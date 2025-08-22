# 用户画像生成系统 - 项目设置指南

## 项目概述

这是一个基于React和Node.js的用户画像生成系统，集成了Coze AI平台，能够根据用户输入自动生成用户画像、故事板和内容分析。

## 系统架构

- **前端**: React 18 + TypeScript
- **后端**: Node.js + Express
- **AI服务**: Coze Bot API
- **端口配置**: 前端3000，后端3003

## 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd src/services
npm install
```

### 2. 配置环境变量

在 `src/services/` 目录下创建 `.env` 文件：

```bash
# Coze API 配置
COZE_API_KEY=your_coze_api_key_here
COZE_BOT_ID=your_bot_id_here

# 服务器配置
PORT=3003
NODE_ENV=development
```

### 3. 启动服务

#### 方法1: 使用批处理文件 (Windows)
```bash
# 启动后端服务
start-backend.bat

# 启动前端服务 (新终端)
npm start
```

#### 方法2: 使用PowerShell脚本
```bash
# 启动后端服务
.\start-backend-simple.ps1

# 启动前端服务 (新终端)
npm start
```

#### 方法3: 手动启动
```bash
# 终端1: 启动后端
cd src/services
node cozeAPI.js

# 终端2: 启动前端
npm start
```

## 功能特性

### 1. 用户画像生成
- 根据用户描述自动生成用户画像
- 支持多维度用户特征分析
- 生成用户行为模式和偏好

### 2. 故事板生成
- 基于用户画像创建故事板
- 支持多种故事类型和风格
- 自动生成角色和情节

### 3. 内容分析
- 分析用户生成的内容
- 提供优化建议和改进方向
- 支持多种内容类型

## API 端点

### 主要接口
- `POST /api/coze/function` - 通用功能调用接口
- `POST /api/coze/chat` - 聊天接口（兼容性）
- `GET /api/coze/health` - 健康检查

### 功能类型
- `persona_generation` - 用户画像生成
- `story_generation` - 故事板生成
- `content_analysis` - 内容分析

## 配置说明

### Coze API 配置
1. 登录 [Coze 平台](https://www.coze.cn/)
2. 进入Bot设置页面
3. 获取API Key和Bot ID
4. 配置到 `.env` 文件中

### 端口配置
- 前端: 3000 (React默认)
- 后端: 3003 (可自定义)

## 故障排除

### 常见问题

1. **模块未找到错误**
   ```bash
   npm install
   ```

2. **端口被占用**
   ```bash
   # 修改 .env 文件中的 PORT 值
   PORT=3004
   ```

3. **Coze API 调用失败**
   - 检查API Key和Bot ID是否正确
   - 确认网络连接正常
   - 查看控制台错误信息

4. **PowerShell 语法错误**
   - 使用 `start-backend-simple.ps1` 脚本
   - 或使用批处理文件 `start-backend.bat`

### 日志查看
- 前端: 浏览器控制台
- 后端: 终端输出

## 开发指南

### 添加新功能
1. 在 `cozeAPI.js` 中添加新的API端点
2. 在 `generatePromptByFunction` 中添加对应的提示词生成逻辑
3. 在前端组件中添加相应的UI界面

### 自定义提示词
修改 `generatePromptByFunction` 函数中的提示词模板，以适应不同的业务需求。

## 部署说明

### 生产环境
1. 设置 `NODE_ENV=production`
2. 配置生产环境的API密钥
3. 使用PM2或类似工具管理Node.js进程

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3003
CMD ["node", "src/services/cozeAPI.js"]
```

## 许可证

MIT License

## 支持

如有问题，请查看：
1. 控制台错误信息
2. 网络请求状态
3. 环境变量配置
4. 依赖包版本兼容性 