import axios from 'axios';

// 配置
const COZE_API_BASE = process.env.REACT_APP_COZE_API_BASE || 'http://localhost:3003'; // 修复API路径
const VISUAL_PROMPT_BOT_ID = '7526396752845963291'; // 画面提示词生成bot ID

/**
 * 构图参考映射函数
 * @param {string} compositionId - 前端构图ID
 * @returns {string} 后端构图描述
 */
const mapCompositionReference = (compositionId) => {
  const compositionMap = {
    'wide': '广角镜头，包含用户全身与周围环境，背景细节清晰，环境元素占比大，用户在画面中较小。',
    'close': '特写镜头，画面只包含局部元素，如用户的手部或面部与设备界面，背景模糊，焦点集中。',
    'over-shoulder': '过肩视角，从用户背后或侧面拍摄，能看到用户的部分身体和前方的操作对象，营造身临其境的感觉。',
    'first-person': '第一人称视角，模拟用户视角，画面完全从用户眼睛位置出发，直接展示用户看到的内容。',
    'split-screen': '分屏构图，将画面分为多个区域，同时展示不同角度的内容或对比信息，信息密度高。',
    'medium': '中景镜头，用户占据画面适中比例，既能看到用户的主要动作，也能看到部分环境背景，平衡主体与环境。'
  };
  
  return compositionMap[compositionId] || '中景镜头，用户占据画面适中比例，既能看到用户的主要动作，也能看到部分环境背景，平衡主体与环境。';
};

/**
 * 生成画面提示词
 * @param {Object} visualPromptData - 画面提示词生成所需的数据
 * @param {string} visualPromptData.branchContext - 当前分支该选中分镜之前的分镜的故事脚本连接起来的完整内容（上下文）
 * @param {string} visualPromptData.currentFrameStory - 当前分镜的故事脚本
 * @param {string} visualPromptData.initialVisualPrompt - 用户输入的初始视觉提示词
 * @param {string} visualPromptData.compositionReference - 用户选择的构图参考
 * @param {Object} visualPromptData.keywordBubbles - 用户拖入的气泡，按维度分类
 * @param {Array} visualPromptData.keywordBubbles.persona - 人设相关关键词
 * @param {Array} visualPromptData.keywordBubbles.context - 情境相关关键词
 * @param {Array} visualPromptData.keywordBubbles.goal - 目标相关关键词
 * @param {Array} visualPromptData.keywordBubbles.pain - 痛点相关关键词
 * @param {Array} visualPromptData.keywordBubbles.emotion - 情感相关关键词
 * @returns {Promise<Object>} 返回生成的画面提示词数据
 */
export const generateVisualPrompt = async (visualPromptData) => {
  try {
    console.log('🎨 开始生成画面提示词');
    console.log('🔍 接收到的数据:', visualPromptData);
    
    // 构造结构化数据，转换为JSON字符串放在query字段中
    const structuredData = {
      branch_context: visualPromptData.branchContext || '', // 分支上下文
      current_frame_story: visualPromptData.currentFrameStory || '', // 当前分镜故事
      initial_visual_prompt: visualPromptData.initialVisualPrompt || '', // 初始视觉提示词
      composition_reference: mapCompositionReference(visualPromptData.compositionReference || 'medium'), // 构图参考
      bubbles: visualPromptData.keywordBubbles || [] // 关键词气泡数组，格式: [{type, keyword, importance}]
    };
    
    const requestData = {
      user_id: `visual_prompt_user_${Date.now()}`,
      query: JSON.stringify(structuredData, null, 2), // 将结构化数据转换为JSON字符串
      stream: false,
      bot_id: VISUAL_PROMPT_BOT_ID // 画面提示词生成bot ID
    };
    
    console.log('📤 发送到画面提示词生成bot的数据:', requestData);
    console.log('🔍 请求数据详情:');
    console.log('  - user_id:', requestData.user_id);
    console.log('  - query (JSON字符串):', requestData.query);
    console.log('  - bot_id:', requestData.bot_id);
    console.log('🔍 结构化数据内容:');
    console.log('  - branch_context:', structuredData.branch_context);
    console.log('  - current_frame_story:', structuredData.current_frame_story);
    console.log('  - initial_visual_prompt:', structuredData.initial_visual_prompt);
    console.log('  - composition_reference:', structuredData.composition_reference);
    console.log('  - bubbles:', structuredData.bubbles);
    
    // 调用画面提示词生成bot
    const response = await axios.post(`${COZE_API_BASE}/api/coze/chat`, requestData);
    
    console.log('📋 画面提示词生成bot API初始响应:', response.data);
    
    if (response.data.code !== 0 || !response.data.data) {
      throw new Error(`画面提示词生成bot API错误: ${response.data.msg || '未知错误'}`);
    }
    
    const { id: chatId, conversation_id: conversationId } = response.data.data;
    
    if (!chatId || !conversationId) {
      throw new Error('无法获取chat_id或conversation_id');
    }
    
    console.log('⏳ 等待画面提示词生成bot处理完成...', { chatId, conversationId });
    
    // 等待处理完成并获取结果
    const result = await waitForTaskCompletion(chatId, conversationId);
    
    if (result.content) {
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log('✅ 成功解析画面提示词生成结果:', parsedData);
          return parsedData;
        } else {
          throw new Error('未找到有效的JSON格式');
        }
      } catch (parseError) {
        console.error('❌ 解析画面提示词生成响应内容失败:', parseError);
        return {
          raw_content: result.content,
          message: '响应解析失败，返回原始内容'
        };
      }
    }
    
    throw new Error('无法获取有效的响应内容');
    
  } catch (error) {
    console.error('❌ 画面提示词生成失败:', error);
    throw error;
  }
};

/**
 * 等待任务完成并获取结果
 * @param {string} chatId - 聊天ID
 * @param {string} conversationId - 对话ID
 * @returns {Promise<Object>} 返回任务结果
 */
const waitForTaskCompletion = async (chatId, conversationId) => {
  const maxAttempts = 20; // 调整为20次轮询
  const delayMs = 2000; // 每次等待的毫秒数
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`⏳ 第 ${attempt} 次尝试获取结果...`);
      
      // 调用retrieve API获取对话详情
      const retrieveResponse = await axios.get(`${COZE_API_BASE}/api/coze/chat/retrieve`, {
        params: { chat_id: chatId, conversation_id: conversationId }
      });
      
      console.log('📋 Retrieve API响应:', retrieveResponse.data);
      
      if (retrieveResponse.data.code === 0 && retrieveResponse.data.data) {
        const { status } = retrieveResponse.data.data;
        
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
              return { content: answerMessage.content };
            } else {
              console.log('⚠️ 未找到有效的答案消息');
            }
          } else {
            console.log('⚠️ 获取消息列表失败:', messageResponse.data);
          }
          
          // 如果到这里说明任务已完成但没有找到内容，抛出错误
          throw new Error('任务完成但未找到有效内容');
          
        } else if (status === 'failed') {
          throw new Error('任务执行失败');
        } else if (status === 'processing') {
          console.log('⏳ 任务仍在处理中...');
        } else {
          console.log(`⚠️ 未知状态: ${status}`);
        }
      } else {
        console.log('⚠️ Retrieve API返回异常:', retrieveResponse.data);
      }
      
      // 如果不是最后一次尝试，等待一段时间后重试
      if (attempt < maxAttempts) {
        console.log(`⏳ 等待 ${delayMs}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
    } catch (error) {
      console.error(`❌ 第 ${attempt} 次尝试失败:`, error);
      
      if (attempt === maxAttempts) {
        throw new Error(`等待任务完成超时，已尝试 ${maxAttempts} 次`);
      }
      
      // 如果不是最后一次尝试，等待一段时间后重试
      console.log(`⏳ 等待 ${delayMs}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error('等待任务完成超时');
}; 