# Coze API 集成示例

这个项目展示了如何正确集成和使用 [Coze API](https://www.coze.cn/open/docs/developer_guides/chat_v3)。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install axios express cors http-proxy-middleware
```

### 2. 配置信息

在代码中配置你的Coze API信息：

```javascript
const BOT_ID = '你的Bot ID';
const API_KEY = '你的API Key';
```

### 3. 运行测试

#### 直接调用Coze API
```bash
node test-coze-correct.js
```

#### 通过代理服务器调用
```bash
# 启动代理服务器
node debug-proxy.js

# 在另一个终端测试代理
node test-coze-proxy.js
```

#### 完整流程测试
```bash
node coze-api-examples.js
```

## 📚 API 端点

### 1. 发起对话
- **端点**: `POST /v3/chat`
- **文档**: [Chat API](https://www.coze.cn/open/docs/developer_guides/chat_v3)

```javascript
const chatData = {
  bot_id: "你的Bot ID",
  user_id: "用户ID",
  stream: false, // 设置为true启用流式响应
  additional_messages: [
    {
      content: "你好",
      content_type: "text",
      role: "user",
      type: "question"
    }
  ],
  parameters: {}
};

const response = await axios.post('https://api.coze.cn/v3/chat', chatData, {
  headers: {
    'Authorization': 'Bearer 你的API Key',
    'Content-Type': 'application/json'
  }
});
```

### 2. 查看对话详情
- **端点**: `GET /v3/chat/retrieve`
- **文档**: [Retrieve Chat](https://www.coze.cn/open/docs/developer_guides/retrieve_chat)

```javascript
const response = await axios.get('https://api.coze.cn/v3/chat/retrieve', {
  params: {
    conversation_id: '对话ID',
    chat_id: '聊天ID'
  },
  headers: {
    'Authorization': 'Bearer 你的API Key'
  }
});
```

### 3. 查看对话消息列表
- **端点**: `GET /v3/chat/message/list`
- **文档**: [List Chat Messages](https://www.coze.cn/open/docs/developer_guides/list_chat_messages)

```javascript
const response = await axios.get('https://api.coze.cn/v3/chat/message/list', {
  params: {
    conversation_id: '对话ID',
    chat_id: '聊天ID'
  },
  headers: {
    'Authorization': 'Bearer 你的API Key'
  }
});
```

## 🔧 代理服务器

项目包含一个代理服务器 (`debug-proxy.js`)，可以：

- 解决CORS问题
- 隐藏API密钥
- 添加请求日志
- 统一错误处理

### 启动代理服务器
```bash
node debug-proxy.js
```

代理服务器将在 `http://localhost:3003` 启动，将 `/api/coze/*` 的请求转发到 `https://api.coze.cn/v3/*`。

## 📝 重要注意事项

1. **API端点**: 使用 `https://api.coze.cn/v3/chat` 而不是 `https://api.coze.cn/v3/chat?`
2. **请求头**: 必须包含 `Authorization: Bearer {API_KEY}` 和 `Content-Type: application/json`
3. **请求体格式**: 严格按照官方文档的JSON结构
4. **流式响应**: 设置 `stream: true` 启用流式响应
5. **错误处理**: 检查响应状态和错误码

## 🧪 测试文件说明

- `test-coze-correct.js` - 直接调用Coze API测试
- `test-coze-proxy.js` - 通过代理服务器测试
- `coze-api-examples.js` - 完整的API使用示例
- `debug-proxy.js` - 代理服务器
- `test-simple.js` - 简单测试

## 🔍 调试

如果遇到问题，检查：

1. API密钥是否有效
2. Bot ID是否正确
3. 网络连接是否正常
4. 请求格式是否符合文档要求
5. 代理服务器是否正常运行

## 📖 官方文档

- [Chat API v3](https://www.coze.cn/open/docs/developer_guides/chat_v3)
- [Retrieve Chat](https://www.coze.cn/open/docs/developer_guides/retrieve_chat)
- [List Chat Messages](https://www.coze.cn/open/docs/developer_guides/list_chat_messages)
