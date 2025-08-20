const http = require('http');

console.log('🧪 测试 Agent 切换功能...\n');

// 测试不同的 agent
const testAgents = [
  {
    id: '7537689196866158618',
    name: '01 智能助手'
  },
  {
    id: '7538458406407913522',
    name: '02 故事脚本生成'
  },
  {
    id: '7540134398662967296',
    name: '03 故事脚本拆分'
  }
];

async function testAgentSwitching() {
  for (const agent of testAgents) {
    console.log(`\n🤖 测试 ${agent.name} (Bot ID: ${agent.id})...`);
    
    try {
      const result = await sendRequest(agent.id, '你好，请简单介绍一下自己');
      console.log(`✅ ${agent.name} 测试成功`);
      console.log(`   响应状态: ${result.status}`);
      console.log(`   使用的 Bot ID: ${result.botId}`);
    } catch (error) {
      console.log(`❌ ${agent.name} 测试失败: ${error.message}`);
    }
    
    // 等待一下再测试下一个
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

function sendRequest(botId, message) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      user_id: 'test_user_123',
      query: message,
      stream: false,
      bot_id: botId
    });
    
    const req = http.request({
      hostname: 'localhost',
      port: 3003,
      path: '/api/coze/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: response.code === 0 ? 'success' : 'error',
            botId: botId,
            response: response
          });
        } catch (error) {
          reject(new Error('解析响应失败: ' + error.message));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error('请求失败: ' + error.message));
    });
    
    req.write(postData);
    req.end();
  });
}

// 运行测试
testAgentSwitching().then(() => {
  console.log('\n🎉 Agent 切换测试完成！');
}).catch(error => {
  console.error('\n💥 测试过程中出现错误:', error.message);
}); 