// 有道翻译API服务
// 用于中英文翻译

// 有道应用ID和密钥
const APP_ID = '61de91c516fd4f01';
const APP_KEY = 'Vlg4haTaZ9f2a8YP2RAsG3inux9CqNH5';

// 获取当前UTC时间戳(秒)
const getTimestamp = () => {
  return Math.round(new Date().getTime() / 1000);
};

// 生成随机字符串
const generateSalt = () => {
  return new Date().getTime().toString();
};

// 截取输入文本 - 严格按照有道API文档示例实现
// 如果 q 长度小于等于 20，直接返回 q
// 如果 q 长度大于 20，返回 q 的前 10 个字符 + q 长度 + q 的后 10 个字符
function truncate(q) {
  const len = q.length;
  if (len <= 20) return q;
  return q.substring(0, 10) + len + q.substring(len - 10, len);
}

// 使用JSONP方式调用有道翻译API（绕过CORS限制）
const translateWithJsonp = (text, from = 'zh-CHS', to = 'en') => {
  return new Promise((resolve, reject) => {
    console.log(`[有道翻译] ===== 开始翻译 =====`);
    console.log(`[有道翻译] 源语言: ${from}, 目标语言: ${to}`);
    console.log(`[有道翻译] 原文: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    
    try {
      // 准备参数
      const salt = generateSalt();
      const curtime = getTimestamp().toString();
      
      console.log(`[有道翻译] 盐值(salt): ${salt}`);
      console.log(`[有道翻译] 当前时间戳(curtime): ${curtime}`);
    
    // 计算签名
      const input = truncate(text);
      console.log(`[有道翻译] 截断后的输入(input): ${input}`);
      
      const signStr = APP_ID + input + salt + curtime + APP_KEY;
      console.log(`[有道翻译] 签名字符串: ${signStr}`);
      
      const CryptoJS = require('crypto-js');
      const sign = CryptoJS.SHA256(signStr).toString();
      
      console.log(`[有道翻译] 最终签名: ${sign}`);
    
      // 创建回调函数名称
      const callbackName = 'youdaoTranslateCallback_' + Date.now();
      
      // 创建URL
      const url = new URL('https://openapi.youdao.com/api');
      url.searchParams.append('q', text);
      url.searchParams.append('from', from);
      url.searchParams.append('to', to);
      url.searchParams.append('appKey', APP_ID);
      url.searchParams.append('salt', salt);
      url.searchParams.append('sign', sign);
      url.searchParams.append('signType', 'v3');
      url.searchParams.append('curtime', curtime);
      url.searchParams.append('callback', callbackName);
      
      console.log(`[有道翻译] 完整URL: ${url.toString()}`);
      
      // 创建全局回调函数
      window[callbackName] = (data) => {
        console.log(`[有道翻译] 收到响应:`, data);
        
        // 清理回调和脚本
        delete window[callbackName];
        document.body.removeChild(script);
    
        // 检查结果
        if (data.errorCode === '0' && data.translation && data.translation.length > 0) {
          console.log(`[有道翻译] 翻译成功: ${data.translation[0]}`);
          resolve(data.translation[0]);
    } else {
          const errorMsg = `翻译失败: ${data.errorCode || data.code}, ${data.msg || '未知错误'}`;
          console.error(`[有道翻译] ${errorMsg}`);
          reject(new Error(errorMsg));
        }
      };
      
      // 创建并添加脚本
      const script = document.createElement('script');
      script.src = url.toString();
      script.onerror = () => {
        // 清理回调和脚本
        delete window[callbackName];
        document.body.removeChild(script);
        
        const errorMsg = '加载翻译API失败';
        console.error(`[有道翻译] ${errorMsg}`);
        reject(new Error(errorMsg));
      };
      
      // 添加到文档以执行请求
      document.body.appendChild(script);
  } catch (error) {
      console.error(`[有道翻译] 错误:`, error);
      console.error(`[有道翻译] ===== 翻译失败 =====`);
      reject(error);
  }
  });
};

// 导出API函数
export default {
  // 保留translateWithJsonp，但将其改名为translate，使其成为主要翻译方法
  translate: translateWithJsonp,
  
  // 便捷翻译方法现在直接调用JSONP方式
  zhToEn: async (text) => {
    try {
      return await translateWithJsonp(text, 'zh-CHS', 'en');
    } catch (error) {
      console.error(`[有道翻译] 中译英失败:`, error);
      throw error; // 继续抛出异常给调用者处理
    }
  },
  enToZh: async (text) => {
    try {
      return await translateWithJsonp(text, 'en', 'zh-CHS');
    } catch (error) {
      console.error(`[有道翻译] 英译中失败:`, error);
      throw error; // 继续抛出异常给调用者处理
    }
  }
}; 