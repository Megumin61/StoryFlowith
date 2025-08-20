const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3002;

// 启用CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// 解析JSON请求体
app.use(express.json());

// 简单的代理中间件 - 修复路径处理
app.use('/api/coze', async (req, res) => {
  console.log('🚀 收到请求:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  try {
    // 构建目标URL - 修复路径重写
    const targetPath = req.path.replace('/api/coze', '/v1');
    const targetUrl = `https://api.coze.cn${targetPath}`;
    
    console.log('🎯 转发到:', targetUrl);
    console.log('📝 原始路径:', req.path);
    console.log('🎯 目标路径:', targetPath);

    // 准备请求选项
    const options = {
      hostname: 'api.coze.cn',
      port: 443,
      path: targetPath,
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'StoryFlow-Proxy/1.0'
      }
    };

    // 复制必要的请求头
    if (req.headers.authorization) {
      options.headers['Authorization'] = req.headers.authorization;
    }
    if (req.headers.accept) {
      options.headers['Accept'] = req.headers.accept;
    }

    console.log('🔧 请求选项:', {
      hostname: options.hostname,
      port: options.port,
      path: options.path,
      method: options.method,
      headers: options.headers
    });

    // 创建HTTPS请求
    const proxyReq = https.request(options, (proxyRes) => {
      console.log('✅ 收到响应:', {
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

      // 复制响应头
      Object.keys(proxyRes.headers).forEach(key => {
        if (key.toLowerCase() !== 'transfer-encoding') {
          res.setHeader(key, proxyRes.headers[key]);
        }
      });

      res.status(proxyRes.statusCode);

      // 流式传输响应
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('❌ 代理请求错误:', err);
      res.status(500).json({
        error: '代理请求失败',
        message: err.message,
        timestamp: new Date().toISOString()
      });
    });

    proxyReq.on('timeout', () => {
      console.error('⏰ 代理请求超时');
      proxyReq.destroy();
      res.status(504).json({
        error: '请求超时',
        message: '代理请求超时',
        timestamp: new Date().toISOString()
      });
    });

    // 设置超时（5分钟）
    proxyReq.setTimeout(300000);

    // 发送请求体
    if (req.body && Object.keys(req.body).length > 0) {
      proxyReq.write(JSON.stringify(req.body));
    }

    proxyReq.end();

  } catch (error) {
    console.error('❌ 代理错误:', error);
    res.status(500).json({
      error: '代理服务器错误',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 简单代理服务器运行在 http://localhost:${PORT}`);
  console.log('🔗 代理Coze API请求到 https://api.coze.cn');
  console.log('📝 前端应用应该使用 http://localhost:3002/api/coze/chat 作为API端点');
  console.log('⏱️  超时设置: 5分钟');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🔄 正在关闭代理服务器...');
  process.exit(0);
}); 