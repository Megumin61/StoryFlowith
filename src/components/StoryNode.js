import React, { memo, useState, useEffect, useRef } from 'react';
// 删除Handle和Position导入
import { Image as ImageIcon, RefreshCw, Edit2, X, ChevronDown, ChevronUp, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
// 导入测试图像
import testImage from '../images/test.png';
// 导入FalAI API服务
import FalAI from '../services/falai';
import { falConfig } from '../config';
// 导入有道翻译服务
import YoudaoTranslate from '../services/youdaoTranslate';

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

// 计算时间工具函数
const calculateTime = (startTime, endTime) => {
  const timeDiff = endTime - startTime;
  const seconds = Math.floor(timeDiff / 1000);
  const milliseconds = timeDiff % 1000;
  return `${seconds}.${milliseconds.toString().padStart(3, '0')}秒`;
};

// 提取可复用动画配置
const nodeAnimations = {
  initial: { scale: 0.9, opacity: 0 },
  exit: { opacity: 0, scale: 0.8 },
  hover: { y: -4 },
};

// 删除添加节点按钮组件 - 不再需要

// 在节点上方添加左右移动按钮组件
const MoveNodeButtons = ({ onMoveLeft, onMoveRight }) => (
  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-2 z-50 transition-opacity opacity-40 hover:opacity-100">
    <button
      className="w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-blue-100 border border-gray-200"
      onClick={onMoveLeft}
      title="向左移动"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <ChevronLeft size={16} className="text-gray-500" />
    </button>
    <button
      className="w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-blue-100 border border-gray-200"
      onClick={onMoveRight}
      title="向右移动"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <ChevronRight size={16} className="text-gray-500" />
    </button>
  </div>
);

// 节点状态类型
const NODE_STATES = {
  COLLAPSED: 'collapsed',
  EDITING: 'editing',
  GENERATING: 'generating',
  IMAGE: 'image',
  IMAGE_EDITING: 'imageEditing'
};

// 调整节点宽度常量，使比例更适合16:9的图像
const NODE_WIDTH = {
  COLLAPSED: 240, // 适当增加宽度以更好地显示16:9的图像
  EXPANDED: 360  // 增加展开时的宽度，适应16:9比例的图像
};

const StoryNode = ({ data, selected }) => {
  // 基本状态
  const [nodeState, setNodeState] = useState(data.image ? NODE_STATES.IMAGE : NODE_STATES.COLLAPSED);
  const [nodeText, setNodeText] = useState(data.text || '');
  // 只初始化为imagePrompt，不再和text关联
  const [visualPrompt, setVisualPrompt] = useState(data.imagePrompt || '');
  const [regeneratePrompt, setRegeneratePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // 移除调试面板状态
  // const [showDebugPanel, setShowDebugPanel] = useState(false);
  // const [debugReferenceImage, setDebugReferenceImage] = useState('');
  // const [debugGeneratedImage, setDebugGeneratedImage] = useState('');
  
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
    controls.start({ opacity: 1, scale: 1 });
    setNodeText(data.text || '');
    // 不再同步visualPrompt和text
    setVisualPrompt(data.imagePrompt || '');
  }, [controls, data.text, data.imagePrompt]);

  // 修改副作用，避免ResizeObserver循环错误
  useEffect(() => {
    // 使用防抖函数减少调整频率
    let resizeTimeout;

    // 自动调整所有文本区域的高度
    const adjustTextareaHeights = () => {
      clearTimeout(resizeTimeout);

      resizeTimeout = setTimeout(() => {
        try {
          const textareas = nodeRef.current?.querySelectorAll('textarea');
          if (textareas) {
            textareas.forEach(textarea => {
              // 不直接在循环中操作DOM，而是使用RAF分散操作
              window.requestAnimationFrame(() => {
                try {
                  // 先重置高度，然后再设置为scrollHeight
                  textarea.style.height = 'auto';
                  const scrollHeight = textarea.scrollHeight;
                  
                  // 限制最大高度，避免过大导致布局问题
                  const maxHeight = 200; // 设置一个合理的最大高度
                  textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
                  
                  // 如果内容超出最大高度，启用滚动
                  if (scrollHeight > maxHeight) {
                    textarea.style.overflowY = 'auto';
                  } else {
                    textarea.style.overflowY = 'hidden';
                  }
                } catch (err) {
                  console.error('调整文本区域高度时出错:', err);
                }
              });
            });
          }
        } catch (error) {
          console.error('处理文本区域时出错:', error);
        }
      }, 50); // 增加延迟，减少频繁触发
    };

    // 初始调整使用稍长延迟
    const initialAdjustment = setTimeout(adjustTextareaHeights, 100);

    // 监听窗口大小变化，使用更长的防抖
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(adjustTextareaHeights, 200);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialAdjustment);
      clearTimeout(resizeTimeout);
      clearTimeout(resizeTimer);
    };
  }, [nodeState, nodeText, visualPrompt, regeneratePrompt]);

  // 添加焦点管理
  useEffect(() => {
    // 当状态变为编辑状态时，设置焦点
    if (nodeState === NODE_STATES.EDITING) {
      // 使用短暂延迟确保DOM已更新
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
        }
      }, 50);
    } else if (nodeState === NODE_STATES.IMAGE_EDITING) {
      // 编辑图像状态时，聚焦到提示词输入框
      setTimeout(() => {
        if (promptTextAreaRef.current) {
      promptTextAreaRef.current.focus();
    }
      }, 50);
    }
  }, [nodeState]);

  // 优化节点状态变化处理
  useEffect(() => {
    if (prevNodeStateRef.current !== nodeState && typeof data.onStateChange === 'function') {
      const isExpanded = nodeState !== NODE_STATES.COLLAPSED;
      
      // 将状态变更延迟一帧，确保UI更新后再触发布局调整
      requestAnimationFrame(() => {
      data.onStateChange(data.id, nodeState, isExpanded);
      });
      
      prevNodeStateRef.current = nodeState;
    }
  }, [nodeState, data]);

  // 删除鼠标事件处理 - 不再需要

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
      safeSetNodeState(NODE_STATES.EDITING);
    }
  };

  // 安全状态转换函数，保存内容后再变更状态
  const safeSetNodeState = (newState) => {
    // 如果当前正在编辑中，先保存内容
    if (nodeState === NODE_STATES.EDITING || nodeState === NODE_STATES.IMAGE_EDITING) {
      handleTextSave();
      handlePromptSave();
    }
    
    if (nodeState !== newState) {
      setNodeState(newState);
      console.log(`节点状态从 ${nodeState} 变为 ${newState}`);
      
      // 通知父组件状态变化
      if (data.onNodeStateChange) {
        data.onNodeStateChange(newState);
      }
    }
  };

  // 修改文本变化处理函数，减少DOM操作频率
  const handleTextChange = (e) => {
    setNodeText(e.target.value);

    // 使用防抖避免频繁触发布局计算
    if (handleTextChange.timeout) {
      clearTimeout(handleTextChange.timeout);
    }
    
    handleTextChange.timeout = setTimeout(() => {
    requestAnimationFrame(() => {
      try {
      e.target.style.height = 'auto';
        const scrollHeight = e.target.scrollHeight;
        
        // 限制最大高度
        const maxHeight = 200;
        e.target.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        
        // 如果内容超出最大高度，启用滚动
        if (scrollHeight > maxHeight) {
          e.target.style.overflowY = 'auto';
        } else {
          e.target.style.overflowY = 'hidden';
        }
      } catch (err) {
        console.error('调整文本区域高度时出错:', err);
      }
    });
    }, 50);
  };

  const handlePromptChange = (e) => {
    setVisualPrompt(e.target.value);

    // 使用防抖避免频繁触发布局计算
    if (handlePromptChange.timeout) {
      clearTimeout(handlePromptChange.timeout);
    }
    
    handlePromptChange.timeout = setTimeout(() => {
    requestAnimationFrame(() => {
      try {
      e.target.style.height = 'auto';
        const scrollHeight = e.target.scrollHeight;
        
        // 限制最大高度
        const maxHeight = 200;
        e.target.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        
        // 如果内容超出最大高度，启用滚动
        if (scrollHeight > maxHeight) {
          e.target.style.overflowY = 'auto';
        } else {
          e.target.style.overflowY = 'hidden';
        }
      } catch (err) {
        console.error('调整文本区域高度时出错:', err);
      }
    });
    }, 50);
  };

  const handleTextSave = () => {
    if (nodeText !== data.text) {
      // 调用父组件的保存函数
      if (data.onTextSave) {
        data.onTextSave(nodeText);
      }
      addToast('情节描述已保存', 'success');
    }
  };

  // 添加视觉描述保存函数
  const handlePromptSave = () => {
    if (visualPrompt !== data.imagePrompt) {
      // 调用父组件的保存函数
      if (data.onPromptSave) {
        data.onPromptSave(visualPrompt);
      }
    }
  };

  // 修复handleDeleteNode函数，确保在没有事件对象时也能正常工作
  const handleDeleteNode = (e) => {
    // 添加默认值，避免在没有事件对象时报错
    if (e) {
    e.stopPropagation();
    }
    
    console.log('StoryNode 调用删除函数, 节点ID:', data.id);
    
    // 直接调用删除回调，不等待动画完成
    if (typeof data.onDeleteNode === 'function') {
      data.onDeleteNode(data.id);
    } else {
      console.error('删除回调未定义', data);
    }
  };

  // 修改生成图像函数，添加时间记录和完整打印
  const handleGenerateImage = async () => {
    setNodeState(NODE_STATES.GENERATING);
    setIsGenerating(true);
    const startTime = new Date();
    const startTimeStr = startTime.toLocaleTimeString() + '.' + startTime.getMilliseconds();
    console.log(`[生成图像] 开始生成图像, 时间: ${startTimeStr}`);

    try {
      // 添加正面引导词，提高安全性
      let safePrompt = visualPrompt;
      
      // 翻译视觉提示词为英文
      let translatedPrompt;
      const translateStartTime = new Date();
      console.log(`[生成图像] 开始翻译提示词: "${safePrompt}", 时间: ${translateStartTime.toLocaleTimeString() + '.' + translateStartTime.getMilliseconds()}`);
      try {
        translatedPrompt = await YoudaoTranslate.zhToEn(safePrompt);
        const translateEndTime = new Date();
        const translateTime = (translateEndTime - translateStartTime) / 1000;
        console.log(`[生成图像] 翻译成功: "${translatedPrompt}", 用时: ${translateTime}秒, 时间: ${translateEndTime.toLocaleTimeString() + '.' + translateEndTime.getMilliseconds()}`);
      } catch (error) {
        console.error('[生成图像] 翻译失败:', error);
        translatedPrompt = safePrompt; // 翻译失败 fallback 到原文
        console.warn(`[生成图像] 使用原文作为提示词: "${translatedPrompt}"`);
      }

      // 使用翻译后的提示词构建 finalPrompt，不再添加安全描述
      const prompt = `Don't reference the characters in the image, only reference the style of the image, generate a single storyboard frame for me(Do not have an outer frame around the image): ${translatedPrompt}`;
      console.log(`[生成图像] 最终提示词: "${prompt}"`);

      // 从data属性中获取风格名称
      const styleName = data.styleName || "style1"; // 获取风格名称
      console.log(`[生成图像] 风格名称: ${styleName}`);

      // 获取风格图像URL - 业务逻辑移到这里
      const referenceImageUrl = FalAI.STYLE_URLS[styleName] || FalAI.STYLE_URLS.style1;
      console.log(`[生成图像] 使用风格图像URL: ${referenceImageUrl}`);

      // 记录API调用开始时间
      const apiCallStartTime = new Date();
      console.log(`[生成图像] 开始调用FalAI API, 时间: ${apiCallStartTime.toLocaleTimeString() + '.' + apiCallStartTime.getMilliseconds()}`);
      
      // 调用FalAI的图生图API - 直接传入风格图像URL，使用生图模型(kontext)
      const response = await FalAI.generateImageToImage(
        prompt, // 使用翻译后的提示词
        referenceImageUrl, // 直接传入风格图像URL
        'generate' // 指定使用生图模型
      );

      // 计算API调用耗时
      const apiCallEndTime = new Date();
      const apiCallDuration = calculateTime(apiCallStartTime, apiCallEndTime);
      console.log(`[生成图像] API调用完成, 用时: ${apiCallDuration}`);
      
      if (response.referenceImageUrl) {
        console.log('[生成图像] API实际使用的参考图URL:', response.referenceImageUrl);
      }

      // 检查响应状态
      console.log('[生成图像] 收到响应:', JSON.stringify(response));
        
      // 从fal.ai API响应中获取图像URL
      if (!response || !response.data || !response.data.images || !response.data.images[0]) {
        console.error('[生成图像] API响应格式不正确:', response);
        throw new Error('未获取到生成的图像URL');
      }

      // 获取生成的图像URL - 从对象中提取url属性
      const imageUrl = response.data.images[0].url;
      console.log('[生成图像] 提取的图像URL:', imageUrl);
      
      // 记录图像加载开始时间
      const imageLoadStartTime = new Date();
      console.log(`[生成图像] 开始加载图像, 时间: ${imageLoadStartTime.toLocaleTimeString() + '.' + imageLoadStartTime.getMilliseconds()}`);
      
      // 创建新图像对象并预加载，确保图像已经加载完成再更新UI
      const img = new Image();
      img.src = imageUrl;
      
      // 等待图像加载完成或加载失败
      await new Promise((resolve) => {
        img.onload = () => {
          const imageLoadEndTime = new Date();
          const imageLoadDuration = calculateTime(imageLoadStartTime, imageLoadEndTime);
          console.log(`[生成图像] 图像预加载成功, 用时: ${imageLoadDuration}`);
          resolve();
        };
        img.onerror = () => {
          console.warn('[生成图像] 图像预加载失败，将使用原始URL');
          resolve();
        };
        
        // 设置超时，防止无限等待
        setTimeout(resolve, 3000);
      });

      // 计算总耗时
      const endTime = new Date();
      const totalDuration = calculateTime(startTime, endTime);
      console.log(`[生成图像] 图像生成完整流程完成，总耗时: ${totalDuration}`);
      console.log(`[生成图像] API调用耗时: ${apiCallDuration} | 图像加载耗时: ${calculateTime(imageLoadStartTime, endTime)}`);
      console.log(`[生成图像] 从API调用到图像返回总耗时: ${calculateTime(apiCallStartTime, endTime)}`);

      // 更新节点数据
      data.onUpdateNode?.(data.id, {
        image: imageUrl,
        imagePrompt: visualPrompt,
        styleName: styleName // 保存风格名称
      });

      setNodeState(NODE_STATES.IMAGE);
    } catch (error) {
      console.error("[生成图像] 图像生成失败:", error);
      console.error('[生成图像] 错误详情:', error);

      // 如果没有找到图像URL，显示错误并回到编辑状态
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

  // 修改重新生成图像函数，添加时间记录和完整打印
  const handleRegenerateImage = async () => {
    setNodeState(NODE_STATES.GENERATING);
    setIsGenerating(true);
    const startTime = new Date();
    const startTimeStr = startTime.toLocaleTimeString() + '.' + startTime.getMilliseconds();
    console.log(`[重新生成] 开始重新生成图像, 时间: ${startTimeStr}`);

    try {
      // 构建提示词
      const userPrompt = regeneratePrompt || visualPrompt;
      
      // 不再添加安全提示词
      const finalPrompt = userPrompt;
      
      console.log(`[重新生成] 原始提示词: "${finalPrompt}"`);
      
      // 翻译编辑提示词为英文
      let translatedPrompt;
      const translateStartTime = new Date();
      console.log(`[重新生成] 开始翻译提示词, 时间: ${translateStartTime.toLocaleTimeString() + '.' + translateStartTime.getMilliseconds()}`);
      try {
        translatedPrompt = await YoudaoTranslate.zhToEn(finalPrompt);
        const translateEndTime = new Date();
        const translateTime = (translateEndTime - translateStartTime) / 1000;
        console.log(`[重新生成] 翻译成功: "${translatedPrompt}", 用时: ${translateTime}秒, 时间: ${translateEndTime.toLocaleTimeString() + '.' + translateEndTime.getMilliseconds()}`);
      } catch (error) {
        console.error('[重新生成] 翻译失败:', error);
        translatedPrompt = finalPrompt; // 翻译失败 fallback 到原文
        console.warn(`[重新生成] 使用原文作为提示词: "${translatedPrompt}"`);
      }


      // 使用当前图像作为参考图
      let currentImageUrl = data.image;

      // 完整打印当前分镜图像URL，用于调试
      console.log('[重新生成] 当前分镜图像URL:', currentImageUrl);
      
      // 更新调试面板的参考图像
      // setDebugReferenceImage(currentImageUrl);
      // setShowDebugPanel(true);

      // 添加详细的日志记录
      console.log('[重新生成] data对象内容:', {
        id: data.id,
        image: data.image ? (data.image.substring(0, 30) + '...') : 'undefined', // 只打印部分URL
        imagePrompt: data.imagePrompt,
        styleName: data.styleName
      });
      
      // 检查是否是base64格式的图像数据，或者是否是HTTP链接
      if (currentImageUrl) {
        if (currentImageUrl.startsWith('data:')) {
          console.log('[重新生成] 检测到Data URL格式图像，需要使用风格图像替代');
          // 如果是base64格式，退回到使用风格图像
          currentImageUrl = FalAI.STYLE_URLS[data.styleName || 'style1'] || FalAI.STYLE_URLS.style1;
          console.log(`[重新生成] 改用风格参考图: ${currentImageUrl}`);
        } else if (currentImageUrl.startsWith('http')) {
          console.log('[重新生成] 使用HTTP格式的当前分镜图像作为参考图');
        } else {
          console.log('[重新生成] 检测到非标准图像URL格式，需要使用风格图像替代');
          currentImageUrl = FalAI.STYLE_URLS[data.styleName || 'style1'] || FalAI.STYLE_URLS.style1;
          console.log(`[重新生成] 改用风格参考图: ${currentImageUrl}`);
        }
      } else {
        console.log('[重新生成] 当前图像URL不可用，使用风格图像替代');
        currentImageUrl = FalAI.STYLE_URLS[data.styleName || 'style1'] || FalAI.STYLE_URLS.style1;
        console.log(`[重新生成] 使用风格参考图: ${currentImageUrl}`);
      }

      // 不再添加安全词到提示词
      const finalTranslatedPrompt = `Don't reference the characters in the image, only reference the style of the image, generate a single storyboard frame for me(Do not have an outer frame around the image): ${translatedPrompt}`;

      // console.log(`[重新生成] 开始编辑图像，参考图: ${currentImageUrl}`);
      console.log(`[重新生成] 最终提示词: "${finalTranslatedPrompt}"`);

      // 调用FalAI的图生图API，直接使用当前图像URL
      const apiStartTime = new Date();
      console.log(`[重新生成] 开始调用FalAI API, 时间: ${apiStartTime.toLocaleTimeString() + '.' + apiStartTime.getMilliseconds()}`);
      console.log(`[重新生成] 明确使用当前分镜图像作为参考图: ${currentImageUrl}`);
      
      // 使用max模型进行图像编辑
      const response = await FalAI.generateImageToImage(
        finalTranslatedPrompt, // 使用翻译后的提示词
        currentImageUrl, // 使用当前图像URL作为参考图
        'edit' // 指定使用编辑模型 (kontext/max)
      );

      const apiEndTime = new Date();
      const apiTime = (apiEndTime - apiStartTime) / 1000;
      console.log(`[重新生成] API调用完成, 用时: ${apiTime}秒, 时间: ${apiEndTime.toLocaleTimeString() + '.' + apiEndTime.getMilliseconds()}`);
      
      // 检查响应状态
      console.log('[重新生成] 收到响应:', JSON.stringify(response));
        
      // 从fal.ai API响应中获取图像URL
      if (!response || !response.data || !response.data.images || !response.data.images[0]) {
        console.error('[重新生成] API响应格式不正确:', response);
        throw new Error('未获取到生成的图像URL');
      }

      // 获取生成的图像URL - 从对象中提取url属性
      const imageUrl = response.data.images[0].url;
      console.log('[重新生成] 提取的图像URL:', imageUrl);
      
      // 更新调试面板的生成图像
      // setDebugGeneratedImage(imageUrl);

      // 打印完整响应和图像URL格式，便于调试
      console.log('[重新生成] 完整响应:', response);
      console.log('[重新生成] 返回的图像URL格式:', {
        type: typeof imageUrl,
        isString: typeof imageUrl === 'string',
        value: imageUrl
      });
      
      // 更新调试面板的生成图像
      // setDebugGeneratedImage(imageUrl);

      // 创建新图像对象并预加载，确保图像已经加载完成再更新UI
      const img = new Image();
      img.src = imageUrl;
      
      // 等待图像加载完成或加载失败
      const loadStartTime = new Date();
      console.log(`[重新生成] 开始加载图像, 时间: ${loadStartTime.toLocaleTimeString() + '.' + loadStartTime.getMilliseconds()}`);
      await new Promise((resolve) => {
        img.onload = () => {
          const loadEndTime = new Date();
          const loadTime = (loadEndTime - loadStartTime) / 1000;
          console.log(`[重新生成] 图像预加载成功, 用时: ${loadTime}秒, 时间: ${loadEndTime.toLocaleTimeString() + '.' + loadEndTime.getMilliseconds()}`);
          resolve();
        };
        img.onerror = () => {
          console.warn('[重新生成] 图像预加载失败，将使用原始URL');
          resolve();
        };
        
        // 设置超时，防止无限等待
        setTimeout(resolve, 3000);
      });

        // 更新节点数据
        data.onUpdateNode?.(data.id, {
          image: imageUrl,
        // 不再用编辑提示覆盖原始视觉描述
        // imagePrompt: finalPrompt,
        styleName: data.styleName // 保持原有风格
        });

        setNodeState(NODE_STATES.IMAGE);
    } catch (error) {
      console.error("[重新生成] 图像编辑失败:", error);
      console.error('[重新生成] 错误详情:', error);

      // 如果没有找到图像URL，显示错误并回到编辑状态
      setNodeState(NODE_STATES.IMAGE_EDITING);
    }

    setIsGenerating(false);
  };

  // 添加一个专门用于应用编辑的函数，强制使用当前分镜图像
  const handleApplyEdit = async () => {
    setNodeState(NODE_STATES.GENERATING);
    setIsGenerating(true);
    const startTime = new Date();
    const startTimeStr = startTime.toLocaleTimeString() + '.' + startTime.getMilliseconds();
    console.log(`[应用编辑] 开始应用编辑到图像, 时间: ${startTimeStr}`);

    try {
      // 构建提示词
      const userPrompt = regeneratePrompt || visualPrompt;
      
      // 不再添加安全提示词
      const finalPrompt = userPrompt;
      
      console.log(`[应用编辑] 原始提示词: "${finalPrompt}"`);
      
      // 翻译编辑提示词为英文
      let translatedPrompt;
      const translateStartTime = new Date();
      console.log(`[应用编辑] 开始翻译提示词, 时间: ${translateStartTime.toLocaleTimeString() + '.' + translateStartTime.getMilliseconds()}`);
      try {
        translatedPrompt = await YoudaoTranslate.zhToEn(finalPrompt);
        const translateEndTime = new Date();
        const translateTime = (translateEndTime - translateStartTime) / 1000;
        console.log(`[应用编辑] 翻译成功: "${translatedPrompt}", 用时: ${translateTime}秒, 时间: ${translateEndTime.toLocaleTimeString() + '.' + translateEndTime.getMilliseconds()}`);
      } catch (error) {
        console.error('[应用编辑] 翻译失败:', error);
        translatedPrompt = finalPrompt; // 翻译失败 fallback 到原文
        console.warn(`[应用编辑] 使用原文作为提示词: "${translatedPrompt}"`);
      }

      // 强制使用当前图像作为参考图，无论何种格式
      let currentImageUrl = data.image;

      // 完整打印当前分镜图像URL，用于调试
      console.log('[应用编辑] 当前分镜图像URL:', currentImageUrl);

      // 确保有可用的图像URL
      if (!currentImageUrl) {
        console.error('[应用编辑] 当前分镜没有可用的图像URL，无法应用编辑');
        addToast('当前分镜图像无法编辑，请先生成图像', 'error');
        setNodeState(NODE_STATES.IMAGE_EDITING);
        setIsGenerating(false);
        return;
      }

      // 应用编辑时直接使用翻译后的提示词，无需添加前缀
      const finalTranslatedPrompt = translatedPrompt;

      console.log(`[应用编辑] 最终提示词: "${finalTranslatedPrompt}"`);
      console.log(`[应用编辑] 使用当前分镜图像作为参考图`);

      // 记录API调用开始时间
      const apiCallStartTime = new Date();
      console.log(`[应用编辑] 开始调用FalAI API, 时间: ${apiCallStartTime.toLocaleTimeString() + '.' + apiCallStartTime.getMilliseconds()}`);
      
      // 调用FalAI的图生图API，直接传递当前图像URL，使用编辑模型
      const response = await FalAI.generateImageToImage(
        finalTranslatedPrompt, // 使用翻译后的提示词
        currentImageUrl, // 直接传入当前图像URL
        'edit' // 指定使用编辑模型 (kontext/max)
      );

      // 计算API调用耗时
      const apiCallEndTime = new Date();
      const apiCallDuration = calculateTime(apiCallStartTime, apiCallEndTime);
      console.log(`[应用编辑] API调用完成, 用时: ${apiCallDuration}`);
      
      if (response.referenceImageUrl) {
        console.log('[应用编辑] API实际使用的参考图URL:', response.referenceImageUrl);
      }
      
      // 检查响应状态
      console.log('[应用编辑] 收到响应:', JSON.stringify(response));
        
      // 从fal.ai API响应中获取图像URL
      if (!response || !response.data || !response.data.images || !response.data.images[0]) {
        console.error('[应用编辑] API响应格式不正确:', response);
        throw new Error('未获取到生成的图像URL');
      }

      // 获取生成的图像URL - 从对象中提取url属性
      const imageUrl = response.data.images[0].url;
      console.log('[应用编辑] 提取的图像URL:', imageUrl);
      
      // 记录图像加载开始时间
      const imageLoadStartTime = new Date();
      console.log(`[应用编辑] 开始加载图像, 时间: ${imageLoadStartTime.toLocaleTimeString() + '.' + imageLoadStartTime.getMilliseconds()}`);

      // 创建新图像对象并预加载，确保图像已经加载完成再更新UI
      const img = new Image();
      img.src = imageUrl;
      
      // 等待图像加载完成或加载失败
      await new Promise((resolve) => {
        img.onload = () => {
          const imageLoadEndTime = new Date();
          const imageLoadDuration = calculateTime(imageLoadStartTime, imageLoadEndTime);
          console.log(`[应用编辑] 图像预加载成功, 用时: ${imageLoadDuration}`);
          resolve();
        };
        img.onerror = () => {
          console.warn('[应用编辑] 图像预加载失败，将使用原始URL');
          resolve();
        };
        
        // 设置超时，防止无限等待
        setTimeout(resolve, 3000);
      });

      // 计算总耗时
      const endTime = new Date();
      const totalDuration = calculateTime(startTime, endTime);
      console.log(`[应用编辑] 图像编辑完整流程完成，总耗时: ${totalDuration}`);
      console.log(`[应用编辑] API调用耗时: ${apiCallDuration} | 图像加载耗时: ${calculateTime(imageLoadStartTime, endTime)}`);
      console.log(`[应用编辑] 从API调用到图像返回总耗时: ${calculateTime(apiCallStartTime, endTime)}`);

      // 更新节点数据
      data.onUpdateNode?.(data.id, {
        image: imageUrl,
        // 不再用编辑提示覆盖原始视觉描述
        // imagePrompt: finalPrompt,
        styleName: data.styleName // 保持原有风格
      });

      setNodeState(NODE_STATES.IMAGE);
    } catch (error) {
      console.error("[应用编辑] 图像编辑失败:", error);
      console.error('[应用编辑] 错误详情:', error);

      // 如果没有找到图像URL，显示错误并回到编辑状态
      setNodeState(NODE_STATES.IMAGE_EDITING);
    }

    setIsGenerating(false);
  };

  const handleCancel = () => {
    // 使用安全状态转换，不需要再手动保存
    if (nodeState === NODE_STATES.IMAGE_EDITING) {
      safeSetNodeState(NODE_STATES.IMAGE);
    } else {
      safeSetNodeState(NODE_STATES.COLLAPSED);
    }
  };

  // 删除添加分镜函数 - 不再需要

  // 渲染折叠状态
  const renderCollapsedCard = () => (
    <div className="flex flex-col p-4 min-h-[100px] cursor-pointer" onClick={handleCardClick}>
      <div className="text-xs text-gray-400 font-medium mb-2">{data.label}</div>
      <textarea
        data-no-drag
        value={nodeText}
        readOnly
        placeholder={data.placeholder || "点击此处添加分镜描述..."}
        className="w-full text-sm text-gray-800 resize-none bg-gray-50/50 border-none rounded-md p-2 flex-grow focus:outline-none overflow-hidden"
        style={{ height: 'auto' }}
      />
      <div className="flex justify-center mt-2">
        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );

  // 渲染编辑状态 - 添加简约的右上角关闭按钮
  const renderEditingCard = () => (
    <div className="flex flex-col p-4 relative">
      {/* 简约右上角删除按钮 - 提高z-index */}
      <button
        onClick={() => handleDeleteNode()}
        className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 transition-colors z-50"
        title="删除分镜"
        style={{ pointerEvents: 'auto' }}
      >
        <X size={14} />
      </button>
      
      <div className="text-xs text-gray-400 font-medium mb-2">{data.label}</div>
      <textarea
        data-no-drag
        ref={textAreaRef}
        value={nodeText}
        onChange={handleTextChange}
        onBlur={(e) => {
          handleTextSave();
          data.onTextBlur && data.onTextBlur();
        }}
        onFocus={() => data.onTextFocus && data.onTextFocus()}
        onClick={e => e.stopPropagation()}
        placeholder={data.placeholder || "在此处输入分镜描述..."}
        className="w-full text-sm text-gray-800 bg-gray-50/50 border-gray-100 rounded-md p-2 mb-4 resize-none focus:outline-none focus:ring-1 focus:ring-blue-200 overflow-hidden"
        style={{ height: 'auto' }}
        // 添加更多事件阻止传播，防止文本选择时拖动节点或移动画布
        onMouseDown={e => {
          e.stopPropagation();
          data.onTextFocus && data.onTextFocus();
        }} 
        onTouchStart={e => {
          e.stopPropagation();
          data.onTextFocus && data.onTextFocus();
        }}
        onMouseMove={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
        draggable="false"
      />

      <div className="border-t border-gray-100 pt-4 mt-2">
        <div className="text-xs text-gray-500 mb-2 font-medium">视觉描述</div>
        <textarea
          data-no-drag
          ref={promptTextAreaRef}
          value={visualPrompt}
          onChange={handlePromptChange}
          onBlur={(e) => {
            handlePromptSave();
            data.onPromptBlur && data.onPromptBlur();
          }}
          onFocus={() => data.onPromptFocus && data.onPromptFocus()}
          onClick={e => e.stopPropagation()}
          placeholder="描述画面的视觉元素..."
          className="w-full p-2 text-xs resize-none border-gray-100 focus:border-gray-200 bg-gray-50/50 rounded-md min-h-[60px] focus:outline-none focus:ring-0 overflow-hidden"
          style={{ height: 'auto' }}
          // 添加更多事件阻止传播，防止文本选择时拖动节点或移动画布
          onMouseDown={e => {
            e.stopPropagation();
            data.onTextFocus && data.onTextFocus();
          }} 
          onTouchStart={e => {
            e.stopPropagation();
            data.onTextFocus && data.onTextFocus();
          }}
          onMouseMove={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          draggable="false"
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

  // 渲染生成中状态 - 添加简约的右上角关闭按钮
  const renderGeneratingCard = () => (
    <div className="flex flex-col p-4 relative">
      {/* 简约右上角删除按钮 - 提高z-index */}
      <button
        onClick={() => handleDeleteNode()}
        className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 transition-colors z-50"
        title="删除分镜"
        style={{ pointerEvents: 'auto' }}
      >
        <X size={14} />
      </button>
      
      <div className="text-xs text-gray-400 font-medium mb-3">{data.label}</div>
      <div className="h-32 bg-gray-50 rounded-md flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={24} className="animate-spin text-gray-500 mx-auto mb-2" />
          <div className="text-sm text-gray-600 font-medium">图像生成中</div>
          <div className="text-xs text-gray-500 mt-1">
            请稍候...
          </div>
        </div>
      </div>
      {/* 显示简短的情节描述 */}
      <div className="text-xs text-gray-500 mt-3 line-clamp-1 overflow-hidden">情节: {nodeText.substring(0, 30)}{nodeText.length > 30 ? '...' : ''}</div>
      {/* 显示主要的视觉提示词 */}
      {visualPrompt && (
        <div className="text-sm text-gray-800 mt-2 line-clamp-2 overflow-hidden font-medium">
          提示词: {visualPrompt.substring(0, 50)}{visualPrompt.length > 50 ? '...' : ''}
        </div>
      )}
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
          onLoad={() => console.log(`[图像] 图像加载完成: ${data.image}`)}
          onError={(e) => {
            console.error(`图像加载失败: ${data.image}`);
            e.target.onerror = null; // 防止无限循环
            
            // 使用本地测试图像作为备选
            e.target.src = FalAI.TEST_IMAGE;
          }}
          style={{
            backgroundImage: `url(${FalAI.TEST_IMAGE})`, // 使用测试图像作为背景，在主图像加载前显示
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute top-1.5 right-1.5 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-50" style={{ pointerEvents: 'auto' }}>
          <button
            className="p-1.5 bg-black/60 rounded-full hover:bg-blue-600/80 transform hover:scale-110 transition-all duration-200"
            onClick={handleEditImage}
            title="编辑视觉提示"
          >
            <Edit2 size={12} className="text-white" />
          </button>
          <button
            className="p-1.5 bg-black/60 rounded-full hover:bg-red-600/80 transform hover:scale-110 transition-all duration-200"
            onClick={() => {
              console.log('图片状态下点击删除按钮');
              handleDeleteNode();
            }}
            title="删除节点"
          >
            <X size={12} className="text-white" />
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100"></div>

      <div className="p-3">
        <div className="text-xs text-gray-400 font-medium mb-1">{data.label}</div>
        <textarea
          data-no-drag
          value={nodeText}
          onChange={handleTextChange}
          onBlur={(e) => {
            handleTextSave();
            data.onTextBlur && data.onTextBlur();
          }}
          onFocus={() => data.onTextFocus && data.onTextFocus()}
          onClick={e => e.stopPropagation()}
          placeholder={data.placeholder || "点击此处添加分镜描述..."}
          className="w-full text-sm text-gray-800 resize-none bg-gray-50/50 border-gray-100 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-200 overflow-hidden"
          style={{ height: 'auto', minHeight: '1.5rem', maxHeight: '120px' }}
          rows="1"
          ref={el => {
            if (el) {
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }
          }}
          onMouseDown={e => {
            e.stopPropagation();
            data.onTextFocus && data.onTextFocus();
          }} 
          onTouchStart={e => {
            e.stopPropagation();
            data.onTextFocus && data.onTextFocus();
          }}
          onMouseMove={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          draggable="false"
        />
      </div>
    </div>
  );

  // 修改图片编辑状态的渲染，确保删除按钮在感应区域之上
  const renderImageEditingCard = () => (
    <>
      <div className="flex flex-col relative">
        <div className="relative">
          {/* 简约右上角删除按钮 - 提高z-index */}
          <button
            onClick={() => handleDeleteNode()}
            className="absolute top-1 right-1 z-50 p-1 text-gray-200 hover:text-white bg-black/30 rounded-full transition-colors"
            title="删除分镜"
            style={{ pointerEvents: 'auto' }}
          >
            <X size={14} />
          </button>
          
          <img
            src={data.image}
            alt={data.label}
            className="w-full h-auto aspect-[16/9] object-cover rounded-t-[20px]"
            onLoad={() => console.log(`[图像编辑] 图像加载完成: ${data.image}`)}
            onError={(e) => {
              console.error(`图像加载失败: ${data.image}`);
              e.target.onerror = null; // 防止无限循环
              
              // 使用本地测试图像作为备选
              e.target.src = FalAI.TEST_IMAGE;
            }}
            style={{
              backgroundImage: `url(${FalAI.TEST_IMAGE})`, // 使用测试图像作为背景，在主图像加载前显示
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        </div>

        <div className="border-t border-gray-100"></div>

        {/* 主卡片内容区域 - 包含节点文本和视觉提示词 */}
        <div className="p-3">
          <div className="text-xs text-gray-400 font-medium mb-1">{data.label}</div>
          {/* 使用可编辑的textarea替代div，并添加自动调整高度属性 */}
          <textarea
            data-no-drag
            value={nodeText}
            onChange={handleTextChange}
            onBlur={(e) => {
              handleTextSave();
              data.onTextBlur && data.onTextBlur();
            }}
            onFocus={() => data.onTextFocus && data.onTextFocus()}
            onClick={e => e.stopPropagation()}
            placeholder={data.placeholder || "点击此处添加分镜描述..."}
            className="w-full text-sm text-gray-800 resize-none bg-gray-50/50 border-gray-100 rounded-md p-2 mb-2 focus:outline-none focus:ring-1 focus:ring-blue-200 overflow-hidden"
            style={{ minHeight: '1.5rem', maxHeight: '100px' }}
            rows="1"
            ref={el => {
              if (el) {
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
              }
            }}
            // 添加更多事件阻止传播，防止文本选择时拖动节点或移动画布
            onMouseDown={e => {
              e.stopPropagation();
              data.onTextFocus && data.onTextFocus();
            }} 
            onTouchStart={e => {
              e.stopPropagation();
              data.onTextFocus && data.onTextFocus();
            }}
            onMouseMove={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
            draggable="false"
          />
          
          {/* 视觉提示输入区 */}
          <div className="border-t border-gray-100 pt-2 mt-1">
            <div className="text-xs text-gray-400 font-medium mb-1">视觉描述</div>
            <textarea
              data-no-drag
              value={visualPrompt}
              onChange={handlePromptChange}
              onBlur={(e) => {
                handlePromptSave();
                data.onPromptBlur && data.onPromptBlur();
              }}
              onFocus={() => data.onPromptFocus && data.onPromptFocus()}
              placeholder="描述基础画面元素..."
              className="w-full p-2 text-xs resize-none border-gray-100 focus:border-gray-200 bg-gray-50/50 rounded-md min-h-[40px] focus:outline-none focus:ring-0 overflow-hidden"
              style={{ height: 'auto' }}
              // 添加更多事件阻止传播，防止文本选择时拖动节点或移动画布
              onMouseDown={e => {
                e.stopPropagation();
                data.onTextFocus && data.onTextFocus();
              }} 
              onTouchStart={e => {
                e.stopPropagation();
                data.onTextFocus && data.onTextFocus();
              }}
              onMouseMove={e => e.stopPropagation()}
              onTouchMove={e => e.stopPropagation()}
              draggable="false"
            />
          </div>
          
          {/* 生成按钮 - 调整按钮顺序，缩短文字 */}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleCancel}
              className="py-1 px-3 mr-2 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleGenerateImage}
              className="py-1 px-3 text-xs text-white bg-gray-800 hover:bg-gray-700 rounded-md flex items-center justify-center transition-colors"
            >
              <ImageIcon size={10} className="mr-1" />
              生成
            </button>
          </div>
        </div>
      </div>

      {/* 下方弹出的编辑提示面板 - 只包含画面编辑提示 */}
      <div className="absolute left-0 right-0 top-full w-full mt-2 z-40">
        <div className="bg-white rounded-[20px] shadow-lg overflow-hidden border border-gray-200">
          <div className="p-3">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">画面编辑提示</div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
            <textarea
              data-no-drag
              value={regeneratePrompt}
              onChange={(e) => setRegeneratePrompt(e.target.value)}
              onBlur={() => data.onTextBlur && data.onTextBlur()}
              onFocus={() => data.onTextFocus && data.onTextFocus()}
              onClick={e => e.stopPropagation()}
              placeholder="输入特定修改要求，例如：'添加更多光线'、'改为夜景'"
              className="w-full p-2 text-xs resize-none border-gray-100 focus:border-gray-200 bg-gray-50/50 rounded-md min-h-[60px] focus:outline-none focus:ring-0 mt-1 overflow-hidden"
              style={{ height: 'auto' }}
              // 添加更多事件阻止传播，防止文本选择时拖动节点或移动画布
              onMouseDown={e => {
                e.stopPropagation();
                data.onTextFocus && data.onTextFocus();
              }} 
              onTouchStart={e => {
                e.stopPropagation();
                data.onTextFocus && data.onTextFocus();
              }}
              onMouseMove={e => e.stopPropagation()}
              onTouchMove={e => e.stopPropagation()}
              draggable="false"
            />
          </div>

          <div className="flex bg-gray-50 p-2 border-t border-gray-100">
            <button
              onClick={handleApplyEdit}
              className="w-full py-1.5 text-xs text-white bg-gray-800 hover:bg-gray-700 rounded-md flex items-center justify-center"
            >
              <RefreshCw size={12} className="mr-1" />
              应用编辑
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // 根据当前状态渲染节点内容
  const renderNodeContent = () => {
    switch (nodeState) {
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

  // 修改renderNode函数，确保删除按钮不被感应区域挡住，同时保持悬浮添加分镜功能
  const renderNode = () => (
    <>
      <motion.div
        ref={nodeRef}
        className={`
          bg-white rounded-[20px]
          ${selected ? 'ring-2 ring-blue-500' : ''}
          shadow-[0_4px_12px_rgba(0,0,0,0.1)]
          relative
        `}
        style={{
          width: nodeState === NODE_STATES.COLLAPSED ? NODE_WIDTH.COLLAPSED + 'px' : NODE_WIDTH.EXPANDED + 'px',
          transformOrigin: 'center center',
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
        data-node-width={nodeState === NODE_STATES.COLLAPSED ? NODE_WIDTH.COLLAPSED : NODE_WIDTH.EXPANDED}
        data-node-height={nodeState === NODE_STATES.COLLAPSED ? 100 : 250}
      >
        {/* 展开状态时显示左右移动按钮 */}
        {(nodeState !== NODE_STATES.COLLAPSED) && data.onMoveNode && (
          <MoveNodeButtons
            onMoveLeft={e => { e.stopPropagation(); data.onMoveNode(data.id, 'left'); }}
            onMoveRight={e => { e.stopPropagation(); data.onMoveNode(data.id, 'right'); }}
          />
        )}
        {/* 节点内容 - 不包含在z-index容器中 */}
        {renderNodeContent()}

        {/* 卡片下方的扩展编辑区域 */}
        <div className="absolute left-0 right-0 w-full z-40">
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
                {/* 这里不再需要重复编辑区域，因为我们已经在renderImageEditingCard中实现了 */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>


      
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

  // 返回节点和Toast，Toast放在外部
  return renderNode();
};

export default memo(StoryNode); 