const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api/coze';
const API_TOKEN = 'pat_jh83evgpcgz12NkqIbVDLqKp1KaBxK88ypjoI1rR9hjXwW4aKSSUKg9C8NPBA4q1';

// 测试健康检查
async function testHealth() {
  try {
    console.log('🏥 测试健康检查...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康检查成功:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
    return false;
  }
}

// 测试发起对话
async function testChat() {
  try {
    console.log('\n🚀 测试发起对话...');
    const response = await axios.post(`${BASE_URL}/chat`, {
      bot_id: '7537689196866158618',
      user_id: '123456789',
      stream: false,
      additional_messages: [
        {
          content: '你好，请介绍一下你自己',
          content_type: 'text',
          role: 'user',
          type: 'question'
        }
      ],
      parameters: {}
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    
    console.log('✅ 发起对话成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 发起对话失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试查看对话详情
async function testRetrieve(chatId, conversationId) {
  try {
    console.log('\n🔍 测试查看对话详情...');
    const response = await axios.get(`${BASE_URL}/chat/retrieve`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      },
      params: { chat_id: chatId, conversation_id: conversationId }
    });
    
    console.log('✅ 查看对话详情成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 查看对话详情失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试查看消息列表
async function testMessageList(chatId, conversationId) {
  try {
    console.log('\n📝 测试查看消息列表...');
    const response = await axios.get(`${BASE_URL}/chat/message/list`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      },
      params: { chat_id: chatId, conversation_id: conversationId }
    });
    
    console.log('✅ 查看消息列表成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 查看消息列表失败:', error.response?.data || error.message);
    return null;
  }
}

// 主测试函数
async function runTests() {
  console.log('🧪 开始测试 Coze API...\n');
  
  // 1. 测试健康检查
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('❌ 服务不可用，停止测试');
    return;
  }
  
  // 2. 测试发起对话
  const chatResult = await testChat();
  if (!chatResult || !chatResult.data) {
    console.log('❌ 无法发起对话，停止测试');
    return;
  }
  
  const { id: chatId, conversation_id: conversationId } = chatResult.data;
  console.log(`📋 获得 Chat ID: ${chatId}`);
  console.log(`📋 获得 Conversation ID: ${conversationId}`);
  
  // 等待一段时间让对话处理完成
  console.log('\n⏳ 等待对话处理完成...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 3. 测试查看对话详情
  await testRetrieve(chatId, conversationId);
  
  // 4. 测试查看消息列表
  await testMessageList(chatId, conversationId);
  
  console.log('\n🎉 所有测试完成！');
}

// 运行测试
runTests().catch(console.error); 