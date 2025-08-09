import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Image, Frown, Meh, Smile, Lightbulb, MousePointerClick,
  GitFork, CheckCircle, Map, KeyRound, FileText, Users
} from 'lucide-react';
import { LocaleProvider, useLocale } from './contexts/LocaleContext';
import IdeaModal from './components/IdeaModal';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import JourneyMap from './components/JourneyMap';
import StoryTree from './components/StoryTree';
import StoryScript from './components/StoryScript';
import UserPersonas from './components/UserPersonas';
import RefinementPage from './components/RefinementPage'; // 新�：�入新页面组件
import StoryboardTest from './components/StoryboardTest'; // ������������Է־����
import FalaiTest from './components/FalaiTest'; // 导入FalAI测试组件
import config from './config';
import textUtils from './utils/textUtils';
import './App.css';

// 检查文档编码并输出调试信息
console.log('文档字��:', document.characterSet);
console.log('文档诨�:', document.documentElement.lang);
textUtils.logChinese('世�显示测试 - Chinese Display Test');

function AppContent() {
  const t = useLocale();
  const [storyData, setStoryData] = useState([]);
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const [nextFrameId, setNextFrameId] = useState(5);
  const [selectedStyle, setSelectedStyle] = useState('写实');
  const [showIdea, setShowIdea] = useState(false); // 修改为默认不显示想法输入页
  const [showRefinementPage, setShowRefinementPage] = useState(false);
  const [showStoryboardTest, setShowStoryboardTest] = useState(true); // 修改为默认显示测试分镜页
  const [showFalaiTest, setShowFalaiTest] = useState(false);
  const [showJourneyMap, setShowJourneyMap] = useState(false);
  const [showStoryScript, setShowStoryScript] = useState(false);
  const [showUserPersonas, setShowUserPersonas] = useState(false);
  const [userPersonas, setUserPersonas] = useState([
    {
      "persona_name": "张敏",
      "persona_summary": "在时间与资源限制中挣扎的效率型家长",
      "memorable_quote": "当手机电量比我的耐心先耗尽时，任何精致菜谱都成了讽刺漫画。",
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
        "允许瑕疵的勉强及格食谱分类",
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
        "形成临时妥协-理想反弹的循环模式"
      ],
      "communication_style": [
        "常用'至少''起码'等底线思维词汇",
        "倾向量化表达（'15分钟''3种食材'）",
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
  ]);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [userInput, setUserInput] = useState(''); // 新：保存用户最原的输

  useEffect(() => {
    // 硿�全局使用正�'的编�
    document.title = t.app.title + ' - ' + t.app.subtitle;
  }, [t]);

  const handleGenerateCanvas = (idea) => { // 俔�：接收初始故�
    setUserInput(idea); // 保存用户输入
    // 模拟AI处理，使用�设故事结�
    const initialFrames = [...t.initialStory].map((frame, index) => {
      if (index === 0) {
        return { ...frame, description: `${frame.description}\n\n## 原�想法\n${idea}` };
      }
      return frame;
    });
    setStoryData(initialFrames); // 使用带用户想法的预�故事
    setShowIdea(false);
    setShowRefinementPage(true); // 显示新页�
  };

  const handleTestStoryboard = (idea) => { // �������������Է־���ť���
    setUserInput(idea); // �����û�����
    setShowIdea(false);
    setShowStoryboardTest(true); // ��ʾ���Է־�����
  };

  const handleCloseStoryboardTest = () => { // �������رղ��Է־�����
    setShowStoryboardTest(false);
    setShowIdea(true); // ���ص���ʼ����
  };

  const handleRefinementComplete = (refinedStory, personas) => { // 俔�：�理新页面的完成事�
    // 注意：目� refinedStory 变�文本，并朧�析。storyData 保持不变
    setUserPersonas(personas);
    setShowRefinementPage(false);
  };

  const handleTestFalai = () => {
    setShowIdea(false);
    setShowFalaiTest(true);
  };

  const handleCloseFalaiTest = () => {
    setShowFalaiTest(false);
    setShowIdea(true);
  };

  const handleFrameSelect = (id) => {
    setSelectedFrameId(id);
  };

  const handleCloseEditor = () => {
    setSelectedFrameId(null);
  };

  const handleUpdateFrame = (title, description, emotion, agentId) => {
    if (!selectedFrameId) return;
    setStoryData(prevData => 
      prevData.map(frame => 
        frame.id === selectedFrameId 
          ? { 
              ...frame, 
              title, 
              description, 
              emotion: emotion || frame.emotion,
              agentId: agentId || frame.agentId
            } 
          : frame
      )
    );
  };

  const handleAddBranch = (whatIfPrompt, params = {}) => {
    if (!selectedFrameId) return;
    const parentFrame = storyData.find(f => f.id === selectedFrameId);
    if (parentFrame) {
      const branchId = `branch_${Date.now()}`;
      const newFrame = {
        id: branchId,
        title: whatIfPrompt ? `What if: ${whatIfPrompt}` : `What if...? #${nextFrameId}`,
        description: whatIfPrompt || 'A new possibility emerges from this point.',
        emotion: 'neutral',
        color: 'blue-500',
        pos: { 
          x: parentFrame.pos.x + Math.floor(Math.random() * 200 - 100),
          y: parentFrame.pos.y + 280
        },
        connections: [],
        agentId: null
      };
      
      setStoryData(prevData => {
        const updatedParent = {
          ...parentFrame,
          connections: [...(parentFrame.connections || []), branchId]
        };
        
        return prevData.map(f => 
          f.id === parentFrame.id ? updatedParent : f
        ).concat(newFrame);
      });
      
      setNextFrameId(prevId => prevId + 1);
    }
  };

  const handleStyleChange = (style) => {
    setSelectedStyle(style);
  };

  const handleRegenerateStyle = () => {
    setStoryData(prevData => 
      prevData.map(frame => ({ ...frame, style: selectedStyle }))
    );
  };

  const toggleLeftSidebar = () => {
    setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed);
  };

  return (
      <div className="h-screen w-screen flex flex-col bg-gray-50 text-gray-800 antialiased overflow-hidden">
        <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200/80 z-50">
          <div className="max-w-full mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span className="text-xl font-bold text-gray-900">{t.app.title}</span>
            </div>
            <AnimatePresence>
            {!showIdea && !showRefinementPage && !showStoryboardTest && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center space-x-4"
              >
                <button
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setShowStoryScript(true)}
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.header.storyScript}</span>
                </button>
                <button
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setShowUserPersonas(true)}
                >
                  <Users className="w-4 h-4" />
                  <span>{t.header.userRoles}</span>
                </button>
                <button
                  className="flex items-center space-x-2 text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setShowJourneyMap(true)}
                >
                  <Map className="w-4 h-4" />
                  <span>{t.header.generateMap}</span>
                </button>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="flex-grow relative overflow-hidden">
        <AnimatePresence>
          {showIdea && (
            <IdeaModal 
              onGenerate={handleGenerateCanvas} 
              onTestStoryboard={handleTestStoryboard} 
              onTestFalai={handleTestFalai} // 添加FalAI测试按钮的处理函数
            />
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {showRefinementPage && (
            <RefinementPage
              initialStoryText={userInput} // 传递原始用户输入文�
              onComplete={handleRefinementComplete}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showStoryboardTest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50"
            >
              <StoryboardTest
                initialStoryText=""
                onClose={handleCloseStoryboardTest}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showFalaiTest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-white"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={handleCloseFalaiTest}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FalaiTest />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          id="main-ui"
          className="flex h-full w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: showIdea || showRefinementPage || showStoryboardTest ? 0 : 1 }}
          style={{ pointerEvents: showIdea || showRefinementPage || showStoryboardTest ? 'none' : 'auto' }}
        >
          {!showIdea && !showRefinementPage && !showStoryboardTest && (
            <>
              <StoryTree 
                storyData={storyData} 
                selectedFrameId={selectedFrameId} 
                onFrameSelect={handleFrameSelect}
              />
              
              <Canvas 
                storyData={storyData}
                selectedFrameId={selectedFrameId}
                onFrameSelect={handleFrameSelect}
              />
              
              <Sidebar 
                storyData={storyData}
                selectedFrameId={selectedFrameId}
                onClose={handleCloseEditor}
                onUpdate={handleUpdateFrame}
                onAddBranch={handleAddBranch}
                selectedStyle={selectedStyle}
                onStyleChange={handleStyleChange}
                onRegenerateStyle={handleRegenerateStyle}
                userPersonas={userPersonas}
              />
            </>
          )}
        </motion.div>

        <AnimatePresence>
          {showJourneyMap && (
            <JourneyMap 
              storyData={storyData}
              onClose={() => setShowJourneyMap(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showStoryScript && (
            <StoryScript 
              storyData={storyData}
              show={showStoryScript}
              onClose={() => setShowStoryScript(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showUserPersonas && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">用户画像管理</h2>
                  <button
                    onClick={() => setShowUserPersonas(false)}
                    className="p-2 rounded-full hover:bg-gray-200 text-gray-500"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6">
                  <UserPersonas 
                    personas={userPersonas}
                    selectedPersona={null}
                    onSelectPersona={() => {}}
                    onUpdatePersonas={setUserPersonas}
                  />
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <LocaleProvider>
      <AppContent />
    </LocaleProvider>
  );
}

export default App;
