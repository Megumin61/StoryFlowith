const axios = require('axios');

// 配置
const COZE_API_KEY = 'pat_jh83evgpcgz12NkqIbVDLqKp1KaBxK88ypjoI1rR9hjXwW4aKSSUKg9C8NPBA4q1';
const COZE_API_BASE = 'https://api.coze.cn/v3';

async function createTestBot() {
  console.log('🤖 开始创建测试Bot...\n');
  
  try {
    // 1. 尝试获取Bot列表（如果API支持）
    console.log('1️⃣ 尝试获取现有Bot列表...');
    try {
      const response = await axios.get(`${COZE_API_BASE}/bot/list`, {
        headers: {
          'Authorization': `Bearer ${COZE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.data) {
        console.log('✅ 成功获取Bot列表');
        console.log('📋 可用的Bot:');
        response.data.data.forEach((bot, index) => {
          console.log(`   ${index + 1}. ID: ${bot.id}, 名称: ${bot.name || '未命名'}, 状态: ${bot.status || '未知'}`);
        });
        
        // 检查是否有可用的Bot
        const availableBot = response.data.data.find(bot => bot.status === 'active' || bot.status === 'enabled');
        if (availableBot) {
          console.log(`\n🎯 发现可用Bot: ${availableBot.name} (ID: ${availableBot.id})`);
          console.log('💡 建议使用这个Bot ID替换当前的配置');
        }
      }
    } catch (error) {
      console.log('❌ 无法获取Bot列表:', error.response?.data?.msg || error.message);
      console.log('💡 这可能是API限制，需要手动检查');
    }
    
    // 2. 提供手动创建Bot的指导
    console.log('\n2️⃣ 手动创建Bot的步骤:');
    console.log('   1. 访问 https://www.coze.cn/');
    console.log('   2. 登录你的账户');
    console.log('   3. 点击"创建Bot"或"+"按钮');
    console.log('   4. 选择"对话Bot"类型');
    console.log('   5. 设置Bot名称（如"测试助手"）');
    console.log('   6. 选择模型（如GPT-4）');
    console.log('   7. 设置简单的系统提示词（如"你是一个友好的AI助手"）');
    console.log('   8. 保存并发布Bot');
    console.log('   9. 复制新Bot的ID');
    
    // 3. 测试新Bot ID的模板
    console.log('\n3️⃣ 测试新Bot ID的模板代码:');
    console.log('```javascript');
    console.log('// 在 src/services/cozeAPI.js 中更新这些值');
    console.log('const COZE_API_KEY = "你的新API Key";');
    console.log('const COZE_BOT_ID = "新的Bot ID";');
    console.log('```');
    
    // 4. 验证新Bot的脚本
    console.log('\n4️⃣ 验证新Bot的测试脚本:');
    console.log('```javascript');
    console.log('const axios = require("axios");');
    console.log('const COZE_API_KEY = "你的新API Key";');
    console.log('const COZE_BOT_ID = "新的Bot ID";');
    console.log('const COZE_API_BASE = "https://api.coze.cn/v3";');
    console.log('');
    console.log('async function testNewBot() {');
    console.log('  try {');
    console.log('    const response = await axios.post(`${COZE_API_BASE}/chat`, {');
    console.log('      user_id: "test_user_123",');
    console.log('      query: "你好",');
    console.log('      bot_id: COZE_BOT_ID,');
    console.log('      stream: false');
    console.log('    }, {');
    console.log('      headers: {');
    console.log('        "Authorization": `Bearer ${COZE_API_KEY}`,');
    console.log('        "Content-Type": "application/json"');
    console.log('      }');
    console.log('    });');
    console.log('    console.log("✅ 新Bot工作正常:", response.data);');
    console.log('  } catch (error) {');
    console.log('    console.log("❌ 新Bot测试失败:", error.response?.data || error.message);');
    console.log('  }');
    console.log('}');
    console.log('');
    console.log('testNewBot();');
    console.log('```');
    
  } catch (error) {
    console.error('❌ 创建测试Bot过程中发生错误:', error.message);
  }
  
  console.log('\n📋 下一步操作:');
  console.log('1. 按照上述步骤在Coze平台创建新的Bot');
  console.log('2. 获取新的Bot ID和API Key');
  console.log('3. 更新配置文件');
  console.log('4. 运行测试脚本验证新Bot');
}

// 运行
createTestBot(); 