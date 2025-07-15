// ȫ�������ļ�
const config = {
  // Ӧ������
  app: {
    name: 'StoryFlow',
    version: '1.0.0',
    description: 'AI�����Ķ�̬UX���°�ϵͳ',
  },
  
  // ���ػ�����
  locale: {
    language: 'zh-CN',
    charset: 'UTF-8',
    timezone: 'Asia/Shanghai',
  },
  
  // API���ã�����У�
  api: {
    baseUrl: '/api',
    timeout: 10000,
  },
  
  // �ı�������������
  text: {
    // ȷ���ı���ȷ��ʾ���������ܵı������⣩
    encode: (text) => {
      if (!text) return '';
      try {
        // ���Խ��ı�����ΪUTF-8
        return text;
      } catch (e) {
        console.error('�ı��������:', e);
        return text;
      }
    },
    
    // �������ܵ�������ʾ����
    fixChinese: (text) => {
      if (!text) return '';
      // ���������κ���������Ĵ����߼��������Ҫ��
      return text;
    },
    
    // ����ַ����Ƿ��������
    hasChinese: (text) => {
      if (!text) return false;
      return /[\u4e00-\u9fa5]/.test(text);
    },
    
    // ��ȡһ���ı�����ȷ����汾
    getEncoded: (text) => {
      if (!text) return '';
      return text;
    }
  }
};

export default config; 