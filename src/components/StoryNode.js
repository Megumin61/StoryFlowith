import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
// 删除Handle和Position导入
import { Image as ImageIcon, RefreshCw, Edit2, X, ChevronDown, ChevronUp, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
// 导入测试图像
import testImage from '../images/test.png';

// 移出Toast组件到节点渲染外部
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

// 提取可复用动画配置
const nodeAnimations = {
  initial: { scale: 0.9, opacity: 0 },
  exit: { opacity: 0, scale: 0.8 },
  hover: { y: -4 },
};

// 添加新节点按钮组件
const AddNodeButton = ({ position, onClick, style }) => {
  // 使用useCallback确保函数引用稳定
  const handleButtonClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log(`点击了${position}侧添加分镜按钮`);
    
    // 确保onClick是一个函数
    if (typeof onClick === 'function') {
      onClick(position);
    } else {
      console.error("onClick函数未定义");
    }
  }, [onClick, position]);
  
  return (
    <div 
      className="absolute top-1/2 transform -translate-y-1/2 hover:scale-105 transition-transform duration-100 z-50"
      style={{ 
        [position === 'left' ? 'left' : 'right']: '-25px', // 将按钮移到节点外部
        ...style
      }}
      onClick={handleButtonClick}
    >
      <div className="w-[35px] h-[34px] rounded-[11px] bg-[#A4ABD0]/16 flex items-center justify-center cursor-pointer">
        <div className="w-[23px] h-[22px] rounded-[6px] bg-[#848FA7]/50 flex items-center justify-center">
          <Plus size={14} className="text-white" />
        </div>
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
  IMAGE_EDITING: 'imageEditing'
};

const StoryNode = ({ data, selected }) => {
  // 基本状态
  const [nodeText, setNodeText] = useState(data.text || '');
  const [visualPrompt, setVisualPrompt] = useState(data.imagePrompt || data.text || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  
  // 节点状态
  const [nodeState, setNodeState] = useState(
    data.image ? NODE_STATES.IMAGE : NODE_STATES.COLLAPSED
  );
  const [regeneratePrompt, setRegeneratePrompt] = useState(''); // 新增再生成提示

  const controls = useAnimation();
  const textAreaRef = useRef(null);
  const promptTextAreaRef = useRef(null);
  const toastPositionRef = useRef({ x: 0, y: 0 });
  const nodeRef = useRef(null);
  const leftSideRef = useRef(null);
  const rightSideRef = useRef(null);
  const leftButtonRef = useRef(null);
  const rightButtonRef = useRef(null);
  const prevNodeStateRef = useRef(nodeState);

  useEffect(() => {
    controls.start({ opacity: 1, scale: 1 });
    setNodeText(data.text || '');
    setVisualPrompt(data.imagePrompt || data.text || '');
  }, [controls, data.text, data.imagePrompt]);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
      if (nodeState === NODE_STATES.EDITING) {
      textAreaRef.current.focus();
    }
    }
  }, [nodeState, nodeText]);
  
  useEffect(() => {
    if (promptTextAreaRef.current && nodeState === NODE_STATES.EDITING) {
      promptTextAreaRef.current.style.height = 'auto';
      promptTextAreaRef.current.style.height = `${promptTextAreaRef.current.scrollHeight}px`;
      promptTextAreaRef.current.focus();
    }
  }, [nodeState, visualPrompt]);

  // 当节点状态变化时通知父组件
  useEffect(() => {
    if (prevNodeStateRef.current !== nodeState && typeof data.onStateChange === 'function') {
      const isExpanded = nodeState !== NODE_STATES.COLLAPSED;
      data.onStateChange(data.id, nodeState, isExpanded);
      prevNodeStateRef.current = nodeState;
    }
  }, [nodeState, data]);

  // 添加鼠标事件处理
  useEffect(() => {
    const handleMouseEnterLeftButton = () => {
      setShowLeftButton(true);
    };
    
    const handleMouseLeaveLeftButton = (e) => {
      // 检查鼠标是否移动到感应区域
      if (!leftSideRef.current?.contains(e.relatedTarget)) {
        setShowLeftButton(false);
      }
    };
    
    const handleMouseEnterRightButton = () => {
      setShowRightButton(true);
    };
    
    const handleMouseLeaveRightButton = (e) => {
      // 检查鼠标是否移动到感应区域
      if (!rightSideRef.current?.contains(e.relatedTarget)) {
        setShowRightButton(false);
      }
    };
    
    // 为按钮添加事件监听
    if (leftButtonRef.current) {
      leftButtonRef.current.addEventListener('mouseenter', handleMouseEnterLeftButton);
      leftButtonRef.current.addEventListener('mouseleave', handleMouseLeaveLeftButton);
    }
    
    if (rightButtonRef.current) {
      rightButtonRef.current.addEventListener('mouseenter', handleMouseEnterRightButton);
      rightButtonRef.current.addEventListener('mouseleave', handleMouseLeaveRightButton);
    }
    
    return () => {
      // 清理事件监听
      if (leftButtonRef.current) {
        leftButtonRef.current.removeEventListener('mouseenter', handleMouseEnterLeftButton);
        leftButtonRef.current.removeEventListener('mouseleave', handleMouseLeaveLeftButton);
      }
      
      if (rightButtonRef.current) {
        rightButtonRef.current.removeEventListener('mouseenter', handleMouseEnterRightButton);
        rightButtonRef.current.removeEventListener('mouseleave', handleMouseLeaveRightButton);
      }
    };
  }, []);

  const addToast = (message, type = 'success') => {
    // 确保nodeRef已设置并且有getBoundingClientRect方法
    if (nodeRef.current) {
      const nodeBounds = nodeRef.current.getBoundingClientRect();
      // 保存toast应该显示的位置（卡片正下方中心）
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
    if (nodeState === NODE_STATES.COLLAPSED) {
      setNodeState(NODE_STATES.EDITING);
    }
  };

  // 修改文本变化处理函数，使用RAF避免连续多次重排
  const handleTextChange = (e) => {
    setNodeText(e.target.value);
    
    // 使用requestAnimationFrame优化性能
    requestAnimationFrame(() => {
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    });
  };

  const handlePromptChange = (e) => {
    setVisualPrompt(e.target.value);
    
    // 使用requestAnimationFrame优化性能
    requestAnimationFrame(() => {
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    });
  };

  const handleTextSave = () => {
    if (nodeText !== data.text) {
      data.onUpdateNode?.(data.id, { text: nodeText });
        addToast('情节描述已保存', 'success');
    }
  };

  const handleDeleteNode = (e) => {
    e.stopPropagation();
    controls.start({ opacity: 0, scale: 0.8 }).then(() => {
      data.onDeleteNode?.(data.id);
      addToast('节点已删除', 'success');
    });
  };

  const handleGenerateImage = async () => {
    setNodeState(NODE_STATES.GENERATING);
    setIsGenerating(true);
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      data.onUpdateNode?.(data.id, { 
        image: testImage,
        imagePrompt: visualPrompt 
      });
      addToast('图像已生成', 'success');
      setNodeState(NODE_STATES.IMAGE);
    } catch (error) {
      console.error("图像生成失败:", error);
      addToast('图像生成失败', 'error');
      setNodeState(NODE_STATES.EDITING);
    }
    
    setIsGenerating(false);
  };
  
  // 修改图像编辑函数
  const handleEditImage = (e) => {
    if (e) e.stopPropagation();
    console.log("调用handleEditImage，当前状态:", nodeState);
    
    // 直接使用setState回调确保获取最新状态
    setNodeState(prevState => {
      console.log("设置状态从", prevState, "到", NODE_STATES.IMAGE_EDITING);
      return NODE_STATES.IMAGE_EDITING;
    });
    
    setVisualPrompt(data.imagePrompt || '');
    setRegeneratePrompt('');
  };

  // 修改重新生成图像函数
  const handleRegenerateImage = async () => {
    setNodeState(NODE_STATES.GENERATING);
    setIsGenerating(true);
    
    try {
      // 构建提示词
      const finalPrompt = visualPrompt + (regeneratePrompt ? `，${regeneratePrompt}` : '');
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      data.onUpdateNode?.(data.id, { 
        image: testImage,
        imagePrompt: finalPrompt 
      });
      addToast('图像已重新生成', 'success');
      setNodeState(NODE_STATES.IMAGE);
    } catch (error) {
      console.error("图像生成失败:", error);
      addToast('图像生成失败', 'error');
      setNodeState(NODE_STATES.IMAGE_EDITING);
    }
    
      setIsGenerating(false);
  };

  const handleCancel = () => {
    if (nodeState === NODE_STATES.IMAGE_EDITING) {
      setNodeState(NODE_STATES.IMAGE);
    } else {
      setNodeState(NODE_STATES.COLLAPSED);
    }
  };
  
  // 添加分镜函数
  const handleAddNode = useCallback((position) => {
    console.log(`添加分镜 ${position} 到节点 ${data.id}`);
    
    // 使用setTimeout确保事件处理完成后再调用onAddNode
    setTimeout(() => {
      if (typeof data.onAddNode === 'function') {
        data.onAddNode(data.id, position);
      } else {
        console.error("onAddNode 函数未定义", data);
      }
    }, 0);
  }, [data]);
  
  // 修改副作用，避免ResizeObserver循环错误
  useEffect(() => {
    // 使用防抖函数减少调整频率
    let resizeTimeout;
    
    // 自动调整所有文本区域的高度
    const adjustTextareaHeights = () => {
      clearTimeout(resizeTimeout);
      
      resizeTimeout = setTimeout(() => {
        const textareas = nodeRef.current?.querySelectorAll('textarea');
        if (textareas) {
          textareas.forEach(textarea => {
            // 使用克隆元素计算高度，避免直接操作可能导致的布局循环
            const clone = textarea.cloneNode(true);
            clone.style.visibility = 'hidden';
            clone.style.position = 'absolute';
            clone.style.height = 'auto';
            document.body.appendChild(clone);
            
            const scrollHeight = clone.scrollHeight;
            document.body.removeChild(clone);
            
            // 只有当高度确实需要变化时才设置，减少不必要的重排
            if (textarea.style.height !== `${scrollHeight}px`) {
              textarea.style.height = `${scrollHeight}px`;
            }
          });
        }
      }, 10); // 短暂延迟，避免频繁触发
    };
    
    // 初始调整
    const initialAdjustment = setTimeout(adjustTextareaHeights, 50);
    
    // 监听窗口大小变化，使用防抖
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(adjustTextareaHeights, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialAdjustment);
      clearTimeout(resizeTimeout);
      clearTimeout(resizeTimer);
    };
  }, [nodeState, nodeText, visualPrompt, regeneratePrompt]);
  
  // 渲染折叠状态
  const renderCollapsedCard = () => (
    <div className="flex flex-col p-4 min-h-[100px] cursor-pointer" onClick={handleCardClick}>
      <div className="text-xs text-gray-400 font-medium mb-2">{data.label}</div>
      <textarea
        value={nodeText}
        readOnly
        className="w-full text-sm text-gray-800 resize-none bg-gray-50/50 border-none rounded-md p-2 flex-grow focus:outline-none overflow-hidden"
        style={{ height: 'auto' }}
      />
      <div className="flex justify-center mt-2">
        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );
  
  // 渲染编辑状态
  const renderEditingCard = () => (
    <div className="flex flex-col p-4">
      <div className="text-xs text-gray-400 font-medium mb-2">{data.label}</div>
      <textarea
        ref={textAreaRef}
        value={nodeText}
        onChange={handleTextChange}
        onBlur={handleTextSave}
        className="w-full text-sm text-gray-800 bg-gray-50/50 border-gray-100 rounded-md p-2 mb-4 resize-none focus:outline-none focus:ring-1 focus:ring-blue-200 overflow-hidden"
        style={{ height: 'auto' }}
      />
      
      <div className="border-t border-gray-100 pt-4 mt-2">
        <div className="text-xs text-gray-500 mb-2 font-medium">视觉描述</div>
        <textarea
          ref={promptTextAreaRef}
          value={visualPrompt}
          onChange={handlePromptChange}
          placeholder="描述画面的视觉元素..."
          className="w-full p-2 text-xs resize-none border-gray-100 focus:border-gray-200 bg-gray-50/50 rounded-md min-h-[60px] focus:outline-none focus:ring-0 overflow-hidden"
          style={{ height: 'auto' }}
        />
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-100 rounded-md"
          >
            取消
          </button>
          <button
            onClick={handleGenerateImage}
            className="flex-1 py-1.5 text-xs text-white bg-gray-800 hover:bg-gray-700 rounded-md flex items-center justify-center"
          >
            <ImageIcon size={12} className="mr-1" />
            生成
          </button>
        </div>
      </div>
    </div>
  );
  
  // 渲染生成中状态
  const renderGeneratingCard = () => (
    <div className="flex flex-col p-4">
      <div className="text-xs text-gray-400 font-medium mb-3">{data.label}</div>
      <div className="h-32 bg-gray-50 rounded-md flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={20} className="animate-spin text-gray-400 mx-auto mb-2" />
          <div className="text-xs text-gray-500">生成中</div>
        </div>
      </div>
      <div className="text-sm text-gray-800 mt-3">{nodeText}</div>
    </div>
  );
  
  // 渲染图片状态
  const renderImageCard = () => (
        <div className="flex flex-col">
          <div className="relative group">
            <img
              src={data.image}
              alt={data.label}
          className="w-full h-auto aspect-[16/9] object-cover rounded-t-[20px]"
            />
            <div className="absolute top-1.5 right-1.5 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
            className="p-1.5 bg-black/60 rounded-full hover:bg-blue-600/80 transform hover:scale-110 transition-all duration-200"
            onClick={handleEditImage}
            title="编辑视觉提示"
          >
            <Edit2 size={12} className="text-white" />
          </button>
          <button
            className="p-1.5 bg-black/60 rounded-full hover:bg-red-600/80 transform hover:scale-110 transition-all duration-200"
                onClick={handleDeleteNode}
            title="删除节点"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          </div>
      
      <div className="border-t border-gray-100"></div>

          <div className="p-3">
        <div className="text-xs text-gray-400 font-medium mb-1">{data.label}</div>
        <div className="text-sm text-gray-800 p-2 bg-gray-50/50 rounded-md">{nodeText}</div>
      </div>
          </div>
  );
  
  // 修改图片编辑状态的渲染
  const renderImageEditingCard = () => (
    <>
      <div className="flex flex-col">
        <div className="relative group">
          <img
            src={data.image}
            alt={data.label}
            className="w-full h-auto aspect-[16/9] object-cover rounded-t-[20px]"
          />
          <div className="absolute top-1.5 right-1.5 flex space-x-1">
            <button
              className="p-1.5 bg-black/60 rounded-full hover:bg-red-600/80 transform hover:scale-110 transition-all duration-200"
              onClick={handleDeleteNode}
              title="删除节点"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-100"></div>
        
        <div className="p-3">
          <div className="text-xs text-gray-400 font-medium mb-1">{data.label}</div>
          <div className="text-sm text-gray-800 p-2 bg-gray-50/50 rounded-md">{nodeText}</div>
            </div>
          </div>
    </>
  );

  // 添加一个额外的副作用来跟踪nodeState的变化
  useEffect(() => {
    console.log("节点状态变更为:", nodeState);
  }, [nodeState]);

  // 根据当前状态渲染节点内容
  const renderNodeContent = () => {
    switch(nodeState) {
      case NODE_STATES.EDITING:
        return renderEditingCard();
      case NODE_STATES.GENERATING:
        return renderGeneratingCard();
      case NODE_STATES.IMAGE:
        return renderImageCard();
      case NODE_STATES.IMAGE_EDITING:
        return renderImageEditingCard();
      case NODE_STATES.COLLAPSED:
      default:
        return renderCollapsedCard();
    }
  };

  // 渲染节点主体
  const renderNode = () => (
    <motion.div 
      ref={nodeRef}
      className={`
        bg-white rounded-[20px]
        ${selected ? 'ring-2 ring-blue-500' : ''}
        shadow-[0_4px_12px_rgba(0,0,0,0.1)]
        transition-all duration-300 ease-out
        ${selected ? 'transform -translate-y-1' : ''}
        relative
      `}
      style={{
        width: nodeState === NODE_STATES.COLLAPSED ? '208px' : '256px',
        transformOrigin: 'center center'
      }}
      animate={controls}
      layout="position"
    >
      {/* 左侧感应区域 - 缩小宽度，避免干扰图片交互 */}
      <div 
        ref={leftSideRef}
        className="absolute left-0 top-0 bottom-0 w-6 z-10"
        onMouseEnter={() => setShowLeftButton(true)}
        onMouseLeave={() => setShowLeftButton(false)}
      />
      
      {/* 左侧添加按钮 - 放在节点外部 */}
      <div ref={leftButtonRef} className="absolute left-0 top-0 bottom-0 z-50 pointer-events-auto" style={{ width: '0' }}>
        <AddNodeButton 
          position="left" 
          onClick={handleAddNode} 
          style={{ 
            opacity: showLeftButton ? 1 : 0,
            pointerEvents: showLeftButton ? 'auto' : 'none'
          }}
        />
      </div>
      
      {renderNodeContent()}
      
      {/* 卡片下方的扩展编辑区域 - 提高z-index并调整位置 */}
      <div className="absolute left-0 right-0 w-full">
        <AnimatePresence>
          {nodeState === NODE_STATES.IMAGE_EDITING && (
            <motion.div 
              className="absolute top-0 left-0 w-full z-40"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ pointerEvents: 'auto' }}
            >
              <div className="bg-white rounded-[20px] shadow-lg overflow-hidden border border-gray-200">
                <div className="p-3 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">调整视觉提示</div>
                    <button
                      onClick={handleCancel}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <textarea
                    value={visualPrompt}
                    onChange={handlePromptChange}
                    placeholder="修改基础视觉提示词..."
                    className="w-full p-2 text-xs resize-none border-gray-100 focus:border-gray-200 bg-gray-50/50 rounded-md min-h-[40px] focus:outline-none focus:ring-0 mt-1 overflow-hidden"
                    style={{ height: 'auto' }} // 确保初始高度为auto
                  />
                </div>
                
                <div className="p-3">
                  <div className="text-xs text-gray-500 mb-1">画面编辑提示</div>
                  <textarea
                    value={regeneratePrompt}
                    onChange={(e) => setRegeneratePrompt(e.target.value)}
                    placeholder="添加特定的修改要求，例如：'添加更多光线'、'改为夜景'"
                    className="w-full p-2 text-xs resize-none border-gray-100 focus:border-gray-200 bg-gray-50/50 rounded-md min-h-[40px] focus:outline-none focus:ring-0 overflow-hidden"
                    style={{ height: 'auto' }} // 确保初始高度为auto
                  />
                </div>
                
                <div className="flex bg-gray-50 p-2 border-t border-gray-100">
                  <button
                    onClick={handleRegenerateImage}
                    className="w-full py-1.5 text-xs text-white bg-gray-800 hover:bg-gray-700 rounded-md flex items-center justify-center"
                  >
                    <RefreshCw size={12} className="mr-1" />
                    重新生成
                  </button>
                </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>

      {/* 右侧感应区域 - 缩小宽度，避免干扰图片交互 */}
      <div 
        ref={rightSideRef}
        className="absolute right-0 top-0 bottom-0 w-6 z-10"
        onMouseEnter={() => setShowRightButton(true)}
        onMouseLeave={() => setShowRightButton(false)}
      />
      
      {/* 右侧添加按钮 - 放在节点外部 */}
      <div ref={rightButtonRef} className="absolute right-0 top-0 bottom-0 z-50 pointer-events-auto" style={{ width: '0' }}>
        <AddNodeButton 
          position="right" 
          onClick={handleAddNode}
          style={{ 
            opacity: showRightButton ? 1 : 0,
            pointerEvents: showRightButton ? 'auto' : 'none'
          }}
        />
      </div>
    </motion.div>
  );

  // 返回节点和Toast，Toast放在外部
  return (
    <>
      {renderNode()}
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

export default memo(StoryNode); 