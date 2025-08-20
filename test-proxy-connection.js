const axios = require('axios');

// 测试代理服务器连接
async function testProxyConnection() {
  console.log('🔍 测试代理服务器连接...');
  
  try {
    // 1. 测试代理服务器是否运行
    console.log('\n1️⃣ 测试代理服务器健康状态...');
    const healthResponse = await axios.get('http://localhost:3002/health');
    console.log('✅ 代理服务器运行正常:', healthResponse.data);
    
    // 2. 测试通过代理访问Coze API
    console.log('\n2️⃣ 测试通过代理访问Coze API...');
    
    // 模拟一个简单的聊天请求
    const chatRequest = {
      messages: [
        {
          role: "user",
          content: "你好，请简单介绍一下你自己"
        }
      ],
      model: "coze-bot",
      stream: false
    };
    
    try {
      const proxyResponse = await axios.post('http://localhost:3002/api/coze/chat/completions', chatRequest, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // 使用测试token
        },
        timeout: 10000 // 10秒超时
      });
      
      console.log('✅ 代理请求成功!');
      console.log('状态码:', proxyResponse.status);
      console.log('响应数据:', JSON.stringify(proxyResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ 代理请求失败:');
      if (error.response) {
        console.log('状态码:', error.response.status);
        console.log('响应头:', error.response.headers);
        console.log('响应数据:', error.response.data);
      } else if (error.request) {
        console.log('请求错误:', error.message);
      } else {
        console.log('其他错误:', error.message);
      }
    }
    
    // 3. 测试不同的API端点
    console.log('\n3️⃣ 测试不同的API端点...');
    const testEndpoints = [
      '/api/coze/models',
      '/api/coze/chat/completions',
      '/api/coze/embeddings'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await axios.get(`http://localhost:3002${endpoint}`, {
          timeout: 5000
        });
        console.log(`✅ ${endpoint} 可访问:`, response.status);
      } catch (error) {
        console.log(`❌ ${endpoint} 不可访问:`, error.response?.status || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testProxyConnection(); 