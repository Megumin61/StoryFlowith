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
// 导入测试图像和风格图
import testImage from '../images/test.png';
import style1Image from '../images/style1.png'; // 用户提供的风格图
// 导入Liblib API服务
import LiblibAPI from '../services/liblib';
import { liblibConfig } from '../config';
// 导入图像工具函数
import { getPublicImageUrl } from '../services/imageUtils';

import 'reactflow/dist/style.css';

const nodeTypes = { story: StoryNode };

// Remove PromptCard component as we're moving to inline

const StyleSelector = ({ selectedStyle, onStyleChange }) => {
  const styles = [
    { id: 'cartoon', label: '卡通' },
    { id: 'realistic', label: '写实' },
  ];

  return (
    <div className="relative">
      <select
        value={selectedStyle}
        onChange={(e) => onStyleChange(e.target.value)}
        className="appearance-none bg-white text-gray-700 py-1.5 px-4 pr-8 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
      >
        {styles.map(style => (
          <option key={style.id} value={style.id}>
            {style.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
    </div>
  );
};

// 设置节点布局的常量
const NODE_SPACING_X = 220; // 减少节点之间的水平间距，使排列更紧密
const INITIAL_X_POSITION = 100; // 初始X坐标
const INITIAL_Y_POSITION = 150; // Y坐标保持固定，增加高度以适应展开的卡片
const LAYOUT_TRANSITION_DURATION = 300; // 布局过渡动画持续时间(毫秒)

// 创建内部组件以使用ReactFlow hooks
function StoryboardFlow({ initialStoryText, onClose }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [showStyleConfirm, setShowStyleConfirm] = useState(false); // For global style confirm modal
  const [useRealApi, setUseRealApi] = useState(false); // 是否使用真实API
  const [referenceImageUrl, setReferenceImageUrl] = useState(''); // 风格参考图URL
  const [apiStatus, setApiStatus] = useState('初始化中...'); // API状态信息
  const [lastError, setLastError] = useState(null); // 最后一次错误
  const reactFlowInstance = useReactFlow();
  const nodeStatesRef = useRef({}); // 用于跟踪节点状态
  const skipViewUpdateRef = useRef(false); // 用于跳过视图更新

  // API调试函数
  const testApiConnection = async () => {
    try {
      setApiStatus('正在测试API连接...');
      // 输出API配置到控制台
      LiblibAPI.debug.logConfig();
      
      // 测试一个简单的API请求
      setApiStatus('开始测试图生图API...');
      // 使用用户提供的公共URL
      const imgUrl = "https://static-mp-ba33f5b1-550e-4c1f-8c15-cd4190c3c69b.next.bspapp.com/style1.png";
      setApiStatus(`参考图URL: ${imgUrl}`);
      
      // 使用指定的提示词
      const testPrompt = "参考图像的风格，为我生成单个故事版分镜：将图中的人物变成戴眼镜的年轻男人";
      setApiStatus(`使用提示词: ${testPrompt}`);
      
      // 测试API请求
      const response = await LiblibAPI.generateImageToImage(
        testPrompt,
        [imgUrl],
        { model: 'pro', aspectRatio: '4:3', imgCount: 1 }
      );
      
      // 确保我们获取到了正确的任务ID
      if (!response || !response.data || !response.data.generateUuid) {
        throw new Error('API响应缺少generateUuid');
      }
      
      const generateUuid = response.data.generateUuid;
      setApiStatus(`API测试成功！任务ID: ${generateUuid}`);
      
      // 尝试获取结果 - 增加轮询超时时间到120秒
      setApiStatus('正在获取结果...');
      const result = await LiblibAPI.pollTaskUntilDone(generateUuid, 2000, 120);
      
      if (result.images && result.images.length > 0) {
        const imageUrl = result.images[0].imageUrl;
        setApiStatus(`测试成功! 已生成图片: ${imageUrl}`);
        
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

  // 初始化时获取风格参考图的公网URL
  useEffect(() => {
    // 获取本地风格图片的可公网访问URL
    const getReferenceImageUrl = () => {
      try {
        // 直接使用用户提供的URL
        const staticUrl = "https://static-mp-ba33f5b1-550e-4c1f-8c15-cd4190c3c69b.next.bspapp.com/style1.png";
        setReferenceImageUrl(staticUrl);
        setApiStatus(`风格参考图已设置: 使用静态URL: ${staticUrl.substring(0, 20)}...`);
        console.log("参考图URL设置为:", staticUrl);
      } catch (error) {
        console.error('获取参考图URL失败:', error);
        // 设置错误状态
        setApiStatus(`错误: 获取参考图URL失败 - ${error.message}`);
        setLastError(error);
        // 使用备用URL
        setReferenceImageUrl("https://static-mp-ba33f5b1-550e-4c1f-8c15-cd4190c3c69b.next.bspapp.com/style1.png");
      }
    };
    
    getReferenceImageUrl();
  }, [selectedStyle]);

  // 监听风格变化，更新参考图 - 目前使用相同的静态URL
  useEffect(() => {
    // 当风格改变时，保持相同的参考图URL
    setApiStatus(`风格已更新为: ${selectedStyle}，继续使用相同的静态参考图`);
  }, [selectedStyle]);

  // 重新排列节点的函数
  const rearrangeNodes = useCallback((currentNodes) => {
    // 先按照节点的原始顺序排序
    const sortedNodes = [...currentNodes].sort((a, b) => {
      const aIndex = parseInt(a.data.label.replace('分镜 ', ''));
      const bIndex = parseInt(b.data.label.replace('分镜 ', ''));
      return aIndex - bIndex;
    });

    // 定义节点宽度和高度常量 - 使用固定宽度避免计算误差
    const COLLAPSED_WIDTH = 208;
    const EXPANDED_WIDTH = 256;
    const NODE_MARGIN = 60; // 大幅增加节点间距，确保即使展开也不会重叠

    // 计算每个节点的位置
    let currentX = INITIAL_X_POSITION;

    return sortedNodes.map((node, idx) => {
      // 固定使用原始Y坐标或初始Y坐标，防止漂移
      // 如果是新节点或者没有位置信息，使用初始Y值
      const yPosition = (node.position && node.position.y) || INITIAL_Y_POSITION;
      
      // 获取节点状态，判断是否展开
      const nodeState = nodeStatesRef.current[node.id];
      const isExpanded = nodeState?.isExpanded || false;
      const isEditing = nodeState?.state === 'editing' || nodeState?.state === 'imageEditing';
      
      // 当前节点的宽度
      const nodeWidth = isExpanded || isEditing ? EXPANDED_WIDTH : COLLAPSED_WIDTH;
      
      // 保存当前节点的X坐标
      const xPosition = currentX;
      
      // 使用固定间距，不再根据状态动态调整
      // 所有节点使用相同的大间距，确保展开后也不会重叠
      currentX += nodeWidth + NODE_MARGIN;
      
      // 为每个节点添加唯一的key，确保React能正确识别更新
      const uniqueKey = `${node.id}-${isExpanded ? 'expanded' : 'collapsed'}-${idx}`;
      
      return {
        ...node,
        position: {
          x: xPosition,
          y: yPosition // 保持Y坐标不变
        },
        data: {
          ...node.data,
          label: `分镜 ${idx + 1}`,
          nodeIndex: idx // 添加索引信息，方便调试
        },
        // 完全移除动画过渡效果，避免任何可能的位置偏移
        style: {
          ...node.style,
          // 不使用CSS transition，避免动画导致的位置偏移
        },
        // 添加布局调试信息
        layoutInfo: {
          isExpanded,
          width: nodeWidth,
          xPosition,
          spacing: NODE_MARGIN
        }
      };
    });
  }, []);

  // 监听节点状态变化并重新排列
  const handleNodeStateChange = useCallback((nodeId, state, isExpanded) => {
    console.log(`处理节点状态变化: 节点=${nodeId}, 状态=${state}, 展开=${isExpanded}`);
    
    // 获取当前节点的精确位置
    let nodePosition = {x: INITIAL_X_POSITION, y: INITIAL_Y_POSITION};
    const existingNode = nodes.find(n => n.id === nodeId);
    if (existingNode && existingNode.position) {
      nodePosition = {...existingNode.position};
      console.log(`节点${nodeId}当前位置:`, nodePosition);
    }
    
    // 更新节点状态引用，精确记录位置
    nodeStatesRef.current[nodeId] = { 
      state, 
      isExpanded, 
      position: nodePosition // 记录完整位置信息
    };
    
    // 记录当前节点状态，用于调试
    console.log("当前所有节点状态:", nodeStatesRef.current);
    
    // 当节点展开或折叠时，重新排列所有节点
    setNodes(currentNodes => {
      // 标记为布局更新，避免不必要的视图调整
      skipViewUpdateRef.current = true;
      
      // 先重新排列所有节点，获取新的X坐标
      const tempArranged = rearrangeNodes(currentNodes);
      
      // 然后为每个节点应用正确的Y坐标
      const finalNodes = tempArranged.map(node => {
        // 获取节点的状态记录
        const nodeState = nodeStatesRef.current[node.id];
        
        // 如果有记录的位置，使用记录的Y坐标
        if (nodeState && nodeState.position) {
          return {
            ...node,
            position: {
              x: node.position.x, // 使用重新计算的X坐标
              y: nodeState.position.y // 使用记录的Y坐标
            }
          };
        }
        return node;
      });
      
      // 不再自动调整视图，根据用户要求
      
      return finalNodes;
    });
  }, [rearrangeNodes, nodes]);

  // 将handleAddNode从useRef中移出，作为独立的useCallback函数
  const handleAddNode = useCallback((nodeId, position) => {
    console.log(`处理添加分镜: ${position} 到节点 ${nodeId}`);
    
    const newId = `frame-${Date.now()}`;
    
    setNodes(nds => {
      let nodeIndex = nds.findIndex(node => node.id === nodeId);
      
      if (nodeIndex === -1) {
        console.error(`未找到ID为${nodeId}的节点，将添加到末尾`);
        nodeIndex = nds.length - 1; // 设置为最后一个节点的索引，以便添加到右侧
        position = 'right'; // 强制添加到末尾（右侧）
      }
      
      const insertIndex = position === 'right' ? nodeIndex + 1 : nodeIndex;
      console.log(`将在索引 ${insertIndex} 处插入新节点`);
      
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
        text: `新分镜`,
        image: null,
        imagePrompt: '',
        onDeleteNode: nodeHandlersRef.current.handleDeleteNode,
        onRegenerateImage: nodeHandlersRef.current.handleRegenerateImage,
        onUpdateNode: nodeHandlersRef.current.handleUpdateNode,
        onGenerateImage: nodeHandlersRef.current.handleGenerateImage,
        onStateChange: handleNodeStateChange,
      });
      
      // 创建新节点
      const newNode = {
        id: newId,
        type: 'story',
        position: { 
          x: INITIAL_X_POSITION, // 临时位置，稍后调整
          y: yPosition // 使用参考节点的Y坐标，保持水平对齐
        },
        data: createNodeData(newId, `分镜 ${insertIndex + 1}`)
      };
      
      // 记录新节点的完整位置
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
      
      console.log(`更新后节点数量: ${newNodes.length}`);
      
      // 更新所有节点的数据，确保onAddNode函数正确设置（避免闭包过时）
      const updatedNodes = newNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onAddNode: (id, pos) => {
            console.log(`从节点调用添加: ${pos} 到 ${id}`);
            handleAddNode(id, pos);
          }
        }
      }));
      
      // 重新排列所有节点，确保保持各自的Y坐标
      const tempArranged = rearrangeNodes(updatedNodes);
      
      return tempArranged.map(n => {
        const nodeState = nodeStatesRef.current[n.id];
        if (nodeState && nodeState.position) {
          return {
            ...n,
            position: {
              x: n.position.x, // 使用重新计算的X坐标
              y: nodeState.position.y // 使用记录的Y坐标
            }
          };
        }
        return n;
      });
    });
    
    // 不再自动调整视图，根据用户要求
    // 可以添加日志记录新节点创建完成
    console.log(`新节点 ${newId} 创建完成`);
  }, [rearrangeNodes, handleNodeStateChange, reactFlowInstance, nodes]); // 添加nodes依赖，确保能找到最新节点

  // 处理节点拖动结束事件
  const handleNodeDragStop = useCallback((event, node) => {
    console.log("节点拖动结束:", node.id, node.position);
    
    // 记录拖动后的完整位置到节点状态
    if (nodeStatesRef.current[node.id]) {
      nodeStatesRef.current[node.id].position = {...node.position};
    } else {
      nodeStatesRef.current[node.id] = {
        state: 'default',
        isExpanded: false,
        position: {...node.position}
      };
    }
    
    // 更新节点位置但不重新排列
    setNodes(nds => {
      // 先记录所有节点当前位置
      nds.forEach(n => {
        if (!nodeStatesRef.current[n.id]) {
          nodeStatesRef.current[n.id] = {
            state: 'default',
            isExpanded: false,
            position: {...n.position}
          };
        } else if (!nodeStatesRef.current[n.id].position) {
          nodeStatesRef.current[n.id].position = {...n.position};
        }
      });
      
      // 更新当前拖动节点的位置
      const updatedNodes = nds.map(n => {
        if (n.id === node.id) {
          return {
            ...n,
            position: {...node.position} // 保留完整位置信息
          };
        }
        return n;
      });
      
      // 重新排列节点，但保留每个节点的Y坐标
      const tempArranged = rearrangeNodes(updatedNodes);
      
      // 应用记录的Y坐标
      return tempArranged.map(n => {
        const nodeState = nodeStatesRef.current[n.id];
        if (nodeState && nodeState.position) {
          return {
            ...n,
            position: {
              x: n.position.x, // 使用重新计算的X坐标
              y: nodeState.position.y // 使用记录的Y坐标
            }
          };
        }
        return n;
      });
    });
  }, [rearrangeNodes]);

  // 导入API服务
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
      setNodes((nds) => {
        // 找到被删除节点的索引
        const newNodes = nds.filter(node => node.id !== nodeId);
        
        // 删除节点状态记录
        delete nodeStatesRef.current[nodeId];
        
        // 更新剩余节点的数据，确保onAddNode最新
        const updatedNodes = newNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onAddNode: (id, pos) => {
              console.log(`从节点调用添加: ${pos} 到 ${id}`);
              handleAddNode(id, pos);
            }
          }
        }));
        
        // 重新排列所有节点
        return rearrangeNodes(updatedNodes);
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
                  error: '图像生成失败'
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
        console.log(`开始生成图像, nodeId: ${nodeId}, 使用API: ${useRealApi}`);
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
            console.log(`使用API生成图像, 参考图: ${referenceImageUrl}`);
            // 使用图生图API而不是文生图API
            setApiStatus('调用图生图API...');
            const response = await LiblibAPI.generateImageToImage(
              finalPrompt, 
              [referenceImageUrl], // 使用上传后的风格参考图URL
              {
                model: selectedStyle === 'realistic' ? 'max' : 'pro',
                aspectRatio: liblibConfig.defaultAspectRatio
              }
            );
            
            // 确保我们获取到了正确的任务ID
            if (!response || !response.data || !response.data.generateUuid) {
              throw new Error('API响应缺少generateUuid');
            }

            const generateUuid = response.data.generateUuid;
            console.log(`API调用成功，任务ID: ${generateUuid}`);
            setApiStatus(`等待结果: 任务ID ${generateUuid}`);
            const result = await LiblibAPI.pollTaskUntilDone(generateUuid);
            
            // 获取生成的图像URL
            if (result.images && result.images.length > 0) {
              const imageUrl = result.images[0].imageUrl;
              console.log(`获取到图像URL: ${imageUrl}`);
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
            setLastError(error);
            setApiStatus(`API错误: ${error.message}`);
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
                  error: '图像生成失败'
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

  const getStorySegments = useCallback((initialText) => {
    // 这里是模拟的故事情节，实际应用中应该从后端API获取
    const segments = [
      "张女士下班疲惫，站在超市生鲜区匆忙打开餐计划应用",
      "她浏览应用推荐的菜谱，看到一道简单的蔬菜沙拉",
      "张女士按照应用指导挑选新鲜的蔬菜和调料",
      "回家后，她跟随应用的步骤指导开始准备晚餐",
      "最终，她做出了美味的沙拉，感到满足和轻松"
    ];
    
    // 实际场景会根据初始文本动态生成
    return segments;
  }, []);

  const handleAddFrame = () => {
    console.log("点击了顶部添加分镜按钮");
    const newId = `frame-${Date.now()}`;
    
    setNodes(nds => {
      const nodeCount = nds.length;
      
      // 创建节点数据的函数
      const createNodeData = (id, label) => ({
        id,
        label,
        text: `新分镜`,
        image: null,
        imagePrompt: '',
        onDeleteNode: nodeHandlersRef.current.handleDeleteNode,
        onRegenerateImage: nodeHandlersRef.current.handleRegenerateImage,
        onUpdateNode: nodeHandlersRef.current.handleUpdateNode,
        onGenerateImage: nodeHandlersRef.current.handleGenerateImage,
        onStateChange: handleNodeStateChange,
      });
      
      // 创建新节点
      const newNode = {
        id: newId,
        type: 'story',
        position: { 
          x: INITIAL_X_POSITION + nodeCount * NODE_SPACING_X, 
          y: INITIAL_Y_POSITION 
        },
        data: createNodeData(newId, `分镜 ${nodeCount + 1}`)
      };
      
      const newNodes = [...nds, newNode];
      
      // 更新所有节点的数据，确保onAddNode函数正确设置
      const updatedNodes = newNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onAddNode: (id, pos) => {
            console.log(`从添加的节点调用添加: ${pos} 到 ${id}`);
            handleAddNode(id, pos);
          }
        }
      }));
      
      // 重新排列所有节点
      return rearrangeNodes(updatedNodes);
    });
    
    // 仅在添加新节点时调整视图
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2 });
      }
    }, 100);
  };

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
  };

  const confirmStyleChange = async () => {
    try {
    setShowStyleConfirm(false);
      setApiStatus('开始更新风格...');
      
      // 使用静态URL
      const staticUrl = "https://static-mp-ba33f5b1-550e-4c1f-8c15-cd4190c3c69b.next.bspapp.com/style1.png";
      setReferenceImageUrl(staticUrl);
      setApiStatus(`已更新风格为: ${selectedStyle}, 继续使用静态参考图URL`);
      
      // 批量重新生成所有已有图像的节点
      const nodesWithImages = nodes.filter(node => node.data.image);
      setApiStatus(`开始更新 ${nodesWithImages.length} 个图像节点`);
      
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
                },
              };
            }
            return n;
          })
        );
        
        try {
          if (useRealApi) {
            // 使用图生图API
            setApiStatus(`调用API: 节点 ${i+1}/${nodesWithImages.length}`);
            const response = await LiblibAPI.generateImageToImage(
              prompt,
              [node.data.image || staticUrl], // 使用当前图像或参考图像
              {
                model: selectedStyle === 'realistic' ? 'max' : 'pro',
                aspectRatio: liblibConfig.defaultAspectRatio
              }
            );
            
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
                      error: null
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
                    error: '风格更新失败'
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

  useEffect(() => {
    if (loading) {
      const segments = getStorySegments(initialStoryText);
      
      // 创建节点数据的函数
      const createNodeData = (id, label, text, index) => ({
        id,
        label,
        text,
        image: null,
        imagePrompt: '',
        onDeleteNode: nodeHandlersRef.current.handleDeleteNode,
        onRegenerateImage: nodeHandlersRef.current.handleRegenerateImage,
        onUpdateNode: nodeHandlersRef.current.handleUpdateNode,
        onGenerateImage: nodeHandlersRef.current.handleGenerateImage,
        onStateChange: handleNodeStateChange,
      });
      
      // 创建初始节点
      const initialNodes = segments.map((seg, i) => ({
        id: `frame-${i}`,
        type: 'story',
        position: { x: INITIAL_X_POSITION + i * NODE_SPACING_X, y: INITIAL_Y_POSITION },
        data: createNodeData(`frame-${i}`, `分镜 ${i + 1}`, seg, i)
      }));
      
      // 更新节点数据，确保onAddNode函数正确设置
      const nodesWithAddFunction = initialNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onAddNode: (id, pos) => {
            console.log(`从初始节点调用添加: ${pos} 到 ${id}`);
            handleAddNode(id, pos);
          }
        }
      }));

      setNodes(nodesWithAddFunction);
      // 不再设置边缘连接
      setEdges([]);

      setLoading(false);
    }
  }, [initialStoryText, loading, setNodes, setEdges, getStorySegments, handleNodeStateChange, handleAddNode]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: '#F4F5F7' }}
    >
      {/* Top nav */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 h-[50px] flex items-center justify-between px-4 z-10">
        <button
          onClick={onClose}
          className="border border-[#007BFF] text-[#007BFF] px-4 py-1.5 rounded text-sm font-medium flex items-center hover:bg-blue-50 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          返回输入页
        </button>
        
        <div className="flex items-center space-x-3">
          <button className="border border-[#28A745] text-[#28A745] px-4 py-1.5 rounded text-sm font-medium flex items-center hover:bg-green-50 transition-colors">
            <Download size={16} className="mr-1" />
            保存/导出
          </button>
          
          <button 
            className="border border-[#6C757D] text-[#6C757D] px-4 py-1.5 rounded text-sm font-medium flex items-center hover:bg-gray-50 transition-colors"
            onClick={handleAddFrame}
          >
            <Plus size={16} className="mr-1" />
            添加分镜
          </button>
          
          <button 
            className="border border-[#17A2B8] text-[#17A2B8] px-4 py-1.5 rounded text-sm font-medium flex items-center hover:bg-blue-50 transition-colors"
            onClick={handleBatchGenerate}
          >
            <Zap size={16} className="mr-1" />
            批量生成图像
          </button>
          
          <div className="flex items-center space-x-1 border border-gray-200 px-2 py-1 rounded">
            <Settings size={16} className="text-gray-600" />
            <span className="text-sm text-gray-600 mr-2">全局风格:</span>
            <StyleSelector 
              selectedStyle={selectedStyle}
              onStyleChange={handleStyleChange}
            />
          </div>
          
          <div className="flex items-center space-x-2 border border-gray-200 px-3 py-1.5 rounded">
            <span className="text-sm text-gray-600">使用API:</span>
            <div 
              className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${useRealApi ? 'bg-blue-500' : 'bg-gray-300'}`}
              onClick={() => setUseRealApi(prev => !prev)}
            >
              <div 
                className={`bg-white w-4 h-4 rounded-full transform transition-transform ${useRealApi ? 'translate-x-6' : 'translate-x-0'}`} 
              />
            </div>
          </div>
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
            nodes={nodes.map(node => ({
              ...node,
              draggable: true, // 启用拖动功能
              data: {
                ...node.data,
                // Pass selectedStyle if needed
              }
            }))}
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
            onNodeClick={(event, node) => {
              // 完全不阻止事件冒泡，让节点内部的点击事件能够正常处理
              console.log("节点点击事件:", node.id);
            }}
            onPaneClick={(event) => {
              // 点击空白区域时的处理
              console.log("画布点击");
            }}
            proOptions={{ 
              hideAttribution: true,
              account: 'paid-pro' 
            }}
            style={{ 
              background: '#F4F5F7',
              height: '100%'
            }}
            nodesDraggable={true}
            elementsSelectable={true}
            snapToGrid={false}
            snapGrid={[20, 20]}
            nodeExtent={[
              [0, 0],
              [2000, 2000]
            ]}
            preventScrolling={true}
            onlyRenderVisibleElements={true}
            nodeOrigin={[0.5, 0.5]}
          >
            <Controls showInteractive={false} />
            <Background variant="dots" gap={20} size={1} />
            <MiniMap nodeStrokeColor="#D3D3D3" nodeColor="#ffffff" nodeBorderRadius={10} />
            
            {/* 调试面板 */}
            <Panel position="top-left" className="bg-white p-2 rounded shadow-md text-xs">
              <div className="font-bold mb-1">调试信息:</div>
              <div>节点数量: {nodes.length}</div>
              <div className="mt-1">API状态: <span className={useRealApi ? "text-green-600 font-bold" : "text-red-600"}>{useRealApi ? '已启用' : '已禁用'}</span></div>
              <div className="mt-1 text-xs text-blue-600 max-w-[220px] truncate">{apiStatus}</div>
              {lastError && (
                <div className="mt-1 text-xs text-red-600 max-w-[220px] truncate">
                  错误: {lastError.message}
                </div>
              )}
              <div className="mt-1 truncate max-w-[220px]">
                参考图: <a href={referenceImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{referenceImageUrl?.substring(0, 20)}...</a>
              </div>
              <div className="flex space-x-1 mt-2">
              <button 
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                  onClick={() => {
                    console.log("当前节点状态:", nodes);
                    setApiStatus(`节点状态已打印到控制台，节点数量: ${nodes.length}`);
                  }}
                >
                  打印状态
              </button>
                <button 
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                  onClick={testApiConnection}
                  disabled={!useRealApi}
                >
                  测试API
                </button>
                <button 
                  className="px-2 py-1 bg-purple-500 text-white rounded text-xs"
                  onClick={() => {
                    // 打印节点布局信息
                    const layoutInfo = nodes.map(node => ({
                      id: node.id,
                      label: node.data.label,
                      position: node.position,
                      state: nodeStatesRef.current[node.id]?.state || 'unknown',
                      isExpanded: nodeStatesRef.current[node.id]?.isExpanded || false
                    }));
                    console.table(layoutInfo);
                    setApiStatus('节点布局信息已打印到控制台');
                    
                    // 重新排列节点
                    setNodes(rearrangeNodes(nodes));
                  }}
                >
                  修复布局
                </button>
              </div>
            </Panel>
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
                className="bg-white p-6 rounded-lg shadow-xl max-w-sm"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                <div className="flex items-center mb-4">
                  <AlertTriangle className="text-yellow-500 mr-2" size={24} />
                  <h3 className="text-lg font-semibold">确认全局风格变更</h3>
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