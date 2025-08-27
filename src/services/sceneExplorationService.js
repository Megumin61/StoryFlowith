import axios from 'axios';

const COZE_API_BASE = process.env.REACT_APP_COZE_API_BASE || 'http://localhost:3003';

/**
 * 情景探索服务 - 调用情景探索bot生成反思气泡和预测分镜
 * @param {Object} explorationData - 探索数据
 * @param {string} explorationData.explorationText - 探索内容
 * @param {string} explorationData.branchContext - 分支上下文（该分支之前所有分镜连起来的故事脚本）
 * @param {string} explorationData.currentFrameStory - 当前分镜故事脚本
 * @param {Object} explorationData.userPersona - 完整的用户画像信息
 * @param {Array} explorationData.keywordBubbles - 用户拖入的关键词气泡数组
 * @returns {Promise<Object>} 返回反思气泡和故事选项数据
 */
export const generateSceneExploration = async (explorationData) => {
  try {
    console.log('🚀 开始情景探索');
    console.log('🔍 接收到的探索数据:', explorationData);
    console.log('🔍 探索文本:', explorationData.explorationText);
    console.log('🔍 分支上下文:', explorationData.branchContext);
    console.log('🔍 当前分镜故事:', explorationData.currentFrameStory);
    console.log('🔍 用户画像:', explorationData.userPersona);
    console.log('🔍 关键词气泡:', explorationData.keywordBubbles);
    
    // 构造结构化数据，转换为JSON字符串放在query字段中
    const structuredData = {
      exploration_text: explorationData.explorationText, // 探索内容
      branch_context: explorationData.branchContext || '', // 分支上下文
      current_frame_story: explorationData.currentFrameStory || '', // 当前分镜故事
      user_persona: explorationData.userPersona || {}, // 完整用户画像
      keyword_bubbles: explorationData.keywordBubbles || [] // 关键词气泡数组
    };
    
    const requestData = {
      user_id: `scene_exploration_user_${Date.now()}`,
      query: JSON.stringify(structuredData, null, 2), // 将结构化数据转换为JSON字符串
      stream: false,
      bot_id: '7540193191904690228' // 情景探索bot ID
    };
    
    console.log('📤 发送到情景探索bot的数据:', requestData);
    console.log('🔍 请求数据详情:');
    console.log('  - user_id:', requestData.user_id);
    console.log('  - query (JSON字符串):', requestData.query);
    console.log('  - bot_id:', requestData.bot_id);
    console.log('🔍 结构化数据内容:');
    console.log('  - exploration_text:', structuredData.exploration_text);
    console.log('  - branch_context:', structuredData.branch_context);
    console.log('  - current_frame_story:', structuredData.current_frame_story);
    console.log('  - user_persona:', structuredData.user_persona);
    console.log('  - keyword_bubbles:', structuredData.keyword_bubbles);
    
    // 调用情景探索bot
    const response = await axios.post(`${COZE_API_BASE}/api/coze/chat`, requestData);
    
    console.log('📋 情景探索bot API初始响应:', response.data);
    
    if (response.data.code !== 0 || !response.data.data) {
      throw new Error(`情景探索bot API错误: ${response.data.msg || '未知错误'}`);
    }
    
    const { id: chatId, conversation_id: conversationId } = response.data.data;
    
    if (!chatId || !conversationId) {
      throw new Error('无法获取chat_id或conversation_id');
    }
    
    console.log('⏳ 等待情景探索bot处理完成...', { chatId, conversationId });
    
    // 等待处理完成并获取结果
    const result = await waitForTaskCompletion(chatId, conversationId);
    
    if (result.content) {
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log('✅ 成功解析情景探索结果:', parsedData);
          return parsedData;
        } else {
          throw new Error('未找到有效的JSON格式');
        }
      } catch (parseError) {
        console.error('❌ 解析情景探索响应内容失败:', parseError);
        return {
          raw_content: result.content,
          message: '响应解析失败，返回原始内容'
        };
      }
    }
    
    throw new Error('无法获取有效的响应内容');
    
  } catch (error) {
    console.error('❌ 情景探索失败:', error);
    throw error;
  }
};

/**
 * 等待任务完成并获取结果
 * @param {string} chatId - 聊天ID
 * @param {string} conversationId - 对话ID
 * @returns {Promise<Object>} 任务结果
 */
const waitForTaskCompletion = async (chatId, conversationId) => {
  const maxAttempts = 60; // 最多等待60次
  const interval = 2000; // 每2秒检查一次
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`⏳ 第${attempt}次检查任务状态...`);
      
      // 检查任务状态
      const statusResponse = await axios.get(`${COZE_API_BASE}/api/coze/chat/retrieve`, {
        params: { chat_id: chatId, conversation_id: conversationId }
      });
      
      if (statusResponse.data.code === 0 && statusResponse.data.data) {
        const { status } = statusResponse.data.data;
        
        if (status === 'completed') {
          console.log('✅ 任务已完成，获取结果...');
          
          // 获取消息列表
          const messageResponse = await axios.get(`${COZE_API_BASE}/api/coze/chat/message/list`, {
            params: { conversation_id: conversationId, chat_id: chatId }
          });
          
          if (messageResponse.data.code === 0 && messageResponse.data.data) {
            const messages = messageResponse.data.data;
            const assistantMessage = messages.find(msg => msg.role === 'assistant' && msg.type === 'answer');
            
            if (assistantMessage) {
              return { content: assistantMessage.content };
            }
          }
          
          throw new Error('无法获取助手消息');
        } else if (status === 'failed') {
          throw new Error('任务执行失败');
        }
        
        // 任务仍在进行中，继续等待
        console.log(`⏳ 任务状态: ${status}，继续等待...`);
      }
      
      // 等待指定时间后再次检查
      await new Promise(resolve => setTimeout(resolve, interval));
      
    } catch (error) {
      console.error(`❌ 第${attempt}次检查失败:`, error);
      if (attempt === maxAttempts) {
        throw error;
      }
      // 继续尝试
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  throw new Error('任务超时');
}; 