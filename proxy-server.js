const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;

// 启用CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// 解析JSON请求体
app.use(express.json());

// 代理Coze API请求
app.use('/api/coze', createProxyMiddleware({
  target: 'https://api.coze.cn',
  changeOrigin: true,
  pathRewrite: {
    '^/api/coze': '/v3'
  },
  // 增加超时设置 - 更长的超时时间
  timeout: 120000, // 120秒超时
  proxyTimeout: 120000,
  // 增加连接超时
  connectTimeout: 60000, // 60秒连接超时
  // 启用详细日志
  logLevel: 'debug',
  // 增加重试机制
  retry: 1,
  // 增加keepAlive
  keepAlive: true,
  onProxyReq: (proxyReq, req, res) => {
    // 保留原始请求头
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    
    // 设置必要的请求头
    proxyReq.setHeader('User-Agent', 'StoryFlow-Proxy/1.0');
    proxyReq.setHeader('Accept', 'text/event-stream, application/json');
    proxyReq.setHeader('Cache-Control', 'no-cache');
    proxyReq.setHeader('Connection', 'keep-alive');
    
    console.log('🚀 代理请求:', {
      method: proxyReq.method,
      url: proxyReq.path,
      target: `${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
      headers: proxyReq.getHeaders(),
      timestamp: new Date().toISOString()
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ 代理响应:', {
      statusCode: proxyRes.statusCode,
      statusMessage: proxyRes.statusMessage,
      headers: proxyRes.headers,
      timestamp: new Date().toISOString()
    });
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  },
  onError: (err, req, res) => {
    console.error('❌ 代理错误:', {
      error: err.message,
      code: err.code,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    // 根据错误类型返回不同的状态码
    let statusCode = 500;
    let errorMessage = '代理服务器错误';
    
    if (err.code === 'ECONNRESET') {
      statusCode = 502;
      errorMessage = '连接被重置';
    } else if (err.code === 'ETIMEDOUT') {
      statusCode = 504;
      errorMessage = '请求超时 (120秒)';
    } else if (err.code === 'ENOTFOUND') {
      statusCode = 502;
      errorMessage = '无法连接到目标服务器';
    } else if (err.code === 'ECONNREFUSED') {
      statusCode = 502;
      errorMessage = '连接被拒绝';
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
      suggestion: '请检查网络连接或稍后重试'
    });
  }
}));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 代理服务器运行在 http://localhost:${PORT}`);
  console.log('🔗 代理Coze API请求到 https://api.coze.cn');
  console.log('📝 前端应用应该使用 http://localhost:3001/api/coze/chat 作为API端点');
  console.log('⏱️  超时设置: 120秒请求超时, 60秒连接超时');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🔄 正在关闭代理服务器...');
  process.exit(0);
}); 