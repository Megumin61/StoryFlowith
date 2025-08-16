import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, X, ChevronDown, ChevronUp, Loader2, Plus, Check, 
  MessageSquare, Sparkles, GitFork, Settings, User
} from 'lucide-react';

// 节点状态常量
const NODE_STATES = {
  COLLAPSED: 'collapsed',
  EXPANDED: 'editing',  // 映射为editing以与StoryNode保持一致
  GENERATING: 'generating',
  CONFIRMING: 'confirming',
  EXPLORING: 'exploring' // 新增：探索面板状态
};

// 动画配置
const nodeAnimations = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { opacity: 0, scale: 0.8 },
  hover: { y: -2 },
};

const ExplorationNode = ({ 
  data, 
  selected, 
  onNodeClick, 
  onNodeDelete,
  onGenerateBranches,
  onMergeBranches 
}) => {
  const [nodeState, setNodeState] = useState(data.state || NODE_STATES.EXPANDED);
  const [explorationText, setExplorationText] = useState(data.explorationText || '');
  const [branchCount, setBranchCount] = useState(data.branchCount || 3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState(data.generatedIdeas || []);
  const [selectedIdeas, setSelectedIdeas] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // 新增：气泡拖拽区域状态
  const [bubbleDragArea, setBubbleDragArea] = useState({
    isOver: false,
    bubbles: data.bubbleDragArea?.bubbles || []
  });

  // 新增：探索面板状态
  const [explorationBubbles, setExplorationBubbles] = useState(
    data.explorationBubbles || {
      immediateFeelings: [], // 即时感受
      actionTendencies: [], // 行动倾向
      goalAdjustments: []   // 目标调整
    }
  );
  
  // 新增：是否显示思考气泡面板
  const [showBubblesPanel, setShowBubblesPanel] = useState(false);
  
  const nodeRef = useRef(null);

  // 同步data.state的变化
  useEffect(() => {
    console.log('ExplorationNode useEffect - data.state:', data.state, 'nodeState:', nodeState);
    if (data.state && data.state !== nodeState) {
      console.log('ExplorationNode syncing state from data.state:', data.state);
      // 处理状态映射：editing -> EXPANDED
      if (data.state === 'editing') {
        setNodeState(NODE_STATES.EXPANDED);
      } else {
        setNodeState(data.state);
      }
    }
  }, [data.state]); // 移除nodeState依赖，避免循环更新

  // 同步本地状态到data - 添加防抖，避免频繁更新
  useEffect(() => {
    console.log('ExplorationNode syncing local state to data:', nodeState);
    if (data.onDataChange) {
      // 处理状态映射：EXPANDED -> editing
      const mappedState = nodeState === NODE_STATES.EXPANDED ? 'editing' : nodeState;
      data.onDataChange({
        ...data,
        state: mappedState,
        explorationText,
        branchCount,
        generatedIdeas,
        selectedIdeas,
        bubbleDragArea,
        explorationBubbles,
        showBubblesPanel
      });
    }
  }, [nodeState, explorationText, branchCount, generatedIdeas, selectedIdeas, bubbleDragArea, explorationBubbles, showBubblesPanel]); // 移除data依赖

  // 同步showBubblesPanel状态到节点数据，确保布局算法能正确计算宽度
  useEffect(() => {
    if (data.onUpdateNode) {
      data.onUpdateNode(data.id, {
        showBubblesPanel: showBubblesPanel
      });
      // 触发重新布局，因为宽度发生了变化
      if (data.onNodeStateChange) {
        // 使用requestAnimationFrame确保状态更新后再触发布局
        requestAnimationFrame(() => {
          data.onNodeStateChange(showBubblesPanel ? 'expanded' : 'collapsed');
        });
      }
    }
  }, [showBubblesPanel, data]);

  // 新增：气泡拖拽区域处理函数
  const handleBubbleDragAreaDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('ExplorationNode 气泡拖拽区域接收到拖拽事件');
    
    try {
      let keywordData = e.dataTransfer.getData('keyword');
      let explorationBubbleData = e.dataTransfer.getData('explorationBubble');
      console.log('拖拽数据 - keyword:', keywordData, 'explorationBubble:', explorationBubbleData);
      
      // 处理思考气泡拖拽
      if (explorationBubbleData) {
        const bubble = JSON.parse(explorationBubbleData);
        console.log('气泡拖拽区域接收到思考气泡拖拽:', bubble);
        // 添加到气泡拖拽区域，保持原有颜色
        const newBubble = {
          id: Date.now() + Math.random(),
          text: bubble.text,
          type: bubble.type, // 'immediateFeelings', 'actionTendencies', 'goalAdjustments'
          originalColor: bubble.originalColor // 保持原有颜色
        };
        console.log('添加思考气泡到拖拽区域:', newBubble);
        setBubbleDragArea(prev => ({
          ...prev,
          bubbles: [...prev.bubbles, newBubble]
        }));
        return;
      }
      
      if (!keywordData) {
        const plainText = e.dataTransfer.getData('text/plain');
        console.log('拖拽数据 - text/plain:', plainText);
        
        if (plainText) {
          try {
            const parsed = JSON.parse(plainText);
            console.log('解析的拖拽数据:', parsed);
            
            if (parsed.keywordData) {
              keywordData = JSON.stringify(parsed.keywordData);
            } else if (parsed.text) {
              // 添加到气泡拖拽区域
              const newBubble = {
                id: Date.now() + Math.random(),
                text: parsed.text,
                type: 'keyword'
              };
              console.log('添加新气泡到拖拽区域:', newBubble);
              setBubbleDragArea(prev => ({
                ...prev,
                bubbles: [...prev.bubbles, newBubble]
              }));
              return;
            }
          } catch (err) {
            console.log('无法解析拖拽数据:', err);
          }
        }
      }
      
      if (keywordData) {
        const keyword = JSON.parse(keywordData);
        console.log('气泡拖拽区域接收到关键词拖拽:', keyword);
        // 添加到气泡拖拽区域，保持原有颜色
        const newBubble = {
          id: Date.now() + Math.random(),
          text: keyword.text,
          type: 'keyword',
          originalColor: keyword.originalColor // 保持原有颜色
        };
        console.log('添加新气泡到拖拽区域:', newBubble);
        setBubbleDragArea(prev => ({
          ...prev,
          bubbles: [...prev.bubbles, newBubble]
        }));
      }
    } catch (error) {
      console.log('气泡拖拽区域处理失败:', error);
    }
  };

  // 新增：删除气泡函数
  const removeBubbleFromDragArea = (bubbleId) => {
    setBubbleDragArea(prev => ({
      ...prev,
      bubbles: prev.bubbles.filter(bubble => bubble.id !== bubbleId)
    }));
  };

  // 新增：生成探索气泡函数
  const generateExplorationBubbles = () => {
    console.log('ExplorationNode generateExplorationBubbles called');
    console.log('ExplorationNode current explorationText:', explorationText);
    console.log('ExplorationNode current nodeState:', nodeState);
    
    const baseText = explorationText || '情景探索';
    console.log('ExplorationNode baseText:', baseText);
    
    // 生成三个维度的思考气泡，添加颜色信息
    const newExplorationBubbles = {
      immediateFeelings: [
        { id: 'feeling-1', text: `${baseText}让我感到兴奋`, originalColor: 'red' },
        { id: 'feeling-2', text: `${baseText}带来一些担忧`, originalColor: 'red' },
        { id: 'feeling-3', text: `${baseText}让我充满期待`, originalColor: 'red' }
      ],
      actionTendencies: [
        { id: 'action-1', text: `想要深入探索${baseText}`, originalColor: 'blue' },
        { id: 'action-2', text: `需要更多信息来理解${baseText}`, originalColor: 'blue' },
        { id: 'action-3', text: `准备制定${baseText}的计划`, originalColor: 'blue' }
      ],
      goalAdjustments: [
        { id: 'goal-1', text: `调整目标以适应${baseText}`, originalColor: 'green' },
        { id: 'goal-2', text: `重新评估${baseText}的优先级`, originalColor: 'green' },
        { id: 'goal-3', text: `为${baseText}设定新的里程碑`, originalColor: 'green' }
      ]
    };
    
    console.log('ExplorationNode setting exploration bubbles:', newExplorationBubbles);
    setExplorationBubbles(newExplorationBubbles);
    console.log('ExplorationNode showing bubbles panel instead of changing state');
    setShowBubblesPanel(true); // 显示右侧气泡面板，而不是切换状态
    console.log('ExplorationNode bubbles panel should now be visible');
  };

  // 新增：生成情景分支函数
  const handleGenerateBranches = async (e) => {
    // 阻止事件冒泡，避免触发其他按钮
    e.preventDefault();
    e.stopPropagation();
    
    console.log('ExplorationNode: handleGenerateBranches 被调用');
    console.log('ExplorationNode: explorationText:', explorationText);
    console.log('ExplorationNode: bubbleDragArea.bubbles:', bubbleDragArea.bubbles);
    
    if (!explorationText.trim() && bubbleDragArea.bubbles.length === 0) {
      console.log('ExplorationNode: 没有探索内容，无法生成分支');
      return;
    }
    
    setIsGenerating(true);
    console.log('ExplorationNode: 开始生成情景分支');
    
    try {
      // 模拟生成分支的API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 生成分支数据 - 每个分支都是一个完整的分镜节点
      const branches = Array.from({ length: branchCount }, (_, i) => ({
        id: `branch-${Date.now()}-${i}`,
        text: generateBranchTitle(i + 1),
        prompt: generateBranchPrompt(i + 1),
        imagePrompt: generateImagePrompt(i + 1),
        image: null,
        state: 'collapsed',
        pos: { x: 0, y: 0 }, // 位置将由父组件计算
        connections: [],
        nodeIndex: data.nodeIndex + 1 + i, // 在探索节点后
        // 分支相关的元数据 - 使用新的分支管理逻辑
        branchData: {
          branchId: `branch_${data.id}_${i}_${Date.now()}`, // 唯一的分支ID
          parentNodeId: data.id,
          explorationText: explorationText,
          bubbleData: bubbleDragArea.bubbles,
          branchIndex: i,
          generationParams: {
            explorationText,
            bubbleData: bubbleDragArea.bubbles
          }
        }
      }));
      
      console.log('ExplorationNode: 生成的分支数据:', branches);
      
      // 调用父组件的回调函数
      if (onGenerateBranches) {
        console.log('ExplorationNode: 调用父组件的 onGenerateBranches');
        onGenerateBranches(branches);
      } else {
        console.error('ExplorationNode: onGenerateBranches 回调函数未定义');
      }
      
      // 注意：不重置状态，保持探索面板内容
      // setExplorationText('');
      // setBubbleDragArea({ isOver: false, bubbles: [] });
      // setShowBubblesPanel(false);
      
    } catch (error) {
      console.error('ExplorationNode: 生成分支失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 辅助函数：生成分支标题
  const generateBranchTitle = (branchIndex) => {
    const titles = [
      '深入探索',
      '谨慎行动',
      '策略调整',
      '寻求帮助',
      '目标重评'
    ];
    return titles[branchIndex - 1] || titles[0];
  };

  // 辅助函数：生成分支提示
  const generateBranchPrompt = (branchIndex) => {
    const prompts = [
      `基于探索内容"${explorationText}"，主角决定深入探索这个方向，发现了一个隐藏的线索`,
      `基于探索内容"${explorationText}"，主角选择谨慎行事，先收集更多信息再做决定`,
      `基于探索内容"${explorationText}"，主角改变了原有的计划，采用新的策略来应对挑战`,
      `基于探索内容"${explorationText}"，主角寻求他人的帮助，共同面对这个情况`,
      `基于探索内容"${explorationText}"，主角重新评估了目标，调整了行动的优先级`
    ];
    return prompts[branchIndex - 1] || prompts[0];
  };

  // 辅助函数：生成图片提示
  const generateImagePrompt = (branchIndex) => {
    const imagePrompts = [
      '主角深入探索场景，发现隐藏线索的特写镜头',
      '主角谨慎观察周围环境，收集信息的场景',
      '主角制定新策略，调整行动计划的场景',
      '主角与他人合作，共同面对挑战的场景',
      '主角重新评估目标，调整优先级的场景'
    ];
    return imagePrompts[branchIndex - 1] || imagePrompts[0];
  };

  const handleToggleState = (e) => {
    if (e) e.stopPropagation();
    console.log('ExplorationNode handleToggleState called, current state:', nodeState);
    setNodeState(prev => {
      const newState = prev === NODE_STATES.COLLAPSED ? NODE_STATES.EXPANDED : NODE_STATES.COLLAPSED;
      console.log('ExplorationNode state changing from', prev, 'to', newState);
      return newState;
    });
  };

  // 处理节点点击
  const handleNodeClick = () => {
    console.log('ExplorationNode handleNodeClick called, current state:', nodeState);
    if (nodeState === NODE_STATES.COLLAPSED) {
      console.log('ExplorationNode expanding from collapsed state');
      setNodeState(NODE_STATES.EXPANDED);
    }
    if (onNodeClick) {
      onNodeClick();
    }
  };

  const handleGenerateIdeas = async (e) => {
    if (e) e.stopPropagation();
    if (!explorationText.trim()) return;
    
    setIsGenerating(true);
    setNodeState(NODE_STATES.GENERATING);
    
    try {
      // 模拟生成想法
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const ideas = Array.from({ length: branchCount }, (_, i) => ({
        id: `idea-${Date.now()}-${i}`,
        text: `探索方向 ${i + 1}: ${explorationText}的延伸构思`,
        selected: false
      }));
      
      setGeneratedIdeas(ideas);
      setNodeState(NODE_STATES.CONFIRMING);
    } catch (error) {
      console.error('生成想法失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleIdeaToggle = (ideaId) => {
    setSelectedIdeas(prev => {
      if (prev.includes(ideaId)) {
        return prev.filter(id => id !== ideaId);
      } else {
        return [...prev, ideaId];
      }
    });
  };

  const handleConfirmBranches = () => {
    const selectedIdeaData = generatedIdeas.filter(idea => 
      selectedIdeas.includes(idea.id)
    );
    
    if (onGenerateBranches && selectedIdeaData.length > 0) {
      onGenerateBranches(selectedIdeaData);
    }
    
    // 重置状态
    setNodeState(NODE_STATES.EXPANDED);
    setGeneratedIdeas([]);
    setSelectedIdeas([]);
  };

  const handleReset = () => {
    setNodeState(NODE_STATES.EXPANDED);
    setGeneratedIdeas([]);
    setSelectedIdeas([]);
    setExplorationText('');
  };

  // 渲染折叠状态
  if (nodeState === NODE_STATES.COLLAPSED) {
    return (
      <motion.div
        ref={nodeRef}
        data-node-id={data.id}
        data-node-width="400"
        data-node-height="120"
        data-expanded="false"
        className={`relative bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
          selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''
        }`}
        style={{
          width: '400px',
          minHeight: '120px'
        }}
        initial="initial"
        animate="animate"
        whileHover="hover"
        variants={nodeAnimations}
        onClick={handleNodeClick}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">情景探索</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleState(e); }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronDown size={16} className="text-gray-500" />
            </button>
          </div>
          
          <div className="text-xs text-gray-500 line-clamp-2">
            {explorationText || '点击展开进行情景探索...'}
          </div>
        </div>
      </motion.div>
    );
  }

  // 渲染生成中状态
  if (nodeState === NODE_STATES.GENERATING) {
    return (
      <motion.div
        ref={nodeRef}
        data-node-id={data.id}
        data-node-width="400"
        data-node-height="200"
        data-expanded="true"
        className={`relative bg-white border-2 border-gray-200 rounded-lg shadow-sm ${
          selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''
        }`}
        style={{
          width: '400px',
          minHeight: '200px'
        }}
        initial="initial"
        animate="animate"
        variants={nodeAnimations}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-blue-500" />
              <span className="text-base font-medium text-gray-800">生成探索方向</span>
            </div>
            <Loader2 size={18} className="text-blue-500 animate-spin" />
          </div>
          
          <div className="text-sm text-gray-600 text-center py-8">
            正在生成 {branchCount} 个探索方向...
          </div>
        </div>
      </motion.div>
    );
  }

  // 渲染确认状态
  if (nodeState === NODE_STATES.CONFIRMING) {
    return (
      <motion.div
        ref={nodeRef}
        data-node-id={data.id}
        data-node-width="400"
        data-node-height="300"
        data-expanded="true"
        className={`relative bg-white border-2 border-gray-200 rounded-lg shadow-sm ${
          selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''
        }`}
        style={{
          width: '400px',
          minHeight: '300px'
        }}
        initial="initial"
        animate="animate"
        variants={nodeAnimations}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitFork size={18} className="text-blue-500" />
              <span className="text-base font-medium text-gray-800">选择分支方向</span>
            </div>
            <button
              onClick={handleReset}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
          
          <div className="space-y-3 mb-4">
            {generatedIdeas.map((idea) => (
              <motion.div
                key={idea.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedIdeas.includes(idea.id)
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleIdeaToggle(idea.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 ${
                    selectedIdeas.includes(idea.id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedIdeas.includes(idea.id) && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                  <div className="text-sm text-gray-700 flex-1">
                    {idea.text}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleConfirmBranches}
              disabled={selectedIdeas.length === 0}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedIdeas.length > 0
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              生成 {selectedIdeas.length} 个分支
            </button>
          </div>
        </div>
      </motion.div>
    );
  }



  // 渲染展开状态
  return (
    <motion.div
      ref={nodeRef}
      data-node-id={data.id}
      data-node-width={showBubblesPanel ? "800" : "400"}
      data-node-height="280"
      data-expanded="true"
      className={`story-frame relative bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
        selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''
      }`}
      style={{
        width: showBubblesPanel ? '800px' : '400px', // 动态调整宽度
        minHeight: '280px',
        zIndex: 50 // 确保ExplorationNode在其他元素之上
      }}
      initial="initial"
      animate="animate"
      whileHover="hover"
      variants={nodeAnimations}
      onClick={(e) => {
        console.log('ExplorationNode root clicked');
        handleNodeClick();
      }}
      onMouseDown={(e) => {
        console.log('ExplorationNode root mouseDown');
      }}
    >
            {/* 使用flex布局来支持左右分栏 */}
      <div className="flex">
        {/* 左侧：原始输入面板 */}
        <div className="p-6" style={{ width: '400px', borderRight: showBubblesPanel ? '2px dashed #d1d5db' : 'none' }}>
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-500" />
            <span className="text-base font-medium text-gray-800">✍️情景探索输入</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
              className={`p-1 rounded transition-colors ${
                showSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <Settings size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleState(e); }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronUp size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* 设置面板 */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">分支数量:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBranchCount(Math.max(1, branchCount - 1))}
                    className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="text-sm font-medium text-gray-700 w-8 text-center">
                    {branchCount}
                  </span>
                  <button
                    onClick={() => setBranchCount(Math.min(8, branchCount + 1))}
                    className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 气泡拖拽区域 - 移到文本框上方，去掉标题 */}
        <div className="mb-4">
          <div
            style={{
              minHeight: '60px',
              cursor: 'pointer',
              border: '2px dashed #d1d5db',
              borderRadius: '12px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              transition: 'all 0.2s ease',
              ...(bubbleDragArea.isOver && {
                borderColor: '#9ca3af',
                backgroundColor: '#f3f4f6'
              })
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setBubbleDragArea(prev => ({ ...prev, isOver: true }));
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setBubbleDragArea(prev => ({ ...prev, isOver: false }));
            }}
            onDrop={handleBubbleDragAreaDrop}
            onClick={(e) => {
              console.log('ExplorationNode 气泡拖拽区域点击');
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              console.log('ExplorationNode 气泡拖拽区域鼠标按下');
              e.stopPropagation();
            }}
          >
            {bubbleDragArea.bubbles.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '36px',
                color: '#6b7280',
                fontSize: '13px'
              }}>
                拖拽气泡到这里进行情景探索
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                {bubbleDragArea.bubbles.map((bubble) => {
                  // 根据气泡类型和原始颜色设置样式
                  let bubbleStyle = {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '16px',
                    fontSize: '11px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  };

                  // 根据气泡类型和原始颜色设置样式
                  if (bubble.originalColor) {
                    // 保持原有颜色
                    switch (bubble.originalColor) {
                      case 'red':
                        bubbleStyle = {
                          ...bubbleStyle,
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca'
                        };
                        break;
                      case 'blue':
                        bubbleStyle = {
                          ...bubbleStyle,
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe'
                        };
                        break;
                      case 'green':
                        bubbleStyle = {
                          ...bubbleStyle,
                          backgroundColor: '#f0fdf4',
                          color: '#16a34a',
                          border: '1px solid #bbf7d0'
                        };
                        break;
                      case 'yellow':
                        bubbleStyle = {
                          ...bubbleStyle,
                          backgroundColor: '#fefce8',
                          color: '#ca8a04',
                          border: '1px solid #fef08a'
                        };
                        break;
                      case 'purple':
                        bubbleStyle = {
                          ...bubbleStyle,
                          backgroundColor: '#faf5ff',
                          color: '#9333ea',
                          border: '1px solid #e9d5ff'
                        };
                        break;
                      case 'orange':
                        bubbleStyle = {
                          ...bubbleStyle,
                          backgroundColor: '#fff7ed',
                          color: '#ea580c',
                          border: '1px solid #fed7aa'
                        };
                        break;
                      default:
                        // 默认关键词气泡样式
                        bubbleStyle = {
                          ...bubbleStyle,
                          backgroundColor: '#3b82f6',
                          color: 'white'
                        };
                    }
                  } else if (bubble.type === 'immediateFeelings') {
                    bubbleStyle = {
                      ...bubbleStyle,
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca'
                    };
                  } else if (bubble.type === 'actionTendencies') {
                    bubbleStyle = {
                      ...bubbleStyle,
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe'
                    };
                  } else if (bubble.type === 'goalAdjustments') {
                    bubbleStyle = {
                      ...bubbleStyle,
                      backgroundColor: '#f0fdf4',
                      color: '#16a34a',
                      border: '1px solid #bbf7d0'
                    };
                  } else {
                    // 默认关键词气泡样式
                    bubbleStyle = {
                      ...bubbleStyle,
                      backgroundColor: '#3b82f6',
                      color: 'white'
                    };
                  }

                  return (
                    <div
                      key={bubble.id}
                      style={bubbleStyle}
                      onMouseEnter={(e) => {
                        if (bubble.type === 'keyword') {
                          e.currentTarget.style.backgroundColor = '#2563eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (bubble.type === 'keyword') {
                          e.currentTarget.style.backgroundColor = '#3b82f6';
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBubbleFromDragArea(bubble.id);
                      }}
                    >
                      <span>{bubble.text}</span>
                      <X size={10} style={{ cursor: 'pointer' }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 探索文本输入 - 样式与StoryNode相近 */}
        <div className="mb-4">
          <div className="text-xs text-gray-400 font-medium mb-2">探索内容</div>
          <textarea
            value={explorationText}
            onChange={(e) => {
              console.log('ExplorationNode textarea onChange:', e.target.value);
              setExplorationText(e.target.value);
            }}
            onFocus={(e) => {
              console.log('ExplorationNode textarea onFocus');
            }}
            onClick={(e) => {
              console.log('ExplorationNode textarea onClick');
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              console.log('ExplorationNode textarea onMouseDown');
              e.stopPropagation();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            placeholder="描述您想要探索的情景或方向..."
            className="w-full text-sm text-gray-800 bg-gray-50/50 border-gray-100 rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-200 overflow-hidden"
            style={{ height: 'auto', minHeight: '60px', maxHeight: '120px' }}
          />
        </div>

        {/* 操作按钮 - 参考StoryNode风格 */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => {
              console.log('ExplorationNode generate button clicked');
              e.stopPropagation();
              generateExplorationBubbles();
            }}
            disabled={!explorationText.trim() || isGenerating}
            className={`flex-1 py-1.5 text-xs text-white bg-gray-800 hover:bg-gray-700 rounded-md flex items-center justify-center transition-colors ${
              !explorationText.trim() || isGenerating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                生成中...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1">
                <Sparkles size={12} />
                情景构思
              </div>
            )}
          </button>
          

        </div>


        </div>

        {/* 右侧：思考气泡面板 */}
        {showBubblesPanel && (
          <div className="p-6" style={{ width: '400px' }}>
            {/* 头部 - 头像放在标题左边，与左侧对齐 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {/* 用户头像 - 参考图中样式 */}
                <div className="w-6 h-6 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full flex items-center justify-center shadow-sm relative">
                  <div className="w-4 h-4 bg-orange-400 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  </div>
                </div>
                <span className="text-base font-medium text-gray-800">用户探索思考</span>
              </div>
              <button
                onClick={() => setShowBubblesPanel(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* 三个维度的思考气泡 - 使用更小的样式 */}
            <div className="space-y-3">
              {/* 即时感受 */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  即时感受
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {explorationBubbles.immediateFeelings.map((bubble) => (
                    <div
                      key={bubble.id}
                      className="px-2 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-700 cursor-move hover:bg-red-100 transition-colors"
                      draggable="true"
                      onDragStart={(e) => {
                        e.dataTransfer.setData('explorationBubble', JSON.stringify({
                          text: bubble.text,
                          type: 'immediateFeelings',
                          originalColor: 'red'
                        }));
                      }}
                    >
                      {bubble.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* 行动倾向 */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  行动倾向
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {explorationBubbles.actionTendencies.map((bubble) => (
                    <div
                      key={bubble.id}
                      className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700 cursor-move hover:bg-blue-100 transition-colors"
                      draggable="true"
                      onDragStart={(e) => {
                        e.dataTransfer.setData('explorationBubble', JSON.stringify({
                          text: bubble.text,
                          type: 'actionTendencies',
                          originalColor: 'blue'
                        }));
                      }}
                    >
                      {bubble.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* 目标调整 */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  目标调整
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {explorationBubbles.goalAdjustments.map((bubble) => (
                    <div
                      key={bubble.id}
                      className="px-2 py-1 bg-green-50 border border-green-200 rounded-full text-xs text-green-700 cursor-move hover:bg-green-100 transition-colors"
                      draggable="true"
                      onDragStart={(e) => {
                        e.dataTransfer.setData('explorationBubble', JSON.stringify({
                          text: bubble.text,
                          type: 'goalAdjustments',
                          originalColor: 'green'
                        }));
                      }}
                    >
                      {bubble.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 生成情景分支按钮 */}
            <div className="mt-6 pt-4 border-t border-gray-100 relative z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('ExplorationNode: 生成分支按钮被点击');
                  handleGenerateBranches(e);
                }}
                disabled={(!explorationText.trim() && bubbleDragArea.bubbles.length === 0) || isGenerating}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 relative z-20 ${
                  (explorationText.trim() || bubbleDragArea.bubbles.length > 0) && !isGenerating
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                style={{ position: 'relative', zIndex: 20 }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    生成分支中...
                  </>
                ) : (
                  <>
                    <GitFork size={16} />
                    生成情景分支 ({branchCount}个)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ExplorationNode; 