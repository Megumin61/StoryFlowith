import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Panel,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Save, ArrowLeft, Download, Plus, Settings, Zap, AlertTriangle } from 'lucide-react';
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
import 'reactflow/dist/style.css';

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

const nodeTypes = { story: StoryNode };

// 优化的StyleSelector组件
const StyleSelector = ({ selectedStyle, onStyleChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const styles = [
    { id: 'style1', label: '动漫风格' },
    { id: 'style2', label: '写实风格' },
    { id: 'style3', label: '水彩风格' },
    { id: 'style4', label: '插画风格' },
  ];

  const selectedStyleData = styles.find(style => style.id === selectedStyle) || styles[0];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm hover:bg-gray-50 transition"
      >
        <div className="w-8 h-8 rounded overflow-hidden">
          <img 
            src={styleImages[selectedStyle] || styleImages.style1} 
            alt={selectedStyleData.label}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error(`风格图像加载失败: ${e.target.src}`);
              e.target.onerror = null; // 防止无限循环
              e.target.src = testImage;
            }}
          />
        </div>
        <span className="font-medium">画面参考</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points={isOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-md shadow-lg border border-gray-200 w-[180px] p-2">
          <div className="flex flex-col space-y-2">
            {styles.map(style => (
              <div 
                key={style.id} 
                className={`cursor-pointer rounded-md overflow-hidden transition-all ${
                  selectedStyle === style.id 
                    ? 'ring-2 ring-blue-500' 
                    : 'hover:opacity-90 border border-gray-200'
                }`}
                onClick={() => {
                  onStyleChange(style.id);
                  setIsOpen(false);
                }}
              >
                <div className="aspect-video w-full relative">
                  <img 
                    src={styleImages[style.id]} 
                    alt={style.label}
                    className="w-full h-full object-cover"
                    title={style.label}
                    onError={(e) => {
                      console.error(`风格图像加载失败: ${e.target.src}`);
                      e.target.onerror = null;
                      e.target.src = testImage;
                    }}
                  />
                  {selectedStyle === style.id && (
                    <div className="absolute bottom-1 right-1">
                      <div className="bg-blue-500 text-white rounded-full p-1 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 设置节点布局的常量
const INITIAL_X_POSITION = 100; // 初始X坐标
const INITIAL_Y_POSITION = 150; // Y坐标保持固定
const LAYOUT_TRANSITION_DURATION = 300; // 布局过渡动画持续时间(毫秒)
const NODE_WIDTH = {
  COLLAPSED: 240,  // 从220增加到240，适应16:9比例
  EXPANDED: 360    // 从320增加到360，适应16:9比例
};
const CARD_GAP = 30; // 卡片之间的实际间距（边到边的距离），从30增加到40，保持适当间距

// 创建内部组件以使用ReactFlow hooks
function StoryboardFlow({ initialStoryText, onClose }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('style1');
  const [showStyleConfirm, setShowStyleConfirm] = useState(false); // For global style confirm modal
  const [useRealApi, setUseRealApi] = useState(true); // 默认使用真实API
  const [referenceImageUrl, setReferenceImageUrl] = useState(styleUrls.style1); // 风格参考图URL
  const [apiStatus, setApiStatus] = useState('初始化中...'); // API状态信息
  const [lastError, setLastError] = useState(null); // 最后一次错误
  const [nodesDraggable, setNodesDraggable] = useState(true); // 修改为默认启用节点拖动
  const [paneMoveable, setPaneMoveable] = useState(true); // 控制画布是否可移动
  const reactFlowInstance = useReactFlow();
  const nodeStatesRef = useRef({}); // 用于跟踪节点状态
  const skipViewUpdateRef = useRef(false); // 用于跳过视图更新

  // 重新排列节点的函数 - 修改为保持节点顺序，只调整位置
  const rearrangeNodes = useCallback((currentNodes) => {
    if (!currentNodes || currentNodes.length === 0) {
      return [];
    }
    
    // 不再对节点进行排序，保持传入的顺序
    const nodesToArrange = [...currentNodes];

    // 使用固定间隔布局，保证卡片之间的间隙一致
    let currentX = INITIAL_X_POSITION;

    // 应用计算出的位置
    const updatedNodes = nodesToArrange.map((node, idx) => {
      // 获取节点状态，判断是否展开
      const nodeState = nodeStatesRef.current[node.id] || {
        state: 'default',
        isExpanded: false
      };
      const isExpanded = nodeState.isExpanded || 
                       nodeState.state === 'editing' || 
                       nodeState.state === 'imageEditing' ||
                       nodeState.state === 'generating';
      
      // 当前节点的宽度
      const nodeWidth = isExpanded ? NODE_WIDTH.EXPANDED : NODE_WIDTH.COLLAPSED;
      
      // 保持原有的Y坐标或使用初始值
      const yPosition = (node.position && node.position.y) || INITIAL_Y_POSITION;
      
      // 保存当前节点的X坐标
      const xPosition = currentX;
      
      // 更新下一个节点的X坐标，固定间隔为CARD_GAP
      currentX = xPosition + nodeWidth + CARD_GAP;
      
      return {
        ...node,
        position: {
          x: xPosition,
          y: yPosition
        },
        data: {
          ...node.data,
          label: `分镜 ${idx + 1}`,
          nodeIndex: idx,
          styleName: node.data.styleName || selectedStyle
        },
        // 添加布局调试信息
        layoutInfo: {
          isExpanded: isExpanded,
          width: nodeWidth,
          xPosition: xPosition,
          gap: CARD_GAP
        }
      };
    });
    
    return updatedNodes;
  }, [selectedStyle]);

  // 在StoryboardFlow组件内部添加handleMoveNode - 移到这里，确保在所有引用它的地方之前定义
  const handleMoveNode = useCallback((nodeId, direction) => {
    console.log(`移动节点 ${nodeId} 向 ${direction} 方向`);
    
    setNodes(nds => {
      const idx = nds.findIndex(n => n.id === nodeId);
      if (idx === -1) {
        console.log(`未找到节点 ${nodeId}`);
        return nds;
      }
      
      let newIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= nds.length) {
        console.log(`无法移动节点，已经在${direction === 'left' ? '最左' : '最右'}边界`);
        return nds; // 边界保护
      }
      
      console.log(`交换节点 ${idx} 和 ${newIdx}`);
      const newNodes = [...nds];
      // 交换节点
      [newNodes[idx], newNodes[newIdx]] = [newNodes[newIdx], newNodes[idx]];
      
      // 重新排列所有节点
      const rearranged = rearrangeNodes(newNodes);
      console.log('节点已重新排列');
      
      // 强制重新渲染，确保位置更新
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView({ padding: 0.2 });
        }
      }, 50);
      
      return rearranged;
    });
  }, [rearrangeNodes, reactFlowInstance]);

  // API调试函数
  const testApiConnection = async () => {
    try {
      setApiStatus('正在测试API连接...');
      // 输出API配置到控制台
      LiblibAPI.debug.logConfig();
      
      const testStartTime = new Date();
      const testStartTimeStr = testStartTime.toLocaleTimeString() + '.' + testStartTime.getMilliseconds();
      setApiStatus(`API测试开始: ${testStartTimeStr}`);
      
      // 测试一个简单的API请求
      setApiStatus('开始测试图生图API...');
      // 使用styleUrls中的URL
      const imgUrl = styleUrls[selectedStyle] || styleUrls.style1;
      
      setApiStatus(`参考图URL: ${imgUrl}`);
      
      // 使用指定的提示词
      const testPrompt = "参考图像的风格，为我生成单个故事版分镜：将图中的人物变成戴眼镜的年轻男人";
      setApiStatus(`使用提示词: ${testPrompt}`);
      
      // 测试API请求
      const apiCallStartTime = new Date();
      setApiStatus(`开始API调用: ${apiCallStartTime.toLocaleTimeString() + '.' + apiCallStartTime.getMilliseconds()}`);
      
      const response = await LiblibAPI.generateImageToImage(
        testPrompt,
        [imgUrl],
        { model: 'pro', aspectRatio: '4:3', imgCount: 1 }
      );
      
      const apiCallEndTime = new Date();
      const apiCallDuration = (apiCallEndTime - apiCallStartTime) / 1000;
      setApiStatus(`API调用完成，用时: ${apiCallDuration}秒, 时间: ${apiCallEndTime.toLocaleTimeString() + '.' + apiCallEndTime.getMilliseconds()}`);
      console.log('API测试响应:', JSON.stringify(response));
      
      // 确保我们获取到了正确的任务ID
      if (!response || !response.data || !response.data.generateUuid) {
        throw new Error('API响应缺少generateUuid');
      }
      
      const generateUuid = response.data.generateUuid;
      setApiStatus(`API测试成功！任务ID: ${generateUuid}`);
      
      // 尝试获取结果 - 增加轮询超时时间到120秒
      const pollingStartTime = new Date();
      setApiStatus(`开始轮询结果: ${pollingStartTime.toLocaleTimeString() + '.' + pollingStartTime.getMilliseconds()}`);
      
      const result = await LiblibAPI.pollTaskUntilDone(generateUuid, 2000, 120);
      
      const pollingEndTime = new Date();
      const pollingDuration = (pollingEndTime - pollingStartTime) / 1000;
      setApiStatus(`轮询完成，用时: ${pollingDuration}秒, 时间: ${pollingEndTime.toLocaleTimeString() + '.' + pollingEndTime.getMilliseconds()}`);
      console.log('轮询结果:', JSON.stringify(result));
      
      if (result.images && result.images.length > 0) {
        const imageUrl = result.images[0].imageUrl;
        const testEndTime = new Date();
        const totalDuration = (testEndTime - testStartTime) / 1000;
        setApiStatus(`测试成功! 总用时: ${totalDuration}秒，已生成图片: ${imageUrl}`);
        
        // 在调试面板显示生成的图像
        console.log('生成的图像URL:', imageUrl);
        
        // 创建一个临时图像元素来显示
        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.style.maxWidth = '200px';
        imgElement.style.border = '2px solid #28A745';
        imgElement.style.borderRadius = '4px';
        imgElement.style.marginTop = '10px';
        
        // 查找调试面板并添加图像
        const debugPanel = document.querySelector('.bg-white.p-2.rounded.shadow-md.text-xs');
        if (debugPanel) {
          debugPanel.appendChild(imgElement);
        }
        
        // 在新窗口显示生成的图像
        window.open(imageUrl, '_blank');
      } else {
        setApiStatus('测试部分成功：任务完成但未返回图像');
      }
    } catch (error) {
      console.error('API测试失败:', error);
      setLastError(error);
      
      // 检查错误是否包含图像URL信息（可能是超时但图像已生成）
      if (error.message && error.message.includes('imageUrl')) {
        try {
          // 尝试从错误消息中提取图像URL
          const match = error.message.match(/imageUrl":"([^"]+)"/);
          if (match && match[1]) {
            const imageUrl = match[1];
            setApiStatus(`尽管出错，但图像已生成: ${imageUrl}`);
            
            // 创建一个临时图像元素来显示
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.style.maxWidth = '200px';
            imgElement.style.border = '2px solid #FFC107';
            imgElement.style.borderRadius = '4px';
            imgElement.style.marginTop = '10px';
            
            // 查找调试面板并添加图像
            const debugPanel = document.querySelector('.bg-white.p-2.rounded.shadow-md.text-xs');
            if (debugPanel) {
              debugPanel.appendChild(imgElement);
            }
            
            // 在新窗口显示生成的图像
            window.open(imageUrl, '_blank');
            return;
          }
        } catch (e) {
          console.error('尝试从错误中提取图像URL失败', e);
        }
      }
      
      setApiStatus(`API测试失败: ${error.message}`);
    }
  };

  // 监听API开关变化
  useEffect(() => {
    setApiStatus(useRealApi ? '已启用API调用' : '已禁用API调用，使用测试图片');
  }, [useRealApi]);

  // 处理文本框焦点变化，控制节点是否可拖动
  const handleTextFocus = useCallback(() => {
    console.log("文本框获得焦点，禁用节点拖动");
    setNodesDraggable(false);
    setPaneMoveable(false); // 同时禁用画布移动
  }, []);

  const handleTextBlur = useCallback(() => {
    console.log("文本框失去焦点，启用节点拖动和画布移动");
    setNodesDraggable(true); // 重新启用节点拖动
    setPaneMoveable(true); // 启用画布移动
  }, []);

  // 初始化时获取风格参考图的公网URL
  useEffect(() => {
    // 获取本地风格图片的可公网访问URL
    const getReferenceImageUrl = async () => {
      try {
        // 使用styleUrls中的URL
        const staticUrl = styleUrls[selectedStyle] || styleUrls.style1;
        setReferenceImageUrl(staticUrl);
        setApiStatus(`风格参考图已设置: ${staticUrl}`);
        console.log("参考图URL设置为:", staticUrl);
      } catch (error) {
        console.error('获取参考图URL失败:', error);
        // 设置错误状态
        setApiStatus(`错误: 获取参考图URL失败 - ${error.message}`);
        setLastError(error);
        // 使用备用URL
        setReferenceImageUrl(styleUrls.style1);
      }
    };
    
    getReferenceImageUrl();
  }, [selectedStyle]);

  // 监听风格变化，更新参考图URL
  useEffect(() => {
    // 当风格改变时，更新参考图URL
    const newReferenceUrl = styleUrls[selectedStyle] || styleUrls.style1;
    setReferenceImageUrl(newReferenceUrl);
    setApiStatus(`风格已更新为: ${selectedStyle}, 参考图URL: ${newReferenceUrl}`);
  }, [selectedStyle]);

  // 监听节点状态变化并重新排列
  const handleNodeStateChange = useCallback((nodeId, state, isExpanded) => {
    // 记录当前节点的精确位置
    let nodePosition = {x: INITIAL_X_POSITION, y: INITIAL_Y_POSITION};
    const existingNode = nodes.find(n => n.id === nodeId);
    if (existingNode && existingNode.position) {
      nodePosition = {...existingNode.position};
    }
    
    // 更新节点状态引用，精确记录位置
    nodeStatesRef.current[nodeId] = { 
      state, 
      isExpanded, 
      position: nodePosition // 记录完整位置信息
    };
    
    // 当节点展开或折叠时，重新排列所有节点
    setNodes(currentNodes => {
      // 标记为布局更新，避免不必要的视图调整
      skipViewUpdateRef.current = true;
      
      // 重新排列所有节点
      return rearrangeNodes(currentNodes);
    });
  }, [rearrangeNodes, nodes]);

  // 处理节点拖动结束事件 - 修改为拖动后重新排序节点
  const handleNodeDragStop = useCallback((event, node) => {
    console.log("节点拖动结束:", node.id);
    
    // 获取所有节点并按X坐标排序
    setNodes(nds => {
      // 按X坐标排序节点
      const sortedByPosition = [...nds].sort((a, b) => {
        return a.position.x - b.position.x;
      });
      
      console.log("节点已按X坐标排序");
      
      // 重新排列节点位置
      return rearrangeNodes(sortedByPosition);
    });
    
    // 拖动结束后适当调整视图
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2 });
      }
    }, 100);
  }, [rearrangeNodes, reactFlowInstance]);

  // 将handleAddNode从useRef中移出，作为独立的useCallback函数
  const handleAddNode = useCallback((nodeId, position) => {
    // 移除日志输出
    // console.log(`处理添加分镜: ${position} 到节点 ${nodeId}`);
    
    const newId = `frame-${Date.now()}`;
    
    setNodes(nds => {
      let nodeIndex = nds.findIndex(node => node.id === nodeId);
      
      if (nodeIndex === -1) {
        // 移除日志输出
        // console.error(`未找到ID为${nodeId}的节点，将添加到末尾`);
        nodeIndex = nds.length - 1; // 设置为最后一个节点的索引，以便添加到右侧
        position = 'right'; // 强制添加到末尾（右侧）
      }
      
      const insertIndex = position === 'right' ? nodeIndex + 1 : nodeIndex;
      // 移除日志输出
      // console.log(`将在索引 ${insertIndex} 处插入新节点`);
      
      // 确定新节点的Y坐标 - 使用参考节点的Y坐标或默认值
      let yPosition = INITIAL_Y_POSITION;
      const referenceNode = nds[nodeIndex];
      if (referenceNode && referenceNode.position) {
        yPosition = referenceNode.position.y;
      }
      
      // 创建新节点的函数，确保每次都创建新的引用
      const createNodeData = (id, label) => ({
        id,
        label,
        text: "", // 空文本
        placeholder: "点击此处添加分镜描述...", // 添加placeholder提示
        image: null,
        imagePrompt: '',
        styleName: selectedStyle, // 使用当前选择的风格
        onDeleteNode: (nodeId) => {
          console.log('直接从新节点调用删除:', nodeId);
          nodeHandlersRef.current.handleDeleteNode(nodeId);
        },
        onRegenerateImage: nodeHandlersRef.current.handleRegenerateImage,
        onUpdateNode: nodeHandlersRef.current.handleUpdateNode,
        onGenerateImage: nodeHandlersRef.current.handleGenerateImage,
        onStateChange: handleNodeStateChange,
        onAddNode: handleAddNode,
        onTextFocus: handleTextFocus,
        onTextBlur: handleTextBlur,
        referenceImageUrl: referenceImageUrl, // 添加风格参考图URL
        onMoveNode: handleMoveNode,
      });
      
      // 创建新节点 - 初始位置不重要，会在rearrangeNodes中重新计算
      const newNode = {
        id: newId,
        type: 'story',
        position: { 
          x: INITIAL_X_POSITION, 
          y: yPosition 
        },
        data: createNodeData(newId, `分镜 ${insertIndex + 1}`)
      };
      
      // 记录新节点的状态
      nodeStatesRef.current[newId] = {
        state: 'default',
        isExpanded: false,
        position: {x: INITIAL_X_POSITION, y: yPosition}
      };
      
      // 插入新节点
      const newNodes = [
        ...nds.slice(0, insertIndex),
        newNode,
        ...nds.slice(insertIndex)
      ];
      
      // 移除日志输出
      // console.log(`更新后节点数量: ${newNodes.length}`);
      
      // 重新排列所有节点
      return rearrangeNodes(newNodes);
    });

    // 添加节点后适当调整视图
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2 });
          }
    }, 100);
  }, [rearrangeNodes, handleNodeStateChange, selectedStyle, referenceImageUrl, reactFlowInstance, handleMoveNode]);

  const handleAddFrame = () => {
    // 移除日志输出
    // console.log("点击了顶部添加分镜按钮");
    const newId = `frame-${Date.now()}`;
    
    setNodes(nds => {
      // 创建节点数据的函数
      const createNodeData = (id, label) => ({
        id,
        label,
        text: "", // 空文本
        placeholder: "点击此处添加分镜描述...", // 添加placeholder提示
        image: null,
        imagePrompt: '',
        styleName: selectedStyle, // 使用当前选择的风格
        onDeleteNode: (nodeId) => {
          console.log('直接从顶部添加的节点调用删除:', nodeId);
          nodeHandlersRef.current.handleDeleteNode(nodeId);
        },
        onRegenerateImage: nodeHandlersRef.current.handleRegenerateImage,
        onUpdateNode: nodeHandlersRef.current.handleUpdateNode,
        onGenerateImage: nodeHandlersRef.current.handleGenerateImage,
        onStateChange: handleNodeStateChange,
        onAddNode: handleAddNode,
        onTextFocus: handleTextFocus,
        onTextBlur: handleTextBlur,
        referenceImageUrl: referenceImageUrl, // 添加风格参考图URL
        onMoveNode: handleMoveNode,
      });
      
      // 创建新节点 - 初始位置不重要，会在rearrangeNodes中重新计算
      const newNode = {
        id: newId,
        type: 'story',
        position: { 
          x: INITIAL_X_POSITION,
          y: INITIAL_Y_POSITION 
        },
        data: createNodeData(newId, `分镜 ${nds.length + 1}`)
      };
      
      // 记录新节点状态
      nodeStatesRef.current[newId] = {
            state: 'default',
            isExpanded: false,
        position: {x: INITIAL_X_POSITION, y: INITIAL_Y_POSITION}
      };
      
      const newNodes = [...nds, newNode];
      
      // 重新排列所有节点
      return rearrangeNodes(newNodes);
    });
    
    // 添加节点后适当调整视图
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2 });
      }
    }, 100);
  };

  // 修改节点删除处理函数
  const nodeHandlersRef = useRef({
    // 生成提示词，根据不同场景使用不同格式
    generatePrompt: (text, isEdit = false, currentImage = null) => {
      if (isEdit && currentImage) {
        // 编辑已有图像的提示词
        return `${text}`;
      } else {
        // 基于风格图生成初始图像的提示词
        return `不要参考图中的人物只参考图像的风格，为我生成故事板分镜画面：${text}`;
      }
    },
    handleDeleteNode: (nodeId) => {
      console.log('正在删除节点:', nodeId);
      if (!nodeId) {
        console.error('删除节点时未提供nodeId');
        return;
      }

      setNodes((nds) => {
        console.log(`尝试删除节点 ${nodeId}, 当前节点数:`, nds.length);
        // 找到被删除节点的索引
        const newNodes = nds.filter(node => node.id !== nodeId);
        console.log('过滤后节点数:', newNodes.length);
        
        // 删除节点状态记录
        delete nodeStatesRef.current[nodeId];
        
        // 重新排列所有节点
        return rearrangeNodes(newNodes);
      });
    },
    handleRegenerateImage: async (nodeId, prompt, isEdit = false) => {
      try {
        // 设置节点状态为加载中
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  isLoading: true,
                },
              };
            }
            return node;
          })
        );
        
        setApiStatus(`开始${isEdit ? '编辑' : '重新生成'}图像: ${prompt.substring(0, 20)}...`);
        
        // 准备图像URL - 如果是编辑则使用当前图像，否则使用风格参考图
        const currentImage = isEdit ? 
          nodes.find(node => node.id === nodeId)?.data?.image || referenceImageUrl :
          referenceImageUrl;
        
        if (!currentImage) {
          throw new Error('参考图URL未设置');
        }
        
        // 准备提示词
        const finalPrompt = nodeHandlersRef.current.generatePrompt(prompt, isEdit, currentImage);
        setApiStatus(`提示词: ${finalPrompt.substring(0, 30)}...`);
        
        // 根据开关状态决定使用API还是测试图像
        if (useRealApi) {
          try {
            // 使用图生图API而不是文生图API
            setApiStatus('调用图生图API...');
            const response = await LiblibAPI.generateImageToImage(
              finalPrompt, 
              [currentImage], 
              {
                model: selectedStyle === 'realistic' ? 'max' : 'pro',
                aspectRatio: liblibConfig.defaultAspectRatio
              }
            );
            
            // 检查是否有错误码和错误消息
            if (response && response.code && response.code !== 0) {
              const errorMsg = response.msg || '未知错误';
              console.error(`[StoryboardTest] API错误: 错误码 ${response.code}, 消息: ${errorMsg}`);
              setApiStatus(`API错误: ${errorMsg} (${response.code})`);
              throw new Error(`API错误: ${errorMsg} (${response.code})`);
            }
            
            // 确保我们获取到了正确的任务ID
            if (!response || !response.data || !response.data.generateUuid) {
              throw new Error('API响应缺少generateUuid');
            }

            const generateUuid = response.data.generateUuid;
            setApiStatus(`等待结果: 任务ID ${generateUuid}`);
            const result = await LiblibAPI.pollTaskUntilDone(generateUuid);
            
            // 获取生成的图像URL
            if (result.images && result.images.length > 0) {
              const imageUrl = result.images[0].imageUrl;
              setApiStatus('图像生成成功');
              
              // 更新节点状态
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                          image: imageUrl,
                          imagePrompt: prompt,
                          isLoading: false
                },
              };
            }
            return node;
          })
        );
      }, 50);
            } else {
              throw new Error('未获取到生成的图像');
            }
          } catch (error) {
            console.error('API调用失败:', error);
            setApiStatus(`API错误: ${error.message}`);
            
            // 显示具体的错误消息给用户
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === nodeId) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      isLoading: false,
                      error: `生成失败: ${error.message}`
                    },
                  };
                }
                return node;
              })
            );
            
            throw error; // 向上传递错误
          }
        } else {
          // 使用测试图像模拟API
          setApiStatus('使用测试图像模拟API...');
          await new Promise(resolve => setTimeout(resolve, 800)); // 模拟延迟
          
          setTimeout(() => {
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === nodeId) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      image: testImage,
                      imagePrompt: prompt,
                      isLoading: false
                    },
                  };
                }
                return node;
              })
            );
          }, 50);
          setApiStatus('已使用测试图像替代');
        }
      } catch (error) {
        console.error('重新生成图像失败:', error);
        setApiStatus(`图像生成失败: ${error.message}`);
        
        // 更新节点状态，显示错误
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  isLoading: false,
                  error: `图像生成失败: ${error.message}`
                },
              };
            }
            return node;
          })
        );
        
        // 使用测试图像作为备选
        setTimeout(() => {
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === nodeId) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    image: testImage,
                    error: null
                  },
                };
              }
              return node;
            })
          );
          setApiStatus('已使用测试图像作为备选');
        }, 500);
      }
    },
    // 生成单个图像
    handleGenerateImage: async (nodeId, prompt) => {
      try {
        const startTime = new Date();
        const startTimeStr = startTime.toLocaleTimeString() + '.' + startTime.getMilliseconds();
        console.log(`[StoryboardTest] 开始生成图像, nodeId: ${nodeId}, 时间: ${startTimeStr}, 使用API: ${useRealApi}`);
        // 设置节点状态为加载中
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  isLoading: true,
                },
              };
            }
            return node;
          })
        );
        
        setApiStatus(`开始生成新图像: ${prompt.substring(0, 20)}...`);
        
        if (!referenceImageUrl) {
          setApiStatus('警告: 参考图URL未设置，使用默认图');
          console.warn('参考图URL未设置，使用默认图');
        }
        
        // 准备提示词
        const finalPrompt = nodeHandlersRef.current.generatePrompt(prompt, false);
        setApiStatus(`提示词: ${finalPrompt.substring(0, 30)}...`);
        
        // 根据开关状态决定使用API还是测试图像
        if (useRealApi) {
          try {
            console.log(`[StoryboardTest] 使用API生成图像, 参考图: ${referenceImageUrl}`);
            // 使用图生图API而不是文生图API
            const apiCallStartTime = new Date();
            setApiStatus(`调用图生图API, 时间: ${apiCallStartTime.toLocaleTimeString() + '.' + apiCallStartTime.getMilliseconds()}`);
            
            const response = await LiblibAPI.generateImageToImage(
              finalPrompt, 
              [referenceImageUrl], // 使用上传后的风格参考图URL
              {
                model: selectedStyle === 'realistic' ? 'max' : 'pro',
                aspectRatio: liblibConfig.defaultAspectRatio
              }
            );
            
            const apiCallEndTime = new Date();
            const apiCallDuration = (apiCallEndTime - apiCallStartTime) / 1000;
            setApiStatus(`API调用完成，用时: ${apiCallDuration}秒, 时间: ${apiCallEndTime.toLocaleTimeString() + '.' + apiCallEndTime.getMilliseconds()}`);
            console.log('API响应:', JSON.stringify(response));
            
            // 检查是否有错误码和错误消息
            if (response && response.code && response.code !== 0) {
              const errorMsg = response.msg || '未知错误';
              console.error(`[StoryboardTest] API错误: 错误码 ${response.code}, 消息: ${errorMsg}`);
              setApiStatus(`API错误: ${errorMsg} (${response.code})`);
              throw new Error(`API错误: ${errorMsg} (${response.code})`);
            }
            
            // 确保我们获取到了正确的任务ID
            if (!response || !response.data || !response.data.generateUuid) {
              throw new Error('API响应缺少generateUuid');
            }

            const generateUuid = response.data.generateUuid;
            console.log(`API调用成功，任务ID: ${generateUuid}`);
            
            const pollingStartTime = new Date();
            setApiStatus(`等待结果: 任务ID ${generateUuid}, 时间: ${pollingStartTime.toLocaleTimeString() + '.' + pollingStartTime.getMilliseconds()}`);
            
            const result = await LiblibAPI.pollTaskUntilDone(generateUuid);
            
            const pollingEndTime = new Date();
            const pollingDuration = (pollingEndTime - pollingStartTime) / 1000;
            setApiStatus(`轮询完成，用时: ${pollingDuration}秒, 时间: ${pollingEndTime.toLocaleTimeString() + '.' + pollingEndTime.getMilliseconds()}`);
            console.log('轮询结果:', JSON.stringify(result));
            
            // 获取生成的图像URL
            if (result.images && result.images.length > 0) {
              const imageUrl = result.images[0].imageUrl;
              const endTime = new Date();
              const totalDuration = (endTime - startTime) / 1000;
              console.log(`获取到图像URL: ${imageUrl}, 总用时: ${totalDuration}秒`);
              setApiStatus(`图像生成成功，总用时: ${totalDuration}秒`);
              
              // 创建图像对象预加载
              const loadStartTime = new Date();
              console.log(`开始加载图像: ${loadStartTime.toLocaleTimeString() + '.' + loadStartTime.getMilliseconds()}`);
              
              try {
                await new Promise((resolve, reject) => {
                  const img = new Image();
                  img.onload = () => {
                    const loadEndTime = new Date();
                    const loadDuration = (loadEndTime - loadStartTime) / 1000;
                    console.log(`图像加载成功，用时: ${loadDuration}秒, 时间: ${loadEndTime.toLocaleTimeString() + '.' + loadEndTime.getMilliseconds()}`);
                    resolve();
                  };
                  img.onerror = () => {
                    console.warn(`图像加载失败: ${imageUrl}`);
                    resolve(); // 仍然继续，不中断流程
                  };
                  img.src = imageUrl;
                  
                  // 设置超时，防止无限等待
                  setTimeout(resolve, 5000);
                });
              } catch (loadError) {
                console.warn('图像预加载错误:', loadError);
              }
              
              // 更新节点状态
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                          image: imageUrl,
                          imagePrompt: prompt,
                          isLoading: false
                },
              };
            }
            return node;
          })
        );
      }, 50);
            } else {
              throw new Error('未获取到生成的图像');
            }
          } catch (error) {
            console.error('API调用失败:', error);
            setLastError(error);
            setApiStatus(`API错误: ${error.message}`);
            
            // 显示具体的错误消息给用户
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === nodeId) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      isLoading: false,
                      error: `生成失败: ${error.message}`
                    },
                  };
                }
                return node;
              })
            );
            
            throw error; // 向上传递错误
          }
        } else {
          // 使用测试图像模拟API
          console.log('使用测试图像模拟API');
          setApiStatus('使用测试图像模拟API...');
          await new Promise(resolve => setTimeout(resolve, 800)); // 模拟延迟
          
          setTimeout(() => {
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === nodeId) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      image: testImage,
                      imagePrompt: prompt,
                      isLoading: false
                    },
                  };
                }
                return node;
              })
            );
          }, 50);
          setApiStatus('已使用测试图像替代');
        }
      } catch (error) {
        console.error('生成图像失败:', error);
        setLastError(error);
        setApiStatus(`图像生成失败: ${error.message}`);
        
        // 更新节点状态，显示错误
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  isLoading: false,
                  error: `图像生成失败: ${error.message}`
                },
              };
            }
            return node;
          })
        );
        
        // 使用测试图像作为备选
        setTimeout(() => {
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === nodeId) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    image: testImage,
                    error: null
                  },
                };
              }
              return node;
            })
          );
          setApiStatus('已使用测试图像作为备选');
        }, 500);
      }
    },
    handleUpdateNode: (nodeId, data) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...data
              },
            };
          }
          return node;
        })
      );
    },
    // 从nodeHandlersRef中删除handleAddNode函数
  });

  // 确保nodeHandlersRef在初始化后不再变化
  useEffect(() => {
    // 仅在组件初始化时设置一次处理函数
    nodeHandlersRef.current = {
      // 生成提示词，根据不同场景使用不同格式
      generatePrompt: (text, isEdit = false, currentImage = null) => {
        if (isEdit && currentImage) {
          // 编辑已有图像的提示词
          return `${text}`;
        } else {
          // 基于风格图生成初始图像的提示词
          return `不要参考图中的人物只参考图像的风格，为我生成故事板分镜画面：${text}`;
        }
      },
      handleDeleteNode: (nodeId) => {
        console.log('正在删除节点:', nodeId);
        if (!nodeId) {
          console.error('删除节点时未提供nodeId');
          return;
        }

        setNodes((nds) => {
          console.log(`尝试删除节点 ${nodeId}, 当前节点数:`, nds.length);
          // 找到被删除节点的索引
          const newNodes = nds.filter(node => node.id !== nodeId);
          console.log('过滤后节点数:', newNodes.length);
          
          // 删除节点状态记录
          delete nodeStatesRef.current[nodeId];
          
          // 重新排列所有节点
          return rearrangeNodes(newNodes);
        });
      },
      // 保持其他处理函数不变
      handleRegenerateImage: nodeHandlersRef.current.handleRegenerateImage,
      handleUpdateNode: nodeHandlersRef.current.handleUpdateNode,
      handleGenerateImage: nodeHandlersRef.current.handleGenerateImage,
    };
  }, [rearrangeNodes, setNodes]);

  const getStorySegments = useCallback((initialText) => {
    // 返回空文本的分镜段落
    const segments = ["", "", "", "", ""];
    
    // 实际场景会根据初始文本动态生成
    return segments;
  }, []);

  const handleBatchGenerate = async () => {
    try {
      // 使用已在顶部导入的API服务
      setApiStatus('开始批量生成图像...');
      
      // 依次处理每个没有图像的节点
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node.data.image) {
        const prompt = nodeHandlersRef.current.generatePrompt(node.data.text);
          setApiStatus(`处理节点 ${i+1}/${nodes.length}: ${prompt.substring(0, 20)}...`);
          
          // 设置当前节点为加载中
          setNodes((nds) =>
            nds.map((n) => {
              if (n.id === node.id) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    isLoading: true,
                  },
                };
              }
              return n;
            })
          );
          
          try {
            if (useRealApi) {
              // 确保有有效的参考图URL
              if (!referenceImageUrl) {
                throw new Error('参考图URL未设置');
              }
              
              // 使用图生图API
              setApiStatus(`调用API: 节点 ${i+1}/${nodes.length}`);
              const response = await LiblibAPI.generateImageToImage(
                prompt,
                [referenceImageUrl], // 使用上传后的风格参考图URL
                {
                  model: selectedStyle === 'realistic' ? 'max' : 'pro',
                  aspectRatio: liblibConfig.defaultAspectRatio
                }
              );
              
              // 检查是否有错误码和错误消息
              if (response && response.code && response.code !== 0) {
                const errorMsg = response.msg || '未知错误';
                console.error(`[StoryboardTest] API错误: 错误码 ${response.code}, 消息: ${errorMsg}`);
                setApiStatus(`API错误: ${errorMsg} (${response.code})`);
                throw new Error(`API错误: ${errorMsg} (${response.code})`);
              }
              
              // 确保我们获取到了正确的任务ID
              if (!response || !response.data || !response.data.generateUuid) {
                throw new Error('API响应缺少generateUuid');
              }

              const generateUuid = response.data.generateUuid;
              setApiStatus(`等待结果: 任务ID ${generateUuid}`);
              const result = await LiblibAPI.pollTaskUntilDone(generateUuid);
              
              // 获取生成的图像URL
              if (result.images && result.images.length > 0) {
                const imageUrl = result.images[0].imageUrl;
                setApiStatus(`成功: 节点 ${i+1}/${nodes.length} 图像已生成`);
                
                // 更新节点状态
                setNodes((nds) =>
                  nds.map((n) => {
                    if (n.id === node.id) {
                      return {
                        ...n,
                        data: {
                          ...n.data,
                          image: imageUrl,
                          imagePrompt: prompt,
                          isLoading: false,
                          error: null
                        },
                      };
                    }
                    return n;
                  })
                );
              } else {
                throw new Error('未获取到生成的图像');
              }
            } else {
              // 使用测试图像模拟API
              setApiStatus(`模拟API: 节点 ${i+1}/${nodes.length}`);
              await new Promise(resolve => setTimeout(resolve, 800)); // 模拟延迟
              
              setNodes((nds) =>
                nds.map((n) => {
                  if (n.id === node.id) {
                    return {
                      ...n,
                      data: {
                        ...n.data,
                        image: testImage,
                        imagePrompt: prompt,
                        isLoading: false,
                        error: null
                      },
                    };
                  }
                  return n;
                })
              );
              setApiStatus(`成功: 节点 ${i+1}/${nodes.length} 已使用测试图像`);
            }
            
          } catch (error) {
            console.error(`节点 ${node.id} 生成图像失败:`, error);
            setApiStatus(`错误: 节点 ${i+1}/${nodes.length} - ${error.message}`);
            
            // 更新节点状态，显示错误
            setNodes((nds) =>
              nds.map((n) => {
                if (n.id === node.id) {
                  return {
                    ...n,
                    data: {
                      ...n.data,
                      isLoading: false,
                      error: '图像生成失败'
                    },
                  };
                }
                return n;
              })
            );
            
            // 使用测试图像作为备选
            setNodes((nds) =>
              nds.map((n) => {
                if (n.id === node.id) {
                  return {
                    ...n,
                    data: {
                      ...n.data,
                      image: testImage,
                      error: null
                    },
                  };
                }
                return n;
              })
            );
          }
          
          // 添加延迟，避免API请求过于频繁
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setApiStatus('批量生成完成');
    } catch (error) {
      console.error('批量生成图像失败:', error);
      setApiStatus(`批量生成失败: ${error.message}`);
    }
  };

  const handleStyleChange = (style) => {
    setSelectedStyle(style);
    setShowStyleConfirm(true);
    // 立即更新参考图URL，不等待确认
    const newReferenceUrl = styleUrls[style] || styleUrls.style1;
    setReferenceImageUrl(newReferenceUrl);
    console.log(`已选择风格: ${style}, 参考图URL: ${newReferenceUrl}`);
  };

  const confirmStyleChange = async () => {
    try {
    setShowStyleConfirm(false);
      setApiStatus('开始更新风格...');
      
      // 使用公网风格图片URL
      const newReferenceUrl = styleUrls[selectedStyle] || styleUrls.style1;
      console.log(`确认更新风格为: ${selectedStyle}, 参考图URL: ${newReferenceUrl}`);
      
      // 批量重新生成所有已有图像的节点
      const nodesWithImages = nodes.filter(node => node.data.image);
      setApiStatus(`开始更新 ${nodesWithImages.length} 个图像节点`);
      
      // 先更新所有节点的风格名称，确保后续生成使用正确的风格
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            styleName: selectedStyle // 更新所有节点的风格名称
          },
        }))
      );
      
      for (let i = 0; i < nodesWithImages.length; i++) {
        const node = nodesWithImages[i];
        const prompt = nodeHandlersRef.current.generatePrompt(node.data.text, true, node.data.image);
        setApiStatus(`处理节点 ${i+1}/${nodesWithImages.length}: ${node.data.text.substring(0, 20)}...`);
        
        // 设置当前节点为加载中
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  isLoading: true,
                  styleName: selectedStyle, // 更新风格名称
                },
              };
            }
            return n;
          })
        );
        
        try {
          if (useRealApi) {
            // 调用 FalAI 的图生图 API，直接使用当前图像URL
            setApiStatus(`调用 FalAI API: 节点 ${i+1}/${nodesWithImages.length}`);
            const response = await FalAI.generateImageToImage(
              prompt,
              [node.data.image || newReferenceUrl], // 使用当前图像URL或风格URL
              false, // 不使用示例图像
              selectedStyle // 传递风格名称
            );
            
            // 从响应中获取图像 URL
            if (!response || !response.data || !response.data.images) {
              throw new Error('未获取到生成的图像');
            }
            
            const imageUrl = response.data.images[0];
              setApiStatus(`成功: 节点 ${i+1}/${nodesWithImages.length} 图像已更新`);
              
              // 更新节点状态
              setNodes((nds) =>
                nds.map((n) => {
                  if (n.id === node.id) {
                    return {
                      ...n,
                      data: {
                        ...n.data,
                        image: imageUrl,
                      imagePrompt: node.data.text,
                        isLoading: false,
                      error: null,
                      styleName: selectedStyle // 更新风格名称
                      },
                    };
                  }
                  return n;
                })
              );
          } else {
            // 使用测试图像模拟API
            setApiStatus(`模拟API: 节点 ${i+1}/${nodesWithImages.length}`);
            await new Promise(resolve => setTimeout(resolve, 800)); // 模拟延迟
            
            setNodes((nds) =>
              nds.map((n) => {
                if (n.id === node.id) {
                  return {
                    ...n,
                    data: {
                      ...n.data,
                      image: testImage,
                      imagePrompt: prompt,
                      isLoading: false,
                      error: null,
                      styleName: selectedStyle // 更新风格名称
                    },
                  };
                }
                return n;
              })
            );
            setApiStatus(`成功: 节点 ${i+1}/${nodesWithImages.length} 已使用测试图像`);
          }
          
        } catch (error) {
          console.error(`节点 ${node.id} 重新生成图像失败:`, error);
          setApiStatus(`错误: 节点 ${i+1}/${nodesWithImages.length} - ${error.message}`);
          
          // 保留原有图像，但显示错误
          setNodes((nds) =>
            nds.map((n) => {
              if (n.id === node.id) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    isLoading: false,
                    error: '风格更新失败',
                    styleName: selectedStyle // 仍然更新风格名称
                  },
                };
              }
              return n;
            })
          );
        }
        
        // 添加延迟，避免API请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setApiStatus('风格更新完成');
    } catch (error) {
      console.error('批量更新风格失败:', error);
      setApiStatus(`风格更新失败: ${error.message}`);
    }
  };

  // 监听节点变化，但不再自动调整视图
  useEffect(() => {
    if (!loading && nodes.length > 0) {
      // 重置跳过视图更新标志
      if (skipViewUpdateRef.current) {
        skipViewUpdateRef.current = false;
      }
      
      // 确保所有节点都有位置记录
      nodes.forEach(node => {
        if (!nodeStatesRef.current[node.id]) {
          nodeStatesRef.current[node.id] = {
            state: 'default',
            isExpanded: false,
            position: {...node.position}
          };
        } else if (!nodeStatesRef.current[node.id].position) {
          nodeStatesRef.current[node.id].position = {...node.position};
        }
      });
      
      // 不再自动调整视图，根据用户要求
    }
  }, [nodes, loading]);

  // 初始化时设置节点处理函数
  useEffect(() => {
    if (loading) {
      const segments = getStorySegments(initialStoryText);
      
      // 创建节点数据的函数
      const createNodeData = (id, label, text, index) => ({
        id,
        label,
        text,
        placeholder: "点击此处添加分镜描述...", // 添加placeholder提示
        image: null,
        imagePrompt: '',
        styleName: selectedStyle,
        onDeleteNode: (nodeId) => {
          console.log('直接从节点调用删除:', nodeId);
          nodeHandlersRef.current.handleDeleteNode(nodeId);
        },
        onRegenerateImage: nodeHandlersRef.current.handleRegenerateImage,
        onUpdateNode: nodeHandlersRef.current.handleUpdateNode,
        onGenerateImage: nodeHandlersRef.current.handleGenerateImage,
        onStateChange: handleNodeStateChange,
        onAddNode: handleAddNode,
        onTextFocus: handleTextFocus,
        onTextBlur: handleTextBlur,
        referenceImageUrl: referenceImageUrl, // 添加风格参考图URL
        onMoveNode: handleMoveNode,
      });
      
      // 创建初始节点
      const initialNodes = segments.map((seg, i) => ({
        id: `frame-${i}`,
        type: 'story',
        position: { x: INITIAL_X_POSITION + i * (NODE_WIDTH.COLLAPSED + CARD_GAP), y: INITIAL_Y_POSITION },
        data: createNodeData(`frame-${i}`, `分镜 ${i + 1}`, seg, i)
      }));
      
      setNodes(initialNodes);
      // 不再设置边缘连接
      setEdges([]);

      setLoading(false);
      
      // 初始加载完成后，适当调整视图
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView({ padding: 0.1, includeHiddenNodes: true });
    }
      }, 300);
    }
  }, [initialStoryText, loading, setNodes, setEdges, getStorySegments, handleNodeStateChange, handleAddNode, selectedStyle, referenceImageUrl, reactFlowInstance, handleMoveNode]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: '#F4F5F7' }}
    >
      {/* Top nav - 简化后只保留返回按钮和风格选择器 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 h-[60px] flex items-center justify-between px-4 z-10">
        <button
          onClick={onClose}
          className="border border-[#007BFF] text-[#007BFF] px-4 py-1.5 rounded text-sm font-medium flex items-center hover:bg-blue-50 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          返回输入页
        </button>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAddFrame}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            <Plus size={14} className="mr-1" />
            添加分镜
          </button>
          <StyleSelector 
            selectedStyle={selectedStyle}
            onStyleChange={handleStyleChange}
          />
        </div>
      </div>

      {/* Main canvas */}
      <div className="flex-grow relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-600">正在生成画布...</span>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={handleNodeDragStop}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            attributionPosition="bottom-right"
            zoomOnScroll={true}
            panOnScroll={false}
            nodesDraggable={nodesDraggable}
            paneMoveable={paneMoveable}
            nodeDragThreshold={1} // 添加拖动阈值，更容易触发拖动
            nodeDraggable={event => !event?.target?.closest('[data-no-drag]')} // 确保只有在非编辑区域才能拖动
            elementsSelectable={true}
            snapToGrid={false}
            preventScrolling={true}
            onlyRenderVisibleElements={false} // 始终渲染所有节点，避免不可见节点的宽度计算问题
            nodeOrigin={[0, 0]} // 使用左上角作为原点，简化定位计算
            style={{ 
              background: '#F4F5F7',
              height: '100%'
            }}
          >
            <Controls showInteractive={false} />
            <Background variant="dots" gap={20} size={1} />
            <MiniMap nodeStrokeColor="#D3D3D3" nodeColor="#ffffff" nodeBorderRadius={10} />
            

          </ReactFlow>
        )}

        {/* Style confirm modal */}
        <AnimatePresence>
          {showStyleConfirm && (
            <motion.div
              className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                <div className="flex items-center mb-4">
                  <AlertTriangle className="text-yellow-500 mr-2" size={24} />
                  <h3 className="text-lg font-semibold">确认全局风格变更</h3>
                </div>
                
                {/* 添加风格图像预览 */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">选择的参考风格：</div>
                  <div className="aspect-[16/9] max-w-[250px] mx-auto border border-gray-200 rounded-md overflow-hidden">
                    <img 
                      src={styleImages[selectedStyle]} 
                      alt="参考风格图"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = testImage;
                      }}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-6">应用新风格到所有图像？这将重新生成所有卡片。</p>
                <div className="flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => setShowStyleConfirm(false)}
                  >
                    取消
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={confirmStyleChange}
                  >
                    确认
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// 主组件包装器，提供ReactFlowProvider
function StoryboardTest(props) {
  return (
    <ReactFlowProvider>
      <StoryboardFlow {...props} />
    </ReactFlowProvider>
  );
}

export default StoryboardTest;