import React, { useState } from 'react';

const PersonaGenerationTest = () => {
  const [interviewText, setInterviewText] = useState('');
  const [selectedBubbles, setSelectedBubbles] = useState({
    persona: [],
    context: [],
    goal: [],
    pain: [],
    emotion: []
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGeneratePersona = async () => {
    if (!interviewText.trim()) {
      alert('请输入访谈文本');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 准备数据
      const interviewData = {
        interview_text: interviewText,
        selected_bubbles: selectedBubbles
      };

      console.log('📤 发送数据:', interviewData);

      // 第一步：调用后端请求函数
      const response = await fetch('/api/coze/function', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          function_type: 'persona_generation',
          data: interviewData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('✅ 初始响应:', responseData);

      // 检查是否有任务ID和对话ID
      if (responseData.data && responseData.data.id && responseData.data.conversation_id) {
        const taskId = responseData.data.id;
        const conversationId = responseData.data.conversation_id;
        
        console.log(`🎯 任务已创建，ID: ${taskId}, 对话ID: ${conversationId}`);
        
        // 第二步：轮询获取任务状态
        let taskCompleted = false;
        let finalResult = null;
        const maxWaitTime = 60000; // 60秒超时
        const startTime = Date.now();
        
        while (!taskCompleted && (Date.now() - startTime) < maxWaitTime) {
          try {
            console.log('⏳ 检查任务状态...');
            
            // 调用getChatDetails函数获取状态响应
            const statusResponse = await fetch(`/api/coze/chat/retrieve?chat_id=${taskId}&conversation_id=${conversationId}`);
            
            if (!statusResponse.ok) {
              throw new Error(`状态检查失败: ${statusResponse.status}`);
            }
            
            const statusData = await statusResponse.json();
            console.log('📋 任务状态:', statusData);
            
            if (statusData.data && statusData.data.status === 'completed') {
              console.log('✅ 任务完成，获取消息列表');
              taskCompleted = true;
              
              // 第三步：调用getMessageList获取返回的数据详情
              const messageResponse = await fetch(`/api/coze/chat/message/list?conversation_id=${conversationId}&chat_id=${taskId}`);
              
              if (!messageResponse.ok) {
                throw new Error(`获取消息失败: ${messageResponse.status}`);
              }
              
              const messageData = await messageResponse.json();
              console.log('📨 消息列表:', messageData);
              
              // 找到Bot的回复消息
              if (messageData.data && messageData.data.messages) {
                const botMessage = messageData.data.messages.find(
                  msg => msg.role === 'assistant' && msg.content
                );
                
                if (botMessage && botMessage.content) {
                  finalResult = {
                    status: 'completed',
                    content: botMessage.content,
                    taskData: statusData.data,
                    messageData: messageData.data
                  };
                } else {
                  finalResult = messageData;
                }
              } else {
                finalResult = messageData;
              }
              
            } else if (statusData.data && (statusData.data.status === 'failed' || statusData.data.status === 'error')) {
              throw new Error(`任务失败: ${statusData.data.error?.message || statusData.data.last_error?.msg || '未知错误'}`);
            } else {
              console.log('⏳ 任务仍在进行中，等待2秒后重试...');
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
          } catch (error) {
            console.error('❌ 检查任务状态时出错:', error);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        if (finalResult) {
          setResult(finalResult);
        } else {
          throw new Error('任务超时，请稍后重试');
        }
        
      } else {
        // 如果没有任务ID，直接使用响应数据
        setResult(responseData);
      }
      
    } catch (err) {
      console.error('❌ 生成失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addBubble = (category, text) => {
    if (text.trim()) {
      setSelectedBubbles(prev => ({
        ...prev,
        [category]: [...prev[category], text.trim()]
      }));
    }
  };

  const removeBubble = (category, index) => {
    setSelectedBubbles(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>用户画像生成测试</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>访谈文本</h3>
        <textarea
          value={interviewText}
          onChange={(e) => setInterviewText(e.target.value)}
          placeholder="请输入用户访谈文本..."
          style={{ width: '100%', height: '150px', padding: '10px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>选中的气泡</h3>
        {Object.entries(selectedBubbles).map(([category, texts]) => (
          <div key={category} style={{ marginBottom: '15px' }}>
            <h4>{category}</h4>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder={`添加${category}气泡...`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addBubble(category, e.target.value);
                    e.target.value = '';
                  }
                }}
                style={{ flex: 1, padding: '5px' }}
              />
              <button onClick={() => {
                const input = document.querySelector(`input[placeholder="添加${category}气泡..."]`);
                if (input) {
                  addBubble(category, input.value);
                  input.value = '';
                }
              }}>
                添加
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {texts.map((text, index) => (
                <span
                  key={index}
                  style={{
                    background: '#e1f5fe',
                    padding: '5px 10px',
                    borderRadius: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {text}
                  <button
                    onClick={() => removeBubble(category, index)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'red' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleGeneratePersona}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          background: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '生成中...' : '生成用户画像'}
      </button>

      {error && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#ffebee', color: '#c62828', borderRadius: '5px' }}>
          <h4>错误</h4>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>生成结果</h3>
          <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PersonaGenerationTest; 