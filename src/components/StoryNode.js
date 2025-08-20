import React, { memo, useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, RefreshCw, Edit2, X, ChevronDown, ChevronUp, Loader2, ChevronLeft, ChevronRight, Zap, Film, Settings, Image, Check, Trash2, Edit3, Highlighter } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import testImage from '../images/test.png';
import FalAI from '../services/falai';
import { falConfig } from '../config';
import YoudaoTranslate from '../services/youdaoTranslate';
import { getBubbleStyle } from '../utils/bubbleStyles';

// Toast 组件
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-md text-white text-sm z-50 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {message}
    </motion.div>
  );
};

// 计算时间工具函数
const calculateTime = (startTime, endTime) => {
  const timeDiff = endTime - startTime;
  const seconds = Math.floor(timeDiff / 1000);
  const milliseconds = timeDiff % 1000;
  return `${seconds}.${milliseconds.toString().padStart(3, '0')}秒`;
};

// 左右移动按钮组件
const MoveNodeButtons = ({ onMoveLeft, onMoveRight, zIndex = 40 }) => (
  <div 
    className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-40 transition-all duration-200 opacity-30 hover:opacity-80"
    style={{ zIndex: zIndex }} // 使用传入的z-index
  >
    <button
      className="w-6 h-6 rounded-full bg-white/80 shadow-sm flex items-center justify-center hover:bg-gray-100 border border-gray-200/60 hover:border-gray-300"
      onClick={onMoveLeft}
      title="向左移动"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
    >
      <ChevronLeft size={14} className="text-gray-400" />
    </button>
    <button
      className="w-6 h-6 rounded-full bg-white/80 shadow-sm flex items-center justify-center hover:bg-gray-100 border border-gray-200/60 hover:border-gray-300"
      onClick={onMoveRight}
      title="向右移动"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
    >
      <ChevronRight size={14} className="text-gray-400" />
    </button>
  </div>
);

// 悬浮按钮组件
const FloatingButtons = ({ nodeId, onAddFrame, onExploreScene, onGenerateImage, onDeleteFrame, onExpandNode, isVisible, style = {} }) => {
  const buttons = [
    {
      id: 'add',
      text: '新分镜',
      icon: '＋',
      onClick: (e) => { e.stopPropagation(); onAddFrame(); }
    },
    {
      id: 'explore',
      text: '情景探索',
      icon: '○',
      onClick: (e) => { e.stopPropagation(); onExploreScene(); }
    },
    {
      id: 'expand',
      text: '画面生成',
      icon: '□',
      onClick: (e) => { e.stopPropagation(); onExpandNode(); }
    },
    {
      id: 'delete',
      text: '删除分镜',
      icon: '✕',
      onClick: (e) => { e.stopPropagation(); onDeleteFrame(); }
    }
  ];

  if (!isVisible) return null;

  return (
    <div 
      className="bg-white rounded-lg shadow-md border border-gray-200 p-3 pointer-events-auto floating-buttons"
      style={{
        width: '120px',
        marginLeft: '12px',
        zIndex: 5,
        ...style // 合并传入的样式，包括动态z-index
      }}
    >
      <div className="space-y-2">
        {buttons.map((button) => (
          <button
            key={button.id}
            className="
              w-full flex items-center gap-2 px-3 py-2 
              text-sm text-gray-700 hover:text-gray-900
              hover:bg-gray-50 rounded-md transition-colors duration-200
              border border-transparent hover:border-gray-200
            "
            onClick={button.onClick}
          >
            <div className="text-base text-gray-500 font-light">{button.icon}</div>
            <div className="font-medium whitespace-nowrap">{button.text}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// 节点状态类型
const NODE_STATES = {
  COLLAPSED: 'collapsed',
  EDITING: 'editing',
  GENERATING: 'generating',
  IMAGE: 'image',
  IMAGE_EDITING: 'imageEditing',
  EXPANDED: 'expanded' // 新增展开态
};

// 节点宽度常量
const NODE_WIDTH = {
  COLLAPSED: 240,
  EXPANDED: 360,
  FULL_EXPANDED: 1200 // 调整为横向布局的宽度
};

const StoryNode = ({ data, selected }) => {
  // 基本状态
  const [nodeState, setNodeState] = useState(data.image ? NODE_STATES.IMAGE : NODE_STATES.COLLAPSED);
  const [nodeText, setNodeText] = useState(data.text || '');
  const [visualPrompt, setVisualPrompt] = useState(data.imagePrompt || '');
  const [regeneratePrompt, setRegeneratePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  
  // 展开态数据
  const [expandedData, setExpandedData] = useState({
    script: data.text || '',
    visualElements: {
      bubbles: [],
      composition: 'medium',
      style: 'sketch'
    },
    prompt: data.imagePrompt || '',
    annotations: [],
    selectedTool: null, // 当前选择的编辑工具
    selectedColor: '#3B82F6' // 当前选择的颜色
  });
  
  // refs
  const textAreaRef = useRef(null);
  const promptTextAreaRef = useRef(null);
  const toastPositionRef = useRef({ x: 0, y: 0 });
  const nodeRef = useRef(null);
  const prevNodeStateRef = useRef(nodeState);

  // 动画控制
  const controls = useAnimation();
  
  // 生成过程计时器状态
  const [generationStartTime, setGenerationStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // 当进入生成状态时启动计时器
  useEffect(() => {
    let timer;
    if (nodeState === NODE_STATES.GENERATING) {
      setGenerationStartTime(new Date());
      setElapsedTime(0);
      
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setGenerationStartTime(null);
      setElapsedTime(0);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [nodeState]);

  // 初始化控件和数据
  useEffect(() => {
    console.log('🔧 StoryNode init useEffect triggered:', { nodeId: data.id });
    controls.start({ opacity: 1, scale: 1 });
    setNodeText(data.text || '');
    setVisualPrompt(data.imagePrompt || '');
  }, [data.id]);

  // 控制小面板显示：选中节点显示
  useEffect(() => {
    setShowFloatingPanel(!!selected);
  }, [selected]);

  // 同步面板显示状态到节点数据
  useEffect(() => {
    try {
      if (data.onUpdateNode && data.id) {
        data.onUpdateNode(data.id, { showFloatingPanel });
      }
    } catch (e) {}
  }, [showFloatingPanel, data]);

  // 优化节点状态变化处理
  useEffect(() => {
    if (prevNodeStateRef.current !== nodeState && typeof data.onStateChange === 'function') {
      const isExpanded = nodeState !== NODE_STATES.COLLAPSED;
      
      requestAnimationFrame(() => {
        data.onStateChange(data.id, nodeState, isExpanded);
      });
      
      prevNodeStateRef.current = nodeState;
    }
  }, [nodeState, data]);

  const addToast = (message, type = 'success') => {
    if (nodeRef.current) {
      const nodeBounds = nodeRef.current.getBoundingClientRect();
      toastPositionRef.current = {
        x: nodeBounds.left + nodeBounds.width / 2,
        y: nodeBounds.bottom + 8
      };
    }

    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCardClick = () => {
    // 调用 onNodeClick 来选中节点
    if (data.onNodeClick) {
      data.onNodeClick();
    }
    
    if (nodeState === NODE_STATES.COLLAPSED) {
      setShowFloatingPanel(true);
    }
  };

  // 安全状态转换函数
  const safeSetNodeState = (newState) => {
    if (nodeState === NODE_STATES.EDITING || nodeState === NODE_STATES.IMAGE_EDITING) {
      handleTextSave();
      handlePromptSave();
    }
    
    if (nodeState !== newState) {
      setNodeState(newState);
      console.log(`节点状态从 ${nodeState} 变为 ${newState}`);
      
      if (data.onNodeStateChange) {
        data.onNodeStateChange(newState);
      }
    }
  };

  // 文本变化处理函数
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setNodeText(newText);

    if (handleTextChange.timeout) {
      clearTimeout(handleTextChange.timeout);
    }
    
    handleTextChange.timeout = setTimeout(() => {
      if (data.onUpdateNode) {
        data.onUpdateNode(data.id, { text: newText });
      }
    }, 50);
  };

  const handlePromptChange = (e) => {
    const newPrompt = e.target.value;
    setVisualPrompt(newPrompt);

    if (handlePromptChange.timeout) {
      clearTimeout(handlePromptChange.timeout);
    }
    
    handlePromptChange.timeout = setTimeout(() => {
      if (data.onUpdateNode) {
        data.onUpdateNode(data.id, { imagePrompt: newPrompt });
      }
    }, 50);
  };

  const handleTextSave = () => {
    if (nodeText !== data.text) {
      if (data.onTextSave) {
        data.onTextSave(nodeText);
      }
      addToast('情节描述已保存', 'success');
    }
  };

  const handlePromptSave = () => {
    if (visualPrompt !== data.imagePrompt) {
      if (data.onPromptSave) {
        data.onPromptSave(visualPrompt);
      }
    }
  };

  // 删除节点函数
  const handleDeleteNode = (e) => {
    if (e) e.stopPropagation();
    
    console.log('StoryNode 调用删除函数, 节点ID:', data.id);
    
    if (typeof data.onDeleteNode === 'function') {
      data.onDeleteNode(data.id);
    } else {
      console.error('删除回调未定义', data);
    }
  };

  // 展开节点函数
  const handleExpandNode = () => {
    console.log('展开节点:', data.id);
    setNodeState(NODE_STATES.EXPANDED);
    
    // 同步展开态数据
    setExpandedData({
      script: data.text || '',
      visualElements: {
        bubbles: [],
        composition: 'medium',
        style: 'sketch'
      },
      prompt: data.imagePrompt || '',
      annotations: []
    });
  };

  // 收起节点函数
  const handleCollapseNode = () => {
    console.log('收起节点:', data.id);
    setNodeState(NODE_STATES.COLLAPSED);
  };

  // 完成并收起函数
  const handleCompleteAndCollapse = () => {
    console.log('完成并收起节点:', data.id);
    setNodeState(NODE_STATES.COLLAPSED);
  };

  // 脚本变化处理
  const handleScriptChange = (e) => {
    const newScript = e.target.value;
    setExpandedData(prev => ({
      ...prev,
      script: newScript
    }));
    
    // 实时同步到折叠状态的文本
    setNodeText(newScript);
  };

  // 保存脚本函数
  const handleSaveScript = () => {
    const newScript = expandedData.script;
    setNodeText(newScript);
    
    // 更新节点数据
    if (data.onUpdateNode) {
      data.onUpdateNode(data.id, { text: newScript });
    }
    
    // 调用文本保存回调
    if (data.onTextSave) {
      data.onTextSave(newScript);
    }
    
    addToast('故事脚本已保存', 'success');
  };

  // 重置脚本函数
  const handleResetScript = () => {
    setExpandedData(prev => ({
      ...prev,
      script: data.text || ''
    }));
  };

  // 构图变化处理
  const handleCompositionChange = (composition) => {
    setExpandedData(prev => ({
      ...prev,
      visualElements: {
        ...prev.visualElements,
        composition
      }
    }));
  };

  // 风格变化处理
  const handleStyleChange = (style) => {
    setExpandedData(prev => ({
      ...prev,
      visualElements: {
        ...prev.visualElements,
        style
      }
    }));
  };

  // 处理图像点击添加编辑元素
  const handleImageClick = (e) => {
    if (!expandedData.selectedTool) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
    
    // 弹出输入框让用户输入内容
    const content = prompt(`请输入${expandedData.selectedTool === 'bubble' ? '对话' : '标签'}内容:`);
    if (!content || content.trim() === '') return;
    
    const newAnnotation = {
      id: Date.now().toString(),
      type: expandedData.selectedTool,
      content: content.trim(),
      color: expandedData.selectedColor,
      x,
      y,
      width: expandedData.selectedTool === 'bubble' ? '120px' : '100px',
      height: expandedData.selectedTool === 'bubble' ? '50px' : '30px'
    };
    
    setExpandedData(prev => ({
      ...prev,
      annotations: [...prev.annotations, newAnnotation],
      selectedTool: null // 添加完成后清除工具选择
    }));
  };

  // 重置提示词函数
  const handleResetPrompt = () => {
    setExpandedData(prev => ({
      ...prev,
      prompt: data.imagePrompt || ''
    }));
  };

  // 添加注释函数
  const handleAddAnnotation = (annotation) => {
    const newAnnotation = {
      id: Date.now(),
      ...annotation
    };
    setExpandedData(prev => ({
      ...prev,
      annotations: [...prev.annotations, newAnnotation]
    }));
  };

  // 移除注释函数
  const handleRemoveAnnotation = (annotationId) => {
    setExpandedData(prev => ({
      ...prev,
      annotations: prev.annotations.filter(a => a.id !== annotationId)
    }));
  };

  // 移除气泡函数
  const handleRemoveBubble = (bubbleIdOrIndex) => {
    setExpandedData(prev => ({
      ...prev,
      visualElements: {
        ...prev.visualElements,
        bubbles: prev.visualElements.bubbles.filter((bubble, index) => {
          // 支持通过ID或索引删除
          if (typeof bubbleIdOrIndex === 'number') {
            return index !== bubbleIdOrIndex;
          } else {
            return bubble.id !== bubbleIdOrIndex;
          }
        })
      }
    }));
  };

  // 添加气泡函数
  const handleAddBubble = () => {
    const newBubble = {
      id: Date.now() + Math.random(),
      text: '',
      type: 'default',
      timestamp: new Date().toISOString()
    };
    
    setExpandedData(prev => ({
      ...prev,
      visualElements: {
        ...prev.visualElements,
        bubbles: [...prev.visualElements.bubbles, newBubble]
      }
    }));
  };

  // 修改气泡文本函数
  const handleBubbleChange = (bubbleIdOrIndex, value) => {
    setExpandedData(prev => ({
      ...prev,
      visualElements: {
        ...prev.visualElements,
        bubbles: prev.visualElements.bubbles.map((bubble, index) => {
          // 支持通过ID或索引修改
          if (typeof bubbleIdOrIndex === 'number') {
            return index === bubbleIdOrIndex ? { ...bubble, text: value } : bubble;
        } else {
            return bubble.id === bubbleIdOrIndex ? { ...bubble, text: value } : bubble;
          }
        })
      }
    }));
  };

  // 处理注释拖拽调整大小
  const handleAnnotationResize = (annotationId, newWidth, newHeight) => {
    setExpandedData(prev => ({
      ...prev,
      annotations: prev.annotations.map(ann => 
        ann.id === annotationId 
          ? { ...ann, width: newWidth, height: newHeight }
          : ann
      )
    }));
  };

  // 处理注释拖拽移动位置
  const handleAnnotationMove = (annotationId, newX, newY) => {
    setExpandedData(prev => ({
      ...prev,
      annotations: prev.annotations.map(ann => 
        ann.id === annotationId 
          ? { ...ann, x: newX, y: newY }
          : ann
      )
    }));
  };

  // 处理注释内容编辑
  const handleAnnotationEdit = (annotationId, newContent) => {
    setExpandedData(prev => ({
      ...prev,
      annotations: prev.annotations.map(ann => 
        ann.id === annotationId 
          ? { ...ann, content: newContent }
          : ann
      )
    }));
  };

  // 处理注释颜色更改
  const handleAnnotationColorChange = (annotationId, newColor) => {
    setExpandedData(prev => ({
      ...prev,
      annotations: prev.annotations.map(ann => 
        ann.id === annotationId 
          ? { ...ann, color: newColor }
          : ann
      )
    }));
  };

  // 处理注释删除
  const handleAnnotationDelete = (annotationId) => {
    setExpandedData(prev => ({
      ...prev,
      annotations: prev.annotations.filter(ann => ann.id !== annotationId)
    }));
  };

  // 清除所有注释
  const handleClearAllAnnotations = () => {
    // 使用自定义确认对话框替代 window.confirm
    const userConfirmed = window.confirm ? window.confirm('确定要清除所有注释吗？') : true;
    if (userConfirmed) {
      setExpandedData(prev => ({
        ...prev,
        annotations: []
      }));
    }
  };

  // 导出注释数据
  const handleExportAnnotations = () => {
    const annotationsData = {
      nodeId: data.id,
      timestamp: new Date().toISOString(),
      annotations: expandedData.annotations
    };
    
    const dataStr = JSON.stringify(annotationsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `annotations_${data.id}_${Date.now()}.json`;
    link.click();
  };

  // 导入注释数据
  const handleImportAnnotations = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedData = JSON.parse(event.target.result);
            if (importedData.annotations && Array.isArray(importedData.annotations)) {
              setExpandedData(prev => ({
                ...prev,
                annotations: importedData.annotations
              }));
              alert('注释导入成功！');
            } else {
              alert('文件格式不正确');
            }
      } catch (error) {
            alert('文件解析失败');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // 生成图像函数
  const handleGenerateImage = async () => {
    setNodeState(NODE_STATES.GENERATING);
    setIsGenerating(true);
    
    try {
      // 这里可以调用图像生成逻辑
      // 暂时模拟成功
      setTimeout(() => {
      setNodeState(NODE_STATES.IMAGE);
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      console.error("图像生成失败:", error);
      setNodeState(NODE_STATES.EXPANDED);
    setIsGenerating(false);
    }
  };

  // 渲染折叠状态
  const renderCollapsedCard = () => (
    <div className="flex flex-col p-3 min-h-[80px] cursor-pointer" onClick={handleCardClick}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-400 font-medium">{data.label}</div>
        {data.branchData ? (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-blue-600 font-medium">
              {data.branchData.branchName || `分支 ${(data.branchData.branchLineIndex || 0) + 1}`}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span className="text-xs text-gray-500 font-medium">主线</span>
          </div>
        )}
      </div>
      <textarea
        data-no-drag
        value={nodeText}
        readOnly={!selected}
        placeholder={data.placeholder || "点击此处添加分镜描述..."}
        className={`w-full text-sm text-gray-800 resize-none border-none rounded-md p-2 flex-grow focus:outline-none overflow-hidden ${
          selected ? 'bg-white border border-blue-200' : 'bg-gray-50/50'
        }`}
        style={{ height: 'auto' }}
        onChange={selected ? handleTextChange : undefined}
      />
      <div className="flex justify-center mt-2">
        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );

  // 渲染展开态卡片
  const renderExpandedCard = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* 顶部标题栏 - 压缩高度 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📽️</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{data.label}</h3>
              <p className="text-xs text-gray-600">编辑分镜内容和视觉元素</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
      <button
              onClick={() => setNodeState(NODE_STATES.COLLAPSED)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
      </button>
          </div>
          </div>
      </div>

      {/* 主要内容区域 - 使用更紧凑的布局 */}
      <div className="flex h-[600px]">
        {/* 左侧控制面板 */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* 关键词气泡区域 - 移到左侧上方，支持拖拽 */}
          <div className="p-4 border-b border-gray-200 flex-1">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Film className="w-4 h-4 mr-2 text-purple-500" />
              关键词气泡
            </h4>
            
            {/* 拖拽区域 */}
            <div 
              className="min-h-[120px] border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50/50 transition-colors hover:border-gray-400 hover:bg-gray-100/50"
              onDragOver={(e) => {
                e.preventDefault();
          e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
        }} 
                            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                try {
                  // 优先尝试解析拖拽的关键词数据
                  const keywordData = e.dataTransfer.getData('keyword');
                  const textData = e.dataTransfer.getData('text/plain');
                  const explorationBubbleData = e.dataTransfer.getData('explorationBubble');
                  
                  let keywordText = '';
                  let keywordType = 'default';
                  let originalColor = null;
                  let bubbleType = 'keyword';
                  let dragSource = null;
                  
                  // 优先处理来自关键词池的拖拽
                  if (explorationBubbleData) {
                    try {
                      const parsed = JSON.parse(explorationBubbleData);
                      keywordText = parsed.text || '';
                      keywordType = parsed.type || 'default';
                      bubbleType = parsed.bubbleType || 'keyword';
                      originalColor = parsed.originalColor || null;
                      dragSource = parsed.dragSource || null;
                    } catch (e) {
                      keywordText = explorationBubbleData;
                    }
                  } else if (keywordData) {
                    try {
                      const parsed = JSON.parse(keywordData);
                      keywordText = parsed.text || parsed.keyword || '';
                      keywordType = parsed.type || 'default';
                      bubbleType = parsed.bubbleType || 'keyword';
                      originalColor = parsed.originalColor || null;
                      dragSource = parsed.dragSource || null;
                    } catch (e) {
                      keywordText = keywordData;
                    }
                  } else if (textData) {
                    try {
                      const parsed = JSON.parse(textData);
                      keywordText = parsed.keywordData?.text || parsed.keyword || '';
                      keywordType = parsed.keywordData?.type || 'default';
                      bubbleType = parsed.keywordData?.bubbleType || 'keyword';
                      originalColor = parsed.keywordData?.originalColor || null;
                      dragSource = parsed.keywordData?.dragSource || null;
                    } catch (e) {
                      keywordText = textData;
                    }
                  }
                  
                  if (keywordText.trim()) {
                    // 根据拖拽源和关键词类型设置正确的气泡样式
                    let finalBubbleType = bubbleType;
                    let finalColor = originalColor;
                    
                    // 如果来自关键词池，根据关键词类型映射到对应的气泡类型
                    if (dragSource === 'keywordPool') {
                      switch (keywordType) {
                        case 'emotions':
                        case 'pain_points':
                          finalBubbleType = 'immediateFeelings';
                          finalColor = keywordType === 'emotions' ? 'red' : 'purple';
                          break;
                        case 'goals':
                          finalBubbleType = 'goalAdjustments';
                          finalColor = 'green';
                          break;
                        case 'user_traits':
                          finalBubbleType = 'actionTendencies';
                          finalColor = 'blue';
                          break;
                        case 'elements':
                          finalBubbleType = 'contextualFactors';
                          finalColor = 'yellow';
                          break;
                        default:
                          finalBubbleType = 'keyword';
                          finalColor = 'blue';
                      }
                    }
                    
                    // 添加新的气泡，保持原有样式信息
                    const newBubble = {
                      id: Date.now() + Math.random(),
                      text: keywordText.trim(),
                      type: keywordType,
                      bubbleType: finalBubbleType,
                      originalColor: finalColor,
                      timestamp: new Date().toISOString(),
                      // 添加样式标识
                      style: {
                        color: finalColor,
                        backgroundColor: finalColor ? `${finalColor}20` : '#E5E7EB',
                        borderColor: finalColor || '#D1D5DB'
                      }
                    };
                    
                    setExpandedData(prev => ({
                      ...prev,
                      visualElements: {
                        ...prev.visualElements,
                        bubbles: [...prev.visualElements.bubbles, newBubble]
                      }
                    }));
                  }
                } catch (error) {
                  console.warn('拖拽关键词解析失败:', error);
                }
              }}
            >
              {/* 拖拽提示 */}
              {expandedData.visualElements.bubbles.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <div className="w-8 h-8 mx-auto mb-2 text-gray-300">📥</div>
                  <p className="text-xs">拖拽关键词到这里</p>
                </div>
              )}
              
              {/* 已添加的关键词气泡 */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {expandedData.visualElements.bubbles.map((bubble, index) => (
                  <div key={bubble.id || index} className="flex items-center space-x-2">
                    {bubble.isEditing ? (
                      <input
                        type="text"
                        value={bubble.text}
                        onChange={(e) => handleBubbleChange(bubble.id || index, e.target.value)}
                        onBlur={() => {
                          // 失去焦点时保存编辑
                          setExpandedData(prev => ({
                            ...prev,
                            visualElements: {
                              ...prev.visualElements,
                              bubbles: prev.visualElements.bubbles.map(b => 
                                b.id === bubble.id ? { ...b, isEditing: false } : b
                              )
                            }
                          }));
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.target.blur();
                          }
                        }}
                        className="flex-1 p-2 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="flex-1 cursor-pointer transition-all duration-200"
                        onDoubleClick={() => {
                          // 双击进入编辑模式
                          setExpandedData(prev => ({
                            ...prev,
                            visualElements: {
                              ...prev.visualElements,
                              bubbles: prev.visualElements.bubbles.map(b => 
                                b.id === bubble.id ? { ...b, isEditing: true } : b
                              )
                            }
                          }));
                        }}
                        title="双击编辑"
                      >
                        {(() => {
                          // 使用统一的气泡样式系统
                          let bubbleStyle;
                          
                          // 优先使用气泡的预定义样式信息
                          if (bubble.style && bubble.style.color) {
                            bubbleStyle = {
                              ...getBubbleStyle('default'),
                              backgroundColor: bubble.style.backgroundColor || '#f3f4f6',
                              color: bubble.style.color,
                              border: `1px solid ${bubble.style.borderColor || '#d1d5db'}`
                            };
                          } else {
                            // 使用统一的颜色系统
                            bubbleStyle = getBubbleStyle(bubble.bubbleType || bubble.type, bubble.originalColor);
                          }

                          return (
                            <div style={bubbleStyle}>
                              <span>{bubble.text || `气泡 ${index + 1}`}</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
          <button
                      onClick={() => handleRemoveBubble(bubble.id || index)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="删除气泡"
          >
                      <Trash2 className="w-4 h-4" />
          </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 生辰提示词按钮 */}
          <button
              onClick={() => {
                // 这里可以添加生辰提示词的功能
                addToast('生辰提示词功能开发中...', 'success');
              }}
              className="w-full mt-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              生辰提示词
          </button>
        </div>

          {/* 视觉提示词区域 - 移到左侧下方 */}
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-yellow-500" />
              视觉提示词
            </h4>
            <textarea
              data-no-drag
              value={expandedData.prompt}
              onChange={handlePromptChange}
              placeholder="描述您想要的画面效果、构图、风格等..."
              className="w-full p-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
      </div>

          {/* 生成图像按钮区域 */}
          <div className="p-4">
            <div className="flex items-center space-x-3">
              {/* 取消按钮 */}
      <button
                onClick={() => setNodeState(NODE_STATES.COLLAPSED)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
      </button>
      
              {/* 生成图像按钮 */}
              <button
                onClick={handleGenerateImage}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>{data.image ? '重新生成图像' : '生成图像'}</span>
              </button>
          </div>
          </div>
      </div>

        {/* 中间图像展示区 */}
        <div className="flex-1 p-4 flex flex-col">
          {/* 图像展示区 */}
          <div className="flex-1 flex items-center justify-center mb-4 relative">
            <div className="w-full max-w-2xl">
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                {data.image ? (
                  <div className="w-full h-full">
        <img
          src={data.image}
                      alt="生成的图像"
                      className="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                    
                    {/* 图像上的编辑元素覆盖层 */}
                    <div className="absolute inset-0 pointer-events-none">
                      {expandedData.annotations.map((annotation) => (
                        <div
                          key={annotation.id}
                          className="absolute pointer-events-auto group"
          style={{
                            left: annotation.x || '10%',
                            top: annotation.y || '10%',
                            width: annotation.width || '80px',
                            height: annotation.height || '40px'
                          }}
                        >
                          {/* 注释控制按钮 - 悬停时显示 */}
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                            <div className="flex space-x-1">
          <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newContent = prompt('编辑内容:', annotation.content);
                                  if (newContent !== null) {
                                    handleAnnotationEdit(annotation.id, newContent);
                                  }
                                }}
                                className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-colors"
                                title="编辑内容"
                              >
                                ✏️
          </button>
          <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnnotationDelete(annotation.id);
                                }}
                                className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                title="删除注释"
                              >
                                ×
          </button>
        </div>
      </div>

                          {/* 颜色选择器 - 悬停时显示 */}
                          <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                            <div className="flex space-x-1">
                              {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'].map((color) => (
                                <button
                                  key={color}
                                  onClick={(e) => {
            e.stopPropagation();
                                    handleAnnotationColorChange(annotation.id, color);
                                  }}
                                  className={`w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all ${
                                    annotation.color === color ? 'ring-2 ring-blue-500 scale-110' : ''
                                  }`}
                                  style={{ backgroundColor: color }}
                                  title="更改颜色"
                                />
                              ))}
      </div>
    </div>

                          {annotation.type === 'bubble' ? (
                            <div 
                              className="bg-white border-2 rounded-lg p-2 shadow-lg cursor-move"
                              style={{ borderColor: annotation.color || '#3B82F6' }}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', annotation.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
                                const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
                                handleAnnotationMove(annotation.id, x, y);
                              }}
                            >
                              <div className="text-xs text-gray-800 font-medium">{annotation.content}</div>
                              <div 
                                className="absolute -bottom-2 left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
                                style={{ borderTopColor: annotation.color || '#3B82F6' }}
                              ></div>
                            </div>
                          ) : annotation.type === 'highlight' ? (
                            <div 
                              className="border-2 rounded cursor-move"
            style={{
                                borderColor: annotation.color || '#EF4444',
                                backgroundColor: annotation.color ? `${annotation.color}20` : '#FEE2E2'
                              }}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', annotation.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
                                const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
                                handleAnnotationMove(annotation.id, x, y);
                              }}
                            >
                              <div className="text-xs text-gray-800 font-medium p-1">{annotation.content}</div>
        </div>
                          ) : null}
              </div>
                      ))}
              </div>
                    
                    {/* 图像点击添加编辑元素 */}
                    {expandedData.selectedTool && (
                      <div 
                        className="absolute inset-0 pointer-events-auto cursor-crosshair"
                        onClick={handleImageClick}
                        title="点击添加编辑元素"
                      />
                    )}

                    {/* 快捷编辑工具 - 放在图像右上角 */}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-2">
                      <div className="space-y-2">
                        {/* 对话框工具 */}
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'].map((color) => (
                              <button
                                key={color}
                                onClick={() => setExpandedData(prev => ({ ...prev, selectedTool: 'bubble', selectedColor: color }))}
                                className={`w-3 h-3 rounded-full border border-white shadow-sm transition-all ${
                                  expandedData.selectedTool === 'bubble' && expandedData.selectedColor === color ? 'ring-2 ring-blue-500' : ''
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <button
                            onClick={() => setExpandedData(prev => ({ ...prev, selectedTool: 'bubble', selectedColor: expandedData.selectedColor || '#3B82F6' }))}
                            className={`px-2 py-1 text-xs rounded border transition-all ${
                              expandedData.selectedTool === 'bubble' 
                                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {expandedData.selectedTool === 'bubble' ? '已选择' : '对话框'}
                          </button>
                        </div>

                        {/* 高亮框工具 */}
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            {['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'].map((color) => (
                              <button
                                key={color}
                                onClick={() => setExpandedData(prev => ({ ...prev, selectedTool: 'highlight', selectedColor: color }))}
                                className={`w-3 h-3 rounded-full border border-white shadow-sm transition-all ${
                                  expandedData.selectedTool === 'highlight' && expandedData.selectedColor === color ? 'ring-2 ring-blue-500' : ''
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <button
                            onClick={() => setExpandedData(prev => ({ ...prev, selectedTool: 'highlight', selectedColor: expandedData.selectedColor || '#EF4444' }))}
                            className={`px-2 py-1 text-xs rounded border transition-all ${
                              expandedData.selectedTool === 'highlight' 
                                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {expandedData.selectedTool === 'highlight' ? '已选择' : '高亮框'}
                          </button>
          </div>
          
                        {/* 分隔线 */}
                        <div className="border-t border-gray-200 pt-2">
                          {/* 注释管理工具 */}
                          <div className="flex items-center space-x-2">
            <button
                              onClick={handleClearAllAnnotations}
                              className="px-2 py-1 text-xs bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 transition-colors"
                              title="清除所有注释"
            >
                              清除
            </button>
            <button
                              onClick={handleExportAnnotations}
                              className="px-2 py-1 text-xs bg-green-50 border border-green-200 text-green-600 rounded hover:bg-green-100 transition-colors"
                              title="导出注释"
                            >
                              导出
                            </button>
                            <button
                              onClick={handleImportAnnotations}
                              className="px-2 py-1 text-xs bg-blue-50 border border-blue-200 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                              title="导入注释"
                            >
                              导入
            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="w-16 h-16 mx-auto mb-3 text-gray-300">🖼️</div>
                      <p className="text-lg font-medium">未生成图像</p>
                      <p className="text-sm">点击左侧"生成图像"按钮</p>
                    </div>
                  </div>
                )}
          </div>
        </div>
      </div>

          {/* 故事脚本区 */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Edit3 className="w-4 h-4 mr-2 text-indigo-500" />
                故事脚本
              </h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveScript}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={handleResetScript}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                >
                  重置
                </button>
              </div>
            </div>
            <textarea
              data-no-drag
              value={expandedData.script}
              onChange={handleScriptChange}
              placeholder="在此处编辑完整的故事脚本..."
              className="w-full p-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={8}
            />
          </div>
          </div>

        {/* 右侧参考区域 */}
        <div className="w-64 border-l border-gray-200 flex flex-col">
          {/* 构图模板选择 */}
          <div className="p-4 border-b border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-green-500" />
              构图参考
            </h5>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'close', name: '近景', icon: '🔍', color: 'bg-blue-50 border-blue-200' },
                { id: 'medium', name: '中景', icon: '📷', color: 'bg-green-50 border-green-200' },
                { id: 'wide', name: '远景', icon: '🏞️', color: 'bg-purple-50 border-purple-200' },
                { id: 'bird', name: '鸟瞰', icon: '🦅', color: 'bg-orange-50 border-orange-200' },
                { id: 'partial', name: '局部', icon: '🔬', color: 'bg-red-50 border-red-200' },
                { id: 'macro', name: '特写', icon: '📱', color: 'bg-indigo-50 border-indigo-200' }
              ].map((template) => (
            <button
                  key={template.id}
                  onClick={() => handleCompositionChange(template.id)}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    expandedData.visualElements.composition === template.id
                      ? 'bg-blue-100 border-blue-300 shadow-md scale-105'
                      : `${template.color} hover:shadow-sm`
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">{template.icon}</div>
                    <div className="text-xs font-medium text-gray-700">{template.name}</div>
                  </div>
            </button>
              ))}
          </div>
        </div>

          {/* 视觉风格选择 */}
          <div className="p-4 border-b border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Image className="w-4 h-4 mr-2 text-pink-500" />
              视觉参考
            </h5>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'style1', name: '动漫风格', image: 'https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style1.png' },
                { id: 'style2', name: '写实风格', image: 'https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style2.png' },
                { id: 'style3', name: '水彩风格', image: 'https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style3.png' },
                { id: 'style4', name: '插画风格', image: 'https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style4.png' }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  className={`relative p-2 rounded-lg border transition-all duration-200 ${
                    expandedData.visualElements.style === style.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full aspect-square rounded overflow-hidden mb-1">
                    <img
                      src={style.image}
                      alt={style.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzMEg3MFY3MEgzMFYzMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTM1IDM1SDY1VjY1SDM1VjM1WiIgZmlsbD0iI0M3Q0FEMiIvPgo8L3N2Zz4K';
                      }}
                    />
      </div>
                  <div className="text-xs font-medium text-gray-700 text-center">{style.name}</div>
                  {expandedData.visualElements.style === style.id && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 根据当前状态渲染节点内容
  const renderNodeContent = () => {
    switch (nodeState) {
      case NODE_STATES.EXPANDED:
        return renderExpandedCard();
      case NODE_STATES.COLLAPSED:
      default:
        return renderCollapsedCard();
    }
  };

  // 渲染节点
  const renderNode = () => {
    // 计算动态z-index：被选中的节点和展开状态的节点应该有更高的层级
    const getDynamicZIndex = () => {
      if (selected) {
        return 1000; // 被选中的节点最高层级
      } else if (nodeState !== NODE_STATES.COLLAPSED) {
        return 500; // 展开状态的节点次高层级
      } else {
        return 1; // 普通折叠状态节点基础层级
      }
    };

    return (
      <>
        <div className="flex items-start">
          <motion.div
            ref={nodeRef}
            className={`
              bg-white rounded-[20px]
              ${selected ? 'ring-2 ring-blue-500' : ''}
              shadow-[0_4px_12px_rgba(0,0,0,0.1)]
              relative
            `}
            style={{
              width: nodeState === NODE_STATES.COLLAPSED ? NODE_WIDTH.COLLAPSED + 'px' : NODE_WIDTH.FULL_EXPANDED + 'px',
              transformOrigin: 'center center',
              zIndex: getDynamicZIndex(), // 动态设置z-index
            }}
            animate={controls}
            layout="position"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.3
            }}
            data-state={nodeState}
            data-expanded={nodeState !== NODE_STATES.COLLAPSED ? 'true' : 'false'}
            data-node-id={data.id}
            data-node-index={data.nodeIndex || 0}
            data-node-width={nodeState === NODE_STATES.COLLAPSED ? NODE_WIDTH.COLLAPSED : NODE_WIDTH.FULL_EXPANDED}
            data-node-height={nodeState === NODE_STATES.COLLAPSED ? 100 : 400}
          >
            {/* 选中状态或展开状态时显示左右移动按钮 */}
            {((selected || nodeState !== NODE_STATES.COLLAPSED) && data.onMoveNode) && (
              <MoveNodeButtons
                onMoveLeft={e => { e.stopPropagation(); data.onMoveNode(data.id, 'left'); }}
                onMoveRight={e => { e.stopPropagation(); data.onMoveNode(data.id, 'right'); }}
                zIndex={getDynamicZIndex() + 20} // 确保移动按钮在节点之上
              />
            )}
            
            {/* 节点内容 */}
            {renderNodeContent()}
          </motion.div>

          {/* 显示右侧小面板 */}
          {showFloatingPanel && (
            <FloatingButtons
              nodeId={data.id}
              onAddFrame={() => {
                if (data.onAddFrame) {
                  data.onAddFrame(data.id);
                }
              }}
              onExploreScene={() => {
                if (data.onExploreScene) {
                  data.onExploreScene(data.id);
                }
              }}
              onExpandNode={handleExpandNode}
              onDeleteFrame={() => {
                if (data.onDeleteFrame) {
                  data.onDeleteFrame(data.id);
                }
              }}
              isVisible={true}
              style={{
                zIndex: getDynamicZIndex() + 10 // 确保面板在节点之上
              }}
            />
          )}
        </div>
        
        <AnimatePresence>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              style={{
                position: 'absolute',
                left: `${toastPositionRef.current.x}px`,
                top: `${toastPositionRef.current.y}px`,
                transform: 'translateX(-50%)',
                zIndex: 9999
              }}
            >
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => removeToast(toast.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </>
    );
  };



  return renderNode();
};

export default memo(StoryNode); 