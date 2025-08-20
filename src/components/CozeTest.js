import React, { useState, useRef, useEffect } from 'react';
import { 
  Button, 
  Input, 
  message, 
  Space, 
  Typography,
  Modal,
  Switch,
  Divider,
  Alert,
  Spin,
  Select,
  Card,
  Row,
  Col
} from 'antd';
import { 
  RobotOutlined,
  UserOutlined,
  SendOutlined,
  CloseOutlined,
  SettingOutlined,
  BookOutlined,
  ScissorOutlined,
  CompassOutlined,
  PictureOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Agent 配置
const AGENTS = {
  '7537689196866158618': {
    id: '7537689196866158618',
    name: '01 智能助手',
    description: '通用智能问答助手',
    icon: <RobotOutlined />,
    color: '#1890ff'
  },
  '7538458406407913522': {
    id: '7538458406407913522',
    name: '02 故事脚本生成',
    description: '专业的故事脚本创作助手',
    icon: <BookOutlined />,
    color: '#52c41a'
  },
  '7540134398662967296': {
    id: '7540134398662967296',
    name: '03 故事脚本拆分',
    description: '将长故事拆分为可执行片段',
    icon: <ScissorOutlined />,
    color: '#fa8c16'
  },
  '7540193191904690228': {
    id: '7540193191904690228',
    name: '04 情景探索',
    description: '深入探索故事情景和细节',
    icon: <CompassOutlined />,
    color: '#722ed1'
  },
  '7526396752845963291': {
    id: '7526396752845963291',
    name: '05 画面提示词生成',
    description: '为AI绘画生成专业提示词',
    icon: <PictureOutlined />,
    color: '#eb2f96'
  }
};

const CozeTest = ({ onClose }) => {
  // Coze API配置 - 使用本地代理服务器解决跨域问题
  const COZE_API_URL = 'http://localhost:3003/api/coze/chat'; // 通过本地调试代理服务器
  const COZE_RETRIEVE_URL = 'http://localhost:3003/api/coze/chat/retrieve';
  const COZE_MESSAGE_LIST_URL = 'http://localhost:3003/api/coze/chat/message/list';
  const COZE_HEALTH_URL = 'http://localhost:3003/api/coze/health';
  
  // 状态管理
  const [selectedAgent, setSelectedAgent] = useState('7537689196866158618'); // 默认选择第一个agent
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [streamEnabled, setStreamEnabled] = useState(false); // 默认使用非流式
  const [autoSaveHistory, setAutoSaveHistory] = useState(true);
  const [enableCard, setEnableCard] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [apiStatus, setApiStatus] = useState('idle'); // idle, testing, success, error
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('unknown'); // unknown, online, offline
  
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // 检查后端服务状态
  useEffect(() => {
    checkBackendStatus();
  }, []);

  // 当选择的agent改变时，重置对话
  useEffect(() => {
    resetConversation();
  }, [selectedAgent]);

  // 初始化欢迎消息
  useEffect(() => {
    resetConversation();
  }, []);

  // 重置对话
  const resetConversation = () => {
    const agent = AGENTS[selectedAgent];
    setChatMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content: `你好！我是${agent.name}，${agent.description}。请问有什么可以帮助您的吗？`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'text',
        agentId: selectedAgent
      }
    ]);
    setConversationId(null);
  };

  // 检查后端服务状态
  const checkBackendStatus = async () => {
    try {
      const response = await fetch(COZE_HEALTH_URL);
      if (response.ok) {
        setBackendStatus('online');
        console.log('✅ 后端服务在线');
      } else {
        setBackendStatus('offline');
        console.log('❌ 后端服务离线');
      }
    } catch (error) {
      setBackendStatus('offline');
      console.log('❌ 无法连接到后端服务:', error.message);
    }
  };

  // 发送消息到Coze API
  const sendMessageToCoze = async (message, options = {}) => {
    const {
      stream = false, // 默认使用非流式
      auto_save_history = autoSaveHistory,
      enable_card = enableCard,
      additional_messages = []
    } = options;

    setIsLoading(true);
    setError(null);
    setApiStatus('testing');

    try {
      // 准备请求体 - 按照后端API格式
      const requestBody = {
        user_id: 'test_user_123',
        query: message,
        stream: stream,
        conversation_id: conversationId,
        additional_messages: additional_messages,
        bot_id: selectedAgent // 添加选择的agent ID
      };

      console.log('🚀 发送请求到本地后端:', {
        url: COZE_API_URL,
        body: requestBody,
        selectedAgent: selectedAgent
      });

      // 使用fetch API发送请求，增加超时控制
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时
      
      try {
        const response = await fetch(COZE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId); // 清除超时定时器

        console.log('📋 收到响应:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ HTTP错误:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // 处理响应
        if (stream) {
          await handleStreamResponse(response, message);
        } else {
          await handleNonStreamResponse(response, message);
        }

        setApiStatus('success');
        setError(null);

      } catch (fetchError) {
        clearTimeout(timeoutId); // 确保清除超时定时器
        
        if (fetchError.name === 'AbortError') {
          throw new Error('请求超时 (60秒)');
        }
        throw fetchError;
      }

    } catch (error) {
      console.error('❌ API调用失败:', error);
      setError(`API调用失败: ${error.message}`);
      setApiStatus('error');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // 处理流式响应
  const handleStreamResponse = async (response, userMessage) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = {
      id: Date.now(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      type: 'text',
      agentId: selectedAgent
    };

    // 先添加用户消息
    const userMsg = {
      id: Date.now() - 1,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toLocaleTimeString(),
      type: 'text'
    };
    setChatMessages(prev => [...prev, userMsg]);

    // 添加助手消息占位符
    setChatMessages(prev => [...prev, assistantMessage]);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        console.log('📦 收到流式数据块:', chunk);
        
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('📄 解析的数据:', data);
              
              if (data.content) {
                assistantMessage.content += data.content;
                // 更新消息内容
                setChatMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: assistantMessage.content }
                      : msg
                  )
                );
              }
            } catch (parseError) {
              console.log('⚠️ 解析流式数据时出错:', parseError, '原始数据:', line);
            }
          } else if (line.trim() && !line.startsWith('data: ')) {
            console.log('📝 其他数据行:', line);
          }
        }
      }

      console.log('✅ 流式响应处理完成，最终内容:', assistantMessage.content);

    } catch (error) {
      console.error('❌ 处理流式响应时出错:', error);
      throw error;
    }
  };

  // 处理非流式响应
  const handleNonStreamResponse = async (response, userMessage) => {
    try {
      const data = await response.json();
      console.log('📄 非流式响应数据:', data);
      
      // 添加用户消息
      const userMsg = {
        id: Date.now() - 1,
        role: 'user',
        content: userMessage,
        timestamp: new Date().toLocaleTimeString(),
        type: 'text'
      };
      setChatMessages(prev => [...prev, userMsg]);

      // 检查响应状态
      if (data.code === 0 && data.data) {
        message.info('正在处理您的请求，请稍候...');
        
        // 根据后端API，data.id 为 Chat ID，data.conversation_id 为会话 ID
        if (data.data.id && data.data.conversation_id) {
          console.log('📋 获得Chat ID:', data.data.id);
          console.log('📋 获得Conversation ID:', data.data.conversation_id);
          
          // 保存对话ID用于后续请求
          setConversationId(data.data.conversation_id);
          
          // 轮询获取结果
          await pollForResult(data.data.id, data.data.conversation_id, userMessage);
        } else {
          // 直接显示响应内容
          const assistantMessage = {
            id: Date.now(),
            role: 'assistant',
            content: data.msg || '请求已提交，但未获得具体回复内容。',
            timestamp: new Date().toLocaleTimeString(),
            type: 'text',
            agentId: selectedAgent
          };
          setChatMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        // 处理错误响应
        const errorMessage = data.msg || '请求失败';
        console.error('❌ API返回错误:', data);
        setError(`API错误: ${errorMessage}`);
        
        // 添加错误消息到聊天记录
        const errorMsg = {
          id: Date.now(),
          role: 'assistant',
          content: `❌ 错误: ${errorMessage}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          agentId: selectedAgent
        };
        setChatMessages(prev => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error('❌ 解析非流式响应失败:', error);
      throw error;
    }
  };

  // 轮询获取结果
  const pollForResult = async (chatId, conversationId, userMessage) => {
    // 参数验证
    if (!chatId || !conversationId) {
      console.error('❌ 轮询参数无效:', { chatId, conversationId });
      setError('轮询参数无效，请重试');
      return;
    }

    const maxAttempts = 30; // 最大尝试次数
    const pollInterval = 2000; // 轮询间隔2秒
    let attempts = 0;
    
    console.log('🔄 开始轮询获取结果:', { chatId, conversationId });
    
    // 添加一个"正在处理"的助手消息
    const processingMessage = {
      id: Date.now(),
      role: 'assistant',
      content: '正在处理您的请求...',
      timestamp: new Date().toLocaleTimeString(),
      type: 'text',
      agentId: selectedAgent
    };
    setChatMessages(prev => [...prev, processingMessage]);
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        // 超时处理
        setChatMessages(prev => 
          prev.map(msg => 
            msg.id === processingMessage.id 
              ? { ...msg, content: '❌ 请求处理超时，请重试' }
              : msg
          )
        );
        setError('请求处理超时，请重试');
        return;
      }
      
      try {
        // 调用retrieve API获取对话状态
        const retrieveUrl = `${COZE_RETRIEVE_URL}?chat_id=${chatId}&conversation_id=${conversationId}`;
        
        console.log('🔍 调用Retrieve API:', retrieveUrl);
        
        const retrieveResponse = await fetch(retrieveUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (retrieveResponse.ok) {
          const retrieveData = await retrieveResponse.json();
          console.log('📋 Retrieve API响应:', retrieveData);
          
          if (retrieveData.code === 0 && retrieveData.data) {
            const result = retrieveData.data;
            
            // 检查是否完成
            if (result.status === 'completed') {
              // 获取消息列表
              await getMessageList(conversationId, chatId, processingMessage);
              return; // 完成，退出轮询
            } else if (result.status === 'failed') {
              // 处理失败
              setChatMessages(prev => 
                prev.map(msg => 
                  msg.id === processingMessage.id 
                    ? { ...msg, content: '❌ 请求处理失败' }
                    : msg
                )
              );
              setError('请求处理失败: ' + (result.error?.message || '未知错误'));
              return;
            } else {
              console.log('⏳ 当前状态:', result.status, '- 继续等待...');
            }
          }
        } else {
          console.error('❌ Retrieve API调用失败:', retrieveResponse.status, retrieveResponse.statusText);
        }
        
        // 继续轮询
        attempts++;
        console.log(`🔄 第${attempts}次轮询，继续等待...`);
        setTimeout(poll, pollInterval);
        
      } catch (error) {
        console.error('❌ 轮询过程中出错:', error);
        attempts++;
        
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          setChatMessages(prev => 
            prev.map(msg => 
              msg.id === processingMessage.id 
                ? { ...msg, content: '❌ 轮询失败: ' + error.message }
                : msg
            )
          );
          setError('轮询失败: ' + error.message);
        }
      }
    };
    
    // 开始轮询
    setTimeout(poll, pollInterval);
  };

  // 获取消息列表
  const getMessageList = async (conversationId, chatId, processingMessage) => {
    try {
      const messageListUrl = `${COZE_MESSAGE_LIST_URL}?conversation_id=${conversationId}&chat_id=${chatId}`;
      
      console.log('📝 调用Message List API:', messageListUrl);
      
      const response = await fetch(messageListUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Message List API响应:', data);
        
        if (data.code === 0 && data.data && data.data.length > 0) {
          // 找到主要的回答消息
          const answerMessage = data.data.find(msg => msg.type === 'answer');
          const followUpMessages = data.data.filter(msg => msg.type === 'follow_up');
          
          if (answerMessage) {
            // 更新处理消息为实际回答
            setChatMessages(prev => 
              prev.map(msg => 
                msg.id === processingMessage.id 
                  ? { 
                      ...msg, 
                      content: answerMessage.content,
                      timestamp: new Date().toLocaleTimeString(),
                      agentId: selectedAgent
                    }
                  : msg
              )
            );
            
            // 如果有跟进问题，也显示出来
            if (followUpMessages.length > 0) {
              const followUpContent = followUpMessages.map(msg => msg.content).join('\n\n');
              const followUpMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: `💡 您可能还想了解：\n\n${followUpContent}`,
                timestamp: new Date().toLocaleTimeString(),
                type: 'follow_up',
                agentId: selectedAgent
              };
              setChatMessages(prev => [...prev, followUpMsg]);
            }
          } else {
            // 没有找到答案消息
            setChatMessages(prev => 
              prev.map(msg => 
                msg.id === processingMessage.id 
                  ? { ...msg, content: '处理完成，但未找到具体回答内容', agentId: selectedAgent }
                  : msg
              )
            );
          }
        } else {
          setChatMessages(prev => 
            prev.map(msg => 
              msg.id === processingMessage.id 
                ? { ...msg, content: '处理完成，但未获得消息列表', agentId: selectedAgent }
                : msg
            )
          );
        }
      } else {
        console.error('❌ Message List API调用失败:', response.status, response.statusText);
        setChatMessages(prev => 
          prev.map(msg => 
            msg.id === processingMessage.id 
              ? { ...msg, content: '获取消息列表失败', agentId: selectedAgent }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('❌ 获取消息列表失败:', error);
      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === processingMessage.id 
            ? { ...msg, content: '获取消息列表失败: ' + error.message, agentId: selectedAgent }
            : msg
        )
      );
    }
  };

  // 发送消息
  const handleSendMessage = () => {
    if (!currentMessage.trim() || isLoading) return;
    
    const options = {
      stream: streamEnabled, // 根据设置决定是否使用流式
      auto_save_history: autoSaveHistory,
      enable_card: enableCard
    };
    
    console.log('📤 发送消息:', currentMessage, '选项:', options);
    sendMessageToCoze(currentMessage, options);
    setCurrentMessage('');
  };

  // 清空聊天记录
  const clearChat = () => {
    setChatMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content: '聊天记录已清空。有什么可以帮助您的吗？',
        timestamp: new Date().toLocaleTimeString(),
        type: 'text',
        agentId: selectedAgent
      }
    ]);
    setConversationId(null);
    setApiStatus('idle');
  };

  // 取消当前请求
  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // 测试后端连接
  const testBackendConnection = async () => {
    await checkBackendStatus();
    if (backendStatus === 'online') {
      message.success('后端服务连接正常！');
    } else {
      message.error('无法连接到后端服务，请检查服务是否启动');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: AGENTS[selectedAgent]?.color || '#1890ff' }}>
            {AGENTS[selectedAgent]?.icon || <RobotOutlined />}
          </div>
          <div>
            <Title level={4} className="mb-0">Coze 智能助手测试</Title>
            <Text type="secondary">
              {AGENTS[selectedAgent]?.name || 'AI助手'} - {AGENTS[selectedAgent]?.description || '智能对话助手'}
            </Text>
          </div>
        </div>
        <Space>
          <Select
            style={{ width: 200 }}
            value={selectedAgent}
            onChange={setSelectedAgent}
            placeholder="选择AI助手"
            size="middle"
          >
            {Object.entries(AGENTS).map(([key, agent]) => (
              <Option key={key} value={key}>
                <div className="flex items-center space-x-2">
                  <span style={{ color: agent.color }}>
                    {agent.icon}
                  </span>
                  <span>{agent.name}</span>
                </div>
              </Option>
            ))}
          </Select>
          <Button 
            icon={<SettingOutlined />} 
            onClick={() => setSettingsVisible(true)}
          >
            设置
          </Button>
          <Button onClick={clearChat}>清空聊天</Button>
          <Button 
            icon={<CloseOutlined />} 
            onClick={onClose}
          >
            关闭
          </Button>
        </Space>
      </div>

      {/* 后端状态指示器 */}
      <div className="px-4 py-2">
        <Alert 
          message={`后端服务状态: ${backendStatus === 'online' ? '在线' : backendStatus === 'offline' ? '离线' : '未知'}`}
          type={backendStatus === 'online' ? 'success' : backendStatus === 'offline' ? 'error' : 'warning'}
          showIcon
          action={
            <Button size="small" onClick={testBackendConnection}>
              测试连接
            </Button>
          }
        />
      </div>

      {/* API状态指示器 */}
      <div className="px-4 py-2">
        {apiStatus === 'testing' && (
          <Alert 
            message="正在与Coze API通信..." 
            type="info" 
            showIcon 
            action={
              <Button size="small" onClick={cancelRequest}>
                取消
              </Button>
            }
          />
        )}
        {apiStatus === 'success' && (
          <Alert message="API调用成功！" type="success" showIcon />
        )}
        {apiStatus === 'error' && (
          <Alert message="API调用失败，请检查配置" type="error" showIcon />
        )}
        
        {/* 错误信息显示 */}
        {error && (
          <Alert 
            message="错误详情" 
            description={error}
            type="error" 
            showIcon 
            className="mt-2"
            action={
              <Button size="small" onClick={() => setError(null)}>
                清除
              </Button>
            }
          />
        )}
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
              msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {msg.role === 'user' ? (
                  <UserOutlined className="text-white text-sm" />
                ) : (
                  msg.agentId && AGENTS[msg.agentId] ? (
                    <div style={{ color: 'white' }}>
                      {AGENTS[msg.agentId].icon}
                    </div>
                  ) : (
                    <RobotOutlined className="text-gray-600 text-sm" />
                  )
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                {msg.role === 'assistant' && msg.agentId && AGENTS[msg.agentId] && (
                  <div className="text-xs text-gray-500 mb-1 flex items-center">
                    <span style={{ color: AGENTS[msg.agentId].color }}>
                      {AGENTS[msg.agentId].icon}
                    </span>
                    <span className="ml-1">{AGENTS[msg.agentId].name}</span>
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                <div className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: AGENTS[selectedAgent]?.color || '#666' }}>
                {AGENTS[selectedAgent]?.icon || <RobotOutlined />}
              </div>
              <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Spin size="small" />
                  <span className="text-sm">
                    {AGENTS[selectedAgent]?.name || 'AI助手'} 正在思考...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <TextArea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="输入您的消息..."
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading || backendStatus !== 'online'}
            rows={2}
            className="flex-1"
          />
          <Button 
            type="primary" 
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isLoading || backendStatus !== 'online'}
            loading={isLoading}
          >
            发送
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          按 Enter 发送，Shift + Enter 换行
          {backendStatus !== 'online' && ' (后端服务离线，无法发送消息)'}
        </div>
      </div>

      {/* 设置模态框 */}
      <Modal
        title="Coze API 设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSettingsVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={() => setSettingsVisible(false)}>
            保存
          </Button>
        ]}
      >
        <div className="space-y-4">
          <div>
            <Text strong>后端服务地址:</Text>
            <div className="mt-1">
              <Input 
                value={COZE_API_URL} 
                readOnly 
                addonAfter={
                  <Button size="small" onClick={() => navigator.clipboard.writeText(COZE_API_URL)}>
                    复制
                  </Button>
                }
              />
            </div>
          </div>

          <Divider />

          <div>
            <Text strong>响应模式:</Text>
            <div className="mt-1">
              <Switch 
                checked={streamEnabled} 
                onChange={setStreamEnabled}
              />
              <Text className="ml-2 text-gray-600">
                {streamEnabled ? '流式响应' : '非流式响应'}
              </Text>
            </div>
            <div className="mt-1">
              <Alert
                message={streamEnabled ? "流式响应模式" : "非流式响应模式"}
                description={streamEnabled 
                  ? "实时显示AI回复，提供打字机效果，适合长对话。"
                  : "等待完整回复后显示，需要轮询获取结果，更稳定可靠。"
                }
                type="info"
                showIcon
              />
            </div>
          </div>

          <div>
            <Text strong>轮询设置 (非流式模式):</Text>
            <div className="mt-1 text-gray-600">
              <div>• 轮询间隔: 2秒</div>
              <div>• 最大尝试次数: 30次</div>
              <div>• 超时时间: 60秒</div>
            </div>
          </div>

          <div>
            <Text strong>自动保存历史:</Text>
            <div className="mt-1">
              <Switch 
                checked={autoSaveHistory} 
                onChange={setAutoSaveHistory}
              />
              <Text className="ml-2 text-gray-600">
                {autoSaveHistory ? '启用' : '禁用'} - 保存对话记录
              </Text>
            </div>
          </div>

          <div>
            <Text strong>启用卡片:</Text>
            <div className="mt-1">
              <Switch 
                checked={enableCard} 
                onChange={setEnableCard}
              />
              <Text className="ml-2 text-gray-600">
                {enableCard ? '启用' : '禁用'} - 以卡片形式显示回复
              </Text>
            </div>
          </div>

          <div>
            <Text strong>选择AI助手:</Text>
            <div className="mt-1">
              <Select
                style={{ width: '100%' }}
                value={selectedAgent}
                onChange={setSelectedAgent}
                placeholder="选择一个AI助手"
              >
                {Object.entries(AGENTS).map(([key, agent]) => (
                  <Option key={key} value={key}>
                    <Row align="middle">
                      <Col span={4}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: agent.color }}>
                          {agent.icon}
                        </div>
                      </Col>
                      <Col span={20}>
                        <div className="text-sm font-semibold">{agent.name}</div>
                        <div className="text-xs text-gray-600">{agent.description}</div>
                      </Col>
                    </Row>
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          <Alert
            message="配置说明"
            description="这些设置将影响与Coze API的通信方式。流式响应提供实时反馈，非流式响应需要轮询获取结果。"
            type="info"
            showIcon
          />
        </div>
      </Modal>
    </div>
  );
};

export default CozeTest; 