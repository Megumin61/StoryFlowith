/**
 * API使用示例
 * 展示如何使用新的通用Coze功能API
 */

import { 
  generatePersona, 
  generateStory, 
  analyzeContent, 
  callCustomFunction,
  streamFunction 
} from './cozeFunctionAPI';

/**
 * 示例1: 生成用户画像
 */
export const exampleGeneratePersona = async () => {
  try {
    const interviewData = {
      text: "我每天在办公室坐八九个小时，下班后觉得腰酸背痛，所以开始去健身房。但我其实不太会用那些器械，看别人动作很标准，我就很紧张。有一次姿势不对还腰疼过。饮食方面更是搞不懂，App推荐的营养计划太复杂，没办法坚持。我希望能慢慢建立习惯，不要总觉得自己落后别人。"
    };

    const selectedBubbles = {
      persona: ["白领", "健身新手"],
      context: ["健身房锻炼", "长时间久坐办公"],
      goal: ["改善身体素质", "建立习惯"],
      pain: ["器械使用不熟练", "饮食安排复杂", "姿势导致不适"],
      emotion: ["紧张", "困惑"]
    };

    console.log('🚀 开始生成用户画像...');
    const result = await generatePersona(interviewData, selectedBubbles);
    
    console.log('✅ 用户画像生成成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 生成用户画像失败:', error);
    throw error;
  }
};

/**
 * 示例2: 生成故事
 */
export const exampleGenerateStory = async () => {
  try {
    const persona = {
      persona_name: "小蔡",
      persona_summary: "在健身初学阶段寻求科学指导的白领",
      memorable_quote: "既然已经开始了，还是想再坚持一下",
      basic_profile: {
        age: "31岁",
        gender: "男",
        occupation: "白领"
      }
    };

    const sceneDescription = "小蔡第一次独自去健身房，面对各种器械感到不知所措";

    console.log('🚀 开始生成故事...');
    const result = await generateStory(persona, sceneDescription);
    
    console.log('✅ 故事生成成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 生成故事失败:', error);
    throw error;
  }
};

/**
 * 示例3: 内容分析
 */
export const exampleAnalyzeContent = async () => {
  try {
    const content = "用户反馈显示，我们的产品在移动端体验上存在一些问题，加载速度慢，界面不够直观。但同时也有用户表示产品功能很全面，客服响应及时。";
    
    const analysisRequirements = "请分析用户反馈的情感倾向、主要问题和改进建议";

    console.log('🚀 开始分析内容...');
    const result = await analyzeContent(content, analysisRequirements);
    
    console.log('✅ 内容分析成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 内容分析失败:', error);
    throw error;
  }
};

/**
 * 示例4: 自定义功能调用
 */
export const exampleCustomFunction = async () => {
  try {
    const customPrompt = "请帮我分析以下产品的优缺点，并给出改进建议";
    const customData = {
      product_name: "智能健身App",
      target_users: "健身初学者",
      current_features: ["训练计划", "饮食建议", "进度跟踪"]
    };

    console.log('🚀 开始执行自定义功能...');
    const result = await callCustomFunction(customPrompt, customData);
    
    console.log('✅ 自定义功能执行成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 自定义功能执行失败:', error);
    throw error;
  }
};

/**
 * 示例5: 流式调用（实时响应）
 */
export const exampleStreamFunction = async () => {
  try {
    const functionType = 'content_analysis';
    const data = {
      content: "这是一个很长的内容，需要实时分析...",
      analysis_requirements: "请逐段分析内容"
    };

    console.log('🚀 开始流式调用...');
    
    let fullResponse = '';
    const onChunk = (chunk) => {
      console.log('📝 收到数据块:', chunk);
      fullResponse += chunk;
    };

    await streamFunction(functionType, data, onChunk);
    
    console.log('✅ 流式调用完成，完整响应:', fullResponse);
    return fullResponse;
  } catch (error) {
    console.error('❌ 流式调用失败:', error);
    throw error;
  }
};

/**
 * 示例6: 批量处理多个请求
 */
export const exampleBatchProcessing = async () => {
  try {
    const tasks = [
      {
        name: "用户画像生成",
        function: () => exampleGeneratePersona()
      },
      {
        name: "故事生成",
        function: () => exampleGenerateStory()
      },
      {
        name: "内容分析",
        function: () => exampleAnalyzeContent()
      }
    ];

    console.log('🚀 开始批量处理...');
    
    const results = {};
    for (const task of tasks) {
      try {
        console.log(`📋 执行任务: ${task.name}`);
        results[task.name] = await task.function();
        console.log(`✅ ${task.name} 完成`);
      } catch (error) {
        console.error(`❌ ${task.name} 失败:`, error);
        results[task.name] = { error: error.message };
      }
    }

    console.log('✅ 批量处理完成:', results);
    return results;
  } catch (error) {
    console.error('❌ 批量处理失败:', error);
    throw error;
  }
};

/**
 * 示例7: 错误处理和重试
 */
export const exampleErrorHandling = async () => {
  try {
    console.log('🚀 测试错误处理...');
    
    // 故意发送错误数据
    const invalidData = {
      function_type: 'persona_generation',
      data: {
        interview_text: "", // 空文本
        selected_bubbles: {} // 空气泡
      }
    };

    const response = await fetch('http://localhost:3003/api/coze/function', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('⚠️ 预期的错误响应:', errorData);
      return { status: 'error_handled', data: errorData };
    }

    return { status: 'unexpected_success', data: await response.json() };
  } catch (error) {
    console.error('❌ 错误处理测试失败:', error);
    return { status: 'exception', error: error.message };
  }
};

// 导出所有示例函数
export default {
  exampleGeneratePersona,
  exampleGenerateStory,
  exampleAnalyzeContent,
  exampleCustomFunction,
  exampleStreamFunction,
  exampleBatchProcessing,
  exampleErrorHandling
}; 