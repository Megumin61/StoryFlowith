const axios = require('axios');

// 测试代理服务器的基本功能
async function testProxy() {
  console.log('🧪 开始测试代理服务器...');
  
  try {
    // 1. 测试健康检查端点
    console.log('1️⃣ 测试健康检查端点...');
    const healthResponse = await axios.get('http://localhost:3002/health');
    console.log('✅ 健康检查成功:', healthResponse.data);
    
    // 2. 测试简单的API端点
    console.log('\n2️⃣ 测试API端点...');
    const apiResponse = await axios.post('http://localhost:3002/api/coze/test', {
      message: 'test'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ API测试成功:', apiResponse.data);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态:', error.response.status);
      console.error('📝 错误数据:', error.response.data);
    }
  }
}

// 运行测试
testProxy(); 