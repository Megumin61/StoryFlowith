// API配置文件
module.exports = {
  // Coze API配置
  coze: {
    apiKey: process.env.COZE_API_KEY || 'pat_jh83evgpcgz12NkqIbVDLqKp1KaBxK88ypjoI1rR9hjXwW4aKSSUKg9C8NPBA4q1',
    botId: process.env.COZE_BOT_ID || '7537689196866158618',
    // 尝试多个可能的API地址
    apiBases: [
      'https://api.coze.cn/v3',
      'https://api.coze.com/v3',
      'https://api.coze.cn',
      'https://api.coze.com'
    ],
    // 备用API地址（如果主要地址不可用）
    fallbackApis: [
      'https://api.coze.cn/v2',
      'https://api.coze.com/v2'
    ]
  },
  
  // 服务器配置
  server: {
    port: process.env.PORT || 3003,
    host: '0.0.0.0',
    cors: {
      origins: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    }
  },
  
  // 请求配置
  request: {
    timeout: 30000, // 30秒超时
    maxRetries: 3,
    retryDelay: 1000, // 1秒重试延迟
    maxRedirects: 5
  },
  
  // 模拟模式配置
  mock: {
    enabled: process.env.MOCK_MODE === 'true',
    fallbackToMock: true // 当真实API失败时自动使用模拟API
  }
}; 