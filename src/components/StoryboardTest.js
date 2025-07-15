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
// 导入测试图像
import testImage from '../images/test.png';

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
const NODE_SPACING_X = 280; // 增加节点之间的水平间距，确保展开后不会重叠
const INITIAL_X_POSITION = 100; // 初始X坐标
const INITIAL_Y_POSITION = 150; // Y坐标保持固定，增加高度以适应展开的卡片

// 创建内部组件以使用ReactFlow hooks
function StoryboardFlow({ initialStoryText, onClose }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [showStyleConfirm, setShowStyleConfirm] = useState(false); // For global style confirm modal
  const reactFlowInstance = useReactFlow();
  const nodeStatesRef = useRef({}); // 用于跟踪节点状态
  const skipViewUpdateRef = useRef(false); // 用于跳过视图更新

  // 重新排列节点的函数
  const rearrangeNodes = useCallback((currentNodes) => {
    // 先按照节点的原始顺序排序
    const sortedNodes = [...currentNodes].sort((a, b) => {
      const aIndex = parseInt(a.data.label.replace('分镜 ', ''));
      const bIndex = parseInt(b.data.label.replace('分镜 ', ''));
      return aIndex - bIndex;
    });

    return sortedNodes.map((node, idx) => {
      // 保留节点的Y坐标，只调整X坐标
      const yPosition = node.position ? node.position.y : INITIAL_Y_POSITION;
      
      return {
        ...node,
        position: {
          x: INITIAL_X_POSITION + idx * NODE_SPACING_X,
          y: yPosition
        },
        data: {
          ...node.data,
          label: `分镜 ${idx + 1}`
        }
      };
    });
  }, []);

  // 监听节点状态变化并重新排列
  const handleNodeStateChange = useCallback((nodeId, state, isExpanded) => {
    nodeStatesRef.current[nodeId] = { state, isExpanded };
    
    // 当节点展开或折叠时，重新排列所有节点，但不调整视图
    skipViewUpdateRef.current = true;
    setNodes(currentNodes => {
      return rearrangeNodes(currentNodes);
    });
  }, [rearrangeNodes]);

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
          y: INITIAL_Y_POSITION 
        },
        data: createNodeData(newId, `分镜 ${insertIndex + 1}`)
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
      
      // 重新排列所有节点
      return rearrangeNodes(updatedNodes);
    });
    
    // 仅在添加新节点时调整视图
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2 });
      }
    }, 100);
  }, [rearrangeNodes, handleNodeStateChange, reactFlowInstance]); // 移除nodes依赖，避免闭包过时

  // 处理节点拖动结束事件
  const handleNodeDragStop = useCallback((event, node) => {
    console.log("节点拖动结束:", node.id, node.position);
    
    // 更新节点位置但不重新排列
    // 我们只保存新的Y坐标，X坐标将在重新排列时计算
    setNodes(nds => {
      const updatedNodes = nds.map(n => {
        if (n.id === node.id) {
          return {
            ...n,
            position: {
              ...n.position,
              y: node.position.y // 只保留Y坐标变化
            }
          };
        }
        return n;
      });
      
      // 重新排列所有节点，但保留Y坐标
      return rearrangeNodes(updatedNodes);
    });
  }, [rearrangeNodes]);

  const nodeHandlersRef = useRef({
    generatePrompt: (text) => `一个精美的场景，描述：${text}。${selectedStyle}风格，明亮的光线，高清细节。`,
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
    handleRegenerateImage: async (nodeId, prompt) => {
      // 使用本地测试图像而不是生成随机颜色
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 使用setTimeout延迟更新节点状态，避免ResizeObserver错误
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  image: testImage, // 使用导入的测试图像
                  imagePrompt: prompt
                },
              };
            }
            return node;
          })
        );
      }, 50);
    },
    handleGenerateImage: async (nodeId, prompt) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 使用setTimeout延迟更新节点状态，避免ResizeObserver错误
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  image: testImage, // 使用导入的测试图像
                  imagePrompt: prompt
                },
              };
            }
            return node;
          })
        );
      }, 50);
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
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node.data.image) {
        const prompt = nodeHandlersRef.current.generatePrompt(node.data.text);
        await nodeHandlersRef.current.handleGenerateImage(node.id, prompt);
        // Sequential animation delay
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  };

  const handleStyleChange = (style) => {
    setSelectedStyle(style);
    setShowStyleConfirm(true);
  };

  const confirmStyleChange = async () => {
    setShowStyleConfirm(false);
    // Batch regenerate all with new style
    for (let node of nodes) {
      if (node.data.image) {
        const prompt = nodeHandlersRef.current.generatePrompt(node.data.text);
        await nodeHandlersRef.current.handleRegenerateImage(node.id, prompt);
      }
    }
  };

  // 监听节点变化，确保动态调整位置
  useEffect(() => {
    if (!loading && nodes.length > 0) {
      // 如果设置了跳过视图更新标志，则不调整视图
      if (skipViewUpdateRef.current) {
        skipViewUpdateRef.current = false;
        return;
      }
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
          
          <div className="flex items-center space-x-1 border border-gray-200 px-2 py-1 rounded">
            <Settings size={16} className="text-gray-600" />
            <span className="text-sm text-gray-600 mr-2">全局风格:</span>
            <StyleSelector 
              selectedStyle={selectedStyle}
              onStyleChange={handleStyleChange}
            />
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
          >
            <Controls showInteractive={false} />
            <Background variant="dots" gap={20} size={1} />
            <MiniMap nodeStrokeColor="#D3D3D3" nodeColor="#ffffff" nodeBorderRadius={10} />
            
            {/* 添加调试面板 */}
            <Panel position="top-left" className="bg-white p-2 rounded shadow-md text-xs">
              <div className="font-bold mb-1">调试信息:</div>
              <div>节点数量: {nodes.length}</div>
              <button 
                className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
                onClick={() => console.log("当前节点状态:", nodes)}
              >
                打印节点状态
              </button>
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