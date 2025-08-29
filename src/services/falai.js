// FalAI 服务模块
// 用于处理与fal.ai Flux Pro Kontext API的通信

import { fal } from '@fal-ai/client';
import { falConfig } from '../config';
import YoudaoTranslate from './youdaoTranslate';
import testImage from '../images/test.png';

// 调试日志函数
const debugLog = (...args) => {
  if (falConfig.debug) {
    console.log('[FalAI]', ...args);
  }
};

// 初始化fal.ai客户端 - 直接使用完整API KEY
fal.config({
  credentials: falConfig.fullKey
});

// 官方示例中的参考图像URL - 这个URL是可以公开访问的
const EXAMPLE_IMAGE_URL = "https://v3.fal.media/files/rabbit/rmgBxhwGYb2d3pl3x9sKf_output.png";

// 公开可访问的风格图片URL
// 要替换这些图片，你可以：
// 1. 将新图片上传到你的云存储服务（如腾讯云COS、阿里云OSS等）
// 2. 或者将图片放在public目录下，使用相对路径
// 3. 或者使用其他可公开访问的图片URL
const STYLE_URLS = {
  style1: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style1.png", // 动漫风格
  style2: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style2.png", // 写实风格  
  style3: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style3.png", // 水彩风格
  style4: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style4.png"  // 插画风格
};

// 本地测试图片，用作备选
const TEST_IMAGE = testImage;

/**
 * 将本地图像文件上传到fal.ai服务器
 * @param {File|Blob} imageFile - 要上传的图像文件
 * @returns {Promise<string>} - 上传后的图像URL
 */
const uploadImageToFal = async (imageFile) => {
  try {
    debugLog('开始上传图像到fal.ai服务器...');
    const imageUrl = await fal.storage.upload(imageFile);
    debugLog(`图像上传成功，URL: ${imageUrl}`);
    return imageUrl;
  } catch (error) {
    debugLog(`图像上传失败: ${error.message}`);
    console.error('图像上传失败:', error);
    throw error;
  }
};

/**
 * 获取风格图像URL
 * @param {string} styleName - 风格名称 (style1, style2, style3, style4)
 * @returns {string} - 风格图像URL
 */
const getStyleImageUrl = (styleName = 'style1') => {
  return STYLE_URLS[styleName] || STYLE_URLS.style1;
};

/**
 * 直接使用官方示例参数测试API
 * 完全按照官方文档示例进行调用
 */
const testOfficialExample = async () => {
  try {
    console.log('开始测试官方示例...');
    
    // 完全按照官方文档示例构建请求
    const result = await fal.subscribe("fal-ai/flux-pro/kontext/max", {
      input: {
        prompt: "Put a donut next to the flour.",
        image_url: EXAMPLE_IMAGE_URL
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });
    
    console.log('官方示例测试成功!', result);
    return result;
  } catch (error) {
    console.error('官方示例测试失败:', error);
    // 打印完整的错误信息
    if (error.response) {
      console.error('错误响应:', error.response);
    }
    throw error;
  }
};

/**
 * 预加载图像
 * @param {string} imageUrl - 图像URL
 * @returns {Promise<boolean>} - 是否预加载成功
 */
const preloadImage = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageUrl;
  });
};

/**
 * 文生图API - 将文本提示转换为图像
 * @param {string} prompt - 文本提示
 */
const generateTextToImage = async (prompt) => {
  try {
    const startTime = new Date();
    debugLog(`开始文生图调用, 提示词: ${prompt}, 开始时间: ${startTime.toLocaleTimeString()}`);
    console.log(`开始文生图调用, 提示词: ${prompt}, 开始时间: ${startTime.toLocaleTimeString()}`);
    
    // 检查提示词是否为中文，如果是则翻译成英文
    let englishPrompt = prompt;
    if (/[\u4e00-\u9fa5]/.test(prompt)) {
      try {
        console.log('🔄 检测到中文提示词，开始翻译...');
        const translation = await YoudaoTranslate.zhToEn(prompt);
        englishPrompt = translation;
        console.log('✅ 翻译完成:', englishPrompt);
      } catch (translateError) {
        console.warn('⚠️ 翻译失败，使用原始提示词:', translateError);
        englishPrompt = prompt;
      }
    }
    
    // 添加指定的前缀
    const finalPrompt = `Don't reference the characters in the image, only reference the style of the image, generate a single storyboard frame for me(Do not have an outer frame around the image): ${englishPrompt}`;
    
    console.log('🎯 最终英文提示词:', finalPrompt);
    
    // 构建请求参数 - 包含所有必需参数
    const input = {
      prompt: finalPrompt,
      image_urls: [getStyleImageUrl('style1')], // 默认使用style1作为参考风格
      aspect_ratio: "16:9",
      sync_mode: true
    };
    
    // 打印请求参数
    debugLog('文生图请求参数:', JSON.stringify(input, null, 2));
    console.log('文生图请求参数:', JSON.stringify(input, null, 2));
    
    // 使用queue.submit方法替代subscribe方法
    const { request_id } = await fal.queue.submit("fal-ai/nano-banana/edit", {
      input: input
    });
    
    debugLog('文生图请求已提交，请求ID:', request_id);
    console.log('文生图请求已提交，请求ID:', request_id);
    
    // 轮询获取结果
    let result = null;
    let attempts = 0;
    const maxAttempts = 120; // 增加最大尝试次数
    const pollInterval = 500; // 轮询间隔设置为0.5秒
    let lastStatus = "";
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // 获取请求状态
      const status = await fal.queue.status("fal-ai/nano-banana/edit", {
        requestId: request_id,
        logs: true
      });
      
      // 只有状态变化时才打印日志，减少日志干扰
      if (status.status !== lastStatus) {
        debugLog(`文生图状态检查 (${attempts}/${maxAttempts}):`, status.status);
        console.log(`文生图状态检查 (${attempts}/${maxAttempts}):`, status.status);
        lastStatus = status.status;
      }
      
      if (status.status === "COMPLETED") {
        // 获取结果
        result = await fal.queue.result("fal-ai/nano-banana/edit", {
          requestId: request_id
        });
        break;
      } else if (status.status === "FAILED") {
        throw new Error(`API请求失败: ${status.error || "未知错误"}`);
      }
      
      // 等待指定时间再次检查
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    if (!result) {
      throw new Error('API请求超时');
    }
    
    const endTime = new Date();
    const timeTaken = (endTime - startTime) / 1000;
    debugLog(`文生图响应:`, result);
    console.log(`文生图完整响应 (耗时: ${timeTaken}秒):`, result);
    
    // 处理返回结果，确保返回正确的图像URL
    if (result && result.data && result.data.images && result.data.images.length > 0 && result.data.images[0].url) {
      const resultImageUrl = result.data.images[0].url;
      
      // 预加载图像，减少后续显示延迟
      console.log('开始预加载图像:', resultImageUrl);
      const preloadSuccess = await preloadImage(resultImageUrl);
      console.log('图像预加载' + (preloadSuccess ? '成功' : '失败'));
      
      // 直接返回包含图像URL的对象
      return {
        data: {
          images: [resultImageUrl]
        }
      };
    } else {
      console.error('API返回结果格式不正确:', result);
      throw new Error('API返回结果中没有图像URL');
    }
  } catch (error) {
    debugLog(`文生图调用出错: ${error.message}`, error);
    console.error('文生图调用出错:', error);
    // 打印完整的错误信息
    if (error.response) {
      console.error('错误响应:', error.response);
    }
    throw error;
  }
};

/**
 * 图生图API - 基于参考图和提示词生成新图像
 * @param {string} prompt - 文本提示词
 * @param {string|Array<string>} imageUrl - 参考图片URL(可以是HTTP或Data URL格式)
 * @param {string} modelType - 模型类型，可选值为'generate'或'edit'，默认为'generate'
 * @returns {Object} - 返回结果，包含生成的图像和实际使用的参考图URL
 */
const generateImageToImage = async (prompt, imageUrl, modelType = 'generate') => {
  try {
    const startTime = new Date();
    
    // 根据modelType确定使用的模型
    const modelEndpoint = modelType === 'edit' ? 
      "fal-ai/nano-banana/edit" : 
      "fal-ai/nano-banana/edit";
    
    console.log(`[图生图] 使用模型: ${modelEndpoint} (模式: ${modelType})`);
    
    // 日志记录
    debugLog('图生图函数收到的参数:', {
      prompt,
      imageUrl: typeof imageUrl === 'string' ? (imageUrl.substring(0, 30) + '...') : '数组',
      modelType
    });
    
    // 确保imageUrl是字符串
    let finalImageUrl = Array.isArray(imageUrl) && imageUrl.length > 0 ? imageUrl[0] : imageUrl;
    
    if (!finalImageUrl) {
      throw new Error('[图生图] 未提供有效的图像URL');
    }

    console.log('[图生图] 使用图像类型:', typeof finalImageUrl);
    
    // 记录原始图像URL，用于返回给调用者
    const originalImageUrl = finalImageUrl;

    
    // 检查提示词是否为中文，如果是则翻译成英文
    let englishPrompt = prompt;
    if (/[\u4e00-\u9fa5]/.test(prompt)) {
      try {
        console.log('🔄 [图生图] 检测到中文提示词，开始翻译...');
        const translation = await YoudaoTranslate.zhToEn(prompt);
        englishPrompt = translation;
        console.log('✅ [图生图] 翻译完成:', englishPrompt);
      } catch (translateError) {
        console.warn('⚠️ [图生图] 翻译失败，使用原始提示词:', translateError);
        englishPrompt = prompt;
      }
    }
    
    // 添加指定的前缀
    const finalPrompt = `Don't reference the characters in the image, only reference the style of the image, generate a single storyboard frame for me(Do not have an outer frame around the image): ${englishPrompt}`;
    
    console.log('🎯 [图生图] 最终英文提示词:', finalPrompt);
    
    // 构建请求参数 - 包含所有必需参数
    const input = {
      prompt: finalPrompt,
      image_urls: [finalImageUrl],
      aspect_ratio: "16:9",
      sync_mode: true
    };
    
    // 打印请求参数
    debugLog('图生图请求参数:', JSON.stringify({
      ...input,
      image_urls: input.image_urls.map(url => url.substring(0, 30) + '...')
    }));
    
    console.log('[图生图] 开始API调用');
    console.log('[图生图] 实际使用的参考图URL:', finalImageUrl);
    
    // 尝试使用subscribe方法调用API
    try {
      const result = await fal.subscribe(modelEndpoint, {
        input: input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });
      
      const endTime = new Date();
      const timeTaken = (endTime - startTime) / 1000;
      debugLog(`图生图响应完成, 耗时: ${timeTaken}秒`);
      
      // 处理返回结果
      if (result && result.data && result.data.images && result.data.images.length > 0 && result.data.images[0].url) {
        const resultImageUrl = result.data.images[0].url;
        return {
          data: {
            images: [{ url: resultImageUrl }]
          },
          referenceImageUrl: finalImageUrl, // 添加实际使用的参考图URL
          originalImageUrl: originalImageUrl // 添加原始传入的图像URL
        };
      } else {
        throw new Error('API返回结果中没有图像URL');
      }
    } catch (subscribeError) {
      console.error('subscribe方法调用失败，尝试使用queue方法:', subscribeError);
      
      // 如果subscribe方法失败，尝试使用queue方法
      const { request_id } = await fal.queue.submit(modelEndpoint, {
        input: input
      });
      
      // 轮询获取结果
      let result = null;
      let attempts = 0;
      const maxAttempts = 120;
      const pollInterval = 500;
      let lastStatus = "";
      
      while (attempts < maxAttempts) {
        attempts++;
        
        // 获取请求状态
        const status = await fal.queue.status(modelEndpoint, {
          requestId: request_id,
          logs: true
        });
        
        if (status.status !== lastStatus) {
          debugLog(`图生图状态检查 (${attempts}/${maxAttempts}):`, status.status);
          lastStatus = status.status;
        }
        
        if (status.status === "COMPLETED") {
          result = await fal.queue.result(modelEndpoint, {
            requestId: request_id
          });
          break;
        } else if (status.status === "FAILED") {
          throw new Error(`API请求失败: ${status.error || "未知错误"}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
      if (!result) {
        throw new Error('API请求超时');
      }
      
      const endTime = new Date();
      const timeTaken = (endTime - startTime) / 1000;
      debugLog(`图生图响应完成 (queue), 耗时: ${timeTaken}秒`);
      
      // 处理返回结果
      if (result && result.data && result.data.images && result.data.images.length > 0 && result.data.images[0].url) {
        const resultImageUrl = result.data.images[0].url;
        return {
          data: {
            images: [{ url: resultImageUrl }]
          },
          referenceImageUrl: finalImageUrl, // 添加实际使用的参考图URL
          originalImageUrl: originalImageUrl // 添加原始传入的图像URL
        };
      } else {
        throw new Error('API返回结果中没有图像URL');
      }
    }
  } catch (error) {
    debugLog(`图生图调用出错: ${error.message}`);
    console.error('图生图调用出错:', error);
    throw error;
  }
};

/**
 * 图像编辑函数
 * 基于现有图像和编辑提示词生成新的图像
 * @param {Object} params - 编辑参数
 * @param {string} params.image_url - 原始图像URL
 * @param {string} params.prompt - 编辑提示词
 * @param {number} params.strength - 编辑强度 (0-1)
 * @param {number} params.guidance_scale - 引导尺度
 * @param {number} params.num_inference_steps - 推理步数
 * @param {number} params.seed - 随机种子
 * @returns {Promise<Object>} - 编辑后的图像结果
 */
const editImage = async (params) => {
  try {
    debugLog('开始图像编辑，参数:', params);
    
    // 验证必要参数
    if (!params.image_url) {
      throw new Error('缺少原始图像URL');
    }
    if (!params.prompt) {
      throw new Error('缺少编辑提示词');
    }
    
    // 构建请求参数，使用fal.ai的图像编辑模型
    const requestParams = {
      prompt: params.prompt,
      image_urls: [params.image_url],
      strength: params.strength || 0.7,
      guidance_scale: params.guidance_scale || 7.5,
      num_inference_steps: params.num_inference_steps || 30,
      seed: params.seed || Math.floor(Math.random() * 1000000)
    };
    
    debugLog('发送图像编辑请求，参数:', requestParams);
    
    // 调用fal.ai的图像编辑API
    const result = await fal.subscribe("fal-ai/nano-banana/edit", {
      input: requestParams,
      logs: falConfig.debug,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && falConfig.debug) {
          update.logs?.map((log) => log.message).forEach(console.log);
        }
      },
    });
    
    debugLog('图像编辑完成，结果:', result);
    return result;
    
  } catch (error) {
    debugLog(`图像编辑调用出错: ${error.message}`);
    console.error('图像编辑调用出错:', error);
    throw error;
  }
};

// 导出API函数
export default {
  generateTextToImage,
  generateImageToImage,
  editImage,
  testOfficialExample,
  STYLE_URLS,
  TEST_IMAGE,
  uploadImageToFal,
  getStyleImageUrl,
  preloadImage
}; 