// 测试Coze API调用的简单脚本
// 可以在浏览器控制台中运行

const COZE_API_KEY = 'pat_jh83evgpcgz12NkqIbVDLqKp1KaBxK88ypjoI1rR9hjXwW4aKSSUKg9C8NPBA4q1';
const COZE_BASE_URL = 'https://api.coze.cn';

// 测试获取Agent列表
async function testGetAgents() {
  try {
    console.log('正在测试获取Agent列表...');
    const response = await fetch(`${COZE_BASE_URL}/v1/bots`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('请求失败:', errorText);
      return;
    }

    const result = await response.json();
    console.log('获取Agent列表成功:', result);
    return result;
  } catch (error) {
    console.error('测试获取Agent列表失败:', error);
  }
}

// 测试创建Agent
async function testCreateAgent() {
  try {
    console.log('正在测试创建Agent...');
    const agentConfig = {
      name: '测试Agent_' + Date.now(),
      description: '这是一个测试用的Agent',
      avatar: 'https://via.placeholder.com/100',
      prompts: ['你是一个有用的AI助手'],
      settings: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000
      }
    };

    const response = await fetch(`${COZE_BASE_URL}/v1/bots`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agentConfig)
    });

    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('创建Agent失败:', errorText);
      return;
    }

    const result = await response.json();
    console.log('创建Agent成功:', result);
    return result;
  } catch (error) {
    console.error('测试创建Agent失败:', error);
  }
}

// 测试发起对话
async function testStartChat(botId) {
  try {
    console.log('正在测试发起对话...');
    const messages = [
      {
        content: '你好，请介绍一下你自己',
        content_type: 'text',
        role: 'user',
        type: 'question'
      }
    ];

    const response = await fetch(`${COZE_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bot_id: botId,
        user_id: 'test_user_' + Date.now(),
        messages: messages,
        stream: false
      })
    });

    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('发起对话失败:', errorText);
      return;
    }

    const result = await response.json();
    console.log('发起对话成功:', result);
    return result;
  } catch (error) {
    console.error('测试发起对话失败:', error);
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始运行Coze API测试...');
  console.log('='.repeat(50));

  // 测试1: 获取Agent列表
  const agents = await testGetAgents();
  console.log('='.repeat(50));

  // 测试2: 创建Agent
  const newAgent = await testCreateAgent();
  console.log('='.repeat(50));

  // 测试3: 如果有新创建的Agent，测试对话
  if (newAgent && newAgent.id) {
    await testStartChat(newAgent.id);
  } else if (agents && agents.length > 0) {
    // 使用第一个现有的Agent测试对话
    await testStartChat(agents[0].id || agents[0].bot_id);
  }

  console.log('='.repeat(50));
  console.log('所有测试完成！');
}

// 导出测试函数，可以在控制台中使用
window.testCozeAPI = {
  testGetAgents,
  testCreateAgent,
  testStartChat,
  runAllTests
};

console.log('Coze API测试脚本已加载！');
console.log('使用方法:');
console.log('- testCozeAPI.runAllTests() - 运行所有测试');
console.log('- testCozeAPI.testGetAgents() - 测试获取Agent列表');
console.log('- testCozeAPI.testCreateAgent() - 测试创建Agent');
console.log('- testCozeAPI.testStartChat(botId) - 测试发起对话'); 