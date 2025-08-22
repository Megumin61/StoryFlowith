import axios from 'axios';

const COZE_API_BASE = process.env.REACT_APP_COZE_API_BASE || 'http://localhost:3003';

/**
 * 将故事脚本拆分成5个分镜节点
 * @param {Object} storyData - 故事数据，包含故事内容和评价
 * @returns {Promise<Object>} 分镜节点数据
 */
export const generateStoryFrames = async (storyData) => {
  try {
    console.log('🚀 开始将故事拆分成分镜节点:', storyData);
    
    // 构造请求数据 - 只需要故事内容
    const requestData = {
      story_content: storyData.content
    };
    
    console.log('📤 发送到第三个bot的数据:', requestData);
    
    // 调用第三个bot (7540134398662967296)
    const response = await axios.post(`${COZE_API_BASE}/api/coze/chat`, {
      user_id: `story_to_frames_user_${Date.now()}`,
      query: storyData.content, // 直接传递故事内容
      stream: false,
      bot_id: '7540134398662967296'
    });
    
    console.log('📋 第三个bot API初始响应:', response.data);
    
    if (response.data.code !== 0 || !response.data.data) {
      throw new Error(`第三个bot API错误: ${response.data.msg || '未知错误'}`);
    }
    
    const { id: chatId, conversation_id: conversationId } = response.data.data;
    
    if (!chatId || !conversationId) {
      throw new Error('无法获取chat_id或conversation_id');
    }
    
    console.log('⏳ 等待第三个bot处理完成...', { chatId, conversationId });
    
    // 等待处理完成并获取结果
    const result = await waitForTaskCompletion(chatId, conversationId);
    
    if (result.content) {
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log('✅ 成功解析分镜节点JSON:', parsedData);
          return parsedData;
        } else {
          throw new Error('未找到有效的JSON格式');
        }
      } catch (parseError) {
        console.error('❌ 解析分镜节点响应内容失败:', parseError);
        return {
          raw_content: result.content,
          message: '响应解析失败，返回原始内容'
        };
      }
    }
    
    throw new Error('无法获取有效的分镜节点响应内容');
    
  } catch (error) {
    console.error('❌ 生成分镜节点失败:', error);
    throw error;
  }
};

/**
 * 等待任务完成
 * @param {string} chatId - 聊天ID
 * @param {string} conversationId - 会话ID
 * @returns {Promise<Object>} 任务结果
 */
async function waitForTaskCompletion(chatId, conversationId, maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 第${attempt}次检查任务状态...`);
      
      // 等待2秒
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 检查状态
      const statusResponse = await axios.get(`${COZE_API_BASE}/api/coze/chat/retrieve`, {
        params: { chat_id: chatId, conversation_id: conversationId }
      });
      
      if (statusResponse.data.code === 0 && statusResponse.data.data) {
        const status = statusResponse.data.data.status;
        console.log(`📋 任务状态: ${status}`);
        
        if (status === 'completed') {
          console.log('✅ 任务完成，获取消息列表');
          
          // 获取消息列表
          const messageResponse = await axios.get(`${COZE_API_BASE}/api/coze/chat/message/list`, {
            params: { conversation_id: conversationId, chat_id: chatId }
          });
          
          if (messageResponse.data.code === 0 && messageResponse.data.data) {
            // 找到答案消息
            const answerMessage = messageResponse.data.data.find(
              msg => msg.role === 'assistant' && msg.type === 'answer' && msg.content
            );
            
            if (answerMessage && answerMessage.content) {
              console.log('✅ 找到答案消息:', answerMessage.content);
              return answerMessage;
            }
          }
          break;
        } else if (status === 'failed') {
          throw new Error(`任务失败: ${statusResponse.data.data.last_error?.msg || '未知错误'}`);
        }
        // 如果状态是 'in_progress'，继续等待
      }
      
    } catch (error) {
      console.error(`❌ 第${attempt}次检查失败:`, error.message);
      if (attempt === maxAttempts) {
        throw new Error('轮询超时');
      }
    }
  }
  
  throw new Error('轮询超时');
} 