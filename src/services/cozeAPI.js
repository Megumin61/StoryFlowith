// 引入必要的库
const express = require('express');
const axios = require('axios');
const cors = require('cors');

// 推荐使用 dotenv 来管理环境变量
require('dotenv').config();

// --- 配置 ---
// 从环境变量中读取配置，如果不存在则使用您提供的默认值
const COZE_API_KEY = process.env.COZE_API_KEY || 'pat_jh83evgpcgz12NkqIbVDLqKp1KaBxK88ypjoI1rR9hjXwW4aKSSUKg9C8NPBA4q1';
const COZE_BOT_ID = process.env.COZE_BOT_ID || '7537689196866158618';
const PORT = process.env.PORT || 3003; // 修正端口为3003，与前端一致
const COZE_API_BASE = 'https://api.coze.cn/v3';

// --- Express 应用初始化 ---
const app = express();

// 添加CORS支持
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // 允许React开发服务器访问
  credentials: true
}));

// 使用 express.json() 中间件来解析传入的 JSON 请求体
app.use(express.json());

// --- 辅助函数 ---
/**
 * 返回调用 Coze API 所需的请求头
 * @returns {object}
 */
const getCozeHeaders = () => {
  return {
    'Authorization': `Bearer ${COZE_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': '*/*'
  };
};

// --- API 端点 ---

/**
 * 接口: 发起对话
 * @route POST /api/coze/chat
 */
app.post('/api/coze/chat', async (req, res) => {
  const { user_id, query, stream = false, conversation_id, additional_messages = [], bot_id } = req.body;

  // 添加详细的请求体日志
  console.log('🔍 收到前端请求:');
  console.log('   完整请求体:', JSON.stringify(req.body, null, 2));
  console.log('   解析后的 bot_id:', bot_id);
  console.log('   类型:', typeof bot_id);
  console.log('   是否为 undefined:', bot_id === undefined);
  console.log('   是否为 null:', bot_id === null);
  console.log('   是否为空字符串:', bot_id === '');

  if (!user_id || !query) {
    return res.status(400).json({ error: "请求体中必须包含 'user_id' 和 'query'" });
  }

  // 使用前端传递的 bot_id，如果没有则使用默认值
  const targetBotId = bot_id || COZE_BOT_ID;
  
  console.log('🎯 最终使用的 Bot ID:');
  console.log('   前端传递的 bot_id:', bot_id);
  console.log('   默认的 COZE_BOT_ID:', COZE_BOT_ID);
  console.log('   最终选择的 targetBotId:', targetBotId);

  // 构建请求 Coze API 的 payload，按照官方文档格式
  const payload = {
    bot_id: targetBotId,
    user_id: user_id,
    stream: stream,
    additional_messages: [
      {
        content: query,
        content_type: "text", // 使用下划线格式
        role: "user",
        type: "question"
      },
      ...additional_messages
    ],
    parameters: {}
  };
  
  // 如果提供了 conversation_id，则加入到 payload 中
  if (conversation_id) {
    payload.conversation_id = conversation_id;
  }

  console.log('🚀 发送请求到Coze API:', {
    url: `${COZE_API_BASE}/chat`,
    payload: payload,
    headers: getCozeHeaders(),
    selectedBotId: targetBotId
  });

  try {
    const response = await axios.post(`${COZE_API_BASE}/chat`, payload, {
      headers: getCozeHeaders(),
      responseType: stream ? 'stream' : 'json'
    });

    console.log('📋 Coze API响应状态:', response.status);
    console.log('📋 Coze API响应数据:', response.data);

    if (stream) {
      // 设置响应头，告诉客户端这是一个事件流
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // 直接将 Coze API 的响应流管道连接到我们的响应体中
      response.data.pipe(res);
    } else {
      // 对于非流式响应，直接返回 JSON 数据
      res.status(200).json(response.data);
    }
  } catch (error) {
    console.error('❌ 调用 Coze API 失败:', error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ 
      error: "调用 Coze API 失败", 
      details: error.response?.data || error.message 
    });
  }
});

/**
 * 接口: 查看对话详情
 * @route GET /api/coze/chat/retrieve
 */
app.get('/api/coze/chat/retrieve', async (req, res) => {
  const { chat_id, conversation_id } = req.query;

  if (!chat_id) {
    return res.status(400).json({ error: "必须提供 'chat_id' 参数" });
  }

  console.log('🔍 调用Retrieve API:', { chat_id, conversation_id });

  try {
    const response = await axios.get(`${COZE_API_BASE}/chat/retrieve`, {
      headers: getCozeHeaders(),
      params: { chat_id, conversation_id }
    });
    
    console.log('📋 Retrieve API响应:', response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ 调用 Coze API 失败:', error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ 
      error: "调用 Coze API 失败", 
      details: error.response?.data || error.message 
    });
  }
});

/**
 * 接口: 查看对话消息列表
 * @route GET /api/coze/chat/message/list
 */
app.get('/api/coze/chat/message/list', async (req, res) => {
  const { conversation_id, chat_id } = req.query;

  if (!conversation_id || !chat_id) {
    return res.status(400).json({ error: "必须同时提供 'conversation_id' 和 'chat_id' 参数" });
  }

  console.log('📝 调用Message List API:', { conversation_id, chat_id });

  try {
    const response = await axios.get(`${COZE_API_BASE}/chat/message/list`, {
      headers: getCozeHeaders(),
      params: { conversation_id, chat_id }
    });
    
    console.log('📋 Message List API响应:', response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ 调用 Coze API 失败:', error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ 
      error: "调用 Coze API 失败", 
      details: error.response?.data || error.message 
    });
  }
});

// 添加健康检查端点
app.get('/api/coze/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Coze API 服务运行正常',
    bot_id: COZE_BOT_ID,
    port: PORT
  });
});

// --- 启动服务器 ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Coze API 服务器已成功启动，正在监听端口: http://localhost:${PORT}`);
  console.log(`🤖 Bot ID: ${COZE_BOT_ID}`);
  console.log(`🔑 API Key: ${COZE_API_KEY.substring(0, 10)}...`);
  console.log(`📡 API Base: ${COZE_API_BASE}`);
});