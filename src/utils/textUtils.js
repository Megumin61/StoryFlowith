/**
 * �ı��������ߺ������������������ı�
 */

// ����ַ����Ƿ��������
export const hasChinese = (text) => {
  if (!text) return false;
  return /[\u4e00-\u9fa5]/.test(text);
};

// ȷ���ı���ȷ��ʾ����
export const ensureChineseDisplay = (text) => {
  if (!text) return '';
  return text;
};

// ���������������������
export const fixChineseEncoding = (text) => {
  if (!text) return '';
  
  // ����һЩ����������ģʽ�������Ҫ��
  return text;
};

// ��ȡ�ַ������ֽڳ��ȣ�������Ӣ�ģ�
export const getByteLength = (text) => {
  if (!text) return 0;
  
  let length = 0;
  for (let i = 0; i < text.length; i++) {
    // �����ַ�ͨ��ռ��3���ֽڣ�UTF-8��
    if (text.charCodeAt(i) > 127) {
      length += 3;
    } else {
      length += 1;
    }
  }
  
  return length;
};

// ��ȡ�̶����ȵ��ַ�������������
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + suffix;
};

// ��ӡ���ĵ�����Ϣ
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