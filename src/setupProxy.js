const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // LiblibAI API代理
  app.use(
    '/api/liblib',
    createProxyMiddleware({
      target: 'https://openapi.liblibai.cloud',
      changeOrigin: true,
      pathRewrite: {
        '^/api/liblib': '', // 移除/api/liblib前缀，直接访问目标服务器根路径
      },
      logLevel: 'debug', // 添加调试日志
    })
  );
  
  // FalAI API代理 (fal.ai默认使用直连，不需要代理，这里预留以防万一)
  app.use(
    '/api/falai',
    createProxyMiddleware({
      target: 'https://api.fal.ai',
      changeOrigin: true,
      pathRewrite: {
        '^/api/falai': '',
      },
      logLevel: 'debug',
    })
  );
  
  // 有道翻译API代理
  app.use(
    '/api/youdao',
    createProxyMiddleware({
      target: 'https://openapi.youdao.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/youdao': '/',
      },
    })
  );
}; 