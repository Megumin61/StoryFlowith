# 环境变量配置说明

## 创建 .env 文件

在 `src/services/` 目录下创建一个 `.env` 文件，包含以下配置：

```bash
# Coze API 配置
COZE_API_KEY=your_coze_api_key_here
COZE_BOT_ID=your_bot_id_here

# 服务器配置
PORT=3003

# 其他配置
NODE_ENV=development
```

## 配置说明

### COZE_API_KEY
- 从 Coze 平台获取的 API 密钥
- 格式：`pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### COZE_BOT_ID
- 从 Coze 平台获取的 Bot ID
- 格式：数字字符串，如 `7537689196866158618`

### PORT
- 后端服务监听的端口号
- 默认：3003
- 确保与前端配置一致

## 获取配置值

1. 登录 [Coze 平台](https://www.coze.cn/)
2. 进入你的 Bot 设置页面
3. 在 API 设置中获取 API Key 和 Bot ID
4. 将这些值复制到 `.env` 文件中

## 注意事项

- `.env` 文件包含敏感信息，不要提交到版本控制系统
- 确保 `.env` 文件在 `src/services/` 目录下
- 重启服务后配置才会生效 