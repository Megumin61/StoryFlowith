// LiblibAPI 服务模块
// 用于处理与Liblib AI开放平台的通信

// 导入配置
import { liblibConfig } from '../config';
// 导入有道翻译服务
import YoudaoTranslate from './youdaoTranslate';

// 调试日志函数
const debugLog = (...args) => {
  if (liblibConfig.debug) {
    console.log('[LiblibAPI]', ...args);
  }
};

// 从配置文件获取API信息
const API_BASE_URL = liblibConfig.apiBaseUrl; // 确保使用绝对 URL 'https://openapi.liblibai.cloud'
const ACCESS_KEY = liblibConfig.accessKey;
const SECRET_KEY = liblibConfig.secretKey;

// 生成随机字符串
const generateRandomString = (length = 16) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// 将字符串转换为 Uint8Array
const textToUint8Array = (text) => {
  const encoder = new TextEncoder();
  return encoder.encode(text);
};

// 将ArrayBuffer转换为Base64
const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// 使用浏览器的Web Crypto API生成HMAC-SHA1签名
const generateHmacSha1 = async (text, key) => {
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    textToUint8Array(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await window.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    textToUint8Array(text)
  );
  
  // 转换为Base64并进行URL安全处理
  const base64 = arrayBufferToBase64(signature);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// 生成API签名
const generateSignature = async (uri) => {
  const timestamp = Date.now().toString(); // 当前毫秒时间戳
  const signatureNonce = generateRandomString(); // 随机字符串
  
  // 原文 = URL地址 + "&" + 毫秒时间戳 + "&" + 随机字符串
  const content = `${uri}&${timestamp}&${signatureNonce}`;
  
  // 使用Web Crypto API生成签名
  const signature = await generateHmacSha1(content, SECRET_KEY);
  
  return {
    signature,
    timestamp,
    signatureNonce
  };
};

// 构建完整的API URL，包含签名信息
const buildApiUrl = async (uri) => {
  const { signature, timestamp, signatureNonce } = await generateSignature(uri);
  return `${API_BASE_URL}${uri}?AccessKey=${ACCESS_KEY}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${signatureNonce}`;
};

// 文生图API调用
const generateTextToImage = async (prompt, options = {}) => {
  try {
    debugLog(`开始文生图调用, 提示词: ${prompt.substring(0, 30)}...`);
    
    // 使用原始路径，package.json中的proxy会自动处理
    const uri = '/api/generate/kontext/text2img';
    
    // 构建签名参数
    const { signature, timestamp, signatureNonce } = await generateSignature('/api/generate/kontext/text2img');
    
    // 构建API URL，使用相对路径
    const apiUrl = `/api/generate/kontext/text2img?AccessKey=${ACCESS_KEY}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${signatureNonce}`;
    
    debugLog(`使用API URL: ${apiUrl}`);
    
    // 默认参数
    const defaultParams = {
      model: 'max',
      prompt,
      aspectRatio: '1:1',
      guidance_scale: 3.5,
      imgCount: 1
    };
    
    // 合并默认参数和用户传入的参数
    const generateParams = { ...defaultParams, ...options };
    
    // 构建请求体
    const requestBody = {
      templateUuid: liblibConfig.templateUuid?.text2img || 'fe9928fde1b4491c9b360dd24aa2b115', // Kontext文生图模板ID
      generateParams
    };
    
    debugLog(`发送请求: ${apiUrl}`, requestBody);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await response.text();
    debugLog(`收到响应: HTTP ${response.status}`, responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`解析响应失败: ${responseText}`);
    }
    
    if (!response.ok) {
      throw new Error(data.message || `文生图API调用失败: HTTP ${response.status}`);
    }
    
    debugLog(`文生图API调用成功: ${JSON.stringify(data)}`);
    return data;
  } catch (error) {
    debugLog(`文生图调用出错: ${error.message}`, error);
    throw error;
  }
};

// 图生图API调用 (指令编辑或多图参考)
const generateImageToImage = async (prompt, imageUrls = [], options = {}) => {
  try {
    debugLog(`开始图生图调用, 提示词: ${prompt.substring(0, 30)}...`);
    debugLog(`参考图片: ${JSON.stringify(imageUrls)}`);
    debugLog(`选项: ${JSON.stringify(options)}`);
    
    // 验证输入参数
    if (!prompt) {
      throw new Error('提示词不能为空');
    }
    
    // 验证图片列表
    if (!imageUrls || !imageUrls.length || imageUrls.length > 4) {
      throw new Error('参考图片数量必须在1-4张之间');
    }
    
    // 检查图片URL是否可访问
    imageUrls.forEach((url, index) => {
      if (!url || !url.startsWith('http')) {
        throw new Error(`参考图片 #${index+1} URL无效: ${url}`);
      }
    });
    
    // 使用原始路径，package.json中的proxy会自动处理
    const uri = '/api/generate/kontext/img2img';
    
    // 构建签名参数
    const { signature, timestamp, signatureNonce } = await generateSignature('/api/generate/kontext/img2img');
    
    // 打印时间戳和随机字符串，方便调试
    console.log('API请求参数:', {
      uri: '/api/generate/kontext/img2img',
      AccessKey: ACCESS_KEY,
      Timestamp: timestamp,
      SignatureNonce: signatureNonce,
      Signature: signature
    });
    
    // 构建API URL，使用相对路径
    const apiUrl = `/api/generate/kontext/img2img?AccessKey=${ACCESS_KEY}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${signatureNonce}`;
    
    debugLog(`使用API URL: ${apiUrl}`);
    
    // 默认参数 - 修改默认比例为4:3
    const defaultParams = {
      model: 'max',
      prompt,
      aspectRatio: '4:3', // 默认使用4:3比例
      guidance_scale: 3.5,
      imgCount: 1,
      image_list: imageUrls
    };
    
    // 合并默认参数和用户传入的参数
    const generateParams = { ...defaultParams, ...options };
    
    // 构建请求体
    const requestBody = {
      templateUuid: liblibConfig.templateUuid?.img2img || '1c0a9712b3d84e1b8a9f49514a46d88c', // Kontext图生图模板ID
      generateParams
    };
    
    debugLog(`发送请求: ${apiUrl}`, requestBody);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await response.text();
    debugLog(`收到响应: HTTP ${response.status}`, responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`解析响应失败: ${responseText}`);
    }
    
    if (!response.ok) {
      throw new Error(data.message || `图生图API调用失败: HTTP ${response.status}`);
    }
    
    debugLog(`图生图API调用成功: ${JSON.stringify(data)}`);
    return data;
  } catch (error) {
    debugLog(`图生图调用出错: ${error.message}`, error);
    throw error;
  }
};

// 查询任务状态
const checkTaskStatus = async (generateUuid) => {
  try {
    debugLog(`检查任务状态: ${generateUuid}`);
    
    // 验证UUID参数
    if (!generateUuid) {
      throw new Error('generateUuid参数不能为空');
    }
    
    // 使用原始路径，package.json中的proxy会自动处理
    const uri = '/api/generate/status';
    
    // 构建签名参数
    const { signature, timestamp, signatureNonce } = await generateSignature('/api/generate/status');
    
    // 打印状态查询参数
    console.log('状态查询参数:', {
      uri: '/api/generate/status',
      AccessKey: ACCESS_KEY,
      Timestamp: timestamp,
      SignatureNonce: signatureNonce,
      Signature: signature,
      generateUuid
    });
    
    // 构建API URL，使用相对路径
    const apiUrl = `/api/generate/status?AccessKey=${ACCESS_KEY}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${signatureNonce}`;
    
    debugLog(`使用API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ generateUuid })
    });
    
    const responseText = await response.text();
    debugLog(`状态响应: HTTP ${response.status}`, responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`解析状态响应失败: ${responseText}`);
    }
    
    if (!response.ok) {
      throw new Error(data.message || '查询任务状态失败');
    }
    
    // 处理API返回的错误码
    if (data.code !== 0) {
      throw new Error(data.msg || `API错误: ${data.code}`);
    }
    
    // 检查响应数据格式，确保能够正确读取状态信息
    const statusData = data.data || {};
    
    // 获取状态描述
    const statusDesc = getStatusDescription(statusData.generateStatus);
    
    // 打印详细的状态信息
    console.log('任务状态详情:', {
      generateUuid,
      status: statusData.generateStatus,
      statusDesc,
      progress: statusData.percentCompleted,
      images: statusData.images || [],
      message: statusData.generateMsg || '无消息'
    });
    
    debugLog(`任务状态: ${statusData.generateStatus} (${statusDesc}), 进度: ${statusData.percentCompleted}%`);
    return statusData;
  } catch (error) {
    debugLog(`查询任务状态出错: ${error.message}`, error);
    throw error;
  }
};

// 获取状态码描述
const getStatusDescription = (statusCode) => {
  switch(statusCode) {
    case 0: return '等待中';
    case 1: return '排队中';
    case 2: return '生成中';
    case 3: return '已完成';
    case 4: return '失败';
    case 5: return '已完成(可能需要审核)';
    default: return '未知状态';
  }
};

// 轮询任务状态直到完成或失败
const pollTaskUntilDone = async (generateUuid, intervalMs = 1000, maxAttempts = 60) => {
  let attempts = 0;
  
  console.log(`开始轮询任务状态: ${generateUuid}, 最大尝试次数: ${maxAttempts}, 间隔: ${intervalMs}ms`);
  
  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        attempts++;
        console.log(`第 ${attempts}/${maxAttempts} 次查询任务状态`);
        
        const result = await checkTaskStatus(generateUuid);
        
        // 根据API文档，状态码 3 表示任务完成
        if (result.generateStatus === 3) {
          console.log('任务已完成!', {
            generateUuid,
            images: result.images || []
          });
          resolve(result);
          return;
        }
        
        // 状态码 5 也表示任务已完成，但可能处于不同阶段
        if (result.generateStatus === 5 && result.images && result.images.length > 0) {
          console.log('任务已完成(状态5)，已生成图像!', {
            generateUuid,
            images: result.images || []
          });
          resolve(result);
          return;
        }
        
        // 如果任务失败，抛出错误
        if (result.generateStatus === 4) {
          console.error('任务失败:', result.generateMsg);
          reject(new Error(`生成任务失败: ${result.generateMsg}`));
          return;
        }
        
        // 达到最大尝试次数
        if (attempts >= maxAttempts) {
          console.error('达到最大尝试次数，任务超时');
          
          // 如果已经有图像但状态仍为5，则视为成功
          if (result.generateStatus === 5 && result.images && result.images.length > 0) {
            console.log('尽管超时，但图像已生成，视为成功', {
              generateUuid,
              images: result.images || []
            });
            resolve(result);
            return;
          }
          
          reject(new Error('查询任务状态超时'));
          return;
        }
        
        // 继续轮询
        console.log(`任务进行中，状态: ${result.generateStatus}, 进度: ${result.percentCompleted || 0}%, 将在 ${intervalMs}ms 后重试...`);
        setTimeout(checkStatus, intervalMs);
      } catch (error) {
        console.error('轮询过程中出错:', error);
        reject(error);
      }
    };
    
    // 开始轮询
    checkStatus();
  });
};

// 导出API函数
export default {
  generateTextToImage,
  generateImageToImage,
  checkTaskStatus,
  pollTaskUntilDone,
  // 添加调试功能
  debug: {
    logConfig: () => {
      console.log('LiblibAPI 配置:', {
        API_BASE_URL,
        accessKey: ACCESS_KEY ? ACCESS_KEY.substring(0, 4) + '...' : '未设置',
        secretKey: SECRET_KEY ? '已设置' : '未设置',
        debug: liblibConfig.debug || false,
        templateUuid: liblibConfig.templateUuid || '使用默认值'
      });
    }
  }
};