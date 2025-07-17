// 有道翻译API服务
// 用于中英文翻译

// 有道应用ID和密钥
const APP_ID = '61de91c516fd4f01';
const APP_KEY = 'Vlg4haTaZ9f2a8YP2RAsG3inux9CqNH5';

// 有道翻译API地址
const API_URL = 'https://openapi.youdao.com/api';

// 生成随机字符串
const generateRandomString = (length = 16) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// 计算MD5哈希
const md5 = (text) => {
  return require('crypto-js/md5')(text).toString();
};

// 获取当前时间戳（秒）
const getTimestamp = () => {
  return Math.floor(Date.now() / 1000);
};

// 截取输入文本
const truncateInput = (text, maxLength = 20) => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, 10) + text.length + text.substring(text.length - 10);
};

// 翻译文本
const translate = async (text, from = 'zh-CHS', to = 'en') => {
  try {
    console.log(`[有道翻译] 开始翻译: ${text.substring(0, 30)}...`);
    
    // 准备签名所需参数
    const salt = generateRandomString();
    const timestamp = getTimestamp();
    const curtime = timestamp.toString();
    
    // 计算签名
    const truncated = truncateInput(text);
    const signString = APP_ID + truncated + salt + curtime + APP_KEY;
    const sign = md5(signString);
    
    // 构建请求参数
    const params = new URLSearchParams();
    params.append('q', text);
    params.append('from', from);
    params.append('to', to);
    params.append('appKey', APP_ID);
    params.append('salt', salt);
    params.append('sign', sign);
    params.append('signType', 'v3');
    params.append('curtime', curtime);
    
    // 发送请求
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    const data = await response.json();
    
    // 检查响应
    if (data.errorCode !== '0') {
      throw new Error(`翻译失败: ${data.errorCode}`);
    }
    
    // 返回翻译结果
    if (data.translation && data.translation.length > 0) {
      console.log(`[有道翻译] 翻译结果: ${data.translation[0]}`);
      return data.translation[0];
    } else {
      throw new Error('翻译结果为空');
    }
  } catch (error) {
    console.error(`[有道翻译] 错误: ${error.message}`);
    // 如果翻译失败，返回原文
    return text;
  }
};

// 导出API函数
export default {
  translate,
  // 便捷翻译方法
  zhToEn: (text) => translate(text, 'zh-CHS', 'en'),
  enToZh: (text) => translate(text, 'en', 'zh-CHS')
}; 