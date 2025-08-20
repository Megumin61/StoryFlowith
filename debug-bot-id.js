const http = require('http');

console.log('🔍 测试 bot_id 传递...\n');

// 测试不同的 bot_id
const testCases = [
  {
    botId: '7537689196866158618',
    name: '01 智能助手'
  },
  {
    botId: '7538458406407913522',
    name: '02 故事脚本生成'
  },
  {
    botId: '7540134398662967296',
    name: '03 故事脚本拆分'
  }
];

async function testBotId(botId, name) {
  console.log(`\n🤖 测试 ${name} (Bot ID: ${botId})...`);
  
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      user_id: 'test_user_123',
      query: '你好，请简单介绍一下自己',
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
          if (response.code === 0 && response.data) {
            console.log('✅ 请求成功');
            console.log(`   聊天ID: ${response.data.id}`);
            console.log(`   对话ID: ${response.data.conversation_id}`);
            console.log(`   状态: ${response.data.status}`);
            console.log(`   使用的Bot ID: ${response.data.bot_id}`);
            
            // 验证返回的 bot_id 是否匹配
            if (response.data.bot_id === botId) {
              console.log('✅ Bot ID 匹配正确');
              resolve(true);
            } else {
              console.log(`❌ Bot ID 不匹配！期望: ${botId}, 实际: ${response.data.bot_id}`);
              resolve(false);
            }
          } else {
            console.log('❌ 请求失败:', response.msg);
            resolve(false);
          }
        } catch (e) {
          console.log('❌ 解析响应失败:', e.message);
          resolve(false);
        }
      });
    });
    
    req.on('error', (e) => {
      console.log('❌ 请求失败:', e.message);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// 运行测试
async function runTests() {
  console.log('🚀 开始测试 Bot ID 传递...\n');
  
  const results = [];
  
  for (const testCase of testCases) {
    const success = await testBotId(testCase.botId, testCase.name);
    results.push({
      name: testCase.name,
      botId: testCase.botId,
      success: success
    });
    
    // 等待一段时间再测试下一个
    if (testCase !== testCases[testCases.length - 1]) {
      console.log('\n⏳ 等待3秒后测试下一个...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总:');
  console.log('='.repeat(60));
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ 成功' : '❌ 失败';
    console.log(`${index + 1}. ${result.name}: ${status}`);
    console.log(`   Bot ID: ${result.botId}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('\n' + '='.repeat(60));
  if (successCount === totalCount) {
    console.log('🎉 所有 Bot ID 测试通过！');
  } else {
    console.log(`⚠️  ${successCount}/${totalCount} 个 Bot ID 测试通过`);
  }
  console.log('='.repeat(60));
}

// 启动测试
runTests(); 