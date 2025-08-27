import React, { memo, useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, RefreshCw, Edit2, X, ChevronDown, ChevronUp, Loader2, ChevronLeft, ChevronRight, Zap, Film, Settings, Image, Check, Trash2, Edit3, Highlighter } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import testImage from '../images/test.png';
import FalAI from '../services/falai';
import { falConfig } from '../config';
import YoudaoTranslate from '../services/youdaoTranslate';
import { getBubbleStyle } from '../utils/bubbleStyles';
import { generateVisualPrompt } from '../services/visualPromptService';

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
  EXPANDED: 'expanded', // 新增展开态
  COLLAPSED_WITH_IMAGE: 'collapsedWithImage' // 新增：带有图像的折叠状态
};

// 节点宽度常量
const NODE_WIDTH = {
  COLLAPSED: 240,
  COLLAPSED_WITH_IMAGE: 320, // 带有图像的折叠状态需要更宽
  EXPANDED: 360,
  FULL_EXPANDED: 1200 // 调整为横向布局的宽度
};

const StoryNode = ({ data, selected }) => {
  // 基本状态
  const [nodeState, setNodeState] = useState(data.image ? NODE_STATES.COLLAPSED_WITH_IMAGE : NODE_STATES.COLLAPSED);
  const [nodeText, setNodeText] = useState(data.text || '');
  const [visualPrompt, setVisualPrompt] = useState(data.imagePrompt || '');
  const [regeneratePrompt, setRegeneratePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  
  // 画面编辑状态
  const [editPrompt, setEditPrompt] = useState(''); // 画面编辑提示词
  const [isEditingImage, setIsEditingImage] = useState(false); // 是否正在编辑画面
  
  // 图像历史记录状态
  const [imageHistory, setImageHistory] = useState(data.imageHistory || []); // 图像历史记录
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // 当前显示的图像索引
  
  // 展开态数据
  const [expandedData, setExpandedData] = useState({
    script: data.text || '',
    visualElements: {
      bubbles: [],
      composition: 'medium',
      style: 'sketch'
    },
    prompt: data.imagePrompt || ''
  });
  
  // 对话框相关状态
  const [dialogMode, setDialogMode] = useState(false); // 是否处于添加对话框模式
  const [dialogs, setDialogs] = useState(data.dialogs || []); // 对话框列表
  const [editingDialogId, setEditingDialogId] = useState(null); // 正在编辑的对话框ID
  
  // refs
  const textAreaRef = useRef(null);
  const promptTextAreaRef = useRef(null);
  const toastPositionRef = useRef({ x: 0, y: 0 });
  const nodeRef = useRef(null);
  const prevNodeStateRef = useRef(nodeState);
  const bubbleRefs = useRef({}); // 添加气泡refs用于获取宽度

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
    console.log('🔧 StoryNode init useEffect triggered:', { nodeId: data.id, hasImage: !!data.image, currentState: nodeState });
    controls.start({ opacity: 1, scale: 1 });
    setNodeText(data.text || '');
    setVisualPrompt(data.imagePrompt || '');
    
    // 同步展开态数据中的提示词
    setExpandedData(prev => ({
      ...prev,
      prompt: data.imagePrompt || ''
    }));
    
    // 同步对话框数据
    if (data.dialogs) {
      setDialogs(data.dialogs);
    }
    
    // 初始化图像历史记录
    if (data.imageHistory && data.imageHistory.length > 0) {
      setImageHistory(data.imageHistory);
      // 找到当前图像在历史记录中的位置
      const currentIndex = data.imageHistory.findIndex(img => img.url === data.image);
      setCurrentImageIndex(currentIndex >= 0 ? currentIndex : 0);
    } else if (data.image) {
      // 如果只有当前图像，创建初始历史记录
      const initialHistory = [{
        id: `img_${Date.now()}`,
        url: data.image,
        prompt: data.imagePrompt || '',
        timestamp: new Date().toISOString(),
        type: 'generated'
      }];
      setImageHistory(initialHistory);
      setCurrentImageIndex(0);
    }
    
    // 如果节点已有图像，且当前是普通折叠状态，则设置为带有图像的折叠状态
    if (data.image && (nodeState === NODE_STATES.COLLAPSED)) {
      console.log('🖼️ 设置为带有图像的折叠状态');
      setNodeState(NODE_STATES.COLLAPSED_WITH_IMAGE);
    }
    // 如果节点没有图像，且当前是带有图像的折叠状态，则设置为普通折叠状态
    else if (!data.image && (nodeState === NODE_STATES.COLLAPSED_WITH_IMAGE)) {
      console.log('📝 设置为普通折叠状态');
      setNodeState(NODE_STATES.COLLAPSED);
    }
  }, [data.id, data.image, data.text, data.imagePrompt, data.dialogs, data.imageHistory]);

  // 控制小面板显示：选中节点显示
  useEffect(() => {
    setShowFloatingPanel(!!selected);
  }, [selected]);

  // 监听气泡宽度变化，更新滑块宽度
  const [bubbleWidths, setBubbleWidths] = useState({});
  
  useEffect(() => {
    const updateBubbleWidths = () => {
      const newWidths = {};
      Object.keys(bubbleRefs.current).forEach(key => {
        if (bubbleRefs.current[key]) {
          newWidths[key] = bubbleRefs.current[key].offsetWidth;
        }
      });
      setBubbleWidths(newWidths);
    };

    // 初始更新
    updateBubbleWidths();
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateBubbleWidths);
    
    return () => {
      window.removeEventListener('resize', updateBubbleWidths);
    };
  }, [expandedData.visualElements.bubbles]);

  // 在气泡内容变化后更新宽度
  useEffect(() => {
    const timer = setTimeout(() => {
      const updateBubbleWidths = () => {
        const newWidths = {};
        Object.keys(bubbleRefs.current).forEach(key => {
          if (bubbleRefs.current[key]) {
            newWidths[key] = bubbleRefs.current[key].offsetWidth;
          }
        });
        setBubbleWidths(newWidths);
      };
      updateBubbleWidths();
    }, 100); // 延迟100ms确保DOM更新完成
    
    return () => clearTimeout(timer);
  }, [expandedData.visualElements.bubbles.map(b => b.text)]);

  // 同步面板显示状态和对话框数据到节点数据 - 使用防抖优化
  useEffect(() => {
    try {
      if (data.onUpdateNode && data.id) {
        // 使用防抖机制，避免频繁同步
        const syncTimeout = setTimeout(() => {
          // 只在数据真正发生变化时才同步，避免不必要的更新
          const currentData = {
            showFloatingPanel,
            dialogs: dialogs,
            imageHistory: imageHistory
          };
          
          // 检查是否有实际变化
          const hasChanges = 
            data.showFloatingPanel !== showFloatingPanel ||
            JSON.stringify(data.dialogs) !== JSON.stringify(dialogs) ||
            JSON.stringify(data.imageHistory) !== JSON.stringify(imageHistory);
          
          if (hasChanges) {
            data.onUpdateNode(data.id, currentData);
          }
        }, 500); // 500ms 防抖延迟
        
        return () => clearTimeout(syncTimeout);
      }
    } catch (e) {}
  }, [showFloatingPanel, dialogs, imageHistory, data]);

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
      
      // 同步到父组件模型，触发布局（父层 updateNode 已内置智能重排）
      if (typeof data.onUpdateNode === 'function') {
        data.onUpdateNode(data.id, { showFloatingPanel: true });
      }
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
      
      // 计算是否为展开状态
      const isExpanded = newState === NODE_STATES.EXPANDED || 
                        newState === NODE_STATES.EDITING || 
                        newState === NODE_STATES.GENERATING ||
                        newState === NODE_STATES.IMAGE_EDITING;
      
      // 先同步父层模型中的节点状态，避免布局时读取到旧状态
      if (typeof data.onUpdateNode === 'function') {
        data.onUpdateNode(data.id, { state: newState });
      }
      
      // 下一事件循环再触发布局，确保状态已写入模型
      if (typeof data.onNodeStateChange === 'function') {
        setTimeout(() => data.onNodeStateChange(newState, isExpanded), 0);
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
    
    // 只更新本地状态，不立即同步到父组件，避免输入中断
    setVisualPrompt(newPrompt);
    
    // 延迟同步到父组件，给用户足够时间输入
    if (handlePromptChange.timeout) {
      clearTimeout(handlePromptChange.timeout);
    }
    
    handlePromptChange.timeout = setTimeout(() => {
      // 更新展开态数据
      setExpandedData(prev => ({
        ...prev,
        prompt: newPrompt
      }));
      
      // 同步到父组件
      if (data.onUpdateNode) {
        data.onUpdateNode(data.id, { imagePrompt: newPrompt });
      }
    }, 2000); // 增加到2秒，给用户更充足的输入时间
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
    
    // 先同步父层模型中的节点状态
    if (typeof data.onUpdateNode === 'function') {
      data.onUpdateNode(data.id, { state: NODE_STATES.EXPANDED });
    }
    
    // 通知父组件状态变化（延后一拍，避免读取旧状态）
    if (typeof data.onNodeStateChange === 'function') {
      setTimeout(() => data.onNodeStateChange(NODE_STATES.EXPANDED, true), 0);
    }
    
    // 同步展开态数据
    setExpandedData({
      script: data.text || '',
      visualElements: {
        bubbles: [],
        composition: [],
        style: 'sketch'
      },
      prompt: data.imagePrompt || ''
    });
  };

  // 收起节点函数
  const handleCollapseNode = () => {
    console.log('收起节点:', data.id, '当前图像状态:', !!data.image);
    
    // 根据是否有图像决定使用哪个折叠状态
    if (data.image) {
      console.log('🖼️ 收起为带有图像的折叠状态');
      setNodeState(NODE_STATES.COLLAPSED_WITH_IMAGE);
      
      // 先同步父层模型中的节点状态
      if (typeof data.onUpdateNode === 'function') {
        data.onUpdateNode(data.id, { state: NODE_STATES.COLLAPSED_WITH_IMAGE });
      }
      
      // 通知父组件状态变化（延后一拍，避免读取旧状态）
      if (typeof data.onNodeStateChange === 'function') {
        setTimeout(() => data.onNodeStateChange(NODE_STATES.COLLAPSED_WITH_IMAGE, false), 0);
      }
    } else {
      console.log('📝 收起为普通折叠状态');
      setNodeState(NODE_STATES.COLLAPSED);
      
      // 先同步父层模型中的节点状态
      if (typeof data.onUpdateNode === 'function') {
        data.onUpdateNode(data.id, { state: NODE_STATES.COLLAPSED });
      }
      
      // 通知父组件状态变化（延后一拍，避免读取旧状态）
      if (typeof data.onNodeStateChange === 'function') {
        setTimeout(() => data.onNodeStateChange(NODE_STATES.COLLAPSED, false), 0);
      }
    }
  };

  // 完成并收起函数
  const handleCompleteAndCollapse = () => {
    console.log('完成并收起节点:', data.id, '当前图像状态:', !!data.image);
    
    // 根据是否有图像决定使用哪个折叠状态
    if (data.image) {
      console.log('🖼️ 完成并收起为带有图像的折叠状态');
      setNodeState(NODE_STATES.COLLAPSED_WITH_IMAGE);
      
      // 先同步父层模型中的节点状态
      if (typeof data.onUpdateNode === 'function') {
        data.onUpdateNode(data.id, { state: NODE_STATES.COLLAPSED_WITH_IMAGE });
      }
      
      // 通知父组件状态变化（延后一拍，避免读取旧状态）
      if (typeof data.onNodeStateChange === 'function') {
        setTimeout(() => data.onNodeStateChange(NODE_STATES.COLLAPSED_WITH_IMAGE, false), 0);
      }
    } else {
      console.log('📝 完成并收起为普通折叠状态');
      setNodeState(NODE_STATES.COLLAPSED);
      
      // 先同步父层模型中的节点状态
      if (typeof data.onUpdateNode === 'function') {
        data.onUpdateNode(data.id, { state: NODE_STATES.COLLAPSED });
      }
      
      // 通知父组件状态变化（延后一拍，避免读取旧状态）
      if (typeof data.onNodeStateChange === 'function') {
        setTimeout(() => data.onNodeStateChange(NODE_STATES.COLLAPSED, false), 0);
      }
    }
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



  // 重置提示词函数
  const handleResetPrompt = () => {
    setExpandedData(prev => ({
      ...prev,
      prompt: data.imagePrompt || ''
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
      bubbleType: 'default',
      originalColor: expandedData.selectedColor || 'blue', // 使用颜色名称
      weight: 0.5, // 默认权重 - 对应medium重要性
      importance: 'medium', // 默认重要性
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

  // 修改气泡权重函数 - 转换为importance格式
  const handleBubbleWeightChange = (bubbleIdOrIndex, weight) => {
    // 将权重值转换为importance格式
    let importance = 'medium';
    if (weight <= 0.25) {
      importance = 'low';
    } else if (weight >= 0.75) {
      importance = 'high';
    }
    
    setExpandedData(prev => ({
      ...prev,
      visualElements: {
        ...prev.visualElements,
        bubbles: prev.visualElements.bubbles.map((bubble, index) => {
          // 支持通过ID或索引修改
          if (typeof bubbleIdOrIndex === 'number') {
            return index === bubbleIdOrIndex ? { ...bubble, weight, importance } : bubble;
        } else {
            return bubble.id === bubbleIdOrIndex ? { ...bubble, weight, importance } : bubble;
          }
        })
      }
    }));
  };

  // 对话框相关函数
  const toggleDialogMode = () => {
    setDialogMode(!dialogMode);
  };

  const addDialog = (x, y) => {
    if (!dialogMode) return;
    
    const newDialog = {
      id: `dialog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: x,
      y: y,
      text: '点击输入对话内容...',
      width: 120, // 默认宽度
      height: 60, // 默认高度
      isEditing: true
    };
    
    setDialogs(prev => [...prev, newDialog]);
    setEditingDialogId(newDialog.id);
    setDialogMode(false); // 添加后自动退出对话框模式
  };

  const updateDialogPosition = (dialogId, newX, newY) => {
    setDialogs(prev => prev.map(dialog => 
      dialog.id === dialogId ? { ...dialog, x: newX, y: newY } : dialog
    ));
  };

  const updateDialogText = (dialogId, newText) => {
    setDialogs(prev => prev.map(dialog => 
      dialog.id === dialogId ? { ...dialog, text: newText } : dialog
    ));
  };

  const updateDialogHeight = (dialogId, newHeight) => {
    setDialogs(prev => prev.map(dialog => 
      dialog.id === dialogId ? { ...dialog, height: newHeight } : dialog
    ));
  };

  const toggleDialogEdit = (dialogId) => {
    setDialogs(prev => {
      const updatedDialogs = prev.map(dialog => 
        dialog.id === dialogId ? { ...dialog, isEditing: !dialog.isEditing } : dialog
      );
      
      // 找到当前对话框的状态
      const currentDialog = updatedDialogs.find(d => d.id === dialogId);
      setEditingDialogId(currentDialog && currentDialog.isEditing ? null : dialogId);
      
      return updatedDialogs;
    });
  };

  const deleteDialog = (dialogId) => {
    setDialogs(prev => prev.filter(dialog => dialog.id !== dialogId));
  };

  // 图像切换函数
  const switchToPreviousImage = () => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      const previousImage = imageHistory[newIndex];
      
      setCurrentImageIndex(newIndex);
      
      // 更新当前显示的图像
      if (data.onUpdateNode) {
        data.onUpdateNode(data.id, { image: previousImage.url });
      }
      
      // 更新本地状态
      data.image = previousImage.url;
      
      addToast(`切换到上一张图像 (${newIndex + 1}/${imageHistory.length})`, 'success');
    }
  };

  const switchToNextImage = () => {
    if (currentImageIndex < imageHistory.length - 1) {
      const newIndex = currentImageIndex + 1;
      const nextImage = imageHistory[newIndex];
      
      setCurrentImageIndex(newIndex);
      
      // 更新当前显示的图像
      if (data.onUpdateNode) {
        data.onUpdateNode(data.id, { image: nextImage.url });
      }
      
      // 更新本地状态
      data.image = nextImage.url;
      
      addToast(`切换到下一张图像 (${newIndex + 1}/${imageHistory.length})`, 'success');
    }
  };

  // 画面编辑函数
  const handleEditImage = async () => {
    if (!editPrompt.trim()) {
      return;
    }

    if (!data.image) {
      return;
    }

    setIsEditingImage(true);
    const startTime = new Date();
    
    try {
      // 翻译编辑提示词
      const translatedEditPrompt = await YoudaoTranslate.zhToEn(editPrompt);
      console.log('🌐 画面编辑提示词翻译结果:', translatedEditPrompt);

      // 构建编辑请求参数
      const editParams = {
        image_url: data.image,
        prompt: translatedEditPrompt,
        strength: 0.7, // 编辑强度
        guidance_scale: 7.5,
        num_inference_steps: 30,
        seed: Math.floor(Math.random() * 1000000)
      };

      console.log('🎨 开始画面编辑，参数:', editParams);
      
      // 调用图像编辑服务
      const result = await FalAI.editImage(editParams);
      console.log('✅ 画面编辑完成:', result);

      if (result && result.data && result.data.images && result.data.images.length > 0) {
        const endTime = new Date();
        const timeTaken = calculateTime(startTime, endTime);
        
        const editedImageUrl = result.data.images[0].url;
        
        // 创建编辑后的图像记录
        const editedImageRecord = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: editedImageUrl,
          prompt: editPrompt,
          timestamp: new Date().toISOString(),
          type: 'edited',
          originalPrompt: editPrompt,
          translatedPrompt: translatedEditPrompt,
          timeTaken: timeTaken
        };
        
        // 更新图像历史记录
        const updatedHistory = [...imageHistory, editedImageRecord];
        setImageHistory(updatedHistory);
        setCurrentImageIndex(updatedHistory.length - 1); // 设置为最新图像的索引
        
        // 更新节点数据到父组件
        if (data.onUpdateNode) {
          data.onUpdateNode(data.id, { 
            image: editedImageUrl,
            imageHistory: updatedHistory
          });
        }
        
        // 更新本地状态
        data.image = editedImageUrl;
        data.editHistory = data.editHistory || [];
        data.editHistory.push({
          originalPrompt: editPrompt,
          translatedPrompt: translatedEditPrompt,
          timestamp: new Date().toISOString(),
          timeTaken: timeTaken
        });
        
        // 清空编辑提示词
        setEditPrompt('');
        
        console.log('🎨 图像编辑完成，已添加到历史记录');
      } else {
        throw new Error('编辑结果为空');
      }
    } catch (error) {
      console.error('❌ 画面编辑失败:', error);
    } finally {
      setIsEditingImage(false);
    }
  };

  // 生成图像函数
  const handleGenerateImage = async () => {
    try {
      console.log('🎨 开始生成图像...');
      
      // 检查是否有视觉提示词
      if (!visualPrompt || visualPrompt.trim() === '') {
        addToast('请先输入视觉提示词', 'error');
        return;
      }
      
      // 设置生成状态
      setNodeState(NODE_STATES.GENERATING);
      setIsGenerating(true);
      
      console.log('📝 使用的视觉提示词:', visualPrompt);
      
      // 调用FalAI服务生成图像
      const result = await FalAI.generateTextToImage(visualPrompt);
      
      console.log('✅ 图像生成成功:', result);
      
      if (result && result.data && result.data.images && result.data.images.length > 0) {
        const generatedImageUrl = result.data.images[0];
        
        // 创建新的图像记录
        const newImageRecord = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: generatedImageUrl,
          prompt: visualPrompt,
          timestamp: new Date().toISOString(),
          type: 'generated'
        };
        
        // 更新图像历史记录
        const updatedHistory = [...imageHistory, newImageRecord];
        setImageHistory(updatedHistory);
        setCurrentImageIndex(updatedHistory.length - 1); // 设置为最新图像的索引
        
        // 更新节点数据，保存生成的图像和历史记录
        if (data.onUpdateNode) {
          data.onUpdateNode(data.id, { 
            image: generatedImageUrl,
            imageHistory: updatedHistory
          });
        }
        
        // 更新本地状态 - 生成成功后保持在展开状态，显示生成的图像
        setNodeState(NODE_STATES.EXPANDED);
        setIsGenerating(false);
        
        // 确保父组件知道节点状态变化
        if (data.onStateChange) {
          data.onStateChange(data.id, NODE_STATES.EXPANDED, true);
        }
        
        console.log('🖼️ 图像已保存到节点:', generatedImageUrl);
        console.log('📚 图像历史记录已更新，当前索引:', updatedHistory.length - 1);
      } else {
        throw new Error('API返回结果中没有图像URL');
      }
      
    } catch (error) {
      console.error('❌ 图像生成失败:', error);
      addToast('图像生成失败，请重试', 'error');
      
      // 生成失败时回到展开状态，不折叠
      setNodeState(NODE_STATES.EXPANDED);
      setIsGenerating(false);
    }
  };

  // 生成画面提示词函数
  const handleGenerateVisualPrompt = async () => {
    try {
      console.log('🎨 开始生成画面提示词...');
      
      // 设置按钮loading状态
      setExpandedData(prev => ({
        ...prev,
        isGeneratingPrompt: true
      }));
      
      // 获取分支上下文 - 如果data.branchContext为空，尝试从父组件获取
      let branchContext = data.branchContext;
      if (!branchContext && data.branchId && window.getBranchContext) {
        branchContext = window.getBranchContext(data.branchId, data.id);
      }
      
      console.log('🔍 分支上下文获取结果:', {
        fromData: data.branchContext,
        fromFunction: branchContext,
        final: branchContext || data.branchContext || ''
      });
      
      // 收集所需的数据
      const visualPromptData = {
        branchContext: branchContext || data.branchContext || '', // 分支上下文
        currentFrameStory: data.text || '', // 当前分镜故事脚本
        initialVisualPrompt: visualPrompt || '', // 用户输入的初始视觉提示词
        compositionReference: expandedData.visualElements.composition || 'medium', // 用户选择的构图参考
        keywordBubbles: (() => {
          // 将气泡转换为后端期望的格式
          const bubbleMappings = expandedData.visualElements.bubbles.map(bubble => {
            const bubbleType = bubble.type || bubble.bubbleType || 'default';
            let dimension = 'context'; // 默认维度
            
            // 根据气泡类型映射到对应的维度
            switch (bubbleType) {
              case 'user_traits':
                dimension = 'persona';
                break;
              case 'elements':
                dimension = 'context';
                break;
              case 'goals':
                dimension = 'goal';
                break;
              case 'pain_points':
                dimension = 'pain';
                break;
              case 'emotions':
                dimension = 'emotion';
                break;
              case 'character':
                dimension = 'persona';
                break;
              case 'scene':
                dimension = 'context';
                break;
              case 'action':
                dimension = 'goal';
                break;
              case 'style':
                dimension = 'context';
                break;
              default:
                dimension = 'context'; // 默认归类到情境
            }
            
            // 根据权重值确定重要性
            let importance = 'medium';
            if (bubble.weight !== undefined) {
              if (bubble.weight <= 0.333) {
                importance = 'low';
              } else if (bubble.weight >= 0.666) {
                importance = 'high';
              } else {
                importance = 'medium';
              }
            } else if (bubble.importance) {
              importance = bubble.importance;
            }
            
            return {
              type: dimension,
              keyword: bubble.text || '',
              importance: importance,
              weight: bubble.weight || 0.5 // 保留原始权重用于排序
            };
          }).filter(bubble => bubble.keyword.trim() !== ''); // 过滤空关键词
          
          // 按维度分组，合并同一维度的多个关键词
          const dimensionGroups = {};
          bubbleMappings.forEach(bubble => {
            if (!dimensionGroups[bubble.type]) {
              dimensionGroups[bubble.type] = [];
            }
            dimensionGroups[bubble.type].push(bubble);
          });
          
          // 处理每个维度组，合并关键词并按重要性排序
          const processedBubbles = Object.entries(dimensionGroups).map(([dimension, bubbles]) => {
            // 按重要性排序：high > medium > low，同重要性按权重排序
            const sortedBubbles = bubbles.sort((a, b) => {
              const importanceOrder = { high: 3, medium: 2, low: 1 };
              const aOrder = importanceOrder[a.importance] || 0;
              const bOrder = importanceOrder[b.importance] || 0;
              
              if (aOrder !== bOrder) {
                return bOrder - aOrder; // 重要性降序
              }
              
              // 同重要性按权重降序
              return (b.weight || 0) - (a.weight || 0);
            });
            
            // 如果同一维度有多个关键词，合并处理
            if (sortedBubbles.length === 1) {
              // 单个关键词，直接返回
              const { type, keyword, importance } = sortedBubbles[0];
              return { type, keyword, importance };
            } else {
              // 多个关键词，合并为逗号分隔的字符串
              const keywords = sortedBubbles.map(b => b.keyword).join('、');
              // 取最高重要性
              const maxImportance = sortedBubbles[0].importance;
              
              console.log(`🔗 合并维度 ${dimension} 的多个关键词:`, {
                original: sortedBubbles.map(b => ({ keyword: b.keyword, importance: b.importance, weight: b.weight })),
                merged: { type: dimension, keyword: keywords, importance: maxImportance }
              });
              
              return {
                type: dimension,
                keyword: keywords,
                importance: maxImportance
              };
            }
          });
          
          console.log('📊 气泡数据处理结果:', {
            original: bubbleMappings.length,
            processed: processedBubbles.length,
            dimensionGroups: Object.keys(dimensionGroups),
            processedBubbles
          });
          
          return processedBubbles;
        })()
      };
      
      console.log('📤 准备发送的画面提示词数据:', visualPromptData);
      
      // 调用画面提示词生成服务
      const result = await generateVisualPrompt(visualPromptData);
      
      console.log('✅ 画面提示词生成成功:', result);
      
      // 如果成功生成了提示词，更新到视觉提示词区域
      if (result.scene_visual_prompt) {
        setExpandedData(prev => ({
          ...prev,
          prompt: result.scene_visual_prompt,
          isGeneratingPrompt: false // 清除loading状态
        }));
        
        // 同步到折叠状态的提示词
        setVisualPrompt(result.scene_visual_prompt);
        
        // 更新节点数据
        if (data.onUpdateNode) {
          data.onUpdateNode(data.id, { imagePrompt: result.scene_visual_prompt });
        }
        
        // 成功生成，无需提示
      } else {
        // 清除loading状态
        setExpandedData(prev => ({
          ...prev,
          isGeneratingPrompt: false
        }));
      }
      
    } catch (error) {
      console.error('❌ 画面提示词生成失败:', error);
      // 清除loading状态
      setExpandedData(prev => ({
        ...prev,
        isGeneratingPrompt: false
      }));
              // 移除错误提示
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

  // 渲染带有图像的折叠状态
  const renderCollapsedWithImageCard = () => (
    <div className="flex flex-col p-3 min-h-[120px] cursor-pointer" onClick={handleCardClick}>
      {/* 顶部标签和分支信息 */}
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
      
      {/* 图像展示区域 */}
      <div className="mb-3">
        <div 
          className="relative w-full" 
          style={{ aspectRatio: '16/9' }}
          onClick={(e) => {
            if (dialogMode && data.image) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              addDialog(x, y);
            }
          }}
        >
          {data.image ? (
            <>
              <img
                src={data.image}
                alt="生成的图像"
                className="w-full h-full object-cover rounded-lg shadow-sm border border-gray-200"
              />

              {/* 对话框按钮 - 仅在展开状态下显示，折叠状态下隐藏 */}

              {/* 在折叠状态下显示对话框（不可编辑，缩小显示） */}
              {dialogs.map((dialog) => (
                <div
                  key={dialog.id}
                  className="absolute cursor-default select-none"
                  style={{
                    left: `${dialog.x}px`,
                    top: `${dialog.y}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 100
                  }}
                >
                  <div 
                    className="bg-white border border-gray-300 rounded p-1.5 relative"
                    style={{
                      width: `${Math.max(40, Math.min(80, (dialog.width || 120) * 0.4))}px`,
                      height: `${Math.max(20, Math.min(40, (dialog.height || 60) * 0.4))}px`,
                      minWidth: '40px',
                      maxWidth: '80px',
                      minHeight: '20px',
                      maxHeight: '40px'
                    }}
                  >
                    <div className="text-xs text-gray-700 break-words h-full flex items-center leading-tight">
                      {dialog.text}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="w-8 h-8 mx-auto mb-1 text-gray-300">❌</div>
                <p className="text-xs">图像加载失败</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 故事脚本区域 */}
      <div className="flex-1">
        <textarea
          data-no-drag
          value={nodeText}
          readOnly={!selected}
          placeholder="点击此处添加分镜描述..."
          className={`w-full text-xs text-gray-800 resize-none border-none rounded-md p-2 flex-grow focus:outline-none overflow-hidden ${
            selected ? 'bg-white border border-blue-200' : 'bg-gray-50/50'
          }`}
          style={{ height: 'auto', minHeight: '40px' }}
          onChange={selected ? handleTextChange : undefined}
        />
      </div>
      

    </div>
  );

  // 渲染图像状态卡片
  const renderImageCard = () => (
    <div className="bg-white rounded-[20px] shadow-lg border border-gray-200 overflow-hidden" style={{ pointerEvents: 'auto' }}>
      {/* 顶部标题栏 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">🖼️</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">图像生成完成</h3>
              <p className="text-xs text-gray-600">基于视觉提示词生成的图像</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setNodeState(NODE_STATES.EXPANDED);
                // 通知父组件状态变化
                if (data.onNodeStateChange) {
                  data.onNodeStateChange(NODE_STATES.EXPANDED, true);
                }
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
            >
              <Edit2 className="w-4 h-4" />
              <span>继续编辑</span>
            </button>
            <button
              onClick={() => {
                setNodeState(NODE_STATES.COLLAPSED_WITH_IMAGE);
                // 通知父组件状态变化
                if (data.onNodeStateChange) {
                  data.onNodeStateChange(NODE_STATES.COLLAPSED_WITH_IMAGE, false);
                }
              }}
              className="w-full px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              完成
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex h-[600px]" style={{ pointerEvents: 'auto' }}>
        {/* 左侧控制面板 */}
        <div className="w-80 border-r border-gray-200 flex flex-col" style={{ pointerEvents: 'auto' }}>
          {/* 视觉提示词区域 */}
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-yellow-500" />
              使用的提示词
            </h4>
            <div className="p-3 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
              {expandedData.prompt || '无提示词'}
            </div>
          </div>

          {/* 操作按钮区域 */}
          <div className="p-4 space-y-3">
            <button
              onClick={() => setNodeState(NODE_STATES.EXPANDED)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
            >
              <Edit2 className="w-4 h-4" />
              <span>继续编辑</span>
            </button>
            
            <button
              onClick={handleGenerateImage}
              className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新生成</span>
            </button>
            
            <button
              onClick={() => {
                setNodeState(NODE_STATES.COLLAPSED_WITH_IMAGE);
                // 通知父组件状态变化
                if (data.onNodeStateChange) {
                  data.onNodeStateChange(NODE_STATES.COLLAPSED_WITH_IMAGE, false);
                }
              }}
              className="w-full px-4 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              完成
            </button>
          </div>
        </div>

        {/* 中间图像展示区 */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                {data.image ? (
                  <div className="w-full h-full">
                    <img
                      src={data.image}
                      alt="生成的图像"
                      className="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                    
                    {/* 图像切换箭头 - 仅在有多张图像时显示 */}
                    {imageHistory.length > 1 && (
                      <div className="absolute top-1/2 left-0 right-0 flex justify-between items-center px-2 transform -translate-y-1/2">
                        {/* 上一张图像箭头 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            switchToPreviousImage();
                          }}
                          disabled={currentImageIndex <= 0}
                          className={`w-10 h-10 rounded-full bg-white/90 border border-gray-300 shadow-lg flex items-center justify-center transition-all duration-200 ${
                            currentImageIndex <= 0
                              ? 'text-gray-300 cursor-not-allowed opacity-50'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-white hover:border-gray-400'
                          }`}
                          title={`上一张图像 (${currentImageIndex + 1}/${imageHistory.length})`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        {/* 下一张图像箭头 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            switchToNextImage();
                          }}
                          disabled={currentImageIndex >= imageHistory.length - 1}
                          className={`w-10 h-10 rounded-full bg-white/90 border border-gray-300 shadow-lg flex items-center justify-center transition-all duration-200 ${
                            currentImageIndex >= imageHistory.length - 1
                              ? 'text-gray-300 cursor-not-allowed opacity-50'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-white hover:border-gray-400'
                          }`}
                          title={`下一张图像 (${currentImageIndex + 1}/${imageHistory.length})`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    {/* 图像计数器 - 显示当前图像位置 */}
                    {imageHistory.length > 1 && (
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {currentImageIndex + 1} / {imageHistory.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="w-16 h-16 mx-auto mb-3 text-gray-300">❌</div>
                      <p className="text-lg font-medium">图像加载失败</p>
                      <p className="text-sm">请检查图像URL或重新生成</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 画面编辑区域 */}
              {data.image && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Edit3 className="w-4 h-4 mr-2 text-purple-500" />
                    画面编辑
                  </h5>
                  
                  <div className="space-y-3">
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="输入画面编辑提示，例如：将天空改为夜晚、添加雨滴效果、改变人物表情等..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows="2"
                      disabled={isEditingImage}
                    />
                    
                    <button
                      onClick={handleEditImage}
                      disabled={isEditingImage || !editPrompt.trim()}
                      className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
                        isEditingImage || !editPrompt.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {isEditingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>编辑中...</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-4 h-4" />
                          <span>应用编辑</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧信息区域 */}
        <div className="w-64 border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Image className="w-4 h-4 mr-2 text-green-500" />
              图像信息
            </h5>
            <div className="space-y-2 text-xs text-gray-600">
              <div>
                <span className="font-medium">状态:</span>
                <span className="ml-2 text-green-600">✓ 生成完成</span>
              </div>
              <div>
                <span className="font-medium">尺寸:</span>
                <span className="ml-2">16:9 宽屏</span>
              </div>
              <div>
                <span className="font-medium">模型:</span>
                <span className="ml-2">Flux Pro Kontext</span>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-blue-500" />
              快速操作
            </h5>
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (data.image) {
                    const link = document.createElement('a');
                    link.href = data.image;
                    link.download = `generated_image_${data.id}_${Date.now()}.png`;
                    link.click();
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-blue-50 border border-blue-200 text-blue-600 rounded hover:bg-blue-100 transition-colors"
              >
                下载图像
              </button>
              <button
                onClick={() => {
                  if (data.image) {
                    navigator.clipboard.writeText(data.image);
                    addToast('图像URL已复制到剪贴板', 'success');
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 text-gray-600 rounded hover:bg-gray-100 transition-colors"
              >
                复制URL
              </button>
            </div>
          </div>
          
          {/* 编辑历史 */}
          {data.editHistory && data.editHistory.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Edit3 className="w-4 h-4 mr-2 text-purple-500" />
                编辑历史 ({data.editHistory.length})
              </h5>
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
                {data.editHistory.slice(-3).reverse().map((edit, index) => (
                  <div key={index} className="p-2 bg-purple-50 rounded text-xs">
                    <div className="font-medium text-purple-700 mb-1">
                      {edit.originalPrompt}
                    </div>
                    <div className="text-gray-500 text-xs">
                      耗时: {edit.timeTaken}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 图像历史记录组件已移除 */}
        </div>
      </div>
    </div>
  );

  // 渲染展开态卡片
  const renderExpandedCard = () => (
    <div className="bg-white rounded-[20px] shadow-lg border border-gray-200 overflow-hidden" style={{ pointerEvents: 'auto' }}>
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
              onClick={handleCollapseNode}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
      </button>
          </div>
          </div>
      </div>

      {/* 主要内容区域 - 使用更紧凑的布局 */}
      <div className="flex h-[600px]" style={{ pointerEvents: 'auto' }}>
        {/* 左侧控制面板 */}
        <div className="w-80 border-r border-gray-200 flex flex-col" style={{ pointerEvents: 'auto' }}>
          {/* 关键词气泡区域 - 移到左侧上方，支持拖拽 */}
          <div className="p-4 border-b border-gray-200 flex-1" style={{ pointerEvents: 'auto' }}>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Film className="w-4 h-4 mr-2 text-purple-500" />
              关键词气泡
            </h4>
            
            {/* 拖拽区域 */}
            <div 
              className="min-h-[160px] border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50/50 transition-colors hover:border-gray-400 hover:bg-gray-100/50"
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
                    let finalBubbleType = keywordType; // 直接使用关键词类型
                    
                    // 优先使用拖拽的原始颜色，如果没有则根据类型设置默认颜色
                    let finalOriginalColor = originalColor;
                    if (!finalOriginalColor) {
                      // 根据关键词类型设置默认颜色
                      if (keywordType === 'character') {
                        finalOriginalColor = 'purple'; // 使用颜色名称，让bubbleStyles系统处理
                      } else if (keywordType === 'scene') {
                        finalOriginalColor = 'green';
                      } else if (keywordType === 'action') {
                        finalOriginalColor = 'amber';
                      } else if (keywordType === 'emotion') {
                        finalOriginalColor = 'red';
                      } else if (keywordType === 'style') {
                        finalOriginalColor = 'indigo';
                      } else {
                        finalOriginalColor = 'blue';
                      }
                    }
                    
                    // 添加新的气泡到视觉元素中，保留原始样式信息
                    const newBubble = {
                      id: `bubble_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      text: keywordText.trim(),
                      type: finalBubbleType,
                      bubbleType: finalBubbleType,
                      originalColor: finalOriginalColor, // 使用颜色名称，让bubbleStyles系统处理
                      weight: 0.5, // 默认权重 - 对应medium重要性
                      importance: 'medium', // 默认重要性
                      isEditing: false
                    };
                    
                    setExpandedData(prev => ({
                      ...prev,
                      visualElements: {
                        ...prev.visualElements,
                        bubbles: [...prev.visualElements.bubbles, newBubble]
                      }
                    }));
                    
                    // 显示成功提示
                    addToast(`已添加关键词: ${keywordText.trim()}`, 'success');
                  }
                } catch (error) {
                  console.error('处理拖拽数据时出错:', error);
                  addToast('添加关键词失败，请重试', 'error');
                }
              }}
              style={{ pointerEvents: 'auto' }}
            >
              {/* 拖拽提示 */}
              {expandedData.visualElements.bubbles.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <div className="w-8 h-8 mx-auto mb-2 text-gray-300">📥</div>
                  <p className="text-xs">拖拽关键词到这里</p>
                </div>
              )}
              
              {/* 已添加的关键词气泡 */}
              <div className={`flex flex-wrap gap-3 ${expandedData.visualElements.bubbles.length > 6 ? 'max-h-40 overflow-y-auto bubble-scroll' : ''}`} style={{ pointerEvents: 'auto' }}>
                {expandedData.visualElements.bubbles.map((bubble, index) => (
                  <div key={bubble.id || index} className="flex flex-col items-center" style={{ pointerEvents: 'auto' }}>
                    {/* 气泡内容 */}
                    <div className="relative mb-1">
                      {bubble.isEditing ? (
                        <input
                          type="text"
                          value={bubble.text || ''}
                          onChange={(e) => {
                            setExpandedData(prev => ({
                              ...prev,
                              visualElements: {
                                ...prev.visualElements,
                                bubbles: prev.visualElements.bubbles.map(b => 
                                  b.id === bubble.id ? { ...b, text: e.target.value } : b
                                )
                              }
                            }));
                          }}
                          onBlur={() => {
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
                          className="w-24 p-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                          ref={(el) => {
                            if (el) {
                              bubbleRefs.current[bubble.id || index] = el;
                            }
                          }}
                        />
                      ) : (
                        <div 
                          className="cursor-pointer transition-all duration-200 relative"
                          ref={(el) => {
                            if (el) {
                              bubbleRefs.current[bubble.id || index] = el;
                            }
                          }}
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
                            // 使用统一的气泡样式系统，保持原有样式
                            const bubbleStyle = getBubbleStyle(bubble.bubbleType || bubble.type, bubble.originalColor);
                            
                            return (
                              <div style={bubbleStyle} className="relative">
                                <span>{bubble.text || `气泡 ${index + 1}`}</span>
                                {/* 删除按钮 - 放在气泡内部右上角 */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleRemoveBubble(bubble.id || index);
                                  }}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 transition-all duration-200 z-10"
                                  title="删除气泡"
                                  style={{ pointerEvents: 'auto' }}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    
                    {/* 权重滑块 - 动态宽度与气泡对应，改进样式 */}
                    <div className="flex justify-center" style={{ width: 'fit-content' }}>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.333"
                        value={bubble.weight || 0.5}
                        onChange={(e) => handleBubbleWeightChange(bubble.id || index, parseFloat(e.target.value))}
                        className="h-1 bg-gray-100 border border-gray-200 rounded-full appearance-none cursor-pointer slider-thin opacity-70 hover:opacity-100 transition-opacity"
                        style={{
                          width: bubbleWidths[bubble.id || index] ? 
                            `${Math.max(60, Math.min(120, bubbleWidths[bubble.id || index] - 20))}px` : '100px',
                          minWidth: '60px',
                          maxWidth: '120px',
                          background: (() => {
                            const weight = bubble.weight || 0.5;
                            if (weight <= 0.333) {
                              return `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${weight * 100}%, #f3f4f6 ${weight * 100}%, #f3f4f6 100%)`; // 黄色 - low (1/3)
                            } else if (weight <= 0.666) {
                              return `linear-gradient(to right, #93c5fd 0%, #93c5fd ${weight * 100}%, #f3f4f6 ${weight * 100}%, #f3f4f6 100%)`; // 浅蓝色 - medium (2/3)
                            } else {
                              return `linear-gradient(to right, #86efac 0%, #86efac ${weight * 100}%, #f3f4f6 ${weight * 100}%, #f3f4f6 100%)`; // 浅绿色 - high (1)
                            }
                          })(),
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                        }}
                        title={`重要性: ${bubble.importance || 'medium'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 生成提示词按钮 */}
            <button
              onClick={handleGenerateVisualPrompt}
              disabled={expandedData.isGeneratingPrompt}
              className={`w-full mt-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 font-medium flex items-center justify-center space-x-2 ${
                expandedData.isGeneratingPrompt
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {expandedData.isGeneratingPrompt ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>生成提示词</span>
                </>
              )}
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
              value={visualPrompt}
              onChange={(e) => setVisualPrompt(e.target.value)}
              placeholder="描述您想要的画面效果、构图、风格等..."
              className="w-full p-3 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent custom-scrollbar"
              rows={4}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#E5E7EB #F9FAFB'
              }}
            />
          </div>

          {/* 生成图像按钮区域 */}
          <div className="p-4">
            <div className="flex items-center space-x-3">
              {/* 取消按钮 */}
      <button
                onClick={handleCollapseNode}
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
            {/* 生成状态显示 */}
            {nodeState === NODE_STATES.GENERATING && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
                  <p className="text-lg font-medium text-gray-900 mb-2">正在生成图像...</p>
                  <p className="text-sm text-gray-600 mb-4">这可能需要几分钟时间</p>
                  <div className="text-xs text-gray-500">
                    已用时: {elapsedTime}秒
                  </div>
                </div>
              </div>
            )}
            
            {/* 图像切换箭头 - 仅在有多张图像时显示，放在图像上方 */}
            
            <div className="w-full max-w-2xl">
              <div 
                className="relative w-full cursor-crosshair" 
                style={{ aspectRatio: '16/9' }}
                onClick={(e) => {
                  if (dialogMode && data.image) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    addDialog(x, y);
                  }
                }}
              >
                {data.image ? (
                  <div className="w-full h-full">
                    <img
                      src={data.image}
                      alt="生成的图像"
                      className="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                    
                    {/* 图像切换箭头 - 仅在有多张图像时显示 */}
                    {imageHistory.length > 1 && (
                      <div className="absolute top-1/2 left-0 right-0 flex justify-between items-center px-2 transform -translate-y-1/2">
                        {/* 上一张图像箭头 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            switchToPreviousImage();
                          }}
                          disabled={currentImageIndex <= 0}
                          className={`w-10 h-10 rounded-full bg-white/90 border border-gray-300 shadow-lg flex items-center justify-center transition-all duration-200 ${
                            currentImageIndex <= 0
                              ? 'text-gray-300 cursor-not-allowed opacity-50'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-white hover:border-gray-400'
                          }`}
                          title={`上一张图像 (${currentImageIndex + 1}/${imageHistory.length})`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        {/* 下一张图像箭头 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            switchToNextImage();
                          }}
                          disabled={currentImageIndex >= imageHistory.length - 1}
                          className={`w-10 h-10 rounded-full bg-white/90 border border-gray-300 shadow-lg flex items-center justify-center transition-all duration-200 ${
                            currentImageIndex >= imageHistory.length - 1
                              ? 'text-gray-300 cursor-not-allowed opacity-50'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-white hover:border-gray-400'
                          }`}
                          title={`下一张图像 (${currentImageIndex + 1}/${imageHistory.length})`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    {/* 图像计数器 - 显示当前图像位置 */}
                    {imageHistory.length > 1 && (
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {currentImageIndex + 1} / {imageHistory.length}
                      </div>
                    )}

                    {/* 对话框按钮 - 仅在画面生成状态下显示 */}
                    {data.image && (
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={toggleDialogMode}
                          className={`w-10 h-10 rounded-full border-2 shadow-lg transition-all duration-200 flex items-center justify-center ${
                            dialogMode 
                              ? 'bg-blue-500 border-blue-600 text-white' 
                              : 'bg-white/90 border-gray-300 hover:border-gray-400 hover:bg-white text-gray-600'
                          }`}
                          title={dialogMode ? "退出对话框模式" : "添加对话框"}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* 在展开态下显示对话框 */}
                    {dialogs.map((dialog) => (
                      <div
                        key={dialog.id}
                        className="absolute cursor-move select-none group"
                        style={{
                          left: `${dialog.x}px`,
                          top: `${dialog.y}px`,
                          transform: 'translate(-50%, -50%)',
                          zIndex: 100
                        }}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', dialog.id);
                        }}
                        onDragEnd={(e) => {
                          const rect = e.currentTarget.parentElement.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          updateDialogPosition(dialog.id, x, y);
                        }}
                      >
                        <div 
                          className="bg-white border border-gray-300 rounded p-2 relative shadow-lg"
                          style={{
                            width: `${dialog.width || 120}px`,
                            height: `${dialog.height || 60}px`,
                            minWidth: '80px',
                            minHeight: '40px'
                          }}
                        >
                          {dialog.isEditing ? (
                            <textarea
                              value={dialog.text}
                              onChange={(e) => updateDialogText(dialog.id, e.target.value)}
                              onBlur={() => toggleDialogEdit(dialog.id)}
                              className="w-full h-full text-xs border-none resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="w-full h-full text-xs text-gray-700 break-words cursor-pointer"
                              onDoubleClick={() => toggleDialogEdit(dialog.id)}
                            >
                              {dialog.text}
                            </div>
                          )}
                          
                          {/* 删除按钮 - 悬浮显示，使用灰色 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDialog(dialog.id);
                            }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-600 transition-all duration-200 opacity-0 group-hover:opacity-100"
                            title="删除"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                          
                          {/* 调整大小手柄 */}
                          <div 
                            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const startX = e.clientX;
                              const startY = e.clientY;
                              const startWidth = dialog.width || 120;
                              const startHeight = dialog.height || 60;
                              
                              const handleMouseMove = (moveEvent) => {
                                const deltaX = moveEvent.clientX - startX;
                                const deltaY = moveEvent.clientY - startY;
                                const newWidth = Math.max(80, startWidth + deltaX);
                                const newHeight = Math.max(40, startHeight + deltaY);
                                updateDialogHeight(dialog.id, newHeight);
                                // 这里需要添加更新宽度的函数
                                setDialogs(prev => prev.map(d => 
                                  d.id === dialog.id ? { ...d, width: newWidth } : d
                                ));
                              };
                              
                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };
                              
                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          >
                            <div className="w-full h-full bg-gray-400 rounded-bl opacity-50 hover:opacity-75"></div>
                          </div>
                        </div>
                      </div>
                    ))}
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

          {/* 图像编辑输入框 - 仅在生成图像后显示 */}
          {data.image && (
            <div className="mb-4 flex items-center space-x-3">
              <textarea
                data-no-drag
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="描述您想要对图像进行的修改，例如：调整颜色、改变表情、添加元素等..."
                className="flex-1 p-2 text-xs text-gray-700 bg-white border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
              />
              <button
                onClick={handleEditImage}
                disabled={isEditingImage || !editPrompt.trim()}
                className={`px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap flex items-center justify-center space-x-2 ${
                  isEditingImage || !editPrompt.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isEditingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>编辑中...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>应用编辑</span>
                  </>
                )}
              </button>
            </div>
          )}



          {/* 故事脚本区 - 自动同步 */}
          <div className="flex-1">
            <div className="mb-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Edit3 className="w-4 h-4 mr-2 text-indigo-500" />
                故事脚本
              </h4>
            </div>
            <textarea
              data-no-drag
              value={expandedData.script}
              onChange={handleScriptChange}
              placeholder="在此处编辑完整的故事脚本，内容会自动保存..."
              className="w-full p-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent custom-scrollbar"
              rows={4}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#E5E7EB #F9FAFB'
              }}
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
                { id: 'wide', name: '环境镜头', icon: '🏞️' },
                { id: 'close', name: '特写镜头', icon: '🔍' },
                { id: 'over-shoulder', name: '过肩视角', icon: '👤' },
                { id: 'first-person', name: '第一人称', icon: '👁️' },
                { id: 'split-screen', name: '分屏构图', icon: '📱' },
                { id: 'medium', name: '中景', icon: '📷' }
              ].map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleCompositionChange(template.id)}
                  className={`p-2 rounded-lg border transition-all duration-200 ${
                    expandedData.visualElements.composition === template.id
                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                { id: 'style1', image: 'https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style1.png' },
                { id: 'style2', image: 'https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style2.png' },
                { id: 'style3', image: 'https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style3.png' },
                { id: 'style4', image: 'https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style4.png' }
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
                  <div className="w-full aspect-square rounded overflow-hidden">
                    <img
                      src={style.image}
                      alt={style.id}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzMEg3MFY3MEgzMFYzMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTM1IDM1SDY1VjY1SDM1VjM1WiIgZmlsbD0iI0M3Q0FEMiIvPgo8L3N2Zz4K';
                      }}
                    />
                  </div>
                  {expandedData.visualElements.style === style.id && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* 图像历史记录组件已移除 */}
        </div>
      </div>
    </div>
  );

  // 根据当前状态渲染节点内容
  const renderNodeContent = () => {
    switch (nodeState) {
      case NODE_STATES.EXPANDED:
        return renderExpandedCard();
      case NODE_STATES.GENERATING:
        return renderExpandedCard(); // 生成状态时显示展开卡片，但会有加载覆盖层
      case NODE_STATES.IMAGE:
        return renderImageCard();
      case NODE_STATES.COLLAPSED_WITH_IMAGE:
        return renderCollapsedWithImageCard();
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
              ${selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white' : ''}
              shadow-[0_4px_12px_rgba(0,0,0,0.1)]
              relative
            `}
            style={{
              width: (() => {
                if (nodeState === NODE_STATES.COLLAPSED) return NODE_WIDTH.COLLAPSED + 'px';
                if (nodeState === NODE_STATES.COLLAPSED_WITH_IMAGE) return NODE_WIDTH.COLLAPSED_WITH_IMAGE + 'px';
                return NODE_WIDTH.FULL_EXPANDED + 'px';
              })(),
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
            data-node-width={(() => {
              if (nodeState === NODE_STATES.COLLAPSED) return NODE_WIDTH.COLLAPSED;
              if (nodeState === NODE_STATES.COLLAPSED_WITH_IMAGE) return NODE_WIDTH.COLLAPSED_WITH_IMAGE;
              return NODE_WIDTH.FULL_EXPANDED;
            })()}
            data-node-height={(() => {
              if (nodeState === NODE_STATES.COLLAPSED) return 100;
              if (nodeState === NODE_STATES.COLLAPSED_WITH_IMAGE) return 200;
              return 400;
            })()}
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



  return (
    <>
      {renderNode()}
      <style jsx>{`
        .cursor-crosshair {
          cursor: crosshair;
        }
        .cursor-move {
          cursor: move;
        }
        .cursor-se-resize {
          cursor: se-resize;
        }
        .select-none {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
      `}</style>
    </>
  );
};

export default memo(StoryNode); 