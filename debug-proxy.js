const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3003;

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 测试端点 - 验证请求体传输
app.post('/api/coze/test', (req, res) => {
  console.log('🧪 测试端点 - 收到请求');
  console.log('📦 请求体:', JSON.stringify(req.body, null, 2));
  console.log('📋 请求头:', JSON.stringify(req.headers, null, 2));
  
  res.json({
    message: '测试成功',
    receivedBody: req.body,
    receivedHeaders: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Coze API代理配置
const cozeProxy = createProxyMiddleware({
  target: 'https://api.coze.cn',
  changeOrigin: true,
  pathRewrite: {
    '^/api/coze': '/v3' // 将 /api/coze/chat 重写为 /v3/chat
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔄 代理请求:', req.method, req.path);
    console.log('📦 请求体:', JSON.stringify(req.body, null, 2));
    
    // 如果有请求体，需要重新写入
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ 代理响应:', proxyRes.statusCode);
  },
  onError: (err, req, res) => {
    console.error('❌ 代理错误:', err.message);
    res.status(500).json({ error: '代理错误', message: err.message });
  }
});

// 使用代理中间件
app.use('/api/coze', cozeProxy);

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 代理服务器启动在端口 ${PORT}`);
  console.log(`📡 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔄 Coze API代理: http://localhost:${PORT}/api/coze/*`);
}); 