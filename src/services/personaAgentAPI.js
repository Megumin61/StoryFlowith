// 访谈提取与画像建模Agent API服务
const API_BASE_URL = 'http://localhost:3003/api/coze';

/**
 * 调用访谈提取与画像建模Agent
 * @param {Object} interviewData - 访谈数据
 * @param {Array} keywords - 用户圈画的关键词数组
 * @returns {Promise<Object>} 返回生成的用户画像和气泡数据
 */
export const generatePersonaFromInterview = async (interviewData, keywords) => {
  try {
    // 构建请求数据
    const requestData = {
      user_id: `user_${Date.now()}`, // 生成临时用户ID
      query: `请基于以下用户访谈数据和关键词，生成详细的用户画像和气泡分类：

访谈数据：
${interviewData.text}

用户圈画的关键词：
${keywords.map(k => `- ${k.text} (${getKeywordTypeName(k.type)})`).join('\n')}

请按照以下格式输出JSON：
{
  "personas": [
    {
      "persona_name": "用户姓名",
      "persona_summary": "简要描述",
      "memorable_quote": "代表性话语",
      "Appearance characteristics": "外观特征",
      "basic_profile": {
        "name": "姓名",
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
}`,
      bot_id: '7537689196866158618', // 使用默认的Bot ID
      stream: false
    };

    console.log('🚀 发送请求到画像建模Agent:', requestData);

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📋 画像建模Agent响应:', data);

    // 尝试解析返回的内容
    let result;
    try {
      // 如果返回的是字符串，尝试解析JSON
      if (typeof data.choices?.[0]?.message?.content === 'string') {
        const content = data.choices[0].message.content;
        // 尝试提取JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('无法找到JSON内容');
        }
      } else {
        result = data;
      }
    } catch (parseError) {
      console.error('❌ 解析Agent响应失败:', parseError);
      // 返回默认结构
      result = {
        personas: [],
        bubbles: {
          persona: [],
          context: [],
          goal: [],
          pain: [],
          emotion: []
        }
      };
    }

    return result;
  } catch (error) {
    console.error('❌ 调用画像建模Agent失败:', error);
    throw error;
  }
};

/**
 * 获取关键词类型的中文名称
 * @param {string} type - 关键词类型
 * @returns {string} 中文名称
 */
const getKeywordTypeName = (type) => {
  const typeNames = {
    'elements': '元素',
    'user_traits': '用户特征',
    'pain_points': '痛点',
    'goals': '目标',
    'emotions': '情绪'
  };
  return typeNames[type] || type;
};

/**
 * 健康检查
 * @returns {Promise<boolean>} 服务是否正常
 */
export const checkServiceHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 服务健康检查通过:', data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ 服务健康检查失败:', error);
    return false;
  }
}; 