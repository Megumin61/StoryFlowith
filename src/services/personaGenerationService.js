// 引入必要的库
import axios from 'axios';

// 配置
const COZE_API_BASE = 'http://localhost:3003'; // 使用本地封装的API服务

/**
 * 等待任务完成并获取结果
 * @param {string} chatId - 聊天ID
 * @param {string} conversationId - 对话ID
 * @param {number} maxWaitTime - 最大等待时间（毫秒）
 * @returns {Promise<Object>} 返回任务结果
 */
const waitForTaskCompletion = async (chatId, conversationId, maxWaitTime = 60000) => {
  const startTime = Date.now();
  const pollInterval = 2000; // 每2秒检查一次
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      console.log(`⏳ 等待任务完成，聊天ID: ${chatId}, 对话ID: ${conversationId}`);
      
      // 使用本地封装的API接口获取任务状态
      const response = await axios.get(`${COZE_API_BASE}/api/coze/chat/retrieve`, {
        params: {
          chat_id: chatId,
          conversation_id: conversationId
        }
      });
      
      const taskData = response.data;
      console.log('📋 任务状态检查结果:', taskData);
      
      // 检查任务状态
      if (taskData.code === 0 && taskData.data && taskData.data.status === 'completed') {
        console.log('✅ 任务完成，获取结果:', taskData);
        
        // 获取消息列表
        const messageResponse = await axios.get(`${COZE_API_BASE}/api/coze/chat/message/list`, {
          params: {
            conversation_id: conversationId,
            chat_id: chatId
          }
        });
        
        if (messageResponse.data.code === 0 && messageResponse.data.data && messageResponse.data.data.length > 0) {
          // 找到Bot的回复消息
          const botMessage = messageResponse.data.data.find(
            msg => msg.role === 'assistant' && msg.type === 'answer' && msg.content
          );
          
          if (botMessage && botMessage.content) {
            return {
              status: 'completed',
              content: botMessage.content,
              taskData: taskData.data
            };
          }
        }
        
        return taskData;
      } else if (taskData.code === 0 && taskData.data && (taskData.data.status === 'failed' || taskData.data.status === 'error')) {
        throw new Error(`任务失败: ${taskData.data.last_error?.msg || '未知错误'}`);
      } else if (taskData.code === 0 && taskData.data && (taskData.data.status === 'in_progress' || taskData.data.status === 'processing')) {
        console.log('⏳ 任务仍在进行中，继续等待...');
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } else {
        console.log(`⚠️ 未知任务状态: ${taskData.data?.status || 'unknown'}`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    } catch (error) {
      console.error('❌ 检查任务状态时出错:', error);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  throw new Error('任务超时，请稍后重试');
};

/**
 * 生成用户画像
 * @param {Object} userData - 用户数据
 * @returns {Promise<Object>} 生成的用户画像
 */
export const generatePersona = async (userData) => {
  try {
    console.log('🚀 开始生成用户画像:', userData);
    
    // 直接发送数据到Coze API，不构造提示词
    const response = await axios.post(`${COZE_API_BASE}/api/coze/chat`, {
      user_id: `persona_user_${Date.now()}`,
      query: JSON.stringify(userData, null, 2),
      stream: false,
      bot_id: '7537689196866158618' // 使用专门的用户画像生成Bot
    });
    
    console.log('📋 Coze API初始响应:', response.data);
    
    if (response.data.code !== 0 || !response.data.data) {
      throw new Error(`Coze API错误: ${response.data.msg || '未知错误'}`);
    }
    
    const { id: chatId, conversation_id: conversationId } = response.data.data;
    
    if (!chatId || !conversationId) {
      throw new Error('无法获取chat_id或conversation_id');
    }
    
    console.log('⏳ 等待Coze Bot处理完成...', { chatId, conversationId });
    
    // 等待处理完成并获取结果
    const result = await waitForTaskCompletion(chatId, conversationId);
    
    if (result.content) {
      // 尝试解析JSON内容
      try {
        // 提取JSON部分
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log('✅ 成功解析JSON:', parsedData);
          return parsedData;
        } else {
          throw new Error('未找到有效的JSON格式');
        }
      } catch (parseError) {
        console.error('❌ 解析响应内容失败:', parseError);
        // 如果解析失败，返回原始内容
        return {
          raw_content: result.content,
          message: '响应解析失败，返回原始内容'
        };
      }
    }
    
    throw new Error('无法获取有效的响应内容');
    
  } catch (error) {
    console.error('❌ 生成用户画像失败:', error);
    throw error;
  }
};

/**
 * 生成故事内容
 * @param {Object} storyData - 故事数据
 * @returns {Promise<Object>} 生成的故事内容
 */
export const generateStory = async (storyData) => {
  try {
    console.log('🚀 开始生成故事内容:', storyData);
    
    // 直接发送数据到Coze API，不构造提示词
    const response = await axios.post(`${COZE_API_BASE}/api/coze/chat`, {
      user_id: `story_user_${Date.now()}`,
      query: JSON.stringify(storyData, null, 2),
      stream: false,
      bot_id: '7537689196866158618'
    });
    
    console.log('📋 Coze API初始响应:', response.data);
    
    if (response.data.code !== 0 || !response.data.data) {
      throw new Error(`Coze API错误: ${response.data.msg || '未知错误'}`);
    }
    
    const { id: chatId, conversation_id: conversationId } = response.data.data;
    
    if (!chatId || !conversationId) {
      throw new Error('无法获取chat_id或conversation_id');
    }
    
    console.log('⏳ 等待Coze Bot处理完成...', { chatId, conversationId });
    
    // 等待处理完成并获取结果
    const result = await waitForTaskCompletion(chatId, conversationId);
    
    if (result.content) {
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log('✅ 成功解析JSON:', parsedData);
          return parsedData;
        } else {
          throw new Error('未找到有效的JSON格式');
        }
      } catch (parseError) {
        console.error('❌ 解析响应内容失败:', parseError);
        return {
          raw_content: result.content,
          message: '响应解析失败，返回原始内容'
        };
      }
    }
    
    throw new Error('无法获取有效的响应内容');
    
  } catch (error) {
    console.error('❌ 生成故事失败:', error);
    throw error;
  }
};

/**
 * 分析内容
 * @param {Object} contentData - 内容数据
 * @returns {Promise<Object>} 分析结果
 */
export const analyzeContent = async (contentData) => {
  try {
    console.log('🚀 开始分析内容:', contentData);
    
    // 直接发送数据到Coze API，不构造提示词
    const response = await axios.post(`${COZE_API_BASE}/api/coze/chat`, {
      user_id: `analysis_user_${Date.now()}`,
      query: JSON.stringify(contentData, null, 2),
      stream: false,
      bot_id: '7537689196866158618'
    });
    
    console.log('📋 Coze API初始响应:', response.data);
    
    if (response.data.code !== 0 || !response.data.data) {
      throw new Error(`Coze API错误: ${response.data.msg || '未知错误'}`);
    }
    
    const { id: chatId, conversation_id: conversationId } = response.data.data;
    
    if (!chatId || !conversationId) {
      throw new Error('无法获取chat_id或conversation_id');
    }
    
    if (!chatId || !conversationId) {
      throw new Error('无法获取chat_id或conversation_id');
    }
    
    console.log('⏳ 等待Coze Bot处理完成...', { chatId, conversationId });
    
    // 等待处理完成并获取结果
    const result = await waitForTaskCompletion(chatId, conversationId);
    
    if (result.content) {
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log('✅ 成功解析JSON:', parsedData);
          return parsedData;
        } else {
          throw new Error('未找到有效的JSON格式');
        }
      } catch (parseError) {
        console.error('❌ 解析响应内容失败:', parseError);
        return {
          raw_content: result.content,
          message: '响应解析失败，返回原始内容'
        };
      }
    }
    
    throw new Error('无法获取有效的响应内容');
    
  } catch (error) {
    console.error('❌ 内容分析失败:', error);
    throw error;
  }
};

/**
 * 生成故事脚本
 * @param {Object} storyData - 故事数据，包含用户画像和区域气泡信息
 * @returns {Promise<Object>} 生成的故事脚本
 */
export const generateStoryScript = async (storyData) => {
  try {
    console.log('🚀 开始生成故事脚本，数据:', storyData);
    
    // 直接发送数据到Coze API，不构造提示词
    const response = await axios.post(`${COZE_API_BASE}/api/coze/chat`, {
      user_id: `story_script_user_${Date.now()}`,
      query: JSON.stringify(storyData, null, 2),
      stream: false,
      bot_id: '7538458406407913522' // 使用专门的故事脚本生成Bot
    });
    
    console.log('📋 Coze API初始响应:', response.data);
    
    if (response.data.code !== 0 || !response.data.data) {
      throw new Error(`Coze API错误: ${response.data.msg || '未知错误'}`);
    }
    
    const { id: chatId, conversation_id: conversationId } = response.data.data;
    
    if (!chatId || !conversationId) {
      throw new Error('无法获取chat_id或conversation_id');
    }
    
    console.log('⏳ 等待Coze Bot处理完成...', { chatId, conversationId });
    
    // 等待处理完成并获取结果
    const result = await waitForTaskCompletion(chatId, conversationId);
    
    if (result.content) {
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log('✅ 成功解析JSON:', parsedData);
          return parsedData;
        } else {
          throw new Error('未找到有效的JSON格式');
        }
      } catch (parseError) {
        console.error('❌ 解析响应内容失败:', parseError);
        return {
          raw_content: result.content,
          message: '响应解析失败，返回原始内容'
        };
      }
    }
    
    throw new Error('无法获取有效的响应内容');
    
  } catch (error) {
    console.error('❌ 生成故事脚本失败:', error);
    throw error;
  }
};

/**
 * 将前端数据转换为Coze API所需的格式
 * @param {object} frontendData - 前端数据
 * @returns {object} 转换后的数据
 */
export const transformFrontendData = (frontendData) => {
  // 这里可以根据实际的前端数据结构进行调整
  return {
    interview_text: frontendData.interviewText || frontendData.interview_text || '',
    selected_bubbles: frontendData.selectedBubbles || frontendData.selected_bubbles || {}
  };
};

/**
 * 将Coze API返回的数据转换为前端所需的格式
 * @param {object} apiResponse - API响应数据
 * @returns {object} 转换后的前端数据
 */
export const transformApiResponse = (apiResponse) => {
  // 转换用户画像数据，确保字段名映射正确
  const transformedPersonas = (apiResponse.personas || []).map(persona => ({
    ...persona,
    // 确保外观特征字段正确映射
    appearance_characteristics: persona["Appearance characteristics"] || persona.Appearance_characteristics || persona.appearance_characteristics || ''
  }));
  
  return {
    personas: transformedPersonas,
    bubbles: apiResponse.bubbles || {},
    rawResponse: apiResponse // 保留原始响应以备需要
  };
}; 