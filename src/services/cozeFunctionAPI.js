/**
 * Coze功能API服务
 * 提供统一的接口来调用后端的各种AI功能
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3003/api/coze';

/**
 * 重试机制包装器
 * @param {Function} apiCall - API调用函数
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise} API调用结果
 */
const retryApiCall = async (apiCall, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`第${attempt}次尝试失败:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

/**
 * 调用Coze Bot进行用户画像生成
 * @param {Object} interviewData - 访谈数据
 * @param {Object} selectedBubbles - 选中的气泡分类
 * @returns {Promise<Object>} 返回生成的用户画像和气泡数据
 */
export const generatePersona = async (interviewData, selectedBubbles) => {
  return retryApiCall(async () => {
    const requestData = {
      function_type: 'persona_generation',
      data: {
        interview_text: interviewData.text,
        selected_bubbles: selectedBubbles
      },
      stream: false
    };

    console.log('🚀 调用用户画像生成功能:', {
      function_type: requestData.function_type,
      interviewText: interviewData.text.substring(0, 100) + '...',
      selectedBubbles
    });

    const response = await fetch(`${API_BASE_URL}/function`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ 用户画像生成成功:', data);
    return data;
  });
};

/**
 * 调用Coze Bot进行故事生成
 * @param {Object} persona - 用户画像数据
 * @param {string} sceneDescription - 场景描述
 * @returns {Promise<Object>} 返回生成的故事
 */
export const generateStory = async (persona, sceneDescription) => {
  return retryApiCall(async () => {
    const requestData = {
      function_type: 'story_generation',
      data: {
        persona,
        scene_description: sceneDescription
      },
      stream: false
    };

    console.log('🚀 调用故事生成功能:', {
      function_type: requestData.function_type,
      personaName: persona.persona_name,
      sceneDescription: sceneDescription.substring(0, 100) + '...'
    });

    const response = await fetch(`${API_BASE_URL}/function`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ 故事生成成功:', data);
    return data;
  });
};

/**
 * 调用Coze Bot进行内容分析
 * @param {string} content - 要分析的内容
 * @param {string} analysisRequirements - 分析要求
 * @returns {Promise<Object>} 返回分析结果
 */
export const analyzeContent = async (content, analysisRequirements) => {
  return retryApiCall(async () => {
    const requestData = {
      function_type: 'content_analysis',
      data: {
        content,
        analysis_requirements: analysisRequirements
      },
      stream: false
    };

    console.log('🚀 调用内容分析功能:', {
      function_type: requestData.function_type,
      contentLength: content.length,
      analysisRequirements
    });

    const response = await fetch(`${API_BASE_URL}/function`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ 内容分析成功:', data);
    return data;
  });
};

/**
 * 调用Coze Bot进行自定义功能
 * @param {string} customPrompt - 自定义提示词
 * @param {Object} customData - 自定义数据
 * @param {string} botId - 可选的bot ID
 * @returns {Promise<Object>} 返回执行结果
 */
export const callCustomFunction = async (customPrompt, customData = {}, botId = null) => {
  return retryApiCall(async () => {
    const requestData = {
      function_type: 'custom',
      data: {
        custom_prompt: customPrompt,
        ...customData
      },
      stream: false
    };

    if (botId) {
      requestData.bot_id = botId;
    }

    console.log('🚀 调用自定义功能:', {
      function_type: requestData.function_type,
      customPrompt: customPrompt.substring(0, 100) + '...',
      customData: Object.keys(customData)
    });

    const response = await fetch(`${API_BASE_URL}/function`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ 自定义功能执行成功:', data);
    return data;
  });
};

/**
 * 流式调用Coze Bot（用于实时响应）
 * @param {string} functionType - 功能类型
 * @param {Object} data - 输入数据
 * @param {Function} onChunk - 处理数据块的函数
 * @param {string} botId - 可选的bot ID
 * @returns {Promise<void>}
 */
export const streamFunction = async (functionType, data, onChunk, botId = null) => {
  return retryApiCall(async () => {
    const requestData = {
      function_type: functionType,
      data,
      stream: true
    };

    if (botId) {
      requestData.bot_id = botId;
    }

    console.log('🚀 开始流式调用:', {
      function_type: functionType,
      stream: true
    });

    const response = await fetch(`${API_BASE_URL}/function`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        onChunk(chunk);
      }
    } finally {
      reader.releaseLock();
    }
  });
};

export default {
  generatePersona,
  generateStory,
  analyzeContent,
  callCustomFunction,
  streamFunction
}; 