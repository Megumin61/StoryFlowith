import React, { useState, useEffect, useCallback, useRef } from 'react';
// 移除不再需要的ReactFlow组件
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Save, ArrowLeft, Download, Plus, Settings, Zap, AlertTriangle, User, GitFork, CheckCircle, MousePointerClick, Film, Folder, PanelLeft, PanelLeftClose, Edit3, ChevronDown, CornerDownRight } from 'lucide-react';
import StoryNode from './StoryNode';
// 导入Liblib API服务
import LiblibAPI from '../services/liblib';
// 导入FalAI API服务
import FalAI from '../services/falai';
import { liblibConfig } from '../config';
// 导入图像工具函数
import { getPublicImageUrl } from '../services/imageUtils';
// 导入测试图像和风格图
import testImage from '../images/test.png';
import style1Image from '../images/style1.png'; 
import style2Image from '../images/style2.png'; 
import style3Image from '../images/style3.png'; 
import style4Image from '../images/style4.png';

// 风格图的公网URL
const styleUrls = {
  style1: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style1.png",
  style2: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style2.png",
  style3: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style3.png",
  style4: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style4.png",
};

// 风格图本地引用
const styleImages = {
  style1: style1Image,
  style2: style2Image,
  style3: style3Image,
  style4: style4Image,
};

// 中间页面组件 - 参考RefinementPage设计
function StoryboardPreparationPage({ initialStoryText, onComplete }) {
  const [storyScript, setStoryScript] = useState(initialStoryText || '');
  const [selectedStyle, setSelectedStyle] = useState('style1');
  const [frameCount, setFrameCount] = useState(5);
  const [settings, setSettings] = useState({
    aspectRatio: '16:9',
    model: 'pro',
    enableConnections: true,
    enableBranching: true
  });

  const styles = [
    { id: 'style1', label: '动漫风格' },
    { id: 'style2', label: '写实风格' },
    { id: 'style3', label: '水彩风格' },
    { id: 'style4', label: '插画风格' },
  ];

  const handleStartCanvas = () => {
    const config = {
      storyScript,
      selectedStyle,
      frameCount,
      settings
    };
    onComplete(config);
  };

  return (
    <motion.div
      className="absolute inset-0 bg-gray-50 z-40 p-4 sm:p-6 lg:p-8 overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">故事板配置</h1>
          <p className="text-lg text-gray-600 mb-8">配置您的故事板画布设置和风格偏好</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 故事脚本配置 */}
            <div className="bg-gray-50 rounded-xl p-6 border">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="mr-3 text-blue-500" />
                故事脚本
              </h2>
              <textarea
                className="w-full h-64 p-4 bg-white border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-base font-mono"
                value={storyScript}
                onChange={(e) => setStoryScript(e.target.value)}
                placeholder="请输入您的故事脚本或描述..."
              />
              
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分镜数量</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={frameCount}
                    onChange={(e) => setFrameCount(Number(e.target.value))}
                    className="w-24 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 风格和设置配置 */}
            <div className="bg-gray-50 rounded-xl p-6 border">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <Image className="mr-3 text-green-500" />
                视觉风格
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">选择参考风格</label>
                  <div className="grid grid-cols-2 gap-3">
                    {styles.map(style => (
                      <div 
                        key={style.id}
                        className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedStyle === style.id 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedStyle(style.id)}
                      >
                        <div className="aspect-video relative">
                          <img 
                            src={styleImages[style.id]} 
                            alt={style.label}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = testImage;
                            }}
                          />
                          {selectedStyle === style.id && (
                            <div className="absolute top-2 right-2">
                              <div className="bg-blue-500 text-white rounded-full p-1">
                                <CheckCircle className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-2 text-center">
                          <span className="text-sm font-medium text-gray-700">{style.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">画布设置</label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableConnections"
                        checked={settings.enableConnections}
                        onChange={(e) => setSettings(prev => ({...prev, enableConnections: e.target.checked}))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="enableConnections" className="ml-2 text-sm text-gray-600">启用分镜连线</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableBranching"
                        checked={settings.enableBranching}
                        onChange={(e) => setSettings(prev => ({...prev, enableBranching: e.target.checked}))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="enableBranching" className="ml-2 text-sm text-gray-600">启用分支功能</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-between">
            <button
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              返回
            </button>
            <button
              onClick={handleStartCanvas}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <span>开始创建画布</span>
              <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// 左侧边栏组件 - 参考StoryTree设计
function StoryboardTree({ storyData, selectedFrameId, onFrameSelect }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderStoryTree = () => {
    const nodesById = new Map(storyData.map(node => [node.id, node]));
    const childrenOf = new Map();
    
    // 建立连接关系
    storyData.forEach(node => {
      if (node.connections) {
        node.connections.forEach(childId => {
          if (!childrenOf.has(childId)) childrenOf.set(childId, []);
          childrenOf.get(childId).push(node.id);
        });
      }
    });
    
    // 找到根节点
    const rootId = storyData.find(node => !childrenOf.has(node.id))?.id || (storyData.length > 0 ? storyData[0].id : null);
    
    return rootId ? renderPath(rootId, nodesById, childrenOf) : null;
  };
  
  const renderPath = (nodeId, nodesById, childrenOf) => {
    const visited = new Set();
    const mainPath = [];
    let branchCounter = 0;
    
    let currentNodeId = nodeId;
    
    while (currentNodeId && !visited.has(currentNodeId)) {
      const currentNode = nodesById.get(currentNodeId);
      if (!currentNode) break;
      
      visited.add(currentNodeId);
      mainPath.push(currentNode);
      
      if (currentNode.connections && currentNode.connections.length > 0) {
        currentNodeId = currentNode.connections[0];
      } else {
        currentNodeId = null;
      }
    }
    
    return (
      <ul className="space-y-1">
        <li className="px-2 py-1 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Folder className="w-4 h-4 text-gray-500" />
          <span>主要故事线</span>
        </li>
        {mainPath.map((node, index) => {
          const hasBranches = node.connections && node.connections.length > 1;
          
          return (
            <li key={node.id} className={`story-tree-node ${hasBranches ? 'has-branches' : ''} is-main`}>
              <div 
                className={`node-content w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer ${node.id === selectedFrameId ? 'bg-blue-100 border-blue-500' : ''}`}
                onClick={() => onFrameSelect(node.id)}
              >
                <Film className="w-4 h-4 flex-shrink-0 text-gray-500" />
                <span className="flex-grow text-sm text-gray-800 truncate">{node.label || `分镜 ${index + 1}`}</span>
                <span className="flex-shrink-0">📽️</span>
              </div>
              
              {hasBranches && (
                <ul className="branch-container pl-4">
                  {node.connections.slice(1).map((branchId, idx) => {
                    branchCounter++;
                    const branchName = `分支 ${String.fromCharCode(64 + branchCounter)}`;
                    
                    return (
                      <BranchNode 
                        key={branchId} 
                        branchId={branchId}
                        branchName={branchName} 
                        nodesById={nodesById}
                        selectedFrameId={selectedFrameId}
                        onFrameSelect={onFrameSelect}
                      />
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`bg-white/95 backdrop-blur-sm border-r border-gray-200 flex-shrink-0 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-72'}`}>
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 h-16">
        {!isCollapsed && <h2 className="font-bold text-lg text-gray-800">故事结构</h2>}
        <button 
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          onClick={toggleCollapse}
          title={isCollapsed ? "展开侧边栏" : "折叠侧边栏"}
        >
          {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>
      {!isCollapsed && (
        <div className="flex-grow overflow-y-auto p-2">
          {renderStoryTree()}
        </div>
      )}
    </aside>
  );
}

// 分支节点组件
function BranchNode({ branchId, branchName, nodesById, selectedFrameId, onFrameSelect }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  const renderBranchNodes = (nodeId) => {
    const node = nodesById.get(nodeId);
    if (!node) return null;
    
    return (
      <li key={node.id} className="story-tree-node is-branch">
        <div 
          className={`node-content w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer ${node.id === selectedFrameId ? 'bg-blue-100 border-blue-500' : ''}`}
          onClick={() => onFrameSelect(node.id)}
        >
          <Film className="w-4 h-4 flex-shrink-0 text-gray-500" />
          <span className="flex-grow text-sm text-gray-800 truncate">{node.label || '分镜'}</span>
          <span className="flex-shrink-0">📽️</span>
        </div>
        
        {node.connections && node.connections.length > 0 && (
          <ul className="pl-4">
            {node.connections.map(childId => renderBranchNodes(childId))}
          </ul>
        )}
      </li>
    );
  };
  
  return (
    <li>
      <div 
        className="branch-header flex items-center gap-2 p-2 cursor-pointer text-sm font-medium text-yellow-700 bg-yellow-50/80 rounded-md my-1"
        onClick={toggleExpand}
      >
        <CornerDownRight className="w-4 h-4 flex-shrink-0" />
        <span className="flex-grow">{branchName}</span>
        <ChevronDown className={`w-4 h-4 expand-icon transition-transform ${!isExpanded ? 'rotate-180' : ''}`} />
      </div>
      
      <ul className={`branch-content pl-4 border-l-2 border-yellow-200 ${isExpanded ? '' : 'hidden'}`}>
        {renderBranchNodes(branchId)}
      </ul>
    </li>
  );
}

// 故事板画布组件 - 参考Canvas设计，带连线功能
function StoryboardCanvas({ storyData, selectedFrameId, onFrameSelect, onMoveNode, onDeleteNode, onTextSave, onPromptSave, onNodeStateChange }) {
  const canvasWorldRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const isPanningRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const worldPosRef = useRef({ x: 0, y: 0 });
  const lastWorldPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    renderConnections();
    const cleanup = initCanvasControls();
    return cleanup;
  }, [storyData, selectedFrameId]);

  // 监听节点状态变化，重新渲染连接线
  useEffect(() => {
    const timer = setTimeout(() => {
      renderConnections();
    }, 200); // 增加延迟时间，确保DOM完全更新
    
    return () => clearTimeout(timer);
  }, [storyData]);

  // 添加额外的监听器，确保节点状态变化时重新渲染
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTimeout(() => {
        renderConnections();
      }, 100);
    });

    // 监听所有节点元素的变化
    const nodeElements = document.querySelectorAll('[data-node-id]');
    nodeElements.forEach(element => {
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['data-expanded', 'data-node-width', 'data-node-height']
      });
    });

    return () => observer.disconnect();
  }, [storyData]);

  // 监听窗口大小变化，重新渲染连接线
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        renderConnections();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderConnections = () => {
    const svg = document.getElementById('storyboard-connections');
    if (!svg) return;
    
    // 清除现有的连接线，保留defs
    const existingDefs = svg.querySelector('defs');
    const existingPaths = svg.querySelectorAll('path');
    existingPaths.forEach(path => path.remove());
    
    if (!existingDefs) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `
        <marker id="storyboard-arrowhead" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="8" markerHeight="8"
            orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280"></path>
        </marker>
      `;
      svg.appendChild(defs);
    }



    storyData.forEach(fromFrameData => {
      if (fromFrameData.connections && fromFrameData.connections.length > 0) {
        fromFrameData.connections.forEach(toId => {
          const toFrameData = storyData.find(f => f.id === toId);
          if (toFrameData) {
            console.log(`渲染连接线: ${fromFrameData.id} -> ${toFrameData.id}`);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // 动态计算连接点位置 - 连接到节点侧边中心
            const getNodeDimensions = (frameData) => {
              // 检查节点状态，如果是展开状态则使用更大的宽度
              const nodeElement = document.querySelector(`[data-node-id="${frameData.id}"]`);
              if (nodeElement) {
                const nodeWidth = nodeElement.getAttribute('data-node-width');
                const nodeHeight = nodeElement.getAttribute('data-node-height');
                if (nodeWidth && nodeHeight) {
                  return {
                    width: parseInt(nodeWidth),
                    height: parseInt(nodeHeight)
                  };
                }
                // 如果没有获取到高度，使用默认值
                const isExpanded = nodeElement.getAttribute('data-expanded') === 'true';
                return {
                  width: isExpanded ? 360 : 240,
                  height: isExpanded ? 250 : 100
                };
              }
              return { width: 360, height: 250 }; // 默认尺寸
            };

            const fromDimensions = getNodeDimensions(fromFrameData);
            const toDimensions = getNodeDimensions(toFrameData);
            
            // 连接点位置：从节点右侧中心到左侧中心
            const fromX = fromFrameData.pos.x + fromDimensions.width;
            const fromY = fromFrameData.pos.y + fromDimensions.height / 2;
            const toX = toFrameData.pos.x;
            const toY = toFrameData.pos.y + toDimensions.height / 2;
            
            // 调试信息
            console.log(`连线 ${fromFrameData.id} -> ${toFrameData.id}:`, {
              from: { x: fromX, y: fromY, width: fromDimensions.width, height: fromDimensions.height },
              to: { x: toX, y: toY, width: toDimensions.width, height: toDimensions.height }
            });
            
            // 计算贝塞尔曲线控制点
            const distance = Math.abs(toX - fromX);
            const controlX1 = fromX + distance * 0.5;
            const controlY1 = fromY;
            const controlX2 = toX - distance * 0.5;
            const controlY2 = toY;

            line.setAttribute('d', `M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`);
            line.setAttribute('stroke', '#6b7280');
            line.setAttribute('stroke-width', '2.5');
            line.setAttribute('fill', 'none');
            line.setAttribute('marker-end', 'url(#storyboard-arrowhead)');
            line.setAttribute('opacity', '0.8');
            
            svg.appendChild(line);
          }
        });
      }
    });
  };

  const initCanvasControls = () => {
    const canvasContainer = canvasContainerRef.current;
    if (!canvasContainer) return () => {};
    
    const handleMouseDown = (e) => {
      if (e.target.closest('.story-frame')) return;
      isPanningRef.current = true;
      canvasContainer.classList.add('grabbing');
      startPosRef.current = { x: e.clientX, y: e.clientY };
      lastWorldPosRef.current = { ...worldPosRef.current };
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isPanningRef.current) return;
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      worldPosRef.current.x = lastWorldPosRef.current.x + dx;
      worldPosRef.current.y = lastWorldPosRef.current.y + dy;
      
      if (canvasWorldRef.current) {
        canvasWorldRef.current.style.transform = `translate(${worldPosRef.current.x}px, ${worldPosRef.current.y}px)`;
      }
    };

    const handleMouseUp = () => {
      if (!isPanningRef.current) return;
      isPanningRef.current = false;
      canvasContainer.classList.remove('grabbing');
    };

    canvasContainer.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvasContainer.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  };
  
  return (
    <div className="flex-grow h-full overflow-hidden cursor-grab relative" ref={canvasContainerRef}>
      <div className="absolute top-0 left-0" ref={canvasWorldRef}>
        <svg id="storyboard-connections" style={{ position: 'absolute', top: 0, left: 0, width: '5000px', height: '5000px', pointerEvents: 'none' }}></svg>
        <div>
          {storyData.map(frameData => (
            <div 
              key={frameData.id}
              style={{ left: `${frameData.pos.x}px`, top: `${frameData.pos.y}px`, position: 'absolute', width: '360px' }}
              onClick={() => onFrameSelect(frameData.id)}
            >
              <StoryNode 
                data={{
                  ...frameData,
                  onMoveNode,
                  onDeleteNode,
                  onTextSave: (text) => onTextSave(frameData.id, text),
                  onPromptSave: (prompt) => onPromptSave(frameData.id, prompt),
                  onNodeStateChange: (newState) => onNodeStateChange(frameData.id, newState)
                }} 
                selected={frameData.id === selectedFrameId} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// 创建内部组件以使用ReactFlow hooks
function StoryboardFlow({ initialStoryText, onClose }) {
  // 增加中间页面状态
  const [showPreparation, setShowPreparation] = useState(true);
  const [canvasConfig, setCanvasConfig] = useState(null);
  
  // 修改现有状态以适应新布局
  const [storyData, setStoryData] = useState([]);
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('style1');
  const [useRealApi, setUseRealApi] = useState(true);
  const [referenceImageUrl, setReferenceImageUrl] = useState(styleUrls.style1);
  const [apiStatus, setApiStatus] = useState('初始化中...');
  const [lastError, setLastError] = useState(null);

  // 处理准备页面完成
  const handlePreparationComplete = (config) => {
    setCanvasConfig(config);
    setSelectedStyle(config.selectedStyle);
    setReferenceImageUrl(styleUrls[config.selectedStyle]);
    
    // 基于配置生成初始故事数据
    const initialFrames = generateInitialFrames(config);
    setStoryData(initialFrames);
    setShowPreparation(false);
  };

  // 生成初始分镜数据
  const generateInitialFrames = (config) => {
    const frames = [];
    const spacing = 400; // 初始间距
    
    for (let i = 0; i < config.frameCount; i++) {
      frames.push({
        id: `frame-${i}`,
        label: `分镜 ${i + 1}`,
        text: '',
        image: null,
        pos: { x: 100 + i * spacing, y: 150 },
        connections: i < config.frameCount - 1 ? [`frame-${i + 1}`] : [],
        styleName: config.selectedStyle
      });
    }
    return frames;
  };

  // 处理分镜选择
  const handleFrameSelect = (frameId) => {
    setSelectedFrameId(frameId);
  };

  // 删除添加分镜功能 - 不再需要

  // 处理节点移动
  const handleMoveNode = (nodeId, direction) => {
    const currentIndex = storyData.findIndex(frame => frame.id === nodeId);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'left' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'right' && currentIndex < storyData.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return; // 无法移动
    }

    setStoryData(prev => {
      const updated = [...prev];
      // 交换位置
      [updated[currentIndex], updated[newIndex]] = [updated[newIndex], updated[currentIndex]];
      
      // 重新计算所有节点位置
      return updated.map((frame, index) => ({
        ...frame,
        pos: { x: 100 + index * 400, y: 150 },
        connections: index < updated.length - 1 ? [updated[index + 1].id] : []
      }));
    });
  };

  // 处理节点删除
  const handleDeleteNode = (nodeId) => {
    setStoryData(prev => {
      const filtered = prev.filter(frame => frame.id !== nodeId);
      // 重新计算所有节点位置
      return filtered.map((frame, index) => ({
        ...frame,
        pos: { x: 100 + index * 400, y: 150 },
        connections: index < filtered.length - 1 ? [filtered[index + 1].id] : []
      }));
    });
    
    // 如果删除的是当前选中的节点，清除选择
    if (selectedFrameId === nodeId) {
      setSelectedFrameId(null);
    }
  };

  // 处理文本保存
  const handleTextSave = (nodeId, text) => {
    setStoryData(prev => prev.map(frame => 
      frame.id === nodeId ? { ...frame, text } : frame
    ));
  };

  // 处理视觉描述保存
  const handlePromptSave = (nodeId, prompt) => {
    setStoryData(prev => prev.map(frame => 
      frame.id === nodeId ? { ...frame, visualPrompt: prompt } : frame
    ));
  };

  // 处理节点状态变化
  const handleNodeStateChange = (nodeId, newState) => {
    console.log(`节点 ${nodeId} 状态变化为: ${newState}`);
    
    // 触发重新渲染连接线
    setTimeout(() => {
      const svg = document.getElementById('storyboard-connections');
      if (svg) {
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    }, 50);

    // 自适应调整间距
    setTimeout(() => {
      adjustNodeSpacing();
    }, 200);
  };

  // 自适应调整节点间距
  const adjustNodeSpacing = () => {
    setStoryData(prev => {
      const updated = [...prev];
      let totalWidth = 0;
      const nodeWidths = [];

      // 计算每个节点的实际宽度
      updated.forEach((frame, index) => {
        const nodeElement = document.querySelector(`[data-node-id="${frame.id}"]`);
        let width = 360; // 默认宽度
        if (nodeElement) {
          const nodeWidth = nodeElement.getAttribute('data-node-width');
          if (nodeWidth) {
            width = parseInt(nodeWidth);
          }
        }
        nodeWidths.push(width);
        totalWidth += width;
      });

      // 计算间距，确保节点之间有足够的空间
      const minSpacing = 80; // 最小间距
      const totalSpacing = (updated.length - 1) * minSpacing;
      const totalRequiredWidth = totalWidth + totalSpacing;
      
      // 如果总宽度超过画布宽度，调整间距
      const canvasWidth = 1800; // 假设画布宽度
      let spacing = minSpacing;
      if (totalRequiredWidth > canvasWidth) {
        spacing = Math.max(60, (canvasWidth - totalWidth) / (updated.length - 1));
      }

      // 重新计算位置
      let currentX = 100;
      updated.forEach((frame, index) => {
        const newX = currentX;
        const newY = 150;
        
        // 只有当位置发生显著变化时才更新
        if (Math.abs(frame.pos.x - newX) > 10 || Math.abs(frame.pos.y - newY) > 10) {
          frame.pos.x = newX;
          frame.pos.y = newY;
        }
        
        currentX += nodeWidths[index] + spacing;
      });

      return updated;
    });
  };

  // 如果显示准备页面
  if (showPreparation) {
    return (
      <StoryboardPreparationPage 
        initialStoryText={initialStoryText}
        onComplete={handlePreparationComplete}
      />
    );
  }

  // 主画布页面 - 三栏布局
  return (
    <motion.div
      className="absolute inset-0 flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: '#F4F5F7' }}
    >
      {/* 顶部导航栏 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 h-[60px] flex items-center justify-between px-4 z-10">
        <button
          onClick={onClose}
          className="border border-[#007BFF] text-[#007BFF] px-4 py-1.5 rounded text-sm font-medium flex items-center hover:bg-blue-50 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          返回输入页
        </button>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">画布模式 | 支持分支和连线</span>
        </div>
      </div>

      {/* 主要内容区域 - 两栏布局 */}
      <div className="flex-grow flex overflow-hidden">
        {/* 左侧边栏 - 故事树 */}
        <StoryboardTree 
          storyData={storyData}
          selectedFrameId={selectedFrameId}
          onFrameSelect={handleFrameSelect}
        />
        
        {/* 中间画布 */}
        <StoryboardCanvas 
          storyData={storyData}
          selectedFrameId={selectedFrameId}
          onFrameSelect={handleFrameSelect}
          onMoveNode={handleMoveNode}
          onDeleteNode={handleDeleteNode}
          onTextSave={handleTextSave}
          onPromptSave={handlePromptSave}
          onNodeStateChange={handleNodeStateChange}
        />
      </div>

      {/* API状态调试信息 */}
      {apiStatus && (
        <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow-md text-xs max-w-md">
          <div className="text-gray-600">API状态: {apiStatus}</div>
          {lastError && (
            <div className="text-red-600 mt-1">错误: {lastError.message}</div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// 主组件包装器
function StoryboardTest(props) {
  return <StoryboardFlow {...props} />;
}

export default StoryboardTest;