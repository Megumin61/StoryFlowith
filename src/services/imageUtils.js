// LiblibAPI 服务模块
// 用于处理与Liblib AI开放平台的通信

// 导入配置
import { liblibConfig } from '../config';

// 从配置文件获取API信息
const API_BASE_URL = 'https://openapi.liblibai.cloud'; // 修改为完整 URL，避免相对路径 404
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
  const uri = '/api/generate/kontext/text2img';
  const apiUrl = await buildApiUrl(uri);
  
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
    templateUuid: 'fe9928fde1b4491c9b360dd24aa2b115', // Kontext文生图模板ID
    generateParams
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || '文生图API调用失败');
    }
    
    return data;
  } catch (error) {
    console.error('文生图调用出错:', error);
    throw error;
  }
};

// 图生图API调用 (指令编辑或多图参考)
const generateImageToImage = async (prompt, imageUrls = [], options = {}) => {
  const uri = '/api/generate/kontext/img2img';
  const apiUrl = await buildApiUrl(uri);
  
  // 验证图片列表
  if (!imageUrls || !imageUrls.length || imageUrls.length > 4) {
    throw new Error('参考图片数量必须在1-4张之间');
  }
  
  // 默认参数
  const defaultParams = {
    model: 'max',
    prompt,
    aspectRatio: '1:1',
    guidance_scale: 3.5,
    imgCount: 1,
    image_list: imageUrls
  };
  
  // 合并默认参数和用户传入的参数
  const generateParams = { ...defaultParams, ...options };
  
  // 构建请求体
  const requestBody = {
    templateUuid: '1c0a9712b3d84e1b8a9f49514a46d88c', // Kontext图生图模板ID
    generateParams
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || '图生图API调用失败');
    }
    
    return data;
  } catch (error) {
    console.error('图生图调用出错:', error);
    throw error;
  }
};

// 查询任务状态
const checkTaskStatus = async (generateUuid) => {
  const uri = '/api/generate/status';
  const apiUrl = await buildApiUrl(uri);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ generateUuid })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || '查询任务状态失败');
    }
    
    return data;
  } catch (error) {
    console.error('查询任务状态出错:', error);
    throw error;
  }
};

// 轮询任务状态直到完成或失败
const pollTaskUntilDone = async (generateUuid, intervalMs = 1000, maxAttempts = 60) => {
  let attempts = 0;
  
  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        const result = await checkTaskStatus(generateUuid);
        
        // 根据API文档，状态码 3 表示任务完成
        if (result.generateStatus === 3) {
          resolve(result);
          return;
        }
        
        // 如果任务失败，抛出错误
        if (result.generateStatus === 4) {
          reject(new Error(`生成任务失败: ${result.generateMsg}`));
          return;
        }
        
        // 达到最大尝试次数
        if (attempts >= maxAttempts) {
          reject(new Error('查询任务状态超时'));
          return;
        }
        
        // 继续轮询
        attempts++;
        setTimeout(checkStatus, intervalMs);
      } catch (error) {
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
  pollTaskUntilDone
};