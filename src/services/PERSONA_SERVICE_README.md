# 用户画像生成服务使用说明

## 概述

这个服务封装了与Coze API的交互，用于生成用户画像和气泡分类。服务不直接修改cozeAPI.js文件，而是通过调用其API端点来实现功能。

## 文件结构

```
src/services/
├── cozeAPI.js                    # 后端API服务（不修改）
├── personaGenerationService.js   # 前端服务封装
└── PERSONA_SERVICE_README.md     # 本说明文档
```

## 主要功能

### 1. 用户画像生成 (`generatePersona`)

根据访谈文本和选中的气泡生成用户画像。

**输入数据格式：**
```javascript
{
  interview_text: "用户访谈的文本内容",
  selected_bubbles: {
    persona: ["人物特征1", "人物特征2"],
    context: ["场景1", "场景2"],
    goal: ["目标1", "目标2"],
    pain: ["痛点1", "痛点2"],
    emotion: ["情绪1", "情绪2"]
  }
}
```

**输出数据格式：**
```javascript
{
  personas: [
    {
      persona_name: "用户姓名",
      persona_summary: "简要描述",
      memorable_quote: "代表性话语",
      Appearance_characteristics: "外观特征",
      basic_profile: {
        name: "姓名",
        age: "年龄",
        gender: "性别",
        occupation: "职业",
        education: "教育程度",
        city: "城市",
        technology_literacy: "技术熟练度",
        devices: ["设备列表"]
      },
      domain_pain_points: ["痛点列表"],
      domain_goals_and_motivations: ["目标动机列表"],
      usage_context: ["使用场景列表"],
      tool_expectations: ["工具期望列表"],
      general_behavior: ["一般行为特征"],
      psychological_profile: ["心理特征"],
      communication_style: ["沟通风格"],
      keywords: ["关键词标签"]
    }
  ],
  bubbles: {
    persona: ["人物特征气泡"],
    context: ["场景气泡"],
    goal: ["目标气泡"],
    pain: ["痛点气泡"],
    emotion: ["情绪气泡"]
  }
}
```

### 2. 故事生成 (`generateStory`)

根据用户画像和场景描述生成故事。

**输入数据格式：**
```javascript
{
  persona: { /* 用户画像对象 */ },
  scene_description: "场景描述文本"
}
```

### 3. 内容分析 (`analyzeContent`)

分析指定内容并生成洞察。

**输入数据格式：**
```javascript
{
  content: "要分析的内容",
  analysis_requirements: "分析要求"
}
```

## 使用方法

### 在React组件中使用

```javascript
import { generatePersona } from '../services/personaGenerationService';

const MyComponent = () => {
  const handleGeneratePersona = async () => {
    try {
      const interviewData = {
        interview_text: "用户访谈内容...",
        selected_bubbles: {
          persona: ["关键词1", "关键词2"],
          context: ["场景1"],
          goal: ["目标1"],
          pain: ["痛点1"],
          emotion: ["情绪1"]
        }
      };

      const result = await generatePersona(interviewData);
      console.log('生成的用户画像:', result.personas);
      console.log('生成的气泡:', result.bubbles);
    } catch (error) {
      console.error('生成失败:', error.message);
    }
  };

  return (
    <button onClick={handleGeneratePersona}>
      生成用户画像
    </button>
  );
};
```

### 数据转换

服务提供了数据转换函数来帮助处理前后端数据格式的差异：

```javascript
import { transformFrontendData, transformApiResponse } from '../services/personaGenerationService';

// 转换前端数据为API格式
const apiData = transformFrontendData(frontendData);

// 转换API响应为前端格式
const frontendData = transformApiResponse(apiResponse);
```

## 错误处理

服务会抛出详细的错误信息，建议使用try-catch进行错误处理：

```javascript
try {
  const result = await generatePersona(interviewData);
  // 处理成功结果
} catch (error) {
  // 错误信息格式：`用户画像生成失败: ${具体错误}`
  console.error('生成失败:', error.message);
  // 显示用户友好的错误信息
  alert('生成用户画像失败，请稍后重试');
}
```

## 测试

可以使用 `PersonaGenerationTest` 组件来测试服务功能：

```javascript
import PersonaGenerationTest from '../components/PersonaGenerationTest';

// 在路由或页面中使用
<PersonaGenerationTest />
```

## 注意事项

1. **后端服务**：确保cozeAPI.js服务在端口3003上运行
2. **API密钥**：确保环境变量中设置了正确的COZE_API_KEY
3. **网络请求**：服务使用axios进行HTTP请求，确保网络连接正常
4. **数据格式**：严格按照指定的数据格式传递参数，避免API调用失败

## 扩展

如需添加新的功能类型，可以在cozeAPI.js中添加相应的处理逻辑，然后在这个服务中添加对应的函数封装。 