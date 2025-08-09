import React, { useState, useRef, useEffect } from 'react';
import { X, UserPlus, User, Edit3, Plus, Trash2, Save, MessageSquare, Sparkles, Target, Heart, Briefcase, Phone, Quote } from 'lucide-react';

const UserPersonas = ({ personas = [], selectedPersona, onSelectPersona, onUpdatePersonas }) => {
  const [editingPersona, setEditingPersona] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [showStoryBrainstorm, setShowStoryBrainstorm] = useState(false);
  const [storyInput, setStoryInput] = useState('');
  const [storyBubbles, setStoryBubbles] = useState([]);
  const [draggedBubble, setDraggedBubble] = useState(null);
  const canvasRef = useRef(null);

  // 默认的空用户画像结构
  const getDefaultPersona = () => ({
    persona_name: "新用户",
    persona_summary: "",
    memorable_quote: "",
    appearance_characteristics: "",
    basic_profile: {
      name: "",
      age: "",
      gender: "",
      occupation: "",
      education: "",
      city: "",
      technology_literacy: "",
      devices: []
    },
    domain_pain_points: [],
    domain_goals_and_motivations: [],
    usage_context: [],
    tool_expectations: [],
    general_behavior: [],
    psychological_profile: [],
    communication_style: [],
    keywords: []
  });

  // 示例数据
  const samplePersonas = personas.length > 0 ? personas : [
    {
      persona_name: "张敏",
      persona_summary: "35岁银行客户经理，注重效率的职场妈妈",
      memorable_quote: "时间就是金钱，但陪伴孩子的时间更珍贵",
      appearance_characteristics: "职业装扮，简约大方，常戴眼镜，神情专注",
      basic_profile: {
        name: "张敏",
        age: "35",
        gender: "女",
        occupation: "银行客户经理",
        education: "本科",
        city: "成都",
        technology_literacy: "中等",
        devices: ["iPhone", "MacBook", "iPad"]
      },
      domain_pain_points: [
        "对效率流失存在放大镜效应",
        "用工具选择缓解育儿愧疚感",
        "形成临时妥协-理想反弹的循环模式",
        "在快速决策和深度思考间存在矛盾"
      ],
      domain_goals_and_motivations: [
        "在有限时间内做出最优选择",
        "平衡工作效率与家庭责任",
        "寻找能够提升生活质量的工具",
        "建立可持续的生活管理体系"
      ],
      usage_context: [
        "下班路上匆忙查看晚餐食谱",
        "周末为下周做计划和准备",
        "工作间隙处理家庭事务",
        "深夜独处时思考生活规划"
      ],
      tool_expectations: [
        "快速响应，15秒内给出建议",
        "个性化推荐，了解我的偏好",
        "简洁界面，减少认知负担",
        "智能学习，越用越懂我"
      ],
      general_behavior: [
        "喜欢提前规划但常被突发事件打乱",
        "对新工具保持开放但需要快速见效",
        "习惯多任务处理但容易感到焦虑",
        "重视他人评价但有自己的判断标准"
      ],
      psychological_profile: [
        "完美主义倾向，对细节要求高",
        "时间敏感，讨厌等待和低效",
        "责任感强，常为他人着想",
        "内心渴望被理解和认可"
      ],
      communication_style: [
        "简洁直接，不喜欢废话",
        "逻辑清晰，喜欢有条理的表达",
        "情感丰富，但表达较为含蓄",
        "善于倾听，但也希望被倾听"
      ],
      keywords: ["效率", "平衡", "品质", "温暖"]
    }
  ];

  // 生成故事气泡
  const generateStoryBubbles = (persona) => {
    if (!persona) return [];

    const bubbles = [
      // 场景气泡
      ...persona.usage_context.map((context, index) => ({
        id: `context-${index}`,
        type: 'context',
        text: context,
        color: 'bg-amber-50 border-amber-200 text-amber-800',
        icon: '🏠'
      })),
      // 痛点气泡
      ...persona.domain_pain_points.map((pain, index) => ({
        id: `pain-${index}`,
        type: 'pain',
        text: pain,
        color: 'bg-rose-50 border-rose-200 text-rose-800',
        icon: '😰'
      })),
      // 目标气泡
      ...persona.domain_goals_and_motivations.map((goal, index) => ({
        id: `goal-${index}`,
        type: 'goal',
        text: goal,
        color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        icon: '🎯'
      })),
      // 行为气泡
      ...persona.general_behavior.map((behavior, index) => ({
        id: `behavior-${index}`,
        type: 'behavior',
        text: behavior,
        color: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: '🎭'
      })),
      // 心理气泡
      ...persona.psychological_profile.map((psych, index) => ({
        id: `psych-${index}`,
        type: 'psychology',
        text: psych,
        color: 'bg-purple-50 border-purple-200 text-purple-800',
        icon: '💭'
      }))
    ];

    return bubbles;
  };

  const handleCreatePersona = () => {
    const newPersona = getDefaultPersona();
    setEditingPersona(newPersona);
  };

  const handleEditPersona = (persona) => {
    setEditingPersona({ ...persona });
  };
  
  const handleSavePersona = () => {
    if (!editingPersona) return;
    
    const updatedPersonas = samplePersonas.some(p => p.persona_name === editingPersona.persona_name)
      ? samplePersonas.map(p => p.persona_name === editingPersona.persona_name ? editingPersona : p)
      : [...samplePersonas, editingPersona];
    
    onUpdatePersonas(updatedPersonas);
    setEditingPersona(null);
    setActiveTab('basic');
  };

  const handleDeletePersona = (personaName) => {
    const updatedPersonas = samplePersonas.filter(p => p.persona_name !== personaName);
    onUpdatePersonas(updatedPersonas);
  };

  const handleShowStoryBrainstorm = (persona) => {
    setStoryBubbles(generateStoryBubbles(persona));
    setShowStoryBrainstorm(true);
    onSelectPersona(persona);
  };

  const handleBubbleDrop = (e) => {
    e.preventDefault();
    if (draggedBubble) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // 将气泡内容添加到故事输入框
      const currentText = storyInput;
      const bubbleText = draggedBubble.text;
      const newText = currentText ? `${currentText} ${bubbleText}` : bubbleText;
      setStoryInput(newText);
      setDraggedBubble(null);
    }
  };

  const PersonaCard = ({ persona }) => (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* 简约头部 */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xl font-medium text-gray-600">
              {persona.persona_name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{persona.persona_name}</h3>
              <p className="text-sm text-gray-500 mt-1">{persona.basic_profile?.occupation || '职业未设置'}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {persona.basic_profile?.age}岁
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {persona.basic_profile?.city}
                </span>
              </div>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
            <button
              onClick={() => handleEditPersona(persona)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShowStoryBrainstorm(persona)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 核心信息 */}
      <div className="px-6 pb-6">
        {persona.memorable_quote && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <Quote className="w-4 h-4 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 italic">"{persona.memorable_quote}"</p>
          </div>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">痛点</span>
            <span className="px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs">
              {persona.domain_pain_points?.length || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">目标</span>
            <span className="px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs">
              {persona.domain_goals_and_motivations?.length || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">场景</span>
            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
              {persona.usage_context?.length || 0}
            </span>
          </div>
        </div>

        {persona.keywords?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {persona.keywords.slice(0, 3).map((keyword, index) => (
              <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const StoryBubble = ({ bubble, onDragStart }) => (
    <div
      draggable
      onDragStart={() => onDragStart(bubble)}
      className={`inline-block m-2 p-3 rounded-2xl border-2 cursor-move hover:shadow-md transition-all duration-200 ${bubble.color} hover:scale-105`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg">{bubble.icon}</span>
        <span className="text-sm font-medium">{bubble.text}</span>
      </div>
    </div>
  );

  const StoryBrainstormModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">故事脚本构思助手</h2>
            <p className="text-sm text-gray-500 mt-1">拖拽气泡到对话框中构思您的故事</p>
          </div>
          <button 
            onClick={() => setShowStoryBrainstorm(false)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* 气泡区域 */}
          <div className="w-1/2 p-6 border-r border-gray-100 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">故事元素气泡</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-amber-700 mb-2">🏠 使用场景</h4>
                <div className="flex flex-wrap">
                  {storyBubbles.filter(b => b.type === 'context').map(bubble => (
                    <StoryBubble 
                      key={bubble.id} 
                      bubble={bubble} 
                      onDragStart={setDraggedBubble}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-rose-700 mb-2">😰 痛点问题</h4>
                <div className="flex flex-wrap">
                  {storyBubbles.filter(b => b.type === 'pain').map(bubble => (
                    <StoryBubble 
                      key={bubble.id} 
                      bubble={bubble} 
                      onDragStart={setDraggedBubble}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-emerald-700 mb-2">🎯 目标动机</h4>
                <div className="flex flex-wrap">
                  {storyBubbles.filter(b => b.type === 'goal').map(bubble => (
                    <StoryBubble 
                      key={bubble.id} 
                      bubble={bubble} 
                      onDragStart={setDraggedBubble}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-2">🎭 行为特征</h4>
                <div className="flex flex-wrap">
                  {storyBubbles.filter(b => b.type === 'behavior').map(bubble => (
                    <StoryBubble 
                      key={bubble.id} 
                      bubble={bubble} 
                      onDragStart={setDraggedBubble}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-purple-700 mb-2">💭 心理画像</h4>
                <div className="flex flex-wrap">
                  {storyBubbles.filter(b => b.type === 'psychology').map(bubble => (
                    <StoryBubble 
                      key={bubble.id} 
                      bubble={bubble} 
                      onDragStart={setDraggedBubble}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 故事构思区域 */}
          <div className="w-1/2 p-6 flex flex-col">
            <h3 className="text-lg font-medium text-gray-900 mb-4">故事脚本构思</h3>
            
            {/* 示例故事 */}
            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-700 mb-2">参考示例：</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                "下班回家的路上，疲惫的张女士站在超市生鲜区前，匆忙打开餐计划应用想找一道 15 分钟内能完成的晚餐食谱。她滑动浏览着推荐列表，却发现大部分菜谱都需要她家里没有的食材或复杂的烹饪步骤。随着手机电量显示只剩 15%，她焦虑地反复刷新页面，希望能出现更简单的选项。最终她放弃筛选，随手拿了货架上的速冻水饺，心里盘算着明天一定要找个时间好好研究这个应用 —— 或者干脆删掉它换个更懂忙碌父母需求的工具。"
              </p>
            </div>

            {/* 构思输入框 */}
            <div 
              className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50"
              onDrop={handleBubbleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <textarea
                value={storyInput}
                onChange={(e) => setStoryInput(e.target.value)}
                placeholder="在这里构思您的故事脚本，或将上方的气泡拖拽到这里..."
                className="w-full h-full resize-none border-none bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-sm leading-relaxed"
              />
            </div>

            {/* 操作按钮 */}
            <div className="mt-4 flex justify-end space-x-3">
              <button 
                onClick={() => setStoryInput('')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                清空
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(storyInput);
                  // 这里可以添加复制成功的提示
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                复制故事
              </button>
            </div>
                        </div>
                        </div>
                      </div>
                    </div>
  );

  // 编辑模态框的标签页内容
  const renderTabContent = () => {
    if (!editingPersona) return null;

    const updateEditingPersona = (field, value) => {
      setEditingPersona(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const updateBasicProfile = (field, value) => {
      setEditingPersona(prev => ({
        ...prev,
        basic_profile: {
          ...prev.basic_profile,
          [field]: value
        }
      }));
    };

    const updateArrayField = (field, index, value) => {
      setEditingPersona(prev => ({
        ...prev,
        [field]: prev[field].map((item, i) => i === index ? value : item)
      }));
    };

    const addArrayItem = (field) => {
      setEditingPersona(prev => ({
        ...prev,
        [field]: [...prev[field], ""]
      }));
    };

    const removeArrayItem = (field, index) => {
      setEditingPersona(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    };

    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                    <input 
                      type="text" 
                  value={editingPersona.basic_profile?.name || ''}
                  onChange={(e) => updateBasicProfile('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
                    />
                  </div>
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">年龄</label>
                    <input 
                      type="text" 
                  value={editingPersona.basic_profile?.age || ''}
                  onChange={(e) => updateBasicProfile('age', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
                    />
                  </div>
                </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">个人概要</label>
              <textarea
                value={editingPersona.persona_summary || ''}
                onChange={(e) => updateEditingPersona('persona_summary', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
              />
            </div>

                <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">经典语录</label>
                  <input 
                    type="text" 
                value={editingPersona.memorable_quote || ''}
                onChange={(e) => updateEditingPersona('memorable_quote', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
                  />
                </div>
                </div>
        );

      case 'pain':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">痛点问题</h3>
              <button
                onClick={() => addArrayItem('domain_pain_points')}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>添加痛点</span>
              </button>
                </div>
            
            {editingPersona.domain_pain_points?.map((pain, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={pain}
                  onChange={(e) => updateArrayField('domain_pain_points', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
                  placeholder="描述用户痛点..."
                />
                  <button 
                  onClick={() => removeArrayItem('domain_pain_points', index)}
                  className="p-2 text-red-500 hover:text-red-700 transition-colors"
                  >
                  <Trash2 className="w-4 h-4" />
                  </button>
              </div>
            ))}
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">目标动机</h3>
                  <button 
                onClick={() => addArrayItem('domain_goals_and_motivations')}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                <Plus className="w-4 h-4" />
                <span>添加目标</span>
                  </button>
                </div>
            
            {editingPersona.domain_goals_and_motivations?.map((goal, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => updateArrayField('domain_goals_and_motivations', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
                  placeholder="描述用户目标..."
                />
                <button
                  onClick={() => removeArrayItem('domain_goals_and_motivations', index)}
                  className="p-2 text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-40 overflow-y-auto">
      {/* 头部 */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">用户画像</h1>
              <p className="text-gray-500 mt-1">了解您的用户，创造更好的体验</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreatePersona}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>创建画像</span>
              </button>
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {samplePersonas.map((persona, index) => (
            <PersonaCard key={index} persona={persona} />
          ))}
        </div>
      </div>

      {/* 编辑模态框 */}
      {editingPersona && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-5/6 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">编辑用户画像</h2>
              <button
                onClick={() => setEditingPersona(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* 左侧标签页 */}
              <div className="w-48 p-6 border-r border-gray-100">
                <nav className="space-y-2">
                  {[
                    { id: 'basic', label: '基本信息', icon: User },
                    { id: 'pain', label: '痛点问题', icon: Target },
                    { id: 'goals', label: '目标动机', icon: Heart }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        activeTab === tab.id 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* 右侧内容 */}
              <div className="flex-1 p-6 overflow-y-auto">
                {renderTabContent()}
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setEditingPersona(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSavePersona}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>保存画像</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 故事构思模态框 */}
      {showStoryBrainstorm && <StoryBrainstormModal />}
    </div>
  );
};

export default UserPersonas; 