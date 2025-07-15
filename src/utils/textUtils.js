/**
 * 文本处理工具函数，帮助处理中文文本
 */

// 检查字符串是否包含中文
export const hasChinese = (text) => {
  if (!text) return false;
  return /[\u4e00-\u9fa5]/.test(text);
};

// 确保文本正确显示中文
export const ensureChineseDisplay = (text) => {
  if (!text) return '';
  return text;
};

// 解决常见的中文乱码问题
export const fixChineseEncoding = (text) => {
  if (!text) return '';
  
  // 处理一些常见的乱码模式（如果需要）
  return text;
};

// 获取字符串的字节长度（区分中英文）
export const getByteLength = (text) => {
  if (!text) return 0;
  
  let length = 0;
  for (let i = 0; i < text.length; i++) {
    // 中文字符通常占用3个字节（UTF-8）
    if (text.charCodeAt(i) > 127) {
      length += 3;
    } else {
      length += 1;
    }
  }
  
  return length;
};

// 截取固定长度的字符串，考虑中文
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + suffix;
};

// 打印中文调试信息
export const logChinese = (text) => {
  if (!text) return;
  
  try {
    console.log(`%c ${text}`, 'color: green; font-weight: bold');
  } catch (e) {
    console.log('Chinese text log error:', e);
  }
};

export default {
  hasChinese,
  ensureChineseDisplay,
  fixChineseEncoding,
  getByteLength,
  truncateText,
  logChinese
}; 