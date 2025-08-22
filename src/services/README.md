# Coze功能API系统

这是一个通用的Coze API调用系统，支持多种AI功能，包括用户画像生成、故事生成、内容分析等。

## 🏗️ 系统架构

```
前端组件 → cozeFunctionAPI.js → 后端通用接口 → Coze API → 返回处理后的数据
```

## 📁 文件结构

- `cozeAPI.js` - 后端通用接口服务器
- `cozeFunctionAPI.js` - 前端API服务层
- `personaAgentAPI.js` - 用户画像生成专用API（向后兼容）
- `apiUsageExamples.js` - 使用示例
- `README.md` - 本文档

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd src/services
npm run coze-api
```

后端服务将在 `http://localhost:3003` 启动。

### 2. 在前端使用API

```javascript
import { generatePersona, generateStory, analyzeContent } from './services/cozeFunctionAPI';

// 生成用户画像
const persona = await generatePersona(interviewData, selectedBubbles);

// 生成故事
const story = await generateStory(persona, sceneDescription);

// 分析内容
const analysis = await analyzeContent(content, requirements);
```

## 🔧 API接口说明

### 后端通用接口

**POST** `/api/coze/function`

请求体格式：
```json
{
  "function_type": "功能类型",
  "data": {
    // 具体的数据内容
  },
  "bot_id": "可选的bot ID",
  "stream": false,
  "custom_prompt": "可选的自定义提示词"
}
```

### 支持的功能类型

#### 1. 用户画像生成 (`persona_generation`)

**输入数据格式：**
```json
{
  "interview_text": "访谈文本内容",
  "selected_bubbles": {
    "persona": ["人物特征1", "人物特征2"],
    "context": ["场景1", "场景2"],
    "goal": ["目标1", "目标2"],
    "pain": ["痛点1", "痛点2"],
    "emotion": ["情绪1", "情绪2"]
  }
}
```

**输出数据格式：**
```json
{
  "personas": [
    {
      "persona_name": "用户姓名",
      "persona_summary": "简要描述",
      "memorable_quote": "代表性话语",
      "appearance_characteristics": "外观特征",
      "basic_profile": {
        "name": "用户姓名",
        "age": "年龄",
        "gender": "性别",
        "occupation": "职业",
        "education": "教育程度",
        "city": "城市",
        "technology_literacy": "技术熟练度",
        "devices": ["设备列表"]
      },
      "domain_pain_points": ["痛点列表"],
      "domain_goals_and_motivations": ["目标动机列表"],
      "usage_context": ["使用场景列表"],
      "tool_expectations": ["工具期望列表"],
      "general_behavior": ["一般行为特征"],
      "psychological_profile": ["心理特征"],
      "communication_style": ["沟通风格"],
      "keywords": ["关键词标签"]
    }
  ],
  "bubbles": {
    "persona": ["人物特征气泡"],
    "context": ["场景气泡"],
    "goal": ["目标气泡"],
    "pain": ["痛点气泡"],
    "emotion": ["情绪气泡"]
  }
}
```

#### 2. 故事生成 (`story_generation`)

**输入数据格式：**
```json
{
  "persona": {
    // 用户画像数据
  },
  "scene_description": "场景描述"
}
```

**输出数据格式：**
```json
{
  "story": {
    "title": "故事标题",
    "content": "故事内容",
    "key_elements": ["关键元素"],
    "emotional_arc": "情感弧线描述"
  }
}
```

#### 3. 内容分析 (`content_analysis`)

**输入数据格式：**
```json
{
  "content": "要分析的内容",
  "analysis_requirements": "分析要求"
}
```

**输出数据格式：**
```json
{
  "analysis": {
    "key_insights": ["关键洞察"],
    "recommendations": ["建议"],
    "sentiment": "情感倾向",
    "topics": ["主题标签"]
  }
}
```

## 💡 使用示例

### 基本用法

```javascript
import { generatePersona } from './services/cozeFunctionAPI';

const interviewData = {
  text: "我每天在办公室坐八九个小时，下班后觉得腰酸背痛..."
};

const selectedBubbles = {
  persona: ["白领", "健身新手"],
  context: ["健身房锻炼", "长时间久坐办公"],
  goal: ["改善身体素质", "建立习惯"],
  pain: ["器械使用不熟练", "饮食安排复杂"],
  emotion: ["紧张", "困惑"]
};

try {
  const result = await generatePersona(interviewData, selectedBubbles);
  console.log('生成的用户画像:', result);
} catch (error) {
  console.error('生成失败:', error);
}
```

### 流式调用

```javascript
import { streamFunction } from './services/cozeFunctionAPI';

let fullResponse = '';
const onChunk = (chunk) => {
  console.log('收到数据:', chunk);
  fullResponse += chunk;
};

await streamFunction('content_analysis', {
  content: "长文本内容...",
  analysis_requirements: "请逐段分析"
}, onChunk);

console.log('完整响应:', fullResponse);
```

### 自定义功能

```javascript
import { callCustomFunction } from './services/cozeFunctionAPI';

const result = await callCustomFunction(
  "请分析以下产品的优缺点",
  {
    product_name: "智能健身App",
    target_users: "健身初学者"
  }
);
```

## 🔄 向后兼容

原有的 `personaAgentAPI.js` 仍然可以正常使用，它会自动调用新的API系统。

## 🛠️ 错误处理

系统内置了完善的错误处理机制：

1. **重试机制**：自动重试失败的请求
2. **数据验证**：验证Coze API返回的数据格式
3. **错误分类**：区分不同类型的错误（网络错误、数据格式错误等）
4. **详细日志**：提供详细的错误信息和调试信息

## 📊 监控和日志

系统提供详细的日志记录：

- 🚀 请求开始
- 📤 发送到Coze API
- 📋 Coze API响应
- ✅ 成功处理
- ❌ 错误信息

## 🔧 配置选项

### 环境变量

- `COZE_API_KEY` - Coze API密钥
- `COZE_BOT_ID` - 默认的Bot ID
- `PORT` - 后端服务端口（默认3003）
- `REACT_APP_API_BASE_URL` - 前端API基础URL

### 超时设置

- 默认超时时间：30秒
- 可自定义超时时间
- 支持AbortController取消请求

## 🚨 注意事项

1. **API密钥安全**：不要在客户端代码中暴露API密钥
2. **数据格式**：确保输入数据符合API要求
3. **错误处理**：始终使用try-catch包装API调用
4. **重试策略**：系统会自动重试，避免手动重试
5. **流式响应**：流式调用需要正确处理数据块

## 📞 技术支持

如果遇到问题，请检查：

1. 后端服务是否正常运行
2. 网络连接是否正常
3. API密钥是否有效
4. 请求数据格式是否正确
5. 控制台错误信息

## 🔮 未来扩展

系统设计为可扩展的架构，可以轻松添加新的功能类型：

1. 在 `generatePromptByFunction` 中添加新的case
2. 在 `processCozeResponse` 中添加新的验证逻辑
3. 在前端API服务中添加新的函数
4. 更新类型定义和文档 