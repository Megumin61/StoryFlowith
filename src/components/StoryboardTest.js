import React, { useState, useEffect, useCallback, useRef } from 'react';
// 移除不再需要的ReactFlow组件
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Image, Save, ArrowLeft, Download, Plus, Settings, Zap, AlertTriangle, User, GitFork, CheckCircle, 
  MousePointerClick, Film, Folder, PanelLeft, PanelLeftClose, Edit3, ChevronDown, CornerDownRight,
  Highlighter, Eye, Trash2, Check, Edit2, Loader2, Sparkles
} from 'lucide-react';
import KeywordSelector from './KeywordSelector';
import PersonaDetail from './PersonaDetail';
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
                              className="px-8 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
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
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1"></path>
        </marker>
      `;
      svg.appendChild(defs);
    }

    storyData.forEach(fromFrameData => {
      if (fromFrameData.connections && fromFrameData.connections.length > 0) {
        fromFrameData.connections.forEach(toId => {
          const toFrameData = storyData.find(f => f.id === toId);
          if (toFrameData) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // 动态计算连接点位置 - 连接到节点侧边中心
            const getNodeDimensions = (frameData) => {
              const nodeElement = document.querySelector(`[data-node-id="${frameData.id}"]`);
              if (nodeElement) {
                const nodeWidth = nodeElement.getAttribute('data-node-width');
                const nodeHeight = nodeElement.getAttribute('data-node-height');
                if (nodeWidth && nodeHeight) {
                  return { width: parseInt(nodeWidth), height: parseInt(nodeHeight) };
                }
                const isExpanded = nodeElement.getAttribute('data-expanded') === 'true';
                return {
                  width: isExpanded ? 360 : 240,
                  height: isExpanded ? 250 : 100
                };
              }
              return { width: 360, height: 250 };
            };

            const fromDimensions = getNodeDimensions(fromFrameData);
            const toDimensions = getNodeDimensions(toFrameData);
            
            // 连接点位置：从节点右侧中心到左侧中心
            const fromX = fromFrameData.pos.x + fromDimensions.width;
            const fromY = fromFrameData.pos.y + fromDimensions.height / 2;
            const toX = toFrameData.pos.x;
            const toY = toFrameData.pos.y + toDimensions.height / 2;
            
            // 计算贝塞尔曲线控制点
            const distance = Math.abs(toX - fromX);
            const controlX1 = fromX + distance * 0.5;
            const controlY1 = fromY;
            const controlX2 = toX - distance * 0.5;
            const controlY2 = toY;

            line.setAttribute('d', `M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`);
            line.setAttribute('stroke', '#cbd5e1'); // slate-300
            line.setAttribute('stroke-width', '2');
            line.setAttribute('stroke-linecap', 'round');
            line.setAttribute('stroke-dasharray', '6 4');
            line.setAttribute('fill', 'none');
            line.setAttribute('marker-end', 'url(#storyboard-arrowhead)');
            line.setAttribute('opacity', '0.9');
            
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
    <div id="canvas-container" className="flex-grow h-full overflow-hidden cursor-grab relative" ref={canvasContainerRef}>
      <div id="canvas-world" className="absolute top-0 left-0" ref={canvasWorldRef}>
        <svg id="storyboard-connections" style={{ position: 'absolute', top: 0, left: 0, width: '5000px', height: '5000px', pointerEvents: 'none' }}></svg>
        <div>
          {storyData.map(frameData => (
            <div 
              key={frameData.id}
              style={{ left: `${frameData.pos.x}px`, top: `${frameData.pos.y}px`, position: 'absolute' }}
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

// 新的合并页面组件 - 用户画像 & 故事线生成
function PersonaStoryPage({ 
  selectedKeywords, 
  personas, 
  setPersonas, 
  onStorySelect,
  onBack 
}) {
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [isEditingPersona, setIsEditingPersona] = useState(false);
  const [storyComposition, setStoryComposition] = useState([]);
  const [generatedStories, setGeneratedStories] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState(null);
  const [storyInput, setStoryInput] = useState('');

  // 关键词类型配置 - 优雅灰色系配色
  const keywordTypes = [
    { id: 'user_traits', name: '🎭 用户特征', color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100', icon: '🎭' },
    { id: 'scenarios', name: '🏠 使用场景', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', icon: '🏠' },
    { id: 'pain_points', name: '😰 痛点问题', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100', icon: '😰' },
    { id: 'emotions', name: '💭 情绪状态', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100', icon: '💭' },
    { id: 'goals', name: '🎯 目标动机', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', icon: '🎯' }
  ];

  // 初始化默认用户画像
  useEffect(() => {
    if (personas.length === 0) {
      const defaultPersona = {
        persona_name: '张敏',
        persona_summary: '35岁银行客户经理，工作繁忙，注重效率',
        persona_details: {
          age: '35岁',
          occupation: '银行客户经理',
          lifestyle: '工作繁忙，经常加班',
          pain_points: ['时间紧张', '手机电量焦虑', '效率流失放大镜效应'],
          goals: ['快速找到适合的菜谱', '节省时间', '缓解育儿愧疚感'],
          behaviors: ['单手持手机推购物车', '底线思维', '量化表达']
        }
      };
      setPersonas([defaultPersona]);
      setSelectedPersona(defaultPersona);
    } else {
      setSelectedPersona(personas[0]);
    }
  }, [personas, setPersonas]);

  // 处理拖拽关键词到故事构思区
  const handleDragStart = (e, keyword) => {
    e.dataTransfer.setData('keyword', JSON.stringify(keyword));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const keywordData = e.dataTransfer.getData('keyword');
    if (keywordData) {
      const keyword = JSON.parse(keywordData);
      // 只添加到组合列表中，不修改文本框内容
      if (!storyComposition.find(item => item.id === keyword.id)) {
        setStoryComposition(prev => [...prev, keyword]);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // 移除故事构思中的关键词
  const removeFromComposition = (keywordId) => {
    setStoryComposition(prev => prev.filter(item => item.id !== keywordId));
  };

  // 生成故事脚本
  const generateStories = async () => {
    if (storyComposition.length === 0) return;
    
    setIsGenerating(true);
    
    // 模拟生成多个故事脚本
    setTimeout(() => {
      const stories = [
        {
          id: 'story-1',
          title: '超市购物的效率困境',
          content: `故事背景：
张敏下班后匆忙赶到超市，手机电量已经不足20%。她需要在30分钟内完成采购并回家准备晚餐。

主要情节：
1. 张敏单手推着购物车，另一手拿着手机搜索菜谱
2. 应用推荐的菜谱需要她没有的调料，让她感到焦虑
3. 手机电量警告弹出，她开始慌张地寻找充电宝
4. 最终选择了最简单的方案：买现成的半成品

故事结局：
虽然解决了当天的问题，但张敏意识到需要一个更智能的购物助手。`,
          tags: ['效率', '焦虑', '妥协'],
          score: 85
        },
        {
          id: 'story-2',
          title: '时间与品质的平衡',
          content: `故事背景：
周末的张敏想要为家人准备一顿丰盛的晚餐，但仍然受到时间限制的困扰。

主要情节：
1. 张敏在家中规划菜单，考虑家人的喜好和营养需求
2. 她使用量化思维："15分钟准备，30分钟烹饪"
3. 在超市中，她发现计划与现实的差距
4. 通过灵活调整，最终找到了平衡点

故事结局：
张敏学会了在效率和品质之间找到平衡，家人也很满意这顿饭。`,
          tags: ['平衡', '规划', '满足'],
          score: 92
        },
        {
          id: 'story-3',
          title: '技术焦虑与人性化需求',
          content: `故事背景：
张敏尝试使用新的烹饪应用，但发现技术并不总是能理解人的真实需求。

主要情节：
1. 应用的复杂界面让她感到困惑
2. 推荐算法忽视了她的实际情况
3. 她开始怀疑技术是否真的能帮助她
4. 最终她找到了更适合自己的使用方式

故事结局：
张敏意识到技术需要更人性化，同时她也学会了更好地表达自己的需求。`,
          tags: ['技术', '人性化', '适应'],
          score: 78
        }
      ];
      setGeneratedStories(stories);
      setIsGenerating(false);
    }, 2000);
  };

  // 选择故事脚本
  const selectStory = (story) => {
    setSelectedStoryId(story.id);
  };

  // 确认选择故事并进入下一步
  const confirmStorySelection = () => {
    const selectedStory = generatedStories.find(s => s.id === selectedStoryId);
    if (selectedStory) {
      onStorySelect(selectedStory);
    }
  };

  // 编辑用户画像
  const editPersona = () => {
    setIsEditingPersona(true);
  };

  // 保存用户画像编辑
  const savePersonaEdit = (updatedPersona) => {
    setPersonas(prev => prev.map(p => 
      p.persona_name === selectedPersona.persona_name ? updatedPersona : p
    ));
    setSelectedPersona(updatedPersona);
    setIsEditingPersona(false);
  };

  return (
    <div className="h-full flex bg-gray-50 gap-6 p-6 overflow-hidden relative">
      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>
      {/* 左侧 - 用户画像卡片 */}
      <div className="w-72 flex flex-col">
        {selectedPersona && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
            {/* 卡片头部 */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white relative">
              <button
                onClick={editPersona}
                className="absolute top-4 right-4 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              
              {/* 人物头像 */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedPersona.persona_name}</h3>
                  <p className="text-white/80 text-sm">{selectedPersona.persona_details.age} • {selectedPersona.persona_details.occupation}</p>
                </div>
              </div>
            </div>
            
            {/* 卡片内容 - 更专注于个人信息 */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* 基本信息 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  基本信息
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">年龄</span>
                    <span className="font-medium">{selectedPersona.persona_details.age}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">职业</span>
                    <span className="font-medium">{selectedPersona.persona_details.occupation}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">生活方式</span>
                    <p className="text-gray-800 mt-1">{selectedPersona.persona_details.lifestyle}</p>
                  </div>
                </div>
              </div>

              {/* 个人特征 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  行为特征
                </h4>
                <div className="space-y-2">
                  {selectedPersona.persona_details.behaviors.map((behavior, idx) => (
                    <div key={idx} className="text-xs bg-purple-50 text-purple-700 px-3 py-2 rounded-lg border border-purple-100">
                      {behavior}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 痛点问题 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  主要痛点
                </h4>
                <div className="space-y-2">
                  {selectedPersona.persona_details.pain_points.map((point, idx) => (
                    <div key={idx} className="text-xs bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-100">
                      {point}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 目标动机 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  目标动机
                </h4>
                <div className="space-y-2">
                  {selectedPersona.persona_details.goals.map((goal, idx) => (
                    <div key={idx} className="text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-100">
                      {goal}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 中间 - 故事构思区和故事脚本预览 */}
      <div className="flex-1 flex flex-col space-y-6 min-h-0">
        {/* 故事构思区卡片 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 flex items-center">
              <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-2 text-sm">
                ✨
              </div>
              故事构思区
            </h2>
            <button
              onClick={generateStories}
              disabled={storyComposition.length === 0 || isGenerating}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  生成故事
                </>
              )}
            </button>
          </div>
          
          <div className="p-4">            
            {/* 已选择的关键词显示 - 移到文本框上方 */}
            {storyComposition.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">重点关注</span>
                  <div className="flex-1 h-px bg-gray-200 ml-3"></div>
                </div>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {storyComposition.map(keyword => (
                    <div
                      key={keyword.id}
                      className="flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs border border-gray-200 hover:bg-gray-50 transition-colors flex-shrink-0"
                    >
                      <span className="mr-1">{keyword.text}</span>
                      <button
                        onClick={() => removeFromComposition(keyword.id)}
                        className="text-gray-400 hover:text-gray-600 ml-1 text-sm leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 可输入的文本框 */}
            <div>
              <textarea
                value={storyInput}
                onChange={(e) => setStoryInput(e.target.value)}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                placeholder="在这里输入您的故事构思，或者将右侧的关键词气泡拖拽到上方的重点关注区域..."
                className="w-full h-20 p-3 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-gray-400 hover:bg-gray-100/50 transition-all duration-200 resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 故事脚本预览区域 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 min-h-0 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 flex items-center">
              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-2 text-sm">
                📚
              </div>
              故事脚本预览
            </h2>
            
            {/* 选择故事按钮 - 移到右上角 */}
            {selectedStoryId && (
              <button
                onClick={confirmStorySelection}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 hover:shadow-md transition-all font-medium text-sm"
              >
                选择此故事并继续
              </button>
            )}
            
            {/* 未选择故事时的禁用按钮 */}
            {!selectedStoryId && generatedStories.length > 0 && (
              <button
                disabled
                className="bg-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed font-medium text-sm"
              >
                选择此故事并继续
              </button>
            )}
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            {generatedStories.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📖</span>
                </div>
                <p className="text-lg font-medium mb-2">等待故事生成</p>
                <p className="text-sm">选择关键词并点击生成故事按钮</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {generatedStories.map(story => (
                  <div
                    key={story.id}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedStoryId === story.id 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => selectStory(story)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-base">{story.title}</h3>
                      {selectedStoryId === story.id && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 line-clamp-6 leading-relaxed">
                      {story.content.split('\n\n')[0]}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧 - 关键词气泡池 */}
      <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 flex items-center">
            <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-2 text-sm">
              🏷️
            </div>
            关键词气泡池
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {keywordTypes.map(type => {
              const typeKeywords = selectedKeywords.filter(k => k.type === type.id);
              if (typeKeywords.length === 0) return null;

              return (
                <div key={type.id}>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${type.color.includes('slate') ? 'bg-slate-400' : 
                      type.color.includes('amber') ? 'bg-amber-400' :
                      type.color.includes('rose') ? 'bg-rose-400' :
                      type.color.includes('indigo') ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                    {type.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {typeKeywords.map(keyword => (
                      <div
                        key={keyword.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, keyword)}
                        className={`${type.color} px-3 py-2 rounded-2xl text-sm font-medium cursor-move hover:shadow-md hover:scale-105 transition-all duration-200 border-2 flex items-center space-x-2`}
                      >
                        <span className="text-base">{type.icon}</span>
                        <span>{keyword.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 用户画像编辑弹窗 */}
      {isEditingPersona && selectedPersona && (
        <PersonaEditModal
          persona={selectedPersona}
          personas={personas}
          onSave={savePersonaEdit}
          onClose={() => setIsEditingPersona(false)}
        />
      )}
    </div>
  );
}

// 用户画像编辑弹窗组件
function PersonaEditModal({ persona, personas = [], onSave, onClose }) {
  const [editedPersona, setEditedPersona] = useState(persona);
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedPersonaIndex, setSelectedPersonaIndex] = useState(
    personas.findIndex(p => p.id === persona.id) || 0
  );

  const handleSave = () => {
    onSave(editedPersona);
  };

  const updatePersonaField = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditedPersona(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditedPersona(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // 添加数组项目
  const addArrayItem = (field, newItem = '') => {
    const currentArray = field.includes('.') 
      ? editedPersona.persona_details[field.split('.')[1]] 
      : editedPersona[field];
    const updatedArray = [...currentArray, newItem];
    updatePersonaField(field, updatedArray);
  };

  // 更新数组项目
  const updateArrayItem = (field, index, value) => {
    const currentArray = field.includes('.') 
      ? editedPersona.persona_details[field.split('.')[1]] 
      : editedPersona[field];
    const updatedArray = currentArray.map((item, i) => i === index ? value : item);
    updatePersonaField(field, updatedArray);
  };

  // 删除数组项目
  const removeArrayItem = (field, index) => {
    const currentArray = field.includes('.') 
      ? editedPersona.persona_details[field.split('.')[1]] 
      : editedPersona[field];
    const updatedArray = currentArray.filter((_, i) => i !== index);
    updatePersonaField(field, updatedArray);
  };

  // 添加自定义维度功能
  const [customDimensions, setCustomDimensions] = useState([]);
  const [newDimensionName, setNewDimensionName] = useState('');
  const [showAddDimension, setShowAddDimension] = useState(false);

  const tabs = [
    { id: 'basic', name: '基本信息', icon: '👤' },
    { id: 'pain_points', name: '痛点问题', icon: '⚠️' },
    { id: 'goals', name: '目标动机', icon: '🎯' },
    { id: 'behaviors', name: '行为特征', icon: '🎭' },
    ...customDimensions.map(dim => ({
      id: `custom_${dim.id}`,
      name: dim.name,
      icon: '📝',
      isCustom: true
    }))
  ];

  // 切换用户画像
  const switchPersona = (index) => {
    setSelectedPersonaIndex(index);
    setEditedPersona(personas[index]);
  };

  // 添加自定义维度
  const addCustomDimension = () => {
    if (newDimensionName.trim()) {
      const newDimension = {
        id: Date.now().toString(),
        name: newDimensionName.trim()
      };
      setCustomDimensions(prev => [...prev, newDimension]);
      
      // 在editedPersona中初始化这个维度
      const dimensionKey = `custom_${newDimension.id}`;
      setEditedPersona(prev => ({
        ...prev,
        persona_details: {
          ...prev.persona_details,
          [dimensionKey]: []
        }
      }));
      
      setNewDimensionName('');
      setShowAddDimension(false);
      setActiveTab(`custom_${newDimension.id}`);
    }
  };

  // 删除自定义维度
  const removeCustomDimension = (dimensionId) => {
    setCustomDimensions(prev => prev.filter(dim => dim.id !== dimensionId));
    
    // 从editedPersona中删除这个维度
    const dimensionKey = `custom_${dimensionId}`;
    setEditedPersona(prev => {
      const { [dimensionKey]: removed, ...restDetails } = prev.persona_details;
      return {
        ...prev,
        persona_details: restDetails
      };
    });
    
    // 如果当前激活的是被删除的维度，切换到基本信息
    if (activeTab === `custom_${dimensionId}`) {
      setActiveTab('basic');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col border border-gray-200">
        {/* 头部 */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">用户画像编辑</h2>
                  <p className="text-sm text-gray-600">{editedPersona.persona_name}</p>
                </div>
              </div>
              
              {/* 多用户画像切换 */}
              {personas.length > 1 && (
                <div className="flex items-center space-x-2 ml-8">
                  <span className="text-sm text-gray-500">选择画像:</span>
                  <div className="flex space-x-1">
                    {personas.map((p, index) => (
                      <button
                        key={p.id}
                        onClick={() => switchPersona(index)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                          selectedPersonaIndex === index
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {p.persona_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 左侧标签栏 */}
          <div className="w-56 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-1">
              {tabs.map(tab => (
                <div key={tab.id} className="flex items-center">
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left ${
                      activeTab === tab.id
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium text-sm">{tab.name}</span>
                  </button>
                  {tab.isCustom && (
                    <button
                      onClick={() => removeCustomDimension(tab.id.replace('custom_', ''))}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="删除此维度"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              {/* 添加维度按钮 */}
              <div className="pt-2 border-t border-gray-200 mt-4">
                {!showAddDimension ? (
                  <button
                    onClick={() => setShowAddDimension(true)}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-gray-500 hover:bg-gray-50 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="font-medium text-sm">添加维度</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newDimensionName}
                      onChange={(e) => setNewDimensionName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomDimension()}
                      placeholder="维度名称"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={addCustomDimension}
                        className="flex-1 px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs hover:bg-gray-800"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => {
                          setShowAddDimension(false);
                          setNewDimensionName('');
                        }}
                        className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md text-xs hover:bg-gray-50"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">姓名</label>
                      <input
                        type="text"
                        value={editedPersona.persona_name}
                        onChange={(e) => updatePersonaField('persona_name', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                        placeholder="输入用户姓名"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">年龄</label>
                      <input
                        type="text"
                        value={editedPersona.persona_details.age}
                        onChange={(e) => updatePersonaField('persona_details.age', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                        placeholder="例：35岁"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">职业</label>
                    <input
                      type="text"
                      value={editedPersona.persona_details.occupation}
                      onChange={(e) => updatePersonaField('persona_details.occupation', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                      placeholder="例：银行客户经理"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">概要描述</label>
                    <textarea
                      value={editedPersona.persona_summary}
                      onChange={(e) => updatePersonaField('persona_summary', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                      rows="3"
                      placeholder="简要描述用户的基本情况和特点"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">生活方式</label>
                    <textarea
                      value={editedPersona.persona_details.lifestyle}
                      onChange={(e) => updatePersonaField('persona_details.lifestyle', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                      rows="3"
                      placeholder="描述用户的日常生活方式和习惯"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'pain_points' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">主要痛点</h3>
                    <button
                      onClick={() => addArrayItem('persona_details.pain_points', '')}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加痛点</span>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {editedPersona.persona_details.pain_points.map((point, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-sm font-medium">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => updateArrayItem('persona_details.pain_points', index, e.target.value)}
                          className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-400 text-sm"
                          placeholder="描述用户的痛点"
                        />
                        <button
                          onClick={() => removeArrayItem('persona_details.pain_points', index)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'goals' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">目标动机</h3>
                    <button
                      onClick={() => addArrayItem('persona_details.goals', '')}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加目标</span>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {editedPersona.persona_details.goals.map((goal, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-sm font-medium">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={goal}
                          onChange={(e) => updateArrayItem('persona_details.goals', index, e.target.value)}
                          className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-400 text-sm"
                          placeholder="描述用户的目标"
                        />
                        <button
                          onClick={() => removeArrayItem('persona_details.goals', index)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'behaviors' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">行为特征</h3>
                    <button
                      onClick={() => addArrayItem('persona_details.behaviors', '')}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加特征</span>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {editedPersona.persona_details.behaviors.map((behavior, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-sm font-medium">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={behavior}
                          onChange={(e) => updateArrayItem('persona_details.behaviors', index, e.target.value)}
                          className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-400 text-sm"
                          placeholder="描述用户的行为特征"
                        />
                        <button
                          onClick={() => removeArrayItem('persona_details.behaviors', index)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 自定义维度内容 */}
              {activeTab.startsWith('custom_') && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {customDimensions.find(dim => `custom_${dim.id}` === activeTab)?.name || '自定义维度'}
                    </h3>
                    <button
                      onClick={() => addArrayItem(`persona_details.${activeTab}`, '')}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加条目</span>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {(editedPersona.persona_details[activeTab] || []).map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-sm font-medium">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateArrayItem(`persona_details.${activeTab}`, index, e.target.value)}
                          className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-400 text-sm"
                          placeholder="输入内容"
                        />
                        <button
                          onClick={() => removeArrayItem(`persona_details.${activeTab}`, index)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部按钮 - 固定在底部 */}
        <div className="flex-shrink-0 p-6 bg-white border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            保存修改
          </button>
        </div>
      </div>
    </div>
  );
}

// 访谈查看弹窗组件
function InterviewViewerModal({ interviews = [], index = 0, setIndex, onClose }) {
  const current = interviews[index] || {};
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col border border-gray-200">
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-gray-900 text-sm">访谈记录</span>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => setIndex(Math.max(0, index - 1))}
            disabled={index === 0}
            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一条
          </button>
          <div className="text-sm text-gray-600">
            {index + 1} / {interviews.length} · {current.title} · {current.date}
          </div>
          <button
            onClick={() => setIndex(Math.min(interviews.length - 1, index + 1))}
            disabled={index === interviews.length - 1}
            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一条
          </button>
        </div>
        <div className="px-6 pb-6 flex-1 overflow-y-auto">
          {(current.text || '').split('\n').map((paragraph, i) => (
            <p key={i} className="mb-3 text-gray-700 leading-relaxed">{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// 删除重复的组件定义

// 删除StoryboardPreparationPage组件
// function StoryboardPreparationPage({ initialStoryText, onComplete }) {
//   // ... 删除整个组件
// }

// 创建内部组件以使用ReactFlow hooks
function StoryboardFlow({ initialStoryText, onClose }) {
  // 增加多步骤流程状态
  const [currentStep, setCurrentStep] = useState('interview'); // 'interview', 'persona', 'story', 'preparation', 'canvas'
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
  
  // 自定义选择
  const contentRef = useRef(null);
  const isDraggingRef = useRef(false);
  const anchorRangeRef = useRef(null);
  const lastSelectedTextRef = useRef('');
  const lastSelectedRectRef = useRef(null);
  const [dragHighlightRects, setDragHighlightRects] = useState([]);
  
  // 原有的分镜画布状态
  const [storyData, setStoryData] = useState([]);
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('style1');
  const [useRealApi, setUseRealApi] = useState(true);
  const [referenceImageUrl, setReferenceImageUrl] = useState(styleUrls.style1);
  const [apiStatus, setApiStatus] = useState('初始化中...');
  const [lastError, setLastError] = useState(null);

  // 画布页额外状态
  const [isCanvasPersonaModalOpen, setIsCanvasPersonaModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeKeywordTypeCanvas, setActiveKeywordTypeCanvas] = useState('all');

  // 根据当前节点实际宽度动态排布，保持等距
  const reflowNodesEvenly = useCallback(() => {
    const BASE_LEFT = 100;
    const GAP = 40; // 固定间隔（相邻卡片之间的水平空隙）
    setStoryData(prev => {
      let currentX = BASE_LEFT;
      const updated = prev.map((frame, index, arr) => {
        const el = document.querySelector(`[data-node-id="${frame.id}"]`);
        const widthAttr = el?.getAttribute('data-node-width');
        const width = widthAttr ? parseInt(widthAttr) : (frame.state && frame.state !== 'collapsed' ? 360 : 240);
        const newFrame = {
          ...frame,
          pos: { x: currentX, y: 150 },
          connections: index < arr.length - 1 ? [arr[index + 1].id] : []
        };
        currentX += width + GAP;
        return newFrame;
      });
      return updated;
    });
  }, []);

  // 模拟多份访谈记录数据
  const interviewDataList = [
    {
      id: 1,
      title: "张敏 - 银行客户经理",
      date: "2024-01-15",
      text: `张敏是一位35岁的银行客户经理，每天工作繁忙。她经常在下班后去超市采购食材，但总是面临时间紧张的问题。

"当手机电量比我的耐心先耗尽时，任何精致菜谱都成了讽刺漫画。" 张敏这样描述她的烹饪应用使用体验。她希望能在超市现场快速找到适合的菜谱，但现有的应用推荐算法往往忽视了她实际的时间和库存限制。

在通勤后的超市采购时段（18:30-19:30），她经常单手持手机同时推购物车，处于分心状态。手机低电量警告让她感到焦虑，她潜意识里还在计算明日早餐的准备时间。

张敏对效率流失存在放大镜效应，会为节省2分钟额外支付10元钱。她对进度条和倒计时产生条件反射焦虑，在工具失效时会立即启动备选方案。她将饮食管理视为家庭责任延伸，用工具选择缓解育儿愧疚感。

她常用"至少""起码"等底线思维词汇，倾向量化表达（"15分钟""3种食材"），抱怨时夹杂自嘲式幽默，对营销话术异常敏感。`,
      keywords: []
    },
    {
      id: 2,
      title: "李华 - IT工程师",
      date: "2024-01-16",
      text: `李华是一名28岁的IT工程师，单身，经常加班到深夜。他对于烹饪应用的需求主要集中在简单易做的快手菜。

"我需要的不是米其林三星的复杂菜谱，而是能在15分钟内搞定的营养餐。" 李华表示，他更关注食材的营养搭配和制作效率。

作为一个理性的用户，李华会仔细研究每个菜谱的营养成分和制作时间。他希望应用能够根据他现有的食材智能推荐菜谱，避免频繁购买新食材的麻烦。

李华对于应用的界面设计很敏感，他不喜欢过于花哨的设计，更偏向简洁实用的界面。他经常在深夜使用应用，因此对暗色模式有强烈需求。

他习惯用数据说话，会记录每道菜的制作时间和满意度，并根据这些数据调整自己的菜谱选择。`,
      keywords: []
    },
    {
      id: 3,
      title: "王芳 - 全职妈妈",
      date: "2024-01-17", 
      text: `王芳是一位32岁的全职妈妈，有两个孩子，日常需要为全家准备三餐。她对烹饪应用的需求更多样化，既要考虑营养搭配，也要照顾家人的口味偏好。

"孩子们挑食，老公又想减肥，我自己还要控制血糖，一顿饭要满足这么多需求真的很头疼。" 王芳希望应用能够提供个性化的家庭菜谱推荐。

她经常在菜市场使用应用，需要根据当天的新鲜食材临时调整菜谱。王芳很看重其他用户的评价和心得分享，她认为这比专业厨师的建议更实用。

王芳喜欢在应用中记录家人对每道菜的反馈，并希望应用能够学习这些偏好，逐渐优化推荐内容。她也经常在妈妈群里分享好用的菜谱，社交功能对她很重要。

时间管理对王芳来说是个挑战，她希望能够提前规划一周的菜谱，并自动生成购物清单。`,
      keywords: []
    }
  ];

  // 当前选中的访谈记录
  const [currentInterviewIndex, setCurrentInterviewIndex] = useState(0);
  const currentInterview = interviewDataList[currentInterviewIndex];
  
  // 切换访谈记录时重置关键词
  useEffect(() => {
    setSelectedKeywords(currentInterview.keywords || []);
  }, [currentInterviewIndex]);

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
        const generatedStory = `基于您的想法生成的故事脚本
"${initialStoryText}"

故事背景
[在这里描述故事发生的背景和环境]

主要情节
[在这里描述故事的主要情节发展]

故事结局
[在这里描述故事的结局和寓意]
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
  }, [initialStoryText]);

  // 处理文本选择（兜底）
  const handleTextSelection = (e) => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';
    if (selectedText) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const x = rect.left + window.scrollX;
      const y = rect.bottom + window.scrollY + 8;

      setKeywordSelector({
        show: true,
        text: selectedText,
        position: { x, y }
      });

      setTimeout(() => {
        try { selection.removeAllRanges(); } catch {}
      }, 0);
    }
  };

  // 自定义拖拽选区
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

    // 清空旧高亮
    setDragHighlightRects([]);

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

      evt.preventDefault();
    };

    const handleUp = (evt) => {
      if (!isDraggingRef.current) return cleanup();
      const focus = getCaretRangeFromPoint(evt.clientX, evt.clientY);
      if (focus && anchorRangeRef.current) {
        const range = document.createRange();
        const a = anchorRangeRef.current;
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
    const updatedKeywords = [...selectedKeywords, newKeyword];
    setSelectedKeywords(updatedKeywords);
    
    // 同时更新到当前访谈记录中
    const updatedInterviewList = [...interviewDataList];
    updatedInterviewList[currentInterviewIndex].keywords = updatedKeywords;
    // 这里可以添加保存到本地存储或发送到服务器的逻辑
  };

  // 移除关键词
  const removeKeyword = (keywordId) => {
    const updatedKeywords = selectedKeywords.filter(k => k.id !== keywordId);
    setSelectedKeywords(updatedKeywords);
    
    // 同时更新到当前访谈记录中
    const updatedInterviewList = [...interviewDataList];
    updatedInterviewList[currentInterviewIndex].keywords = updatedKeywords;
    // 这里可以添加保存到本地存储或发送到服务器的逻辑
  };

  // 生成用户画像
  const generatePersonas = () => {
    // 模拟生成用户画像
    const generatedPersonas = [
      {
        persona_name: '张敏',
        persona_summary: '35岁银行客户经理，工作繁忙，注重效率',
        persona_details: {
          age: '35岁',
          occupation: '银行客户经理',
          lifestyle: '工作繁忙，经常加班',
          pain_points: ['时间紧张', '手机电量焦虑', '效率流失放大镜效应'],
          goals: ['快速找到适合的菜谱', '节省时间', '缓解育儿愧疚感'],
          behaviors: ['单手持手机推购物车', '底线思维', '量化表达']
        }
      }
    ];
    setPersonas(generatedPersonas);
    setCurrentStep('persona-story');
  };

  // 处理故事选择
  const handleStorySelect = (selectedStory) => {
    setStory(selectedStory.content);
    // 基于选择的故事生成初始故事数据
    const initialFrames = generateInitialFrames({
      storyScript: selectedStory.content,
      selectedStyle: 'style1',
      frameCount: 5,
      settings: {
        aspectRatio: '16:9',
        model: 'pro',
        enableConnections: true,
        enableBranching: true
      }
    });
    setStoryData(initialFrames);
    setCurrentStep('canvas');
    // 初始进入画布后进行一次等距排布
    setTimeout(() => reflowNodesEvenly(), 50);
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
    // 交换顺序后按实际宽度重新排布
    setTimeout(() => reflowNodesEvenly(), 0);
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
    // 删除后重新排布
    setTimeout(() => reflowNodesEvenly(), 0);
  };

  // 处理文本保存
  const handleTextSave = (nodeId, text) => {
    setStoryData(prev => 
      prev.map(frame => 
      frame.id === nodeId ? { ...frame, text } : frame
      )
    );
  };

  // 处理提示词保存
  const handlePromptSave = (nodeId, prompt) => {
    setStoryData(prev => 
      prev.map(frame => 
        frame.id === nodeId ? { ...frame, prompt } : frame
      )
    );
  };

  // 处理节点状态变化
  const handleNodeStateChange = (nodeId, newState) => {
    setStoryData(prev => prev.map(frame => frame.id === nodeId ? { ...frame, state: newState } : frame));
    // 状态变化会影响宽度，等下一帧读取真实宽度后再排布
    setTimeout(() => reflowNodesEvenly(), 50);
  };

  // 调整节点间距
  const adjustNodeSpacing = () => {
    reflowNodesEvenly();
  };

  // 渲染访谈记录处理页面
  const renderInterviewStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 访谈记录 */}
      <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
        {/* 访谈记录标题和翻页控制 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <User className="mr-2 text-blue-500" />
            用户访谈记录
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Highlighter className="w-4 h-4" />
              <span>圈选关键词</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentInterviewIndex(Math.max(0, currentInterviewIndex - 1))}
                disabled={currentInterviewIndex === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <span className="text-sm text-gray-600">
                {currentInterviewIndex + 1} / {interviewDataList.length}
              </span>
              <button
                onClick={() => setCurrentInterviewIndex(Math.min(interviewDataList.length - 1, currentInterviewIndex + 1))}
                disabled={currentInterviewIndex === interviewDataList.length - 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        </div>
        
        {/* 当前访谈记录信息 */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-800">{currentInterview.title}</h3>
            <span className="text-sm text-gray-500">{currentInterview.date}</span>
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
          {currentInterview.text.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          已提取 {selectedKeywords.length} 个关键词
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
        <div className="mt-4 border-t border-gray-200 pt-4">
          <button
            onClick={generatePersonas}
            disabled={selectedKeywords.length === 0}
            className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            生成用户画像
          </button>
        </div>
      </div>
    </div>
  );

  // 旧的渲染函数已删除

  // 渲染画布页面
  const renderCanvasStep = () => (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-800">分镜画布</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>风格: {selectedStyle}</span>
            <span>•</span>
            <span>{storyData.length} 个分镜</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentStep('persona-story')}
            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            返回上一步
          </button>
          <button
            onClick={() => setIsCanvasPersonaModalOpen(true)}
            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            查看画像
          </button>
          <button
            onClick={() => setIsInterviewModalOpen(true)}
            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            查看访谈
          </button>
          <button
            onClick={adjustNodeSpacing}
            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            调整间距
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>



      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 中间画布区域（全宽） */}
        <div className="flex-1 relative overflow-hidden">
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

          {/* 悬浮侧栏：结构 + 关键词分类气泡 */}
          <div className="absolute left-4 top-4 z-10 w-80 rounded-2xl shadow-lg bg-white/95 backdrop-blur border border-gray-200">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-medium text-gray-800 text-sm">故事结构</span>
              <button
                onClick={() => setIsSidebarCollapsed(v => !v)}
                className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 rounded-md hover:bg-gray-100"
              >
                {isSidebarCollapsed ? '展开' : '收起'}
              </button>
            </div>
            {!isSidebarCollapsed && (
              <div className="max-h-64 overflow-y-auto p-2">
                <StoryboardTree 
                  storyData={storyData}
                  selectedFrameId={selectedFrameId}
                  onFrameSelect={handleFrameSelect}
                />
              </div>
            )}
            <div className="border-t border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">关键词</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                <button
                  onClick={() => setActiveKeywordTypeCanvas('all')}
                  className={`px-2 py-1 rounded text-xs border ${activeKeywordTypeCanvas === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
                >
                  全部 ({selectedKeywords.length})
                </button>
                {keywordTypes.map(type => {
                  const count = selectedKeywords.filter(k => k.type === type.id).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setActiveKeywordTypeCanvas(type.id)}
                      className={`px-2 py-1 rounded text-xs border ${activeKeywordTypeCanvas === type.id ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200'} ${type.color}`}
                    >
                      {type.name} ({count})
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {(
                  activeKeywordTypeCanvas === 'all' 
                    ? selectedKeywords 
                    : selectedKeywords.filter(k => k.type === activeKeywordTypeCanvas)
                ).map(keyword => (
                  <span
                    key={keyword.id}
                    className={`px-2 py-1 rounded-2xl text-xs border ${keywordTypes.find(t => t.id === keyword.type)?.color || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                  >
                    {keyword.text}
                  </span>
                ))}
                {selectedKeywords.length === 0 && (
                  <span className="text-xs text-gray-400">暂无关键词</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 画布页弹窗：画像与访谈查看 */}
      {isCanvasPersonaModalOpen && (
        <PersonaEditModal
          persona={personas[0] || {
            persona_name: '未命名用户',
            persona_summary: '',
            persona_details: { age: '', occupation: '', lifestyle: '', pain_points: [], goals: [], behaviors: [] }
          }}
          personas={personas}
          onSave={(updatedPersona) => {
            setPersonas(prev => prev.length === 0 ? [updatedPersona] : prev.map((p, idx) => idx === 0 ? updatedPersona : p));
            setIsCanvasPersonaModalOpen(false);
          }}
          onClose={() => setIsCanvasPersonaModalOpen(false)}
        />
      )}
      {isInterviewModalOpen && (
        <InterviewViewerModal
          interviews={interviewDataList}
          index={currentInterviewIndex}
          setIndex={setCurrentInterviewIndex}
          onClose={() => setIsInterviewModalOpen(false)}
        />
      )}
    </div>
  );

  // 渲染关键词选择器
  const renderKeywordSelector = () => {
    if (!keywordSelector.show) return null;

    return (
      <KeywordSelector
        selectedText={keywordSelector.text}
        position={keywordSelector.position}
        keywordTypes={keywordTypes}
        onSelectType={handleKeywordTypeSelect}
        onCancel={cancelKeywordSelection}
      />
    );
  };

  // 用户画像详情渲染已删除

  // 根据当前步骤渲染不同内容
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'interview':
        return renderInterviewStep();
      case 'persona-story':
        return (
          <PersonaStoryPage
            selectedKeywords={selectedKeywords}
            personas={personas}
            setPersonas={setPersonas}
            onStorySelect={handleStorySelect}
            onBack={() => setCurrentStep('interview')}
          />
        );
      case 'canvas':
        return renderCanvasStep();
      default:
        return renderInterviewStep();
    }
  };

  return (
    <motion.div
      className={`absolute inset-0 z-40 overflow-y-auto ${
        currentStep === 'canvas' || currentStep === 'persona-story'
          ? 'bg-white' 
          : 'bg-gray-50 p-4 sm:p-6 lg:p-8'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      {currentStep === 'canvas' || currentStep === 'persona-story' ? (
        // 画布步骤：全屏显示
        <>
          {renderCurrentStep()}
          {renderKeywordSelector()}
        </>
      ) : (
        // 其他步骤：保持原有布局
        <div className="max-w-6xl mx-auto">
          {/* 主要内容 */}
          {renderCurrentStep()}
          {renderKeywordSelector()}
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