// LiblibAI API配置文件

// API接口配置
export const liblibConfig = {
  // API基础URL - 使用代理时可使用相对路径
  apiBaseUrl: 'https://openapi.liblibai.cloud',
  
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

export default {
  liblibConfig
}; 