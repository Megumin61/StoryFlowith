import CryptoJS from 'crypto-js';
import axios from 'axios';

/**
 * 有道智云翻译服务
 */
class TranslationService {
  constructor() {
    this.appKey = '61de91c516fd4f01';
    this.appSecret = 'Vlg4haTaZ9f2a8YP2RAsG3inux9CqNH5';
    this.apiUrl = 'https://openapi.youdao.com/api';
  }

  /**
   * 生成签名
   * @param {string} query - 待翻译文本
   * @param {string} salt - 随机字符串
   * @param {number} curtime - 当前时间戳(秒)
   * @returns {string} - 签名
   */
  generateSign(query, salt, curtime) {
    // 计算input：q前10个字符 + q长度 + q后10个字符
    const input = this.truncate(query);
    
    // 拼接字符串
    const signStr = this.appKey + input + salt + curtime + this.appSecret;
    
    // 使用SHA256生成签名
    return CryptoJS.SHA256(signStr).toString(CryptoJS.enc.Hex);
  }

  /**
   * 截断查询字符串，用于生成签名
   */
  truncate(q) {
    const len = q.length;
    if (len <= 20) return q;
    return q.substring(0, 10) + len + q.substring(len - 10, len);
  }

  /**
   * 翻译文本
   * @param {string} text - 待翻译的文本
   * @param {string} from - 源语言，默认中文
   * @param {string} to - 目标语言，默认英文
   * @returns {Promise<string>} - 翻译结果
   */
  async translate(text, from = 'zh-CHS', to = 'en') {
    try {
      console.log(`正在翻译: ${text}`);
      
      // 生成随机数和时间戳
      const salt = new Date().getTime();
      const curtime = Math.round(new Date().getTime() / 1000);
      
      // 生成签名
      const sign = this.generateSign(text, salt, curtime);
      
      // 构建请求参数
      const params = {
        q: text,
        appKey: this.appKey,
        salt: salt,
        from: from,
        to: to,
        sign: sign,
        signType: "v3",
        curtime: curtime
      };
      
      // 发送请求
      const response = await axios.post(this.apiUrl, null, { params });
      
      // 检查翻译结果
      if (response.data && response.data.translation && response.data.translation.length > 0) {
        const translatedText = response.data.translation[0];
        console.log(`翻译结果: ${translatedText}`);
        return translatedText;
      } else {
        console.error('翻译失败，未获取到翻译结果:', response.data);
        // 翻译失败时返回原文
        return text;
      }
    } catch (error) {
      console.error('翻译服务错误:', error);
      // 出错时返回原文
      return text;
    }
  }
}

export default new TranslationService(); 