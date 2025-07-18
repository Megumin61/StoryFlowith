// LiblibAI API配置文件

// API接口配置
export const liblibConfig = {
  // API基础URL - 使用代理
  apiBaseUrl: '/api/liblib',  // 使用我们在setupProxy.js中设置的代理路径
  
  // 访问凭证 - 实际值应从环境变量获取或通过安全存储提供
  accessKey: process.env.REACT_APP_LIBLIB_ACCESS_KEY || 'OJZn7ETfjDq6ePIN3iGAAQ',
  secretKey: process.env.REACT_APP_LIBLIB_SECRET_KEY || 'zS63WXVeBw9vRn_0hYaKKyy2UWPZDAc6',
  
  // 模板UUID
  templateUuid: {
    text2img: 'fe9928fde1b4491c9b360dd24aa2b115', // Kontext文生图模板ID
    img2img: '1c0a9712b3d84e1b8a9f49514a46d88c'   // Kontext图生图模板ID
    },
    
  // 默认生成参数
  defaultAspectRatio: '4:3',
    
  // 调试模式
  debug: true,  // 设置为true启用详细日志
};

// fal.ai 服务配置
export const falConfig = {
  apiKey: '8b2fefdb-1e6e-43df-8a8c-3c4054cbc942',
  apiSecret: '2e522954aebefe7cd2860b47b09cecdd',
  debug: true,
  // 注意：fal.ai需要将apiKey和apiSecret连接为一个字符串，格式为"key:secret"
  fullKey: '8b2fefdb-1e6e-43df-8a8c-3c4054cbc942:2e522954aebefe7cd2860b47b09cecdd',
};

export default {
  liblibConfig
}; 