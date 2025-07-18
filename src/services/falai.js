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
const STYLE_URLS = {
  style1: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style1.png",
  style2: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style2.png",
  style3: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style3.png",
  style4: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style4.png"
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
    const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
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
    
    // 构建请求参数 - 完全按照文档示例
    const input = {
      prompt: prompt,
      sync_mode: true // 启用同步模式，直接返回结果
    };
    
    // 打印请求参数
    debugLog('文生图请求参数:', JSON.stringify(input, null, 2));
    console.log('文生图请求参数:', JSON.stringify(input, null, 2));
    
    // 使用queue.submit方法替代subscribe方法
    const { request_id } = await fal.queue.submit("fal-ai/flux-pro/kontext", {
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
      const status = await fal.queue.status("fal-ai/flux-pro/kontext", {
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
        result = await fal.queue.result("fal-ai/flux-pro/kontext", {
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
 * @param {string} prompt - 文本提示
 * @param {string[]|File[]|Blob[]} images - 参考图片URL数组或图像文件数组
 * @param {boolean} useExampleImage - 是否使用官方示例图像
 * @param {string} style - 风格名称，用于获取风格图片URL
 */
const generateImageToImage = async (prompt, images = [], useExampleImage = true, style = 'style1') => {
  try {
    const startTime = new Date();
    let imageUrl;
    
    // 确定使用哪个图像URL
    if (useExampleImage) {
      // 使用官方示例图像
      imageUrl = EXAMPLE_IMAGE_URL;
    } else if (images && images.length > 0) {
      const firstImage = images[0];
      
      // 判断传入的是File/Blob对象还是URL字符串
      if (firstImage instanceof File || firstImage instanceof Blob) {
        // 如果是文件对象，直接上传到fal.ai
        debugLog('检测到图像文件对象，直接上传到fal.ai');
        imageUrl = await uploadImageToFal(firstImage);
      } else if (typeof firstImage === 'string') {
        // 直接使用URL字符串，不再尝试转换为Blob
        debugLog('使用提供的URL字符串');
        imageUrl = firstImage;
      }
    } else {
      // 如果没有提供图像，使用风格URL
      debugLog('未提供图像，使用风格URL');
      imageUrl = getStyleImageUrl(style);
    }
    
    if (!imageUrl) {
      throw new Error('需要至少一张参考图片');
    }
    
    debugLog(`开始图生图调用, 提示词: ${prompt}, 参考图片URL: ${imageUrl}, 开始时间: ${startTime.toLocaleTimeString()}`);
    console.log(`开始图生图调用, 提示词: ${prompt}, 参考图片URL: ${imageUrl}, 开始时间: ${startTime.toLocaleTimeString()}`);
    
    // 构建请求参数
    const input = {
      prompt: prompt,
      image_url: imageUrl,
      sync_mode: true // 启用同步模式，直接返回结果
    };
    
    // 打印请求参数
    debugLog('图生图请求参数:', JSON.stringify(input, null, 2));
    console.log('图生图请求参数:', JSON.stringify(input, null, 2));
    
    // 尝试使用subscribe方法调用API
    try {
      console.log('使用subscribe方法调用API...');
      const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
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
      debugLog(`图生图响应 (subscribe方法):`, result);
      console.log(`图生图完整响应 (subscribe方法, 耗时: ${timeTaken}秒):`, result);
      
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
        console.error('API返回结果格式不正确 (subscribe方法):', result);
        throw new Error('API返回结果中没有图像URL');
      }
    } catch (subscribeError) {
      console.error('subscribe方法调用失败，尝试使用queue方法:', subscribeError);
      
      // 如果subscribe方法失败，尝试使用queue方法
      const queueStartTime = new Date();
      console.log(`使用queue方法, 时间: ${queueStartTime.toLocaleTimeString()}`);
      
      const { request_id } = await fal.queue.submit("fal-ai/flux-pro/kontext", {
        input: input
      });
      
      debugLog('图生图请求已提交，请求ID:', request_id);
      console.log('图生图请求已提交，请求ID:', request_id);
      
      // 立即开始轮询获取结果
      let result = null;
      let attempts = 0;
      const maxAttempts = 120; // 增加最大尝试次数
      const pollInterval = 500; // 轮询间隔设置为0.5秒
      let lastStatus = "";
      
      while (attempts < maxAttempts) {
        attempts++;
        
        // 获取请求状态
        const status = await fal.queue.status("fal-ai/flux-pro/kontext", {
          requestId: request_id,
          logs: true
        });
        
        // 只有状态变化时才打印日志，减少日志干扰
        if (status.status !== lastStatus) {
          debugLog(`图生图状态检查 (${attempts}/${maxAttempts}):`, status.status);
          console.log(`图生图状态检查 (${attempts}/${maxAttempts}):`, status.status);
          lastStatus = status.status;
        }
        
        if (status.status === "COMPLETED") {
          // 获取结果
          result = await fal.queue.result("fal-ai/flux-pro/kontext", {
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
      const queueTimeTaken = (endTime - queueStartTime) / 1000;
      debugLog(`图生图响应:`, result);
      console.log(`图生图完整响应 (总耗时: ${timeTaken}秒, queue耗时: ${queueTimeTaken}秒):`, result);
      
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
    }
  } catch (error) {
    debugLog(`图生图调用出错: ${error.message}`, error);
    console.error('图生图调用出错:', error);
    // 打印完整的错误信息
    if (error.response) {
      console.error('错误响应:', JSON.stringify(error.response, null, 2));
    }
    throw error;
  }
};

// 导出API函数
export default {
  generateTextToImage,
  generateImageToImage,
  testOfficialExample,
  STYLE_URLS,
  TEST_IMAGE,
  uploadImageToFal,
  getStyleImageUrl,
  preloadImage
}; 