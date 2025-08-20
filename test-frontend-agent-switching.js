const http = require('http');

console.log('🧪 测试前端 Agent 切换行为...\n');

// 模拟前端的 agent 切换逻辑
const AGENTS = {
  '7537689196866158618': {
    id: '7537689196866158618',
    name: '01 智能助手',
    description: '通用智能问答助手'
  },
  '7538458406407913522': {
    id: '7538458407913522',
    name: '02 故事脚本生成',
    description: '专业的故事脚本创作助手'
  },
  '7540134398662967296': {
    id: '7540134398662967296',
    name: '03 故事脚本拆分',
    description: '将长故事拆分为可执行片段'
  }
};

let selectedAgent = '7537689196866158618'; // 默认选择第一个agent
let conversationId = null;

// 模拟前端的状态管理
function switchAgent(newAgentId) {
  console.log(`\n🔄 切换 Agent: ${AGENTS[selectedAgent]?.name} -> ${AGENTS[newAgentId]?.name}`);
  selectedAgent = newAgentId;
  conversationId = null; // 重置对话ID
  console.log(`✅ 当前选择的 Agent: ${AGENTS[selectedAgent]?.name} (ID: ${selectedAgent})`);
}

// 模拟发送消息
async function sendMessage(message) {
  console.log(`\n📤 发送消息: "${message}"`);
  console.log(`🎯 使用 Agent: ${AGENTS[selectedAgent]?.name} (ID: ${selectedAgent})`);
  
  try {
    const result = await sendRequest(selectedAgent, message);
    console.log(`✅ 消息发送成功`);
    console.log(`   响应状态: ${result.status}`);
    console.log(`   使用的 Bot ID: ${result.botId}`);
    
    // 模拟保存对话ID
    if (result.response && result.response.data && result.response.data.conversation_id) {
      conversationId = result.response.data.conversation_id;
      console.log(`💾 保存对话ID: ${conversationId}`);
    }
    
    return result;
  } catch (error) {
    console.log(`❌ 消息发送失败: ${error.message}`);
    throw error;
  }
}

function sendRequest(botId, message) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      user_id: 'test_user_123',
      query: message,
      stream: false,
      conversation_id: conversationId,
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

// 测试场景
async function testAgentSwitching() {
  console.log('🎭 开始测试 Agent 切换场景...\n');
  
  // 场景1: 使用默认agent发送消息
  console.log('📋 场景1: 使用默认agent发送消息');
  await sendMessage('你好，请介绍一下自己');
  
  // 场景2: 切换到第二个agent
  console.log('\n📋 场景2: 切换到第二个agent');
  switchAgent('7538458406407913522');
  await sendMessage('你好，请介绍一下自己');
  
  // 场景3: 切换到第三个agent
  console.log('\n📋 场景3: 切换到第三个agent');
  switchAgent('7540134398662967296');
  await sendMessage('你好，请介绍一下自己');
  
  // 场景4: 切换回第一个agent
  console.log('\n📋 场景4: 切换回第一个agent');
  switchAgent('7537689196866158618');
  await sendMessage('你好，请介绍一下自己');
  
  // 场景5: 验证对话ID是否正确重置
  console.log('\n📋 场景5: 验证对话ID是否正确重置');
  console.log(`💬 当前对话ID: ${conversationId || 'null'}`);
  
  console.log('\n🎉 Agent 切换测试完成！');
}

// 运行测试
testAgentSwitching().catch(error => {
  console.error('\n💥 测试过程中出现错误:', error.message);
}); 