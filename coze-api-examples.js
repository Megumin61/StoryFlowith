const axios = require('axios');

/**
 * Coze API 完整使用示例
 * 基于官方文档: https://www.coze.cn/open/docs/developer_guides/chat_v3
 */

// 配置信息
const COZE_API_BASE = 'https://api.coze.cn/v3';
const PROXY_BASE = 'http://localhost:3003/api/coze'; // 通过代理服务器
const BOT_ID = '7537689196866158618';
const API_KEY = 'pat_jh83evgpcgz12NkqIbVDLqKp1KaBxK88ypjoI1rR9hjXwW4aKSSUKg9C8NPBA4q1';

// 通用请求头
const getHeaders = () => ({
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
});

/**
 * 1. 发起对话请求
 * 文档: https://www.coze.cn/open/docs/developer_guides/chat_v3
 */
async function startChat(useProxy = false) {
  const baseUrl = useProxy ? PROXY_BASE : COZE_API_BASE;
  
  const chatData = {
    bot_id: BOT_ID,
    user_id: "123456789",
    stream: false, // 设置为true启用流式响应
    additional_messages: [
      {
        content: "你好，请介绍一下你自己",
        content_type: "text",
        role: "user",
        type: "question"
      }
    ],
    parameters: {}
  };
  
  try {
    console.log('🚀 发起对话请求...');
    const response = await axios.post(`${baseUrl}/chat`, chatData, {
      headers: getHeaders()
    });
    
    console.log('✅ 对话请求成功!');
    console.log('📋 响应数据:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ 对话请求失败:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 2. 查看对话详情
 * 文档: https://www.coze.cn/open/docs/developer_guides/retrieve_chat
 */
async function retrieveChat(conversationId, chatId, useProxy = false) {
  const baseUrl = useProxy ? PROXY_BASE : COZE_API_BASE;
  
  try {
    console.log('📋 查看对话详情...');
    const response = await axios.get(`${baseUrl}/chat/retrieve`, {
      params: {
        conversation_id: conversationId,
        chat_id: chatId
      },
      headers: getHeaders()
    });
    
    console.log('✅ 对话详情获取成功!');
    console.log('📄 对话详情:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ 获取对话详情失败:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 3. 查看对话消息列表
 * 文档: https://www.coze.cn/open/docs/developer_guides/list_chat_messages
 */
async function listChatMessages(conversationId, chatId, useProxy = false) {
  const baseUrl = useProxy ? PROXY_BASE : COZE_API_BASE;
  
  try {
    console.log('📝 查看对话消息列表...');
    const response = await axios.get(`${baseUrl}/chat/message/list`, {
      params: {
        conversation_id: conversationId,
        chat_id: chatId
      },
      headers: getHeaders()
    });
    
    console.log('✅ 消息列表获取成功!');
    console.log('📄 消息列表:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ 获取消息列表失败:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 完整流程测试
 */
async function runCompleteTest(useProxy = false) {
  console.log(`🧪 完整流程测试 ${useProxy ? '(通过代理)' : '(直接调用)'}...\n`);
  
  try {
    // 1. 发起对话
    const chatResult = await startChat(useProxy);
    
    if (chatResult.data?.conversation_id && chatResult.data?.chat_id) {
      const { conversation_id, chat_id } = chatResult.data;
      
      // 等待一下让对话完成
      console.log('⏳ 等待对话完成...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 2. 查看对话详情
      await retrieveChat(conversation_id, chat_id, useProxy);
      
      // 3. 查看消息列表
      await listChatMessages(conversation_id, chat_id, useProxy);
      
      console.log('🎉 完整流程测试完成!');
    } else {
      console.log('⚠️ 未获得conversation_id或chat_id，跳过后续测试');
    }
    
  } catch (error) {
    console.error('❌ 完整流程测试失败:', error.message);
  }
}

/**
 * 流式对话示例
 */
async function startStreamChat(useProxy = false) {
  const baseUrl = useProxy ? PROXY_BASE : COZE_API_BASE;
  
  const chatData = {
    bot_id: BOT_ID,
    user_id: "123456789",
    stream: true, // 启用流式响应
    additional_messages: [
      {
        content: "请写一首关于春天的诗",
        content_type: "text",
        role: "user",
        type: "question"
      }
    ],
    parameters: {}
  };
  
  try {
    console.log('🌊 发起流式对话请求...');
    const response = await axios.post(`${baseUrl}/chat`, chatData, {
      headers: getHeaders(),
      responseType: 'stream'
    });
    
    console.log('✅ 流式对话请求成功!');
    console.log('📋 响应状态:', response.status);
    
    // 处理流式响应
    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      lines.forEach(line => {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              process.stdout.write(data.content);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      });
    });
    
    return response;
  } catch (error) {
    console.error('❌ 流式对话请求失败:', error.response?.data || error.message);
    throw error;
  }
}

// 导出函数供其他模块使用
module.exports = {
  startChat,
  retrieveChat,
  listChatMessages,
  runCompleteTest,
  startStreamChat,
  BOT_ID,
  API_KEY
};

// 如果直接运行此文件，执行测试
if (require.main === module) {
  console.log('🚀 Coze API 使用示例\n');
  
  // 先测试直接调用
  runCompleteTest(false).then(() => {
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 再测试通过代理
    return runCompleteTest(true);
  }).catch(console.error);
} 