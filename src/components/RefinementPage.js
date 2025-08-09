import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from '../contexts/LocaleContext';
import { Plus, X, User, Trash2, Highlighter, Check, Eye, Edit3, Save } from 'lucide-react';
import KeywordSelector from './KeywordSelector';
import PersonaDetail from './PersonaDetail';

function RefinementPage({ initialStoryText, onComplete }) {
  const t = useLocale();
  const [currentStep, setCurrentStep] = useState('interview'); // 'interview', 'persona', 'story'
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [story, setStory] = useState('');
  const [showPersonaDetail, setShowPersonaDetail] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [keywordSelector, setKeywordSelector] = useState({
    show: false,
    text: '',
    position: null
  });
  // 自定义选择的refs
  const contentRef = useRef(null);
  const isDraggingRef = useRef(false);
  const anchorRangeRef = useRef(null);
  const lastSelectedTextRef = useRef('');
  const lastSelectedRectRef = useRef(null);
  const [dragHighlightRects, setDragHighlightRects] = useState([]);

  // 模拟访谈记录数据
  const interviewData = {
    text: `张敏是一位35岁的银行客户经理，每天工作繁忙。她经常在下班后去超市采购食材，但总是面临时间紧张的问题。

"当手机电量比我的耐心先耗尽时，任何精致菜谱都成了讽刺漫画。" 张敏这样描述她的烹饪应用使用体验。她希望能在超市现场快速找到适合的菜谱，但现有的应用推荐算法往往忽视了她实际的时间和库存限制。

在通勤后的超市采购时段（18:30-19:30），她经常单手持手机同时推购物车，处于分心状态。手机低电量警告让她感到焦虑，她潜意识里还在计算明日早餐的准备时间。

张敏对效率流失存在放大镜效应，会为节省2分钟额外支付10元钱。她对进度条和倒计时产生条件反射焦虑，在工具失效时会立即启动备选方案。她将饮食管理视为家庭责任延伸，用工具选择缓解育儿愧疚感。

她常用"至少""起码"等底线思维词汇，倾向量化表达（"15分钟""3种食材"），抱怨时夹杂自嘲式幽默，对营销话术异常敏感。`,
    keywords: []
  };

  // 关键词类型配置
  const keywordTypes = [
    { id: 'user_traits', name: '用户特征', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'scenarios', name: '使用场景', color: 'bg-green-100 text-green-800 border-green-200' },
    { id: 'pain_points', name: '痛点问题', color: 'bg-red-100 text-red-800 border-red-200' },
    { id: 'emotions', name: '情绪状态', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { id: 'goals', name: '目标动机', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  ];

  useEffect(() => {
    if (initialStoryText) {
        const generatedStory = `${t.refinement.generated.title}
"${initialStoryText}"

${t.refinement.generated.section1}
[${t.refinement.generated.placeholder1}]

${t.refinement.generated.section2}
[${t.refinement.generated.placeholder2}]

${t.refinement.generated.section3}
[${t.refinement.generated.placeholder3}]
`;
        setStory(generatedStory);
    }

    // 添加键盘快捷键：Ctrl/Cmd + K 打开关键词类型选择器
    const onKeyDown = (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        const selection = window.getSelection();
        let text = selection ? selection.toString().trim() : '';
        let rect = null;
        if (text) {
          try {
            const range = selection.getRangeAt(0);
            rect = range.getBoundingClientRect();
          } catch {}
        } else if (lastSelectedTextRef.current && lastSelectedRectRef.current) {
          text = lastSelectedTextRef.current;
          rect = lastSelectedRectRef.current;
        }
        if (text && rect) {
          setKeywordSelector({
            show: true,
            text,
            position: { x: rect.left + window.scrollX, y: rect.bottom + window.scrollY + 8 }
          });
          setTimeout(() => {
            try { selection && selection.removeAllRanges(); } catch {}
          }, 0);
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [initialStoryText, t]);

  // 处理文本选择（保留：用于非自定义场景的兜底）
  const handleTextSelection = (e) => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';
    if (selectedText) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const x = rect.left + window.scrollX;
      const y = rect.bottom + window.scrollY + 8;

      // 显示关键词类型选择器（带滚动偏移，并稍微下移避免遮挡）
      setKeywordSelector({
        show: true,
        text: selectedText,
        position: { x, y }
      });

      // 立即清空原生选区，减少浏览器/插件弹窗干扰
      setTimeout(() => {
        try { selection.removeAllRanges(); } catch {}
      }, 0);
    }
  };

  // 自定义拖拽选区：禁用原生选择，使用指针位置计算Range
  const getCaretRangeFromPoint = (x, y) => {
    if (document.caretRangeFromPoint) {
      return document.caretRangeFromPoint(x, y);
    }
    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (!pos) return null;
      const range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
      return range;
    }
    return null;
  };

  const startCustomSelection = (e) => {
    if (e.button !== 0) return; // 仅左键
    const container = contentRef.current;
    if (!container) return;
    if (!container.contains(e.target)) return;

    // 开始前清空之前的高亮
    setDragHighlightRects([]);

    // 清空原生选区，防止触发原生或插件气泡
    const sel = window.getSelection();
    try { sel && sel.removeAllRanges(); } catch {}

    const anchor = getCaretRangeFromPoint(e.clientX, e.clientY);
    if (!anchor) return;

    isDraggingRef.current = true;
    anchorRangeRef.current = anchor.cloneRange();

    const getRectsRelativeToContainer = (range, containerEl) => {
      const containerRect = containerEl.getBoundingClientRect();
      const rectList = Array.from(range.getClientRects());
      return rectList.map(r => ({
        left: r.left - containerRect.left + containerEl.scrollLeft,
        top: r.top - containerRect.top + containerEl.scrollTop,
        width: r.width,
        height: r.height
      }));
    };

    const handleMove = (evt) => {
      if (!isDraggingRef.current || !anchorRangeRef.current) return;
      const focus = getCaretRangeFromPoint(evt.clientX, evt.clientY);
      if (!focus) return;

      // 计算临时范围并更新高亮矩形
      const temp = document.createRange();
      const a = anchorRangeRef.current;
      const cmp = a.compareBoundaryPoints(Range.START_TO_START, focus);
      if (cmp <= 0) {
        temp.setStart(a.startContainer, a.startOffset);
        temp.setEnd(focus.startContainer, focus.startOffset);
      } else {
        temp.setStart(focus.startContainer, focus.startOffset);
        temp.setEnd(a.startContainer, a.startOffset);
      }
      const rects = getRectsRelativeToContainer(temp, container);
      setDragHighlightRects(rects);

      // 阻止默认以避免原生高亮
      evt.preventDefault();
  };

    const handleUp = (evt) => {
      if (!isDraggingRef.current) return cleanup();
      const focus = getCaretRangeFromPoint(evt.clientX, evt.clientY);
      if (focus && anchorRangeRef.current) {
        const range = document.createRange();
        const a = anchorRangeRef.current;
        // 计算顺序
        const cmp = a.compareBoundaryPoints(Range.START_TO_START, focus);
        if (cmp <= 0) {
          range.setStart(a.startContainer, a.startOffset);
          range.setEnd(focus.startContainer, focus.startOffset);
        } else {
          range.setStart(focus.startContainer, focus.startOffset);
          range.setEnd(a.startContainer, a.startOffset);
        }
        const text = range.toString().trim();
        if (text) {
          const rect = range.getBoundingClientRect();
          lastSelectedTextRef.current = text;
          lastSelectedRectRef.current = rect;
          setKeywordSelector({
            show: true,
            text,
            position: { x: rect.left + window.scrollX, y: rect.bottom + window.scrollY + 8 }
          });
        }
      }
      cleanup();
    };

    const cleanup = () => {
      isDraggingRef.current = false;
      anchorRangeRef.current = null;
      window.removeEventListener('mousemove', handleMove, true);
      window.removeEventListener('mouseup', handleUp, true);
    };

    window.addEventListener('mousemove', handleMove, true);
    window.addEventListener('mouseup', handleUp, true);

    // 阻止原生选择
    e.preventDefault();
  };

  // 处理关键词类型选择
  const handleKeywordTypeSelect = (text, typeId) => {
    addKeyword(text, typeId);
    setKeywordSelector({ show: false, text: '', position: null });
    setDragHighlightRects([]);
  };

  // 取消关键词选择
  const cancelKeywordSelection = () => {
    setKeywordSelector({ show: false, text: '', position: null });
    setDragHighlightRects([]);
  };

  // 添加关键词
  const addKeyword = (text, typeId) => {
    const newKeyword = {
      id: Date.now(),
      text: text,
      type: typeId,
      timestamp: new Date().toISOString()
    };
    setSelectedKeywords([...selectedKeywords, newKeyword]);
  };

  // 删除关键词
  const removeKeyword = (keywordId) => {
    setSelectedKeywords(selectedKeywords.filter(k => k.id !== keywordId));
  };

  // 生成用户画像
  const generatePersonas = () => {
    // 模拟AI生成的用户画像数据
    const generatedPersonas = [
      {
        "persona_name": "张敏",
        "persona_summary": "在时间与资源限制中挣扎的效率型家长",
        "memorable_quote": "\"当手机电量比我的耐心先耗尽时，任何精致菜谱都成了讽刺漫画。\"",
        "Appearance characteristics": "略微驼背的职业女性，左手无名指有戒痕，右手拇指有长期滑动屏幕形成的小茧，穿着容易打理但起球的针织外套。",
        "basic_profile": {
          "name": "张敏",
          "age": "35岁",
          "gender": "女",
          "occupation": "银行客户经理",
          "education": "金融学本科",
          "city": "成都",
          "technology_literacy": "中等",
          "devices": ["华为Mate 40", "小米手环"]
        },
        "domain_pain_points": [
          "菜谱推荐算法忽视实际库存和时间压力",
          "操作流程未考虑移动场景下的电量焦虑",
          "健康饮食理想与现实执行力的落差",
          "决策疲劳导致的工具信任危机"
        ],
        "domain_goals_and_motivations": [
          "在超市现场快速匹配库存的烹饪方案",
          "建立可预测的时间-营养性价比评估系统",
          "降低健康饮食的认知与操作门槛",
          "获得对不完美选择的宽容感"
        ],
        "usage_context": [
          "通勤后的超市采购时段（18:30-19:30）",
          "单手持手机同时推购物车的分心状态",
          "常面临手机低电量警告",
          "潜意识计算明日早餐准备时间"
        ],
        "tool_expectations": [
          "基于实时定位的货架对应推荐",
          "电量敏感型极简交互模式",
          "允许瑕疵的'勉强及格'食谱分类",
          "跨平台购物清单同步功能"
        ],
        "general_behavior": [
          "会为节省2分钟额外支付10元钱",
          "对进度条和倒计时产生条件反射焦虑",
          "在工具失效时立即启动备选方案",
          "周期性产生自我优化冲动"
        ],
        "psychological_profile": [
          "将饮食管理视为家庭责任延伸",
          "对效率流失存在放大镜效应",
          "用工具选择缓解育儿愧疚感",
          "形成'临时妥协-理想反弹'的循环模式"
        ],
        "communication_style": [
          "常用\"至少\"\"起码\"等底线思维词汇",
          "倾向量化表达（\"15分钟\"\"3种食材\"）",
          "抱怨时夹杂自嘲式幽默",
          "对营销话术异常敏感"
        ],
        "keywords": [
          "决策疲劳型用户",
          "场景敏感度需求",
          "底线思维者",
          "工具信任危机"
        ]
      }
    ];
    
    setPersonas(generatedPersonas);
    setCurrentStep('persona');
  };

  // 处理完成
  const handleComplete = () => {
    const finalPersonas = personas.filter(p => p.persona_name && p.persona_summary);
    onComplete(story, finalPersonas);
  };

  // 处理用户画像详情查看
  const handleViewPersonaDetail = (persona) => {
    setSelectedPersona(persona);
  };

  // 处理用户画像保存
  const handleSavePersona = (updatedPersona) => {
    setPersonas(prev => prev.map(p => 
      p.persona_name === updatedPersona.persona_name ? updatedPersona : p
    ));
    setSelectedPersona(null);
  };

  // 关闭用户画像详情
  const handleClosePersonaDetail = () => {
    setSelectedPersona(null);
  };

  // 渲染访谈记录处理页面
  const renderInterviewStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 访谈记录 */}
      <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <User className="mr-2 text-blue-500" />
            用户访谈记录
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Highlighter className="w-4 h-4" />
            <span>圈选关键词</span>
          </div>
        </div>
        
        <div 
          ref={contentRef}
          className="prose relative max-w-none p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[400px] leading-relaxed text-gray-700 select-text"
          onMouseDown={startCustomSelection}
          onContextMenu={(e) => e.preventDefault()}
          style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
        >
          {/* 拖动高亮覆盖层 */}
          <div className="absolute inset-0 pointer-events-none">
            {dragHighlightRects.map((r, idx) => (
              <div
                key={idx}
                className="bg-blue-300/30 rounded-sm"
                style={{ position: 'absolute', left: r.left, top: r.top, width: r.width, height: r.height }}
              />
            ))}
          </div>
          {interviewData.text.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            已提取 {selectedKeywords.length} 个关键词
          </div>
          <button
            onClick={generatePersonas}
            disabled={selectedKeywords.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            生成用户画像
          </button>
        </div>
      </div>

      {/* 关键词气泡 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">提取的关键词</h3>
        
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {keywordTypes.map(type => {
            const typeKeywords = selectedKeywords.filter(k => k.type === type.id);
            if (typeKeywords.length === 0) return null;

  return (
              <div key={type.id} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">{type.name}</h4>
                <div className="space-y-2">
                  {typeKeywords.map(keyword => (
                    <div 
                      key={keyword.id}
                      className={`flex items-center justify-between p-2 rounded-lg border ${type.color}`}
                    >
                      <span className="text-sm flex-1">{keyword.text}</span>
                      <button
                        onClick={() => removeKeyword(keyword.id)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {selectedKeywords.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Highlighter className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>在左侧文本中圈选关键词</p>
          </div>
        )}
      </div>
    </div>
  );

  // 渲染用户画像页面
  const renderPersonaStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">生成的用户画像</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentStep('interview')}
            className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
          >
            返回编辑
          </button>
          <button
            onClick={() => setCurrentStep('story')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            继续下一步
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.map((persona, index) => (
          <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{persona.persona_name}</h3>
                <p className="text-sm text-gray-600 mt-1">{persona.basic_profile.age} · {persona.basic_profile.occupation}</p>
              </div>
                             <button
                 onClick={() => handleViewPersonaDetail(persona)}
                 className="text-blue-600 hover:text-blue-700"
               >
                 <Eye size={20} />
               </button>
            </div>
            
            <p className="text-gray-700 mb-4 italic">"{persona.memorable_quote}"</p>
            <p className="text-sm text-gray-600 mb-4">{persona.persona_summary}</p>
            
            
          </div>
        ))}
      </div>
    </div>
  );

  // 渲染故事脚本页面
  const renderStoryStep = () => (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Story Script Section */}
            <div className="bg-gray-50 rounded-xl p-6 border">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="mr-3 text-blue-500" />
                {t.refinement.storyTitle}
              </h2>
              <textarea
                className="w-full h-96 p-4 bg-white border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-base font-mono"
                value={story}
                onChange={(e) => setStory(e.target.value)}
              />
            </div>

            {/* User Personas Section */}
            <div className="bg-gray-50 rounded-xl p-6 border">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="mr-3 text-green-500" />
                {t.refinement.personaTitle}
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {personas.map((persona, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">{persona.persona_name}</h3>
              <p className="text-sm text-gray-600 mb-2">{persona.persona_summary}</p>
              <p className="text-xs text-gray-500 italic">"{persona.memorable_quote}"</p>
                  </div>
                ))}
              </div>
      </div>
    </div>
  );

  return (
    <motion.div
      className="absolute inset-0 bg-gray-50 z-40 p-4 sm:p-6 lg:p-8 overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">
              {currentStep === 'interview' ? '访谈记录分析' : 
               currentStep === 'persona' ? '用户画像生成' : '故事脚本完善'}
            </h1>
            <p className="text-lg text-gray-600">
              {currentStep === 'interview' ? '第一步：从访谈记录中提取关键信息，圈选用户特征、场景和痛点' :
               currentStep === 'persona' ? '第二步：基于提取的信息生成详细的用户画像' :
               '第三步：完善故事脚本并确认用户画像'}
            </p>
          </div>
          
          {currentStep === 'interview' && renderInterviewStep()}
          {currentStep === 'persona' && renderPersonaStep()}
          {currentStep === 'story' && renderStoryStep()}
          
          {currentStep === 'story' && (
          <div className="mt-8 text-center">
            <button
              onClick={handleComplete}
              className="bg-blue-600 text-white font-semibold py-3 px-12 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
            >
              {t.refinement.button}
            </button>
          </div>
          )}
        </div>
      </div>
      
      {/* 关键词选择器 */}
      {keywordSelector.show && (
        <KeywordSelector
          selectedText={keywordSelector.text}
          position={keywordSelector.position}
          onSelectType={handleKeywordTypeSelect}
          onCancel={cancelKeywordSelection}
          keywordTypes={keywordTypes}
        />
      )}

      {/* 用户画像详情 */}
      {selectedPersona && (
        <PersonaDetail
          persona={selectedPersona}
          onClose={handleClosePersonaDetail}
          onSave={handleSavePersona}
        />
      )}
    </motion.div>
  );
}

export default RefinementPage; 