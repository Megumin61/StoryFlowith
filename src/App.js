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
  const [showIdea, setShowIdea] = useState(true);
  const [showRefinementPage, setShowRefinementPage] = useState(false); // 新�：控制新页面的显示状�
  const [showStoryboardTest, setShowStoryboardTest] = useState(false); // ���������Ʋ��Է־��������ʾ
  const [showJourneyMap, setShowJourneyMap] = useState(false);
  const [showStoryScript, setShowStoryScript] = useState(false);
  const [showUserPersonas, setShowUserPersonas] = useState(false);
  const [userPersonas, setUserPersonas] = useState([]);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [userInput, setUserInput] = useState(''); // 新�：保存用户最原�的输�

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
            <IdeaModal onGenerate={handleGenerateCanvas} onTestStoryboard={handleTestStoryboard} />
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
            <StoryboardTest
              initialStoryText={userInput}
              onClose={handleCloseStoryboardTest}
            />
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
            <UserPersonas 
              show={showUserPersonas}
              onClose={() => setShowUserPersonas(false)}
            />
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
