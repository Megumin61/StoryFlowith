import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// 移除不再需要的ReactFlow组件
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Image, Save, ArrowLeft, Download, Plus, Settings, Zap, AlertTriangle, User, GitFork, CheckCircle,
  MousePointerClick, Film, Folder, PanelLeft, PanelLeftClose, Edit3, ChevronDown, CornerDownRight,
  Highlighter, Eye, Trash2, Check, Edit2, Loader2, Sparkles, Bot
} from 'lucide-react';
import KeywordSelector from './KeywordSelector';
import NodeRenderer, { NODE_TYPES, createNode } from './NodeRenderer';
import { extractInterviewData, checkServiceHealth } from '../services/interviewExtractionAPI';
import { generatePersona, transformFrontendData, transformApiResponse } from '../services/personaGenerationService';
import CozeTest from './CozeTest';

// 导入测试图像和风格图
import testImage from '../images/test.png';
import style1Image from '../images/style1.png';
import style2Image from '../images/style2.png';
import style3Image from '../images/style3.png';
import style4Image from '../images/style4.png';

// 节点类型验证函数（暂时注释掉，避免未使用函数警告）
/*
const isValidNodeType = (nodeType) => {
  return Object.values(NODE_TYPES).includes(nodeType);
};
*/

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

// 全局变量用于存储 layoutTree 的参数
let globalStoryModel = null;
let globalSelectedFrameId = null;
let globalGetNodeById = null;
let globalGetBranchById = null;
let globalUpdateNode = null;

// 添加节点状态跟踪
const nodeStatesRef = {};

// 动态布局常量
const DYNAMIC_LAYOUT_CONFIG = {
  BASE_LEFT: 100,
  BASE_TOP: 100,
  HORIZONTAL_GAP: 60, // 探索节点基础间距（分镜节点间距在calculateDynamicGap中单独处理）
  VERTICAL_GAP: 600, // 垂直间距
  BRANCH_LINE_GAP: 300, // 分支线间距（从300缩小到200，让子分支更紧凑）
  PANEL_WIDTH: 132, // 面板宽度
  NODE_WIDTH: {
    COLLAPSED: 240,
    EXPANDED: 360
  }
};

// 辅助函数：动态计算节点宽度 - 移到组件级别以便全局使用（暂时注释掉，避免未使用函数警告）
/*
const getNodeWidth = (node) => {
  if (!node) return DYNAMIC_LAYOUT_CONFIG.NODE_WIDTH.COLLAPSED;
  
  // 严格检查是否为探索节点
  const isExplorationNode = node.type === NODE_TYPES.EXPLORATION || node.explorationData?.isExplorationNode;
  
  // 根据节点类型调整基础宽度
  if (isExplorationNode) {
    // ExplorationNode的动态宽度处理
    if (node.showBubblesPanel) {
      return 800; // 显示气泡面板时的宽度
    } else {
      return 400; // 不显示气泡面板时的宽度
    }
  }
  
  // 对于普通分镜节点，需要考虑展开状态下的面板宽度
  const nodeState = nodeStatesRef[node.id];
  const isExpanded = nodeState && nodeState.isExpanded;
  
  if (isExpanded) {
    // 展开状态：若显示面板需加上面板宽度
    const showPanel = node.showFloatingPanel;
    return DYNAMIC_LAYOUT_CONFIG.NODE_WIDTH.EXPANDED + (showPanel ? DYNAMIC_LAYOUT_CONFIG.PANEL_WIDTH : 0);
  } else {
    // 折叠状态：若显示面板需加上面板宽度
    const showPanel = node.showFloatingPanel;
    return DYNAMIC_LAYOUT_CONFIG.NODE_WIDTH.COLLAPSED + (showPanel ? DYNAMIC_LAYOUT_CONFIG.PANEL_WIDTH : 0);
  }
};
*/

// 获取节点的实际显示宽度（用于布局计算）
const getNodeDisplayWidth = (node) => {
  if (!node) return DYNAMIC_LAYOUT_CONFIG.NODE_WIDTH.COLLAPSED;
  
  // 严格检查是否为探索节点
  const isExplorationNode = node.type === NODE_TYPES.EXPLORATION || node.explorationData?.isExplorationNode;
  
  // 根据节点类型调整基础宽度
  if (isExplorationNode) {
    // ExplorationNode的动态宽度处理
    if (node.showBubblesPanel) {
      return 800; // 显示气泡面板时的宽度
    } else {
      return 400; // 不显示气泡面板时的宽度
    }
  }
  
  // 对于普通分镜节点，根据节点状态计算宽度
  const nodeState = nodeStatesRef[node.id];
  let baseWidth;
  
  // 检查节点的实际状态
  if (node.state === 'generating' || node.state === 'expanded' || node.state === 'editing') {
    // 画面生成状态和展开状态：1200px (横向布局)
    baseWidth = 1200;
  } else if (node.state === 'collapsedWithImage' || (node.image && node.state === 'collapsed')) {
    // 带有图像的折叠状态：320px
    baseWidth = 320;
  } else {
    // 普通折叠状态：240px
    baseWidth = 240;
  }
  
  // 调试日志
  console.log('🔧 getNodeDisplayWidth:', {
    nodeId: node.id,
    nodeState: node.state,
    hasImage: !!node.image,
    calculatedWidth: baseWidth,
    nodeStatesRef: nodeStatesRef[node.id]
  });
  
  // 如果显示悬浮面板，加上面板宽度
  const showPanel = node.showFloatingPanel;
  const totalWidth = baseWidth + (showPanel ? DYNAMIC_LAYOUT_CONFIG.PANEL_WIDTH : 0);
  
  return totalWidth;
};

// 辅助函数：动态计算节点高度 - 移到组件级别以便全局使用
const getNodeHeight = (node) => {
  if (!node) return 200;
  
  // 根据节点状态和内容计算高度 - 直接检查nodeStatesRef
  const nodeState = nodeStatesRef[node.id];
  if (nodeState && nodeState.isExpanded) {
    return 400; // 展开状态 - 调整为新的压缩布局高度
  }
  
  return 200; // 默认折叠状态
};

// 动态间距计算函数 - 分别处理分镜节点和探索节点
const calculateDynamicGap = (currentNode, currentIndex, allNodes) => {
  const { HORIZONTAL_GAP } = DYNAMIC_LAYOUT_CONFIG;
  let gap = HORIZONTAL_GAP;
  
  // 检查当前节点和下一个节点的类型
  const isCurrentExploration = currentNode.type === NODE_TYPES.EXPLORATION || currentNode.explorationData?.isExplorationNode;
  const nextNode = allNodes[currentIndex + 1];
  const isNextExploration = nextNode?.type === NODE_TYPES.EXPLORATION || nextNode?.explorationData?.isExplorationNode;
  
  // 分镜节点之间的间距 - 保持恒定间距
  if (!isCurrentExploration && !isNextExploration) {
    // 两个都是分镜节点，使用固定间距
    gap = 50;
    
    // 调试日志：检查分镜节点的状态
    console.log('🔧 分镜节点间距计算:', {
      currentId: currentNode.id,
      currentState: currentNode.state,
      currentWidth: getNodeDisplayWidth(currentNode),
      nextId: nextNode?.id,
      nextState: nextNode?.state,
      nextWidth: nextNode ? getNodeDisplayWidth(nextNode) : 'N/A',
      calculatedGap: gap
    });
  }
  // 分镜节点与探索节点之间的间距
  else if (!isCurrentExploration && isNextExploration) {
    // 当前是分镜节点，下一个是探索节点
    // 增加间距避免重合
    gap = 80;
  }
  // 探索节点与分镜节点之间的间距
  else if (isCurrentExploration && !isNextExploration) {
    // 当前是探索节点，下一个是分镜节点
    // 增加间距避免重合，特别是当探索节点展开时
    gap = 100;
  }
  // 探索节点之间的间距
  else if (isCurrentExploration && isNextExploration) {
    // 两个都是探索节点
    gap = 60;
  }
  

  
  return gap;
};

// 递归布局算法 - 支持无限嵌套的树状结构和动态间距调整
const layoutTree = (storyModel, selectedFrameId, getNodeById, getBranchById, updateNode) => {
  

  


  const { BASE_LEFT, BASE_TOP, VERTICAL_GAP, BRANCH_LINE_GAP } = DYNAMIC_LAYOUT_CONFIG;

  // 获取所有分支
  const allBranches = Object.values(storyModel.branches);

  // 递归布局函数
  const layoutBranch = (branchId, startX, startY, level = 0) => {
    const branch = getBranchById(branchId);
    if (!branch) return { width: 0, height: 0 };

    // 获取分支内的节点，并按照nodeIndex排序
    const branchNodes = branch.nodeIds
      .map(nodeId => getNodeById(nodeId))
      .filter(Boolean)
      .sort((a, b) => {
        // 优先使用nodeIndex，如果没有则使用在branch.nodeIds中的位置
        const aIndex = a.nodeIndex !== undefined ? a.nodeIndex : branch.nodeIds.indexOf(a.id);
        const bIndex = b.nodeIndex !== undefined ? b.nodeIndex : branch.nodeIds.indexOf(b.id);
        return aIndex - bIndex;
      });



    if (branchNodes.length === 0) return { width: 0, height: 0 };

    let currentX = startX;
    let maxHeight = 0;
    let totalWidth = 0;

    // 布局分支内的节点 - 确保所有节点在同一水平线上
    branchNodes.forEach((node, index) => {
      // 第一步：设置当前节点位置
      // 如果是第一个节点，使用startX；否则使用前一个节点的位置+宽度+间距
      if (index === 0) {
        // 第一个节点：使用基准位置，如果节点有baseX则使用baseX，否则使用startX
        node.pos = { x: node.baseX !== undefined ? node.baseX : startX, y: startY };
        console.log('🔧 布局第一个节点:', {
          nodeId: node.id,
          nodeState: node.state,
          hasImage: !!node.image,
          pos: node.pos
        });
      } else {
        // 其他节点：基于前一个节点的位置计算
        const prevNode = branchNodes[index - 1];
        const prevNodeWidth = getNodeDisplayWidth(prevNode); // 使用显示宽度确保一致性
        const dynamicGap = calculateDynamicGap(prevNode, index - 1, branchNodes);
        node.pos = { x: prevNode.pos.x + prevNodeWidth + dynamicGap, y: startY };
        
        console.log('🔧 布局后续节点:', {
          nodeId: node.id,
          nodeState: node.state,
          hasImage: !!node.image,
          prevNodeId: prevNode.id,
          prevNodeState: prevNode.state,
          prevNodeWidth,
          dynamicGap,
          pos: node.pos
        });
      }

      // 设置连接关系 - 同一分支内的节点不连接，只连接分支间的关系
      if (index === 0) {
        // 第一个节点连接到父节点（如果有）
        if (branch.originNodeId) {
          node.connections = [branch.originNodeId];
        } else {
          node.connections = [];
        }
      } else {
        // 同一分支内的后续节点不连接到前一个节点
        node.connections = [];
      }

      // 更新节点数据
      updateNode(node.id, {
        pos: node.pos,
        connections: node.connections
      });
      


      // 第二步：计算当前节点的基础宽度（不包括面板）
      const nodeWidth = getNodeDisplayWidth(node); // 使用显示宽度，避免展开时影响布局
      // 动态计算间距：根据节点状态调整间距
      const dynamicGap = calculateDynamicGap(node, index, branchNodes);
      
      // 第三步：计算下一个节点的起始位置
      // 关键：下一个节点的起始位置 = 当前节点的起始位置 + 当前节点的显示宽度 + 间距
      // 这样确保节点展开时不影响后续节点的位置
      const nextNodeStartX = node.pos.x + nodeWidth + dynamicGap;

      // 第四步：更新currentX，使其成为下一个节点的起始位置
      currentX = nextNodeStartX;
      totalWidth = currentX - startX;
      maxHeight = Math.max(maxHeight, getNodeHeight(node));
    });

    // 递归布局子分支
    const childBranches = allBranches.filter(b => b.parentBranchId === branchId);
    if (childBranches.length > 0) {
      // 找到探索节点（分支的起源节点）
      const explorationNode = branchNodes.find(node =>
        node.type === NODE_TYPES.EXPLORATION || node.explorationData?.isExplorationNode
      );

      if (explorationNode) {
        // 计算子分支的起始位置
        const explorationNodeWidth = getNodeDisplayWidth(explorationNode); // 使用显示宽度，避免展开时影响布局
        // 子分支应该基于探索节点的基础宽度，不包括面板宽度
        const childStartX = explorationNode.pos.x + explorationNodeWidth + 20; // 进一步减小探索节点和子分支之间的间距 - 从40缩小到20
        const childStartY = explorationNode.pos.y;

        // 计算子分支的垂直分布 - 确保子分支节点也在同一水平线上
        const totalChildBranches = childBranches.length;
        childBranches.forEach((childBranch, childIndex) => {
          const childY = childStartY + (childIndex - Math.floor(totalChildBranches / 2)) * BRANCH_LINE_GAP;
          layoutBranch(childBranch.id, childStartX, childY, level + 1);

          // 更新探索节点的连接关系
          const childBranchStartNode = childBranch.nodeIds[0] ? getNodeById(childBranch.nodeIds[0]) : null;
          if (childBranchStartNode) {
            explorationNode.connections = [...(explorationNode.connections || []), childBranchStartNode.id];
          }
        });

        // 更新探索节点数据
        updateNode(explorationNode.id, {
          connections: explorationNode.connections
        });
      }
    }

    return { width: totalWidth, height: maxHeight };
  };

  // 找到根分支（没有父分支的分支）
  const rootBranches = allBranches.filter(branch => !branch.parentBranchId);

  if (rootBranches.length === 0) {
    return;
  }

  // 布局根分支
  let currentY = BASE_TOP;
  rootBranches.forEach((rootBranch, index) => {
    const layout = layoutBranch(rootBranch.id, BASE_LEFT, currentY, 0);
    currentY += layout.height + VERTICAL_GAP;
  });


};

// 全局 layoutTree 包装函数
const globalLayoutTree = () => {
  if (globalStoryModel && globalSelectedFrameId !== null && globalGetNodeById && globalGetBranchById && globalUpdateNode) {
    layoutTree(globalStoryModel, globalSelectedFrameId, globalGetNodeById, globalGetBranchById, globalUpdateNode);
  }
};

// 节点状态管理函数
const updateNodeState = (nodeId, state, isExpanded) => {
  // 更新节点状态引用
  nodeStatesRef[nodeId] = {
    state,
    isExpanded,
    lastUpdated: Date.now()
  };
  
  console.log('🔧 updateNodeState:', {
    nodeId,
    state,
    isExpanded,
    timestamp: new Date().toISOString()
  });
  
  // 立即触发动态重新布局，确保节点间距保持动态不变
  requestAnimationFrame(() => {
    const currentNode = globalGetNodeById ? globalGetNodeById(nodeId) : null;
    if (!currentNode) return;

    const isExplorationNode = currentNode.type === NODE_TYPES.EXPLORATION || currentNode.explorationData?.isExplorationNode;

    if (isExplorationNode) {
      // 情景探索节点尺寸变化会影响子分支起点，必须做全局递归布局
      console.log('🔧 探索节点状态变化，执行全局布局');
      globalLayoutTree();
    } else if (currentNode.branchId) {
      // 分镜节点状态变化，使用智能重新布局保持后续节点间距
      const branch = globalGetBranchById ? globalGetBranchById(currentNode.branchId) : null;
      if (branch) {
        console.log('🔧 分镜节点状态变化，执行智能重新布局');
        smartRelayout(branch, nodeId);
      } else {
        console.log('🔧 无法定位分支，执行全局布局');
        globalLayoutTree();
      }
    } else {
      // 兜底：无法定位分支时执行全局布局
      console.log('🔧 兜底处理，执行全局布局');
      globalLayoutTree();
    }
  });
};

// 从指定索引开始重新布局节点（暂时注释掉，避免未使用函数警告）
/*
const relayoutNodesFromIndex = (branch, startIndex) => {
  if (!globalGetNodeById || !globalUpdateNode) return;
  
  const uniqueIds = Array.from(new Set(branch.nodeIds));
  const branchNodes = uniqueIds
    .map(nodeId => globalGetNodeById(nodeId))
    .filter(Boolean)
    .sort((a, b) => (a.nodeIndex || 0) - (b.nodeIndex || 0));
  
  if (startIndex >= branchNodes.length) return;
  
  // 从startIndex开始重新计算位置
  for (let i = startIndex; i < branchNodes.length; i++) {
    const node = branchNodes[i];
    const prevNode = branchNodes[i - 1];
    
    // 基于前一个节点的位置计算当前位置
    const prevNodeWidth = getNodeDisplayWidth(prevNode); // 使用显示宽度，避免展开时影响布局
    const dynamicGap = calculateDynamicGap(prevNode, i - 1, branchNodes);
    
    // 关键修复：确保前一个节点有有效的位置
    if (prevNode && prevNode.pos && typeof prevNode.pos.x === 'number') {
      const newX = prevNode.pos.x + prevNodeWidth + dynamicGap;
      
      // 更新节点位置，但保持Y坐标不变
      globalUpdateNode(node.id, {
        pos: { x: newX, y: node.pos.y }
      });
      

    } else {
      // 如果前一个节点位置无效，使用基准位置
      const baseX = node.baseX !== undefined ? node.baseX : (i * 220); // 默认间距
      globalUpdateNode(node.id, {
        pos: { x: baseX, y: node.pos.y }
      });
    }
  }
};
*/

// 智能重新布局函数 - 保持节点间距动态不变
const smartRelayout = (branch, changedNodeId) => {
  if (!globalGetNodeById || !globalUpdateNode) return;
  
  const uniqueIds = Array.from(new Set(branch.nodeIds));
  const branchNodes = uniqueIds
    .map(nodeId => globalGetNodeById(nodeId))
    .filter(Boolean)
    .sort((a, b) => (a.nodeIndex || 0) - (b.nodeIndex || 0));
  
  const changedNodeIndex = branchNodes.findIndex(node => node.id === changedNodeId);
  if (changedNodeIndex === -1) return;
  
  console.log('🔧 smartRelayout 开始:', {
    branchId: branch.id,
    changedNodeId,
    changedNodeIndex,
    totalNodes: branchNodes.length
  });
  
  // 从变更节点开始，重新计算所有后续节点的位置
  for (let i = changedNodeIndex; i < branchNodes.length; i++) {
    const node = branchNodes[i];
    
    if (i === 0) {
      // 第一个节点保持基准位置
      if (node.baseX !== undefined) {
        const newX = node.baseX;
        if (Math.abs(node.pos.x - newX) > 1) {
          console.log('🔧 更新第一个节点位置:', { nodeId: node.id, oldX: node.pos.x, newX });
          globalUpdateNode(node.id, {
            pos: { x: newX, y: node.pos.y }
          });
        }
      }
    } else {
      // 其他节点基于前一个节点的位置和宽度计算
      const prevNode = branchNodes[i - 1];
      
      if (prevNode && prevNode.pos && typeof prevNode.pos.x === 'number') {
        const prevNodeWidth = getNodeDisplayWidth(prevNode); // 使用实时显示宽度
        const dynamicGap = calculateDynamicGap(prevNode, i - 1, branchNodes);
        const newX = prevNode.pos.x + prevNodeWidth + dynamicGap;
        
        console.log('🔧 计算节点位置:', {
          nodeId: node.id,
          prevNodeId: prevNode.id,
          prevNodeState: prevNode.state,
          prevNodeWidth,
          dynamicGap,
          oldX: node.pos.x,
          newX
        });
        
        // 只有当位置真正需要改变时才更新
        if (Math.abs(node.pos.x - newX) > 1) {
          console.log('🔧 更新节点位置:', { nodeId: node.id, oldX: node.pos.x, newX });
          globalUpdateNode(node.id, {
            pos: { x: newX, y: node.pos.y }
          });
        }
      }
    }
  }
  
  console.log('🔧 smartRelayout 完成');
};

// 初始化节点状态函数
const initializeNodeState = (nodeId) => {
  if (!nodeStatesRef[nodeId]) {
    nodeStatesRef[nodeId] = {
      state: 'collapsed',
      isExpanded: false,
      lastUpdated: Date.now()
    };
  }
  return nodeStatesRef[nodeId];
};

// 设置节点的基准位置（暂时注释掉，避免未使用函数警告）
/*
const setNodeBaseX = (nodeId, baseX) => {
  if (globalUpdateNode) {
    globalUpdateNode(nodeId, { baseX });
  }
};

// 动态重新布局函数（暂时注释掉，避免未使用函数警告）
const triggerDynamicRelayout = () => {
  setTimeout(() => {
    globalLayoutTree();
  }, 100);
};
*/

  // 设置全局 layoutTree 参数的函数
  const setLayoutTreeParams = (storyModel, selectedFrameId, getNodeById, getBranchById, updateNode) => {
    globalStoryModel = storyModel;
    globalSelectedFrameId = selectedFrameId;
    globalGetNodeById = getNodeById;
    globalGetBranchById = getBranchById;
    globalUpdateNode = updateNode;
  };



// 中间页面组件 - 已被删除，避免语法错误

// 左侧边栏组件 - 重构为支持分支结构
function StoryboardTree({ storyModel, selectedFrameId, onFrameSelect, onFrameReorder, onDragStateUpdate, draggedNodeId, dragTargetIndex }) {
  const renderStoryTree = () => {
    if (!storyModel || !storyModel.branches || !storyModel.nodes) {
      return null;
    }

    // 找到根分支（没有父分支的分支）
    const rootBranches = Object.values(storyModel.branches).filter(branch => !branch.parentBranchId);
    
    if (rootBranches.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <span className="text-xs">暂无故事结构</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {rootBranches.map((rootBranch, index) => (
          <BranchTimeline
            key={rootBranch.id}
            branch={rootBranch}
            storyModel={storyModel}
            selectedFrameId={selectedFrameId}
            onFrameSelect={onFrameSelect}
            onFrameReorder={onFrameReorder}
            branchIndex={index}
            onDragStateUpdate={onDragStateUpdate}
            draggedNodeId={draggedNodeId}
            dragTargetIndex={dragTargetIndex}
          />
        ))}
      </div>
    );
  };

  return renderStoryTree();
}

function BranchTimeline({ branch, storyModel, selectedFrameId, onFrameSelect, onFrameReorder, branchIndex, onDragStateUpdate, draggedNodeId, dragTargetIndex }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragOverNodeId, setDragOverNodeId] = useState(null);
  const [dragOverPosition, setDragOverPosition] = useState(null); // 'before' | 'after' | null
  const [dragOverIndex, setDragOverIndex] = useState(null);
  // 使用统一的拖拽状态，与左侧边栏保持一致

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  };

  const getBranchName = useCallback(() => {
    if (branch.name) return branch.name;
    if (branch.level === 0) {
      return '主线';
    }
    const siblings = Object.values(storyModel.branches).filter(b => b.parentBranchId === branch.parentBranchId);
    const siblingIndex = siblings.findIndex(b => b.id === branch.id);
    return `分支 ${String.fromCharCode(65 + (siblingIndex >= 0 ? siblingIndex : branchIndex || 0))}`;
  }, [branch, storyModel.branches, branchIndex]);

  // 仅显示本分支的节点列表（纵向，一行一个）
  const uniqueNodeIds = Array.from(new Set(branch.nodeIds));
  const branchNodes = uniqueNodeIds
    .map(nodeId => storyModel.nodes[nodeId])
    .filter(Boolean)
    .filter(node => node && node.id) // 确保节点有效
    .sort((a, b) => (a.nodeIndex || 0) - (b.nodeIndex || 0));

  const renderNodeRow = (node, indexInBranch) => {
    const isExploration = node.type === NODE_TYPES.EXPLORATION || node.explorationData?.isExplorationNode;
    const isSelected = selectedFrameId === node.id;
    const icon = isExploration ? '🔍' : '📽️';
    const label = node.label || (isExploration ? '情景探索' : `分镜 ${(node.nodeIndex || 0) + 1}`);

    const handleDragStart = (e) => {
      e.stopPropagation();
      e.dataTransfer.setData('text/plain', node.id);
      e.dataTransfer.effectAllowed = 'move';
      
      // 通知父组件拖拽开始
      if (onDragStateUpdate) {
        onDragStateUpdate(node.id, true);
      }
      
      // 添加拖拽时的视觉反馈
      e.currentTarget.style.transform = 'scale(0.95) rotate(2deg)';
      e.currentTarget.style.transition = 'all 0.2s ease';
      
      // 设置拖拽图像
      const dragImage = e.currentTarget.cloneNode(true);
      dragImage.style.opacity = '0.8';
      dragImage.style.transform = 'scale(0.9)';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      
      // 延迟移除拖拽图像
      setTimeout(() => {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage);
        }
      }, 0);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      
      if (isExploration) return; // 探索节点不可拖拽

      const rect = e.currentTarget.getBoundingClientRect();
      const mouseY = e.clientY;
      const nodeCenterY = rect.top + rect.height / 2;
      
      // 判断拖拽位置：在节点上方还是下方
      if (mouseY < nodeCenterY) {
        setDragOverNodeId(node.id);
        setDragOverPosition('before');
        setDragOverIndex(indexInBranch);
        
        // 通知父组件拖拽目标位置
        if (onDragStateUpdate) {
          onDragStateUpdate(draggedNodeId, true, indexInBranch);
        }
      } else {
        setDragOverNodeId(node.id);
        setDragOverPosition('after');
        setDragOverIndex(indexInBranch + 1);
        
        // 通知父组件拖拽目标位置
        if (onDragStateUpdate) {
          onDragStateUpdate(draggedNodeId, true, indexInBranch + 1);
        }
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (isExploration) return; // 探索节点不可拖拽
      
      const draggedNodeId = e.dataTransfer.getData('text/plain');
      if (draggedNodeId && draggedNodeId !== node.id) {
        // 调用父组件的拖拽排序函数，传递插入位置
        if (onFrameReorder) {
          const insertIndex = dragOverPosition === 'before' ? indexInBranch : indexInBranch + 1;
          onFrameReorder(draggedNodeId, insertIndex);
        }
      }
      
      // 清除拖拽状态
      setDragOverNodeId(null);
      setDragOverPosition(null);
      setDragOverIndex(null);
    };

    const handleDragLeave = (e) => {
      // 清除拖拽悬停状态
      setDragOverNodeId(null);
      setDragOverPosition(null);
      setDragOverIndex(null);
      
      // 通知父组件清除拖拽目标位置
      if (onDragStateUpdate && draggedNodeId) {
        onDragStateUpdate(draggedNodeId, true, null);
      }
    };

    const handleDragEnd = (e) => {
      // 恢复拖拽元素的样式
      if (e.currentTarget) {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.transition = '';
      }
      
      // 通知父组件拖拽结束
      if (onDragStateUpdate) {
        onDragStateUpdate(null, false);
      }
      
      setDragOverNodeId(null);
      setDragOverPosition(null);
      setDragOverIndex(null);
    };

    // 渲染拖拽插入位置指示器
    const renderDropIndicator = () => {
      if (dragOverNodeId === node.id && dragOverPosition) {
        const indicatorClass = dragOverPosition === 'before' 
          ? 'absolute -top-1 left-0 right-0 h-1 bg-blue-500 rounded-full z-10'
          : 'absolute -bottom-1 left-0 right-0 h-1 bg-blue-500 rounded-full z-10';
        
        return (
          <div className={indicatorClass} />
        );
      }
      return null;
    };

    return (
      <div 
        key={node.id} 
        className={`node-item group relative ${!isExploration ? 'cursor-move' : ''}`}
        draggable={!isExploration} // 只有分镜节点可以拖拽
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
        onDragEnd={handleDragEnd}
      >
        {/* 拖拽插入位置指示器 */}
        {renderDropIndicator()}
        
        <div
          className={`node-content w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-all duration-200 ${
            isSelected ? 'bg-blue-100 border border-blue-500' : ''
          } ${
            dragOverNodeId === node.id ? 'bg-blue-50 border-2 border-blue-300 shadow-md scale-105' : ''
          } ${
            draggedNodeId === node.id ? 'opacity-50 scale-95 transform' : ''
          } ${
            !isExploration ? 'cursor-pointer' : ''
          }`}
          onClick={() => onFrameSelect(node.id)}
        >
          <div className="w-4 h-4 flex-shrink-0">
            <span className="text-xs align-middle">{icon}</span>
          </div>
          <span className="flex-grow text-sm text-gray-800 truncate min-w-0">{label}</span>
          {/* 拖拽指示器 */}
          {!isExploration && (
            <div className="w-3 h-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors group-hover:scale-110">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 查找挂载在某个探索节点下的子分支（只在分歧处显示分支）
  const getChildBranchesForOrigin = (originNodeId) => {
    return Object.values(storyModel.branches).filter(b => b.parentBranchId === branch.id && b.originNodeId === originNodeId);
  };

  return (
    <div className="branch-tree">
      <div
        className={`branch-header flex items-center justify-between p-2 cursor-pointer text-sm font-medium rounded-md transition-colors ${branch.level === 0 
          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 flex-shrink-0 ${branch.level === 0 ? 'text-blue-500' : 'text-yellow-500'}`}>
            {branch.level === 0 ? <Folder className="w-4 h-4" /> : <CornerDownRight className="w-4 h-4" />}
          </div>
          <span className="font-semibold">{getBranchName()}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${!isExpanded ? 'rotate-180' : ''}`} />
      </div>

      {isExpanded && (
        <div className="pl-3 pt-2">
          {/* 本分支纵向节点列表 */}
          <div className="space-y-1">
            {/* 拖拽到分支开头的提示区域 */}
            {branchNodes.length > 0 && (
              <div
                className={`h-2 rounded transition-all duration-200 ${
                  dragTargetIndex === 0 ? 'bg-blue-200 border-2 border-blue-400' : 'bg-transparent'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverNodeId(null);
                  setDragOverPosition(null);
                  setDragOverIndex(0);
                  // 通知父组件拖拽目标位置
                  if (onDragStateUpdate) {
                    onDragStateUpdate(draggedNodeId, true, 0);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const draggedNodeId = e.dataTransfer.getData('text/plain');
                  if (draggedNodeId && onFrameReorder) {
                    onFrameReorder(draggedNodeId, 0);
                  }
                  setDragOverIndex(null);
                }}
                onDragLeave={() => {
                  setDragOverIndex(null);
                  // 通知父组件清除拖拽目标位置
                  if (onDragStateUpdate && draggedNodeId) {
                    onDragStateUpdate(draggedNodeId, true, null);
                  }
                }}
              />
            )}
            
            {branchNodes.map((node, idx) => (
              <div key={node.id}>
                {renderNodeRow(node, idx)}
                
                {/* 节点之间的拖拽插入区域 */}
                {idx < branchNodes.length - 1 && (
                  <div
                                    className={`h-2 rounded transition-all duration-200 ${
                  dragTargetIndex === idx + 1 ? 'bg-blue-200 border-2 border-blue-400' : 'bg-transparent'
                }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverNodeId(null);
                      setDragOverPosition(null);
                      setDragOverIndex(idx + 1);
                      // 通知父组件拖拽目标位置
                      if (onDragStateUpdate) {
                        onDragStateUpdate(draggedNodeId, true, idx + 1);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const draggedNodeId = e.dataTransfer.getData('text/plain');
                      if (draggedNodeId && onFrameReorder) {
                        onFrameReorder(draggedNodeId, idx + 1);
                      }
                      setDragOverIndex(null);
                    }}
                    onDragLeave={() => {
                      setDragOverIndex(null);
                      // 通知父组件清除拖拽目标位置
                      if (onDragStateUpdate && draggedNodeId) {
                        onDragStateUpdate(draggedNodeId, true, null);
                      }
                    }}
                  />
                )}
                
                {/* 若为情景探索节点，则在此节点下显示其子分支（只显示差异部分） */}
                {(node.type === NODE_TYPES.EXPLORATION || node.explorationData?.isExplorationNode) && (
                  (() => {
                    const childBranches = getChildBranchesForOrigin(node.id);
                    if (childBranches.length === 0) return null;
                    // 按与该探索节点相关的顺序展示分支
                    return (
                      <div className="mt-1 pl-4 border-l-2 border-purple-200 space-y-2">
                        {childBranches.map((childBranch, childIdx) => (
                          <BranchTimeline
                            key={childBranch.id}
                            branch={childBranch}
                            storyModel={storyModel}
                            selectedFrameId={selectedFrameId}
                            onFrameSelect={onFrameSelect}
                            onFrameReorder={onFrameReorder}
                            branchIndex={childIdx}
                          />
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            ))}
            
            {/* 拖拽到分支末尾的提示区域 */}
            {branchNodes.length > 0 && (
              <div
                className={`h-2 rounded transition-all duration-200 ${
                  dragTargetIndex === branchNodes.length ? 'bg-blue-200 border-2 border-blue-400' : 'bg-transparent'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverNodeId(null);
                  setDragOverPosition(null);
                  setDragOverIndex(branchNodes.length);
                  // 通知父组件拖拽目标位置
                  if (onDragStateUpdate) {
                    onDragStateUpdate(draggedNodeId, true, branchNodes.length);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const draggedNodeId = e.dataTransfer.getData('text/plain');
                  if (draggedNodeId && onFrameReorder) {
                    onFrameReorder(draggedNodeId, branchNodes.length);
                  }
                  setDragOverIndex(null);
                }}
                onDragLeave={() => {
                  setDragOverIndex(null);
                  // 通知父组件清除拖拽目标位置
                  if (onDragStateUpdate && draggedNodeId) {
                    onDragStateUpdate(draggedNodeId, true, null);
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 故事板画布组件 - 参考Canvas设计，带连线功能
function StoryboardCanvas({
  storyData,
  storyModel,
  selectedFrameId,
  onFrameSelect,
  onMoveNode,
  onDeleteNode,
  onTextSave,
  onPromptSave,
  onNodeStateChange,
  onAddNode,
  onExploreScene,
  onGenerateImage,
  onDeleteFrame,
  onGenerateBranches,
  onMergeBranches,
  setCurrentExplorationNodeId,
  setIsSceneExplorationOpen,
  // 添加工具函数作为props
  getNodeById,
  getBranchById,
  addNode,
  addNodeToBranch,
  updateNode,
  // 添加用户画像数据
  personas
}) {
  const canvasWorldRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const isPanningRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const worldPosRef = useRef({ x: 0, y: 0 });
  const lastWorldPosRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const hasFocusedRef = useRef(false); // 添加聚焦标志位



  const initCanvasControls = useCallback(() => {
    const canvasContainer = canvasContainerRef.current;
    if (!canvasContainer) return () => { };

    const handleMouseDown = (e) => {
      // 如果点击的是节点或其子元素，不进行拖拽
      if (
        e.target.closest('[data-node-id]') ||
        e.target.closest('.story-frame') ||
        e.target.closest('.exploration-panel') ||
        e.target.closest('.floating-buttons')
      ) {
        return;
      }

      // 如果点击的是按钮或其他交互元素，不进行拖拽
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) {
        return;
      }

      // 点击画布空白处，将所有展开的分镜节点回到折叠状态
      const allNodes = Object.values(storyModel?.nodes || {});
      allNodes.forEach(node => {
        if (node.state === 'expanded' || node.state === 'editing' || node.state === 'generating') {
          // 调用节点状态变化处理函数，将节点状态改为折叠
          if (onNodeStateChange) {
            onNodeStateChange(node.id, 'collapsed');
          }
        }
      });

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
        const transform = `translate(${worldPosRef.current.x}px, ${worldPosRef.current.y}px) scale(${scaleRef.current})`;
        canvasWorldRef.current.style.transform = transform;
      }
    };

    const handleMouseUp = () => {
      if (!isPanningRef.current) return;
      isPanningRef.current = false;
      canvasContainer.classList.remove('grabbing');
    };

    // 添加鼠标滚轮缩放功能
    const handleWheel = (e) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(3, scaleRef.current * delta));

      if (newScale !== scaleRef.current) {
        scaleRef.current = newScale;

        if (canvasWorldRef.current) {
          const transform = `translate(${worldPosRef.current.x}px, ${worldPosRef.current.y}px) scale(${newScale})`;
          canvasWorldRef.current.style.transform = transform;
        }
      }
    };

    canvasContainer.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvasContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvasContainer.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvasContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const renderConnections = useCallback(() => {
    const svg = document.getElementById('canvas-connections');
    if (!svg || !storyModel) return;

    // 清除现有的连接线和圆点，保留defs
    const existingDefs = svg.querySelector('defs');
    const existingPaths = svg.querySelectorAll('path');
    const existingCircles = svg.querySelectorAll('circle');
    existingPaths.forEach(path => path.remove());
    existingCircles.forEach(circle => circle.remove());

    if (!existingDefs) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `
        <marker id="arrowhead" viewBox="0 0 12 8" refX="10" refY="4"
            markerWidth="8" markerHeight="6"
            orient="auto-start-reverse">
          <path d="M 0 0 L 12 4 L 0 8 z" fill="#6b7280"></path>
        </marker>
      `;
      svg.appendChild(defs);
    }

    // 第一步：绘制分支内部的连线 - 移除同一分支内的连接线
    // 同一分支内的节点不再显示连接线，保持动态间距即可

    // 第二步：绘制分支点的连线（从起源节点到分支第一个节点）
    Object.values(storyModel.branches).forEach(branch => {
      if (branch.originNodeId && branch.nodeIds.length > 0) {
        const originNode = storyModel.nodes[branch.originNodeId];
        const firstBranchNode = storyModel.nodes[branch.nodeIds[0]];

        if (originNode && firstBranchNode) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');

          // 动态计算节点宽度和高度
          const originWidth = getNodeDisplayWidth(originNode); // 使用显示宽度确保一致性
          const firstBranchWidth = getNodeDisplayWidth(firstBranchNode); // 使用显示宽度确保一致性
          const originHeight = getNodeHeight(originNode);
          const firstBranchHeight = getNodeHeight(firstBranchNode);

          // 动态计算连接点位置：始终从起源节点右侧中心到分支节点左侧中心
          // 注意：连接线应该基于节点的显示宽度，包括面板宽度
          const fromX = originNode.pos.x + originWidth; // 使用显示宽度，包括面板
          const fromY = originNode.pos.y + originHeight / 2;
          const toX = firstBranchNode.pos.x;
          const toY = firstBranchNode.pos.y + firstBranchHeight / 2;

          // 创建曲线连接
          const distance = Math.abs(toX - fromX);
          const controlX1 = fromX + distance * 0.3;
          const controlY1 = fromY;
          const controlX2 = toX - distance * 0.3;
          const controlY2 = toY;

          line.setAttribute('d', `M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`);
          line.setAttribute('stroke', '#6b7280'); // 使用更深的灰色
          line.setAttribute('stroke-width', '2'); // 稍微加粗
          line.setAttribute('stroke-dasharray', '5,5'); // 虚线表示分支
          line.setAttribute('fill', 'none');
          line.setAttribute('marker-end', 'url(#arrowhead)');

          svg.appendChild(line);

          // 添加连接点圆点
          const fromCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          fromCircle.setAttribute('cx', fromX);
          fromCircle.setAttribute('cy', fromY);
          fromCircle.setAttribute('r', '2');
          fromCircle.setAttribute('fill', '#6b7280');
          fromCircle.setAttribute('stroke', '#ffffff');
          fromCircle.setAttribute('stroke-width', '1');
          svg.appendChild(fromCircle);

          const toCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          toCircle.setAttribute('cx', toX);
          toCircle.setAttribute('cy', toY);
          toCircle.setAttribute('r', '2');
          toCircle.setAttribute('fill', '#6b7280');
          toCircle.setAttribute('stroke', '#ffffff');
          toCircle.setAttribute('stroke-width', '1');
          svg.appendChild(toCircle);
        }
      }
    });
  }, [storyModel]);

  useEffect(() => {
    // console.log('🔧 Layout useEffect triggered:', {
    //   storyModelNodes: storyModel?.nodes?.length,
    //   selectedFrameId,
    //   renderConnections: typeof renderConnections,
    //   initCanvasControls: typeof initCanvasControls
    // });
    
    const cleanup = initCanvasControls();
    return cleanup;
  }, []);

  // 统一的聚焦逻辑 - 确保进入画布时聚焦到第一个分镜节点
  useEffect(() => {
    // 检查是否需要重置聚焦标志
    if (window.resetCanvasFocus) {
      hasFocusedRef.current = false;
      window.resetCanvasFocus = false;
    }

    // 如果是初始分镜（只有一个分镜且标记为初始分镜），不进行聚焦移动
    if (storyData.length === 1 && storyData[0]?.isInitialFrame) {
      return;
    }

    if (storyData.length > 0 && !hasFocusedRef.current) {
      // 确保有第一个分镜时自动选择
      if (!selectedFrameId) {
        onFrameSelect(storyData[0].id);
      }
      hasFocusedRef.current = true; // 设置聚焦标志

      // 聚焦到第一个节点位置 - 延迟更长时间确保layoutTree执行完毕
      setTimeout(() => {
        const firstNode = storyData[0];
        if (firstNode && canvasWorldRef.current && canvasContainerRef.current) {
          const container = canvasContainerRef.current;
          const world = canvasWorldRef.current;

          // 获取容器的实际尺寸
          const containerRect = container.getBoundingClientRect();
          const containerCenterX = containerRect.width / 2;
          const containerCenterY = containerRect.height / 2;

          // 计算节点中心位置（考虑当前的世界变换）
          const nodeWidth = getNodeDisplayWidth(firstNode); // 使用显示宽度，已经包含了面板宽度
          const nodeHeight = getNodeHeight(firstNode);
          
          // 节点宽度已经包含了面板宽度，无需额外计算
          const totalNodeWidth = nodeWidth;
          
          const nodeCenterX = firstNode.pos.x + (totalNodeWidth / 2);
          const nodeCenterY = firstNode.pos.y + (nodeHeight / 2);

          // 计算需要移动的距离，使节点居中
          const moveX = containerCenterX - nodeCenterX;
          const moveY = containerCenterY - nodeCenterY;

          // 应用变换，使用平滑动画
          world.style.transition = 'transform 0.5s ease-out';
          const transform = `translate(${moveX}px, ${moveY}px) scale(${scaleRef.current})`;
          world.style.transform = transform;
          worldPosRef.current = { x: moveX, y: moveY };
          lastWorldPosRef.current = { x: moveX, y: moveY };

          // 移除过渡动画
          setTimeout(() => {
            world.style.transition = '';
          }, 500);
        }
      }, 1500); // 增加延迟时间到1500ms，确保所有组件渲染完成
    }
  }, [storyData.length, selectedFrameId, onFrameSelect, storyData]); // 添加必要的依赖项

  // 当故事数据重置时，重置聚焦标志
  useEffect(() => {
    if (storyData.length === 0) {
      hasFocusedRef.current = false;
    }
  }, [storyData.length]);

  // 监听节点状态变化，重新渲染连接线
  useEffect(() => {
    // console.log('🔧 Render connections useEffect triggered:', {
    //   storyModelNodes: storyModel?.nodes?.length,
    //   selectedFrameId
    // });
    
    const timer = setTimeout(() => {
      renderConnections();
    }, 200); // 增加延迟时间，确保DOM完全更新

    return () => clearTimeout(timer);
  }, [storyModel?.nodes, storyModel?.branches, selectedFrameId]); // 移除renderConnections依赖，避免循环

  // 添加额外的监听器，确保节点状态变化时重新渲染
  useEffect(() => {
    // console.log('🔧 Mutation observer useEffect triggered:', {
    //   storyModelNodes: storyModel?.nodes?.length
    // });
    
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
        attributeFilter: ['data-expanded', 'data-node-width', 'data-node-height', 'data-state']
      });
    });

    return () => observer.disconnect();
  }, [storyModel?.nodes, storyModel?.branches]); // 移除renderConnections依赖，避免循环

  // 监听窗口大小变化，重新渲染连接线
  useEffect(() => {
    // console.log('🔧 Window resize useEffect triggered');
    
    const handleResize = () => {
      setTimeout(() => {
        renderConnections();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // 移除renderConnections依赖，避免循环

  // 悬浮按钮事件处理函数 - 使用新的树状数据结构
  const handleAddFrame = (nodeId) => {
    console.log('🔧 handleAddFrame 被调用，节点ID:', nodeId);
    
    // 获取目标节点
    const targetNode = getNodeById(nodeId);
    if (!targetNode) {
      console.warn('❌ 目标节点不存在:', nodeId);
      return;
    }

    // 获取目标节点所在的分支
    const targetBranchId = targetNode.branchId;
    const targetBranch = getBranchById(targetBranchId);
    if (!targetBranch) {
      console.warn('❌ 目标分支不存在:', targetBranchId);
      return;
    }

    console.log('🔧 目标节点信息:', {
      id: targetNode.id,
      branchId: targetBranchId,
      currentIndex: targetBranch.nodeIds.indexOf(nodeId),
      totalNodes: targetBranch.nodeIds.length
    });

    // 计算插入位置 - 插入到当前节点之后
    const currentIndex = targetBranch.nodeIds.indexOf(nodeId);
    const insertIndex = currentIndex + 1;
    
    // 计算新节点的基准位置 - 插入到当前节点右侧
    const targetNodeWidth = getNodeDisplayWidth(targetNode);
    const dynamicGap = calculateDynamicGap(targetNode, currentIndex, targetBranch.nodeIds.map(id => getNodeById(id)).filter(Boolean));
    const newBaseX = targetNode.pos.x + targetNodeWidth + dynamicGap;



    // 使用节点工厂函数创建新分镜
    const newNode = createNode(NODE_TYPES.STORY_FRAME, {
      branchId: targetBranchId,
      nodeIndex: insertIndex,
      label: `分镜 ${insertIndex + 1}`,
      styleName: targetNode.styleName || 'style1',
      connections: [targetNode.id],
      baseX: newBaseX,
      pos: { x: newBaseX, y: targetNode.pos.y }, // 设置初始位置
      ...(targetBranch.level > 0 ? {
        branchData: {
          branchName: targetBranch.name,
          branchLineIndex: (() => {
            const siblings = Object.values(storyModel.branches).filter(b => b.parentBranchId === targetBranch.parentBranchId);
            const siblingIndex = siblings.findIndex(b => b.id === targetBranch.id);
            return siblingIndex >= 0 ? siblingIndex : 0;
          })()
        }
      } : {})
    });



    // 添加新节点到数据模型
    addNode(newNode);

    // 将新节点插入到目标分支中，插入到当前节点之后
    addNodeToBranch(targetBranchId, newNode.id, insertIndex);

    // 更新目标节点的连接关系，连接到新创建的分镜节点
    updateNode(nodeId, {
      connections: [...(targetNode.connections || []), newNode.id]
    });

    // 调用父组件的添加分镜函数（如果存在）
    if (onAddNode) {
      onAddNode(newNode, insertIndex);
    }

    // 立即重新排布节点，确保新节点位置正确
    setTimeout(() => {
      globalLayoutTree();
    }, 50);
  };

  // 处理生成分支的函数
  const handleGenerateBranches = (nodeId) => {
    if (onGenerateBranches) {
      onGenerateBranches(nodeId);
    }
  };



  // 这些函数将在StoryboardFlow组件内定义

  return (
    <div id="canvas-container" className="flex-grow h-full overflow-hidden cursor-grab relative" ref={canvasContainerRef}>
      <div id="canvas-world" className="absolute top-0 left-0" ref={canvasWorldRef}>
        <svg id="canvas-connections" style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '5000px', 
          height: '5000px', 
          pointerEvents: 'none',
          zIndex: 0 // 确保连接线在最底层，不遮挡节点
        }}></svg>
        <div>
          {storyData
            .filter(frameData => frameData && frameData.pos && typeof frameData.pos.x === 'number' && typeof frameData.pos.y === 'number')
            .map(frameData => {
              // 计算动态z-index：被选中的节点和展开状态的节点应该有更高的层级
              const getNodeZIndex = () => {
                if (frameData.id === selectedFrameId) {
                  return 1000; // 被选中的节点最高层级
                } else if (frameData.state === 'expanded' || frameData.state === 'editing' || frameData.state === 'generating') {
                  return 500; // 展开状态的节点次高层级
                } else {
                  return 1; // 普通折叠状态节点基础层级
                }
              };

              return (
                <div
                  key={frameData.id}
                  style={{ 
                    left: `${frameData.pos.x}px`, 
                    top: `${frameData.pos.y}px`, 
                    position: 'absolute',
                    zIndex: getNodeZIndex() // 动态设置z-index
                  }}
                  onClick={() => onFrameSelect(frameData.id)}
                >
                  <NodeRenderer
                    node={frameData}
                    selected={frameData.id === selectedFrameId}
                    onNodeClick={() => onFrameSelect(frameData.id)}
                    onNodeDelete={() => onDeleteNode(frameData.id)}
                    onGenerateBranches={handleGenerateBranches}
                    onMoveNode={onMoveNode}
                    onTextSave={onTextSave}
                    onPromptSave={onPromptSave}
                    onNodeStateChange={onNodeStateChange}
                    onAddFrame={handleAddFrame}
                    onExploreScene={onExploreScene}
                    onGenerateImage={onGenerateImage}
                    onDeleteFrame={onDeleteFrame}
                    onUpdateNode={updateNode}
                  />
                </div>
              );
            })}
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
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  // 两个故事脚本区域的状态
  const [storyAreas, setStoryAreas] = useState({
    area1: { name: '故事区域1', keywords: [] },
    area2: { name: '故事区域2', keywords: [] }
  });

  // 关键词筛选状态
  const [activeKeywordFilter, setActiveKeywordFilter] = useState('all');

  // 关键词类型配置 - 使用统一的颜色系统
  const keywordTypes = [
    {
      id: 'elements',
      name: '元素',
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    },
    {
      id: 'user_traits',
      name: '用户特征',
      color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
    },
    {
      id: 'pain_points',
      name: '痛点',
      color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
    },
    {
      id: 'goals',
      name: '目标',
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
    },
    {
      id: 'emotions',
      name: '情绪',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
    }
  ];

  // 初始化默认用户画像
  useEffect(() => {
    if (personas.length === 0) {
      const defaultPersona = {
        persona_name: '张敏',
        persona_summary: '35岁银行客户经理，工作繁忙，注重效率',
        memorable_quote: '当手机电量比我的耐心先耗尽时，任何精致菜谱都成了讽刺漫画',
        appearance_characteristics: '穿着职业装，经常单手持手机推购物车',
        persona_details: {
          age: '35岁',
          occupation: '银行客户经理',
          lifestyle: '工作繁忙，经常加班',
          education: '本科',
          city: '北京',
          technology_literacy: '中',
          gender: '女',
          pain_points: ['时间紧张', '手机电量焦虑', '效率流失放大镜效应'],
          goals: ['快速找到适合的菜谱', '节省时间', '缓解育儿愧疚感'],
          behaviors: ['单手持手机推购物车', '底线思维', '量化表达'],
          psychological_profile: ['效率导向', '底线思维', '量化表达'],
          communication_style: ['直接表达', '自嘲式幽默', '对营销话术敏感'],
          tool_expectations: ['快速响应', '简单易用', '节省时间'],
          devices: ['智能手机', '平板电脑']
        }
      };
      setPersonas([defaultPersona]);
      setSelectedPersona(defaultPersona);
    } else if (personas.length > 0 && !selectedPersona) {
      setSelectedPersona(personas[0]);
    }
  }, [personas, setPersonas, selectedPersona]);

  // 处理拖拽关键词到故事构思区
  const handleDragStart = (e, keyword) => {
    // 设置拖拽数据，兼容探索情景节点
    const dragData = {
      type: 'keyword',
      keyword: keyword.text,
      keywordData: keyword
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));

    // 添加颜色信息到拖拽数据 - 使用统一的颜色系统
    const keywordWithColor = {
      ...keyword,
                  originalColor: keyword.type === 'emotions' ? 'indigo' :
        keyword.type === 'pain_points' ? 'red' :
          keyword.type === 'goals' ? 'amber' :
            keyword.type === 'user_traits' ? 'green' :
              keyword.type === 'elements' ? 'blue' : 'blue',
      dragSource: 'keywordPool' // 添加拖拽源标识
    };
    e.dataTransfer.setData('keyword', JSON.stringify(keywordWithColor));
  };

  const handleDrop = (e, areaId) => {
    e.preventDefault();
    const keywordData = e.dataTransfer.getData('keyword');
    if (keywordData) {
      const keyword = JSON.parse(keywordData);
      // 添加到指定区域
      setStoryAreas(prev => ({
        ...prev,
        [areaId]: {
          ...prev[areaId],
          keywords: [...prev[areaId].keywords, keyword]
        }
      }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // 移除故事区域中的关键词
  const removeFromStoryArea = (areaId, keywordId) => {
    setStoryAreas(prev => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        keywords: prev[areaId].keywords.filter(item => item.id !== keywordId)
      }
    }));
  };

  // 移除故事构思中的关键词
  const removeFromComposition = (keywordId) => {
    setStoryComposition(prev => prev.filter(item => item.id !== keywordId));
  };

  // 生成故事脚本
  const generateStories = async () => {
    const totalKeywords = Object.values(storyAreas).reduce((sum, area) => sum + area.keywords.length, 0);
    if (totalKeywords === 0) return;

    setIsGenerating(true);

    try {
      // 准备故事生成数据
      const storyData = {
        persona: selectedPersona,
        areas: {
          area1: {
            name: storyAreas.area1.name,
            bubbles: {
              persona: storyAreas.area1.keywords.filter(k => k.type === 'user_traits').map(k => k.text),
              context: storyAreas.area1.keywords.filter(k => k.type === 'elements').map(k => k.text),
              goal: storyAreas.area1.keywords.filter(k => k.type === 'goals').map(k => k.text),
              pain: storyAreas.area1.keywords.filter(k => k.type === 'pain_points').map(k => k.text),
              emotion: storyAreas.area1.keywords.filter(k => k.type === 'emotions').map(k => k.text)
            }
          },
          area2: {
            name: storyAreas.area2.name,
            bubbles: {
              persona: storyAreas.area2.keywords.filter(k => k.type === 'user_traits').map(k => k.text),
              context: storyAreas.area2.keywords.filter(k => k.type === 'elements').map(k => k.text),
              goal: storyAreas.area2.keywords.filter(k => k.type === 'goals').map(k => k.text),
              pain: storyAreas.area2.keywords.filter(k => k.type === 'pain_points').map(k => k.text),
              emotion: storyAreas.area2.keywords.filter(k => k.type === 'emotions').map(k => k.text)
            }
          }
        }
      };

      console.log('📤 准备发送到故事生成API的数据:', storyData);

      // 调用故事脚本生成服务
      const { generateStoryScript } = await import('../services/personaGenerationService');
      const result = await generateStoryScript(storyData);

      console.log('🎯 故事生成API返回结果:', result);

      if (result.stories && result.stories.length > 0) {
        // 转换API返回的数据格式为前端使用的格式
        const convertedStories = result.stories.map(story => ({
          id: story.story_id || `story-${Date.now()}`,
          title: '', // 不需要标题
          content: story.story_text || '', // 使用后端返回的故事文本
          tags: [], // 暂时为空，后续可以根据需要添加
          score: 85 + Math.floor(Math.random() * 15),
          areaId: 'unknown',
          claimEvaluation: {
            positive: {
              title: '正面评价',
              description: '这个故事在多个维度表现优秀',
              bubbles: story.claims?.positive || ['故事结构完整', '情节发展合理', '角色塑造生动']
            },
            negative: {
              title: '需要改进',
              description: '以下方面可以进一步优化',
              bubbles: story.claims?.negative || ['细节描述可以更丰富', '情感层次可以更深入']
            }
          }
        }));

        setGeneratedStories(convertedStories);
        console.log('✅ 故事脚本生成成功:', convertedStories);
      } else {
        console.warn('⚠️ API返回的故事数据为空');
        setGeneratedStories([]);
      }
    } catch (error) {
      console.error('❌ 故事生成失败:', error);
      setGeneratedStories([]);
    } finally {
      setIsGenerating(false);
    }
  };

  // 根据区域关键词生成故事内容
  const generateStoryContent = (area) => {
    const keywords = area.keywords.map(k => k.text).join('、');

    if (area.name === '效率导向故事') {
      return `故事背景：
基于关键词：${keywords}
张敏是一位注重效率的用户，她希望在有限的时间内完成更多的事情。

主要情节：
1. 张敏面临时间紧张的情况，需要快速做出决策
2. 她使用量化思维来评估每个选项的效率和成本
3. 在追求效率的过程中，她发现了一些意外的收获
4. 最终她找到了平衡效率和质量的解决方案

故事结局：
张敏学会了如何在效率和质量之间找到平衡，提高了整体的生活品质。`;
    } else if (area.name === '情感共鸣故事') {
      return `故事背景：
基于关键词：${keywords}
张敏在使用产品时遇到了情感上的挑战和共鸣。

主要情节：
1. 张敏在使用过程中产生了强烈的情感体验
2. 她开始反思自己的需求和期望
3. 通过与产品的互动，她发现了新的可能性
4. 最终她找到了情感上的满足和认同

故事结局：
张敏不仅解决了实际问题，更重要的是获得了情感上的满足和成长。`;
    } else {
      return `故事背景：
基于关键词：${keywords}
张敏遇到了一个具体的问题，需要找到有效的解决方案。

主要情节：
1. 张敏识别出了问题的核心和影响
2. 她尝试了多种方法来解决这个问题
3. 在解决问题的过程中，她发现了新的机会
4. 最终她找到了最适合的解决方案

故事结局：
张敏不仅解决了当前的问题，还为未来类似的情况积累了经验。`;
    }
  };

  // 生成Claim评价
  const generateClaimEvaluation = (area) => {
    const keywords = area.keywords.map(k => k.text).join('、');
    
    if (area.name === '效率导向故事') {
      return {
        positive: {
          title: '正面评价',
          description: '这个故事在效率导向方面表现优秀',
          bubbles: [
            '时间管理清晰',
            '决策逻辑合理',
            '效率提升明显',
            '成本效益平衡',
            '解决方案实用'
          ]
        },
        negative: {
          title: '需要改进',
          description: '以下方面可以进一步优化',
          bubbles: [
            '情感维度不足',
            '用户动机模糊',
            '冲突设置简单',
            '转折点不够突出',
            '细节描述欠缺'
          ]
        }
      };
    } else if (area.name === '情感共鸣故事') {
      return {
        positive: {
          title: '正面评价',
          description: '这个故事在情感共鸣方面表现优秀',
          bubbles: [
            '情感层次丰富',
            '用户动机清晰',
            '冲突设置合理',
            '情感转折自然',
            '结局令人满意'
          ]
        },
        negative: {
          title: '需要改进',
          description: '以下方面可以进一步优化',
          bubbles: [
            '效率维度不足',
            '时间管理模糊',
            '解决方案不够具体',
            '量化指标欠缺',
            '实用性有待提升'
          ]
        }
      };
    } else {
      return {
        positive: {
          title: '正面评价',
          description: '这个故事在问题解决方面表现良好',
          bubbles: [
            '问题定义清晰',
            '解决思路明确',
            '过程描述详细',
            '结果可预期',
            '经验总结到位'
          ]
        },
        negative: {
          title: '需要改进',
          description: '以下方面可以进一步优化',
          bubbles: [
            '情感深度不足',
            '用户特征模糊',
            '冲突设置简单',
            '转折点不够突出',
            '个性化程度低'
          ]
        }
      };
    }
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
    <div className="h-full flex bg-gray-50 gap-4 p-4 overflow-hidden relative">
      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>

      {/* 左侧面板：精简用户画像 + 气泡池 */}
      <div className="w-80 flex flex-col space-y-2.5">
        {/* 精简用户画像 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-2.5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center">
              <User className="mr-2 text-blue-500" />
              用户画像
            </h3>
            <button
              onClick={() => setIsPersonaModalOpen(true)}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          {selectedPersona ? (
                      <div className="p-3 space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-base">👤</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-base">{selectedPersona.persona_name}</h4>
                <p className="text-sm text-gray-600">{selectedPersona.persona_details.age} • {selectedPersona.persona_details.occupation}</p>
              </div>
            </div>

            <p className="text-sm text-gray-700">{selectedPersona.persona_summary}</p>

              {/* 关键信息标签 */}
              <div className="space-y-2">
                {selectedPersona.persona_details.pain_points && selectedPersona.persona_details.pain_points.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1.5">主要痛点</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPersona.persona_details.pain_points.slice(0, 2).map((point, idx) => (
                        <span key={idx} className="text-sm bg-red-100 text-red-700 px-2.5 py-1.5 rounded">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPersona.persona_details.goals && selectedPersona.persona_details.goals.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1.5">主要目标</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPersona.persona_details.goals.slice(0, 2).map((goal, idx) => (
                        <span key={idx} className="text-sm bg-green-100 text-green-700 px-2.5 py-1.5 rounded">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-gray-500">
              <User className="w-6 h-6 mx-auto mb-1 text-gray-300" />
              <p className="text-xs">暂无用户画像</p>
            </div>
          )}
        </div>

        {/* 关键词气泡池 - 固定高度 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0">
          <div className="p-2.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center">
              <div className="w-5 h-5 bg-gray-100 rounded-lg flex items-center justify-center mr-2 text-xs">
                🏷️
              </div>
              关键词气泡池
            </h2>
          </div>

          {/* 筛选按钮 */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveKeywordFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeKeywordFilter === 'all'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
              >
                全部 ({selectedKeywords.length})
              </button>
              {keywordTypes.map(type => {
                const count = selectedKeywords.filter(k => k.type === type.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={type.id}
                    onClick={() => setActiveKeywordFilter(type.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeKeywordFilter === type.id
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                      }`}
                  >
                    {type.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-3">
              {keywordTypes.map(type => {
                const typeKeywords = selectedKeywords.filter(k => k.type === type.id);
                if (typeKeywords.length === 0) return null;
                if (activeKeywordFilter !== 'all' && activeKeywordFilter !== type.id) return null;

                return (
                  <div key={type.id}>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <span className={`w-2.5 h-2.5 rounded-full mr-2 ${type.color.includes('blue') ? 'bg-blue-400' :
                        type.color.includes('green') ? 'bg-green-400' :
                          type.color.includes('red') ? 'bg-red-400' :
                            type.color.includes('yellow') ? 'bg-yellow-400' : 'bg-purple-400'}`}></span>
                      {type.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {typeKeywords.map(keyword => (
                        <div
                          key={keyword.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, keyword)}
                          className={`${type.color} px-3 py-1.5 rounded-lg text-sm font-medium cursor-move hover:shadow-sm transition-all duration-200 border max-w-full`}
                        >
                          <span className="break-words">{keyword.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧面板：故事输入 + 两个故事区域 */}
      <div className="flex-1 flex flex-col space-y-2.5 min-h-0">
        {/* 故事输入区域 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-3 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center mr-3 text-base">
                ✍️
              </div>
              故事构思输入
            </h2>
          </div>

          <div className="p-4">
            <textarea
              value={storyInput}
              onChange={(e) => setStoryInput(e.target.value)}
              placeholder="在这里输入您的初始故事想法..."
              className="w-full h-24 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed resize-none"
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const keywordData = e.dataTransfer.getData('keyword');
                  if (keywordData) {
                    const keyword = JSON.parse(keywordData);
                    setStoryInput(prev => prev + (prev ? ' ' : '') + `[${keyword.text}]`);
                  }
                } catch (error) {
                  // 忽略拖拽错误
                }
              }}
              onDragOver={(e) => e.preventDefault()}
            />
          </div>
        </div>

                  {/* 两个故事脚本区域 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 min-h-0 flex flex-col" style={{ minHeight: '320px' }}>
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center mr-3 text-base">
                  📚
                </div>
                故事脚本生成
              </h2>
              <button
                onClick={generateStories}
                disabled={Object.values(storyAreas).every(area => area.keywords.length === 0) || isGenerating}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center text-sm font-medium"
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

          <div className="p-3 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-6 h-full">
              {Object.entries(storyAreas).map(([areaId, area]) => (
                <div
                  key={areaId}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 hover:border-gray-400 transition-colors min-h-[140px] max-h-[180px] flex flex-col"
                  onDrop={(e) => handleDrop(e, areaId)}
                  onDragOver={handleDragOver}
                >
                  {/* 拖拽提示 */}
                  {area.keywords.length === 0 && (
                    <div className="text-center py-4 text-gray-400 flex-1 flex flex-col items-center justify-center">
                      <div className="w-5 h-5 mx-auto mb-1.5 text-gray-300">📥</div>
                      <p className="text-sm font-medium">拖拽关键词到这里</p>
                      <p className="text-xs text-gray-400 mt-1">开始构建您的故事</p>
                    </div>
                  )}

                  {/* 已添加的关键词 */}
                  {area.keywords.length > 0 && (
                    <div className="flex-1 overflow-y-auto">
                      <div className="space-y-2">
                        {area.keywords.map(keyword => (
                          <div
                            key={keyword.id}
                            className={`inline-flex items-center justify-between p-2 rounded-lg border max-w-full ${
                              keyword.type === 'elements' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              keyword.type === 'user_traits' ? 'bg-green-50 text-green-700 border-green-200' :
                              keyword.type === 'pain_points' ? 'bg-red-50 text-red-700 border-red-200' :
                              keyword.type === 'goals' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              keyword.type === 'emotions' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            <span className="text-sm flex-1 break-words pr-2 leading-relaxed">{keyword.text}</span>
                            <button
                              onClick={() => removeFromStoryArea(areaId, keyword.id)}
                              className="text-gray-400 hover:text-red-500 flex-shrink-0 p-1 rounded hover:bg-red-50 transition-colors text-sm ml-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 生成的故事脚本预览 */}
        {generatedStories.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200" style={{ minHeight: '600px' }}>
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center mr-3 text-base">
                  📖
                </div>
                生成的故事脚本
              </h2>

              {selectedStoryId && (
                <button
                  onClick={confirmStorySelection}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all font-medium text-sm"
                >
                  选择此故事并继续
                </button>
              )}
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-6">
                {generatedStories.map(story => (
                  <div
                    key={story.id}
                    className={`border-2 rounded-xl p-2.5 cursor-pointer transition-all hover:shadow-lg ${selectedStoryId === story.id
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => selectStory(story)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-base">故事 {story.id}</h3>
                      {selectedStoryId === story.id && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-700 leading-relaxed mb-3 font-medium line-clamp-8">
                      {story.content}
                    </div>

                    {/* Claim评价区域 */}
                    {story.claimEvaluation && (
                      <div className="pt-1 border-t border-gray-100">
                        {/* 左右分列布局 */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* 左侧：正面评价 */}
                          <div className="space-y-1">

                            <div className="flex flex-wrap gap-1">
                              {story.claimEvaluation.positive.bubbles.slice(0, 2).map((bubble, idx) => (
                                <span key={idx} className="text-sm bg-green-50 text-green-600 px-2 py-1 rounded border border-green-200">
                                  {bubble}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* 右侧：负面评价 */}
                          <div className="space-y-1">

                            <div className="flex flex-wrap gap-1">
                              {story.claimEvaluation.negative.bubbles.slice(0, 2).map((bubble, idx) => (
                                <span key={idx} className="text-sm bg-orange-50 text-orange-600 px-2 py-1 rounded border border-orange-200">
                                  {bubble}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 用户画像编辑弹窗 */}
      {isPersonaModalOpen && selectedPersona && (
        <PersonaEditModal
          persona={selectedPersona}
          personas={personas}
          onSave={savePersonaEdit}
          onClose={() => setIsPersonaModalOpen(false)}
        />
      )}
    </div>
  );
}

// 用户画像编辑弹窗组件
const PersonaEditModal = ({ persona, personas = [], onSave, onClose }) => {
  const [editedPersona, setEditedPersona] = useState(() => {
    // 确保所有新字段都有默认值
    const defaultFields = {
      memorable_quote: '',
      appearance_characteristics: '',
      persona_details: {
        age: '',
        occupation: '',
        lifestyle: '',
        education: '',
        city: '',
        technology_literacy: '',
        gender: '',
        pain_points: [],
        goals: [],
        behaviors: [],
        preferences: [],
        attitudes: [],
        frustrations: [],
        technologies: [],
        psychological_profile: [],
        communication_style: [],
        tool_expectations: [],
        devices: []
      }
    };
    
    // 深度合并默认字段和现有数据
    const merged = JSON.parse(JSON.stringify(persona));
    
    // 合并基本信息
    Object.keys(defaultFields).forEach(key => {
      if (!merged[key]) {
        merged[key] = defaultFields[key];
      }
    });
    
    // 合并persona_details
    Object.keys(defaultFields.persona_details).forEach(key => {
      if (!merged.persona_details[key]) {
        merged.persona_details[key] = defaultFields.persona_details[key];
      }
    });
    
    return merged;
  });
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
    { id: 'psychological', name: '心理特征', icon: '🧠' },
    { id: 'communication', name: '沟通风格', icon: '💬' },
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
    const newPersona = personas[index];
    
    // 确保所有新字段都有默认值
    const defaultFields = {
      memorable_quote: '',
      appearance_characteristics: '',
      persona_details: {
        age: '',
        occupation: '',
        lifestyle: '',
        education: '',
        city: '',
        technology_literacy: '',
        gender: '',
        pain_points: [],
        goals: [],
        behaviors: [],
        preferences: [],
        attitudes: [],
        frustrations: [],
        technologies: [],
        psychological_profile: [],
        communication_style: [],
        tool_expectations: [],
        devices: []
      }
    };
    
    // 深度合并默认字段和现有数据
    const merged = JSON.parse(JSON.stringify(newPersona));
    
    // 合并基本信息
    Object.keys(defaultFields).forEach(key => {
      if (!merged[key]) {
        merged[key] = defaultFields[key];
      }
    });
    
    // 合并persona_details
    Object.keys(defaultFields.persona_details).forEach(key => {
      if (!merged.persona_details[key]) {
        merged.persona_details[key] = defaultFields.persona_details[key];
      }
    });
    
    setEditedPersona(merged);
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
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">用户画像编辑</h2>
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
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${selectedPersonaIndex === index
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
          <div className="w-48 bg-white border-r border-gray-200 p-3 overflow-y-auto">
            <div className="space-y-1">
              {tabs.map(tab => (
                <div key={tab.id} className="flex items-center">
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all text-left ${activeTab === tab.id
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
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left text-gray-500 hover:bg-gray-50 transition-all"
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
            <div className="p-4">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">姓名</label>
                      <input
                        type="text"
                        value={editedPersona.persona_name}
                        onChange={(e) => updatePersonaField('persona_name', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                        placeholder="输入用户姓名"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">年龄</label>
                      <input
                        type="text"
                        value={editedPersona.persona_details.age}
                        onChange={(e) => updatePersonaField('persona_details.age', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
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
                                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                        placeholder="例：银行客户经理"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">概要描述</label>
                    <textarea
                      value={editedPersona.persona_summary}
                      onChange={(e) => updatePersonaField('persona_summary', e.target.value)}
                                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                        rows="3"
                        placeholder="简要描述用户的基本情况和特点"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">生活方式</label>
                    <textarea
                      value={editedPersona.persona_details.lifestyle}
                      onChange={(e) => updatePersonaField('persona_details.lifestyle', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                      rows="3"
                      placeholder="描述用户的日常生活方式和习惯"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">教育程度</label>
                      <input
                        type="text"
                        value={editedPersona.persona_details.education || ''}
                        onChange={(e) => updatePersonaField('persona_details.education', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                        placeholder="例：本科"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">城市</label>
                      <input
                        type="text"
                        value={editedPersona.persona_details.city || ''}
                        onChange={(e) => updatePersonaField('persona_details.city', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                        placeholder="例：北京"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">技术熟练度</label>
                      <select
                        value={editedPersona.persona_details.technology_literacy || ''}
                        onChange={(e) => updatePersonaField('persona_details.technology_literacy', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                      >
                        <option value="">请选择</option>
                        <option value="低">低</option>
                        <option value="中">中</option>
                        <option value="高">高</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">性别</label>
                      <select
                        value={editedPersona.persona_details.gender || ''}
                        onChange={(e) => updatePersonaField('persona_details.gender', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                      >
                        <option value="">请选择</option>
                        <option value="男">男</option>
                        <option value="女">女</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">代表性话语</label>
                    <textarea
                      value={editedPersona.memorable_quote || ''}
                      onChange={(e) => updatePersonaField('memorable_quote', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                      rows="2"
                      placeholder="输入用户的代表性话语或口头禅"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">外观特征</label>
                    <textarea
                      value={editedPersona.appearance_characteristics || ''}
                      onChange={(e) => updatePersonaField('appearance_characteristics', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm"
                      rows="2"
                      placeholder="描述用户的外观特征"
                    />
                  </div>

                  {/* 工具期望 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">工具期望</label>
                    <div className="space-y-3">
                      {(editedPersona.persona_details.tool_expectations || []).map((expectation, index) => (
                        <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-blue-300 rounded-full flex items-center justify-center text-blue-700 text-sm font-medium">
                            🛠️
                          </div>
                          <input
                            type="text"
                            value={expectation}
                            onChange={(e) => updateArrayItem('persona_details.tool_expectations', index, e.target.value)}
                            className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-400 text-sm"
                            placeholder="描述用户对工具的期望"
                          />
                          <button
                            onClick={() => removeArrayItem('persona_details.tool_expectations', index)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addArrayItem('persona_details.tool_expectations', '')}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>添加工具期望</span>
                      </button>
                    </div>
                  </div>

                  {/* 使用设备 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">使用设备</label>
                    <div className="space-y-3">
                      {(editedPersona.persona_details.devices || []).map((device, index) => (
                        <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="w-6 h-6 bg-green-300 rounded-full flex items-center justify-center text-green-700 text-sm font-medium">
                            📱
                          </div>
                          <input
                            type="text"
                            value={device}
                            onChange={(e) => updateArrayItem('persona_details.devices', index, e.target.value)}
                            className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-400 text-sm"
                            placeholder="描述用户使用的设备"
                          />
                          <button
                            onClick={() => removeArrayItem('persona_details.devices', index)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addArrayItem('persona_details.devices', '')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>添加使用设备</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pain_points' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">主要痛点</h3>
                    <button
                      onClick={() => addArrayItem('persona_details.pain_points', '')}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
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

              {/* 心理特征标签页 */}
              {activeTab === 'psychological' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">心理特征</h3>
                    <button
                      onClick={() => addArrayItem('persona_details.psychological_profile', '')}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加特征</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(editedPersona.persona_details.psychological_profile || []).map((profile, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-6 h-6 bg-purple-300 rounded-full flex items-center justify-center text-gray-700 text-sm font-medium">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={profile}
                          onChange={(e) => updateArrayItem('persona_details.psychological_profile', index, e.target.value)}
                          className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-400 text-sm"
                          placeholder="描述用户的心理特征"
                        />
                        <button
                          onClick={() => removeArrayItem('persona_details.psychological_profile', index)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 沟通风格标签页 */}
              {activeTab === 'communication' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">沟通风格</h3>
                    <button
                      onClick={() => addArrayItem('persona_details.communication_style', '')}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加风格</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(editedPersona.persona_details.communication_style || []).map((style, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-6 h-6 bg-cyan-300 rounded-full flex items-center justify-center text-gray-700 text-sm font-medium">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={style}
                          onChange={(e) => updateArrayItem('persona_details.communication_style', index, e.target.value)}
                          className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 placeholder-gray-400 text-sm"
                          placeholder="描述用户的沟通风格"
                        />
                        <button
                          onClick={() => removeArrayItem('persona_details.communication_style', index)}
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
        <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200 flex justify-end space-x-3">
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
const StoryboardFlow = ({ initialStoryText, onClose }) => {
  // 增加多步骤流程状态
  const [currentStep, setCurrentStep] = useState('interview'); // 'interview', 'persona', 'story', 'preparation', 'canvas', 'coze'
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

  // 拖拽状态管理
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragTargetIndex, setDragTargetIndex] = useState(null);

  // 重构后的树状数据结构
  const [storyModel, setStoryModel] = useState({
    nodes: {}, // 所有节点对象，以 nodeId 为键
    branches: {} // 所有分支对象，以 branchId 为键
  });



  // 为了兼容现有代码，保留 storyData 作为计算属性
  const storyData = useMemo(() => {
    const allNodes = Object.values(storyModel.nodes);
    // 过滤掉无效的节点
    const validNodes = allNodes.filter(node => 
      node && 
      node.id && 
      node.pos && 
      typeof node.pos.x === 'number' && 
      typeof node.pos.y === 'number'
    );
    const sortedNodes = validNodes.sort((a, b) => (a.nodeIndex || 0) - (b.nodeIndex || 0));
    
    // console.log('🔧 storyData 计算:', {
    //   totalNodes: allNodes.length,
    //   validNodes: validNodes.length,
    //   sortedNodes: sortedNodes.length
    // });
    
    return sortedNodes;
  }, [storyModel]);
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('style1');
  const [useRealApi, setUseRealApi] = useState(true);
  const [referenceImageUrl, setReferenceImageUrl] = useState(styleUrls.style1);
  const [apiStatus, setApiStatus] = useState('初始化中...');
  const [lastError, setLastError] = useState(null);

  // 画布页额外状态
  const [isCanvasPersonaModalOpen, setIsCanvasPersonaModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isKeywordPoolCollapsed, setIsKeywordPoolCollapsed] = useState(false);
  const [activeKeywordTypeCanvas, setActiveKeywordTypeCanvas] = useState('all');
  const [isReferenceDropdownOpen, setIsReferenceDropdownOpen] = useState(false);

  // 情景探索相关状态
  const [isSceneExplorationOpen, setIsSceneExplorationOpen] = useState(false);
  const [currentExplorationNodeId, setCurrentExplorationNodeId] = useState(null);
  const [isGeneratingPersonas, setIsGeneratingPersonas] = useState(false);

  // 自定义关键词相关状态
  const [customKeywordText, setCustomKeywordText] = useState('');
  const [customKeywordType, setCustomKeywordType] = useState('elements');


  


  // 工具函数：操作新的树状数据结构
  const addNode = useCallback((node) => {
    setStoryModel(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [node.id]: node
      }
    }));
  }, []);

  const updateNode = useCallback((nodeId, updates) => {
    setStoryModel(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [nodeId]: {
          ...prev.nodes[nodeId],
          ...updates
        }
      }
    }));

    // 如果更新会影响节点的显示宽度，则立即触发布局
    try {
      const node = getNodeById(nodeId);
      const isExplorationNode = node && (node.type === NODE_TYPES.EXPLORATION || node.explorationData?.isExplorationNode);
      const widthAffectingExploration = Object.prototype.hasOwnProperty.call(updates || {}, 'showBubblesPanel')
        || Object.prototype.hasOwnProperty.call(updates || {}, 'state');
      const widthAffectingStoryboard = Object.prototype.hasOwnProperty.call(updates || {}, 'showFloatingPanel')
        || Object.prototype.hasOwnProperty.call(updates || {}, 'state');

      if (isExplorationNode && widthAffectingExploration) {
        // 情景探索节点尺寸变化会影响子分支，需要全局递归布局
        requestAnimationFrame(() => globalLayoutTree());
      } else if (!isExplorationNode && widthAffectingStoryboard) {
        // 分镜节点的小面板显示/隐藏或展开状态变化，立即重新布局其后的节点
        if (node && node.branchId) {
          const branch = getBranchById(node.branchId);
          if (branch) {
            requestAnimationFrame(() => smartRelayout(branch, nodeId));
          } else {
            requestAnimationFrame(() => globalLayoutTree());
          }
        } else {
          requestAnimationFrame(() => globalLayoutTree());
        }
      }
    } catch (error) {
      console.warn('🔧 updateNode 布局更新失败:', error);
    }
  }, []);

  const removeNode = useCallback((nodeId) => {
    console.log('🔧 removeNode 被调用，节点ID:', nodeId);
    
    setStoryModel(prev => {
      const newNodes = { ...prev.nodes };
      if (newNodes[nodeId]) {
        delete newNodes[nodeId];
        console.log('🔧 节点已从 storyModel.nodes 中删除:', nodeId);
      } else {
        console.warn('❌ 要删除的节点在 storyModel.nodes 中不存在:', nodeId);
      }
      
      return {
        ...prev,
        nodes: newNodes
      };
    });
  }, []);

  const addBranch = useCallback((branch) => {
    setStoryModel(prev => ({
      ...prev,
      branches: {
        ...prev.branches,
        [branch.id]: branch
      }
    }));
  }, []);

  const updateBranch = useCallback((branchId, updates) => {
    setStoryModel(prev => ({
      ...prev,
      branches: {
        ...prev.branches,
        [branchId]: {
          ...prev.branches[branchId],
          ...updates
        }
      }
    }));
  }, []);

  const removeBranch = useCallback((branchId) => {
    setStoryModel(prev => {
      const newBranches = { ...prev.branches };
      delete newBranches[branchId];
      return {
        ...prev,
        branches: newBranches
      };
    });
  }, []);

  const getNodeById = useCallback((nodeId) => {
    return storyModel.nodes[nodeId];
  }, [storyModel.nodes]);

  const getBranchById = useCallback((branchId) => {
    return storyModel.branches[branchId];
  }, [storyModel.branches]);

  const getNodesInBranch = useCallback((branchId) => {
    const branch = storyModel.branches[branchId];
    if (!branch) return [];
    return branch.nodeIds.map(nodeId => storyModel.nodes[nodeId]).filter(Boolean);
  }, [storyModel]);

  const addNodeToBranch = useCallback((branchId, nodeId, position = 'end') => {
    console.log('🔧 addNodeToBranch 被调用:', { branchId, nodeId, position });
    
    setStoryModel(prev => {
      const branch = prev.branches[branchId];
      if (!branch) {
        console.warn('❌ 分支不存在:', branchId);
        return prev;
      }

      // 防止重复插入相同节点
      if (branch.nodeIds.includes(nodeId)) {
        console.warn('❌ 节点已存在于分支中:', nodeId);
        return prev;
      }

      let newNodeIds = [...branch.nodeIds];
      if (position === 'end') {
        newNodeIds.push(nodeId);
        console.log('🔧 添加到分支末尾');
      } else if (typeof position === 'number') {
        // 确保位置在有效范围内
        const validPosition = Math.max(0, Math.min(position, newNodeIds.length));
        newNodeIds.splice(validPosition, 0, nodeId);
        
    
        
        // 更新插入位置之后所有节点的 nodeIndex
        const updatedNodes = { ...prev.nodes };
        for (let i = validPosition + 1; i < newNodeIds.length; i++) {
          const nodeIdToUpdate = newNodeIds[i];
          if (updatedNodes[nodeIdToUpdate]) {
            updatedNodes[nodeIdToUpdate] = {
              ...updatedNodes[nodeIdToUpdate],
              nodeIndex: i
            };
            console.log('🔧 更新节点索引:', nodeIdToUpdate, '->', i);
          }
        }
        
        // 同时更新新插入节点的 nodeIndex
        if (updatedNodes[nodeId]) {
          updatedNodes[nodeId] = {
            ...updatedNodes[nodeId],
            nodeIndex: validPosition
          };
          console.log('🔧 设置新节点索引:', nodeId, '->', validPosition);
        }
        
        return {
          ...prev,
          nodes: updatedNodes,
          branches: {
            ...prev.branches,
            [branchId]: {
              ...branch,
              nodeIds: newNodeIds
            }
          }
        };
      }

      return {
        ...prev,
        branches: {
          ...prev.branches,
          [branchId]: {
            ...branch,
            nodeIds: newNodeIds
          }
        }
      };
    });
  }, []);

  const removeNodeFromBranch = useCallback((branchId, nodeId) => {
    console.log('🔧 removeNodeFromBranch 被调用:', { branchId, nodeId });
    
    setStoryModel(prev => {
      const branch = prev.branches[branchId];
      if (!branch) {
        console.warn('❌ 分支不存在:', branchId);
        return prev;
      }

      const newNodeIds = branch.nodeIds.filter(id => id !== nodeId);
      console.log('🔧 分支节点更新:', { 
        oldNodeIds: branch.nodeIds, 
        newNodeIds, 
        removedNodeId: nodeId 
      });

      return {
        ...prev,
        branches: {
          ...prev.branches,
          [branchId]: {
            ...branch,
            nodeIds: newNodeIds
          }
        }
      };
    });
  }, []);

  // 设置全局 layoutTree 参数
  useEffect(() => {
    setLayoutTreeParams(storyModel, selectedFrameId, getNodeById, getBranchById, updateNode);
  }, [storyModel.nodes, storyModel.branches, selectedFrameId, getBranchById, getNodeById, updateNode]); // 添加必要的依赖项

  // 监听节点状态变化，实时更新布局
  useEffect(() => {
    // 创建一个定时器来检查节点状态变化
    const interval = setInterval(() => {
      // 检查是否有节点状态发生变化
      const currentNodes = Object.values(storyModel.nodes);
      let hasStateChange = false;
      
      currentNodes.forEach(node => {
        const nodeState = nodeStatesRef[node.id];
        if (nodeState) {
          // 检查节点是否展开或显示面板
          const isCurrentlyExpanded = node.state === 'expanded' || node.state === 'editing';
          const isCurrentlyShowingPanel = node.showFloatingPanel;
          
          if (nodeState.isExpanded !== isCurrentlyExpanded || 
              nodeState.showFloatingPanel !== isCurrentlyShowingPanel) {
            hasStateChange = true;
            
            // 更新节点状态引用
            nodeStatesRef[node.id] = {
              ...nodeState,
              isExpanded: isCurrentlyExpanded,
              showFloatingPanel: isCurrentlyShowingPanel,
              lastUpdated: Date.now()
            };
          }
        }
      });
      
      // 如果有状态变化，触发布局更新
      if (hasStateChange) {
    
        requestAnimationFrame(() => globalLayoutTree());
      }
    }, 100); // 每100ms检查一次
    
    return () => clearInterval(interval);
  }, [storyModel.nodes]);

  // 获取分支上下文 - 该分支之前所有的分镜连起来的故事脚本
  const getBranchContext = (branchId, currentNodeId) => {
    try {
      const branch = getBranchById(branchId);
      if (!branch) return '';
      
      // 获取分支中当前节点之前的所有节点
      const nodeIds = branch.nodeIds;
      const currentNodeIndex = nodeIds.indexOf(currentNodeId);
      
      if (currentNodeIndex <= 0) return '';
      
      // 获取当前节点之前的所有节点（包括探索节点）
      const previousNodes = nodeIds
        .slice(0, currentNodeIndex)
        .map(id => getNodeById(id))
        .filter(Boolean)
        .filter(node => 
          node.type === NODE_TYPES.STORY_FRAME || 
          node.type === NODE_TYPES.BRANCH_FRAME ||
          node.type === NODE_TYPES.EXPLORATION
        );
      
      // 将故事内容连接起来，优先使用text，其次使用prompt
      const contextParts = previousNodes.map(node => {
        let content = '';
        if (node.text && node.text.trim()) {
          content = node.text.trim();
        } else if (node.prompt && node.prompt.trim()) {
          content = node.prompt.trim();
        } else if (node.explorationData?.explorationText) {
          content = node.explorationData.explorationText.trim();
        }
        
        // 移除末尾的句号，避免双句号
        if (content.endsWith('。')) {
          content = content.slice(0, -1);
        }
        
        return content;
      }).filter(text => text.length > 0);
      
      // 用句号连接，确保故事流畅
      const context = contextParts.join('。') + '。';
      console.log('🔧 分支上下文构建:', {
        branchId,
        currentNodeId,
        previousNodesCount: previousNodes.length,
        contextParts,
        finalContext: context
      });
      
      return context;
    } catch (error) {
      console.error('获取分支上下文失败:', error);
      return '';
    }
  };

  // 将getBranchContext函数暴露到全局，供StoryNode组件使用
  window.getBranchContext = getBranchContext;

  // 情景探索相关函数 - 使用新的树状数据结构
  const handleExploreScene = (nodeId, personas = []) => {
    console.log('🔧 handleExploreScene 被调用，节点ID:', nodeId);
    
    // 获取源节点
    const sourceNode = getNodeById(nodeId);
    if (!sourceNode) {
      console.warn('❌ 源节点不存在:', nodeId);
      return;
    }

    // 检查是否已经存在探索节点
    const existingExplorationNode = Object.values(storyModel.nodes).find(node =>
      (node.type === NODE_TYPES.EXPLORATION || node.explorationData?.isExplorationNode) &&
      node.explorationData?.parentNodeId === nodeId
    );

    if (existingExplorationNode) {
      console.warn('❌ 已存在探索节点:', existingExplorationNode.id);
      return;
    }

    // 获取源节点所在的分支
    const sourceBranchId = sourceNode.branchId;
    const sourceBranch = getBranchById(sourceBranchId);
    if (!sourceBranch) {
      console.warn('❌ 源分支不存在:', sourceBranchId);
      return;
    }

    console.log('🔧 源节点信息:', {
      id: sourceNode.id,
      branchId: sourceBranchId,
      currentIndex: sourceBranch.nodeIds.indexOf(nodeId),
      totalNodes: sourceBranch.nodeIds.length
    });

    // 计算插入位置 - 插入到当前节点之后
    const currentIndex = sourceBranch.nodeIds.indexOf(nodeId);
    const insertIndex = currentIndex + 1;

    // 计算新节点的基准位置 - 插入到当前节点右侧
    const sourceNodeWidth = getNodeDisplayWidth(sourceNode);
    const dynamicGap = calculateDynamicGap(sourceNode, currentIndex, sourceBranch.nodeIds.map(id => getNodeById(id)).filter(Boolean));
    const newBaseX = sourceNode.pos.x + sourceNodeWidth + dynamicGap;



    // 获取用户画像数据 - 从传入的personas参数获取，确保是完整的用户画像信息
    const userPersona = personas && personas.length > 0 ? personas[0] : {};
    console.log('🔧 用户画像数据:', userPersona);
    console.log('🔍 用户画像详情:', {
      name: userPersona.name,
      age: userPersona.age,
      personality: userPersona.personality,
      goals: userPersona.goals
    });
    
    // 获取分支上下文 - 该分支之前所有的分镜连起来的故事脚本
    const branchContext = getBranchContext(sourceBranchId, nodeId);
    console.log('🔧 分支上下文:', branchContext);
    
    // 获取当前分镜的故事脚本
    const currentFrameStory = sourceNode.text || sourceNode.prompt || '';
    console.log('🔧 当前分镜故事:', currentFrameStory);
    console.log('🔍 源节点详情:', {
      id: sourceNode.id,
      type: sourceNode.type,
      text: sourceNode.text,
      prompt: sourceNode.prompt,
      branchId: sourceNode.branchId
    });
    
    // 数据完整性验证
    console.log('🔍 创建探索节点前的数据验证:');
    console.log('  - userPersona 存在:', !!userPersona);
    console.log('  - branchContext 存在:', !!branchContext);
    console.log('  - currentFrameStory 存在:', !!currentFrameStory);
    console.log('  - userPersona 内容:', userPersona);
    console.log('  - branchContext 内容:', branchContext);
    console.log('  - currentFrameStory 内容:', currentFrameStory);
    
    // 使用节点工厂函数创建探索节点
    const explorationNode = createNode(NODE_TYPES.EXPLORATION, {
      parentNodeId: nodeId,
      branchId: sourceBranchId,
      nodeIndex: insertIndex,
      baseX: newBaseX,
      pos: { x: newBaseX, y: sourceNode.pos.y }, // 设置初始位置
      userPersona: userPersona, // 用户画像数据
      branchContext: branchContext, // 分支上下文
      currentFrameStory: currentFrameStory, // 当前分镜故事
      onDataChange: (newData) => {
        // 更新节点数据
        updateNode(explorationNode.id, newData);
      }
    });

    console.log('🔧 新探索节点创建完成:', explorationNode);
    console.log('🔍 探索节点数据验证:');
    console.log('  - 用户画像:', explorationNode.userPersona);
    console.log('  - 分支上下文:', explorationNode.branchContext);
    console.log('  - 当前分镜故事:', explorationNode.currentFrameStory);
    console.log('  - 探索节点类型:', explorationNode.type);
    console.log('  - 探索节点ID:', explorationNode.id);

    // 添加探索节点到数据模型
    addNode(explorationNode);

    // 将探索节点插入到源节点所在的分支中，插入到当前节点之后
    addNodeToBranch(sourceBranchId, explorationNode.id, insertIndex);

    // 更新源节点的连接关系，连接到新创建的探索节点
    updateNode(nodeId, {
      connections: [...(sourceNode.connections || []), explorationNode.id]
    });

    // 立即重新排布节点，确保新节点位置正确
    setTimeout(() => {
      globalLayoutTree();
    }, 50);
  };

  const handleGenerateImage = (nodeId) => {
    // 这里可以添加生成画面的逻辑
  };

  const handleDeleteFrame = (nodeId) => {
    console.log('🔧 handleDeleteFrame 被调用，节点ID:', nodeId);

    // 获取要删除的节点
    const nodeToDelete = getNodeById(nodeId);
    if (!nodeToDelete) {
      console.warn('❌ 要删除的节点不存在:', nodeId);
      return;
    }

    // 从分支中移除节点
    if (nodeToDelete.branchId) {
      removeNodeFromBranch(nodeToDelete.branchId, nodeId);
      
      // 更新剩余节点的 nodeIndex
      const branch = getBranchById(nodeToDelete.branchId);
      if (branch) {
        const remainingNodes = branch.nodeIds
          .map(id => getNodeById(id))
          .filter(Boolean);
        
        // 重新分配 nodeIndex
        remainingNodes.forEach((node, index) => {
          if (node.nodeIndex !== index) {
            updateNode(node.id, { nodeIndex: index });
          }
        });
      }
    }

    // 删除节点
    removeNode(nodeId);

    // 如果删除的是当前选中的节点，清除选择
    if (selectedFrameId === nodeId) {
      setSelectedFrameId(null);
    }

    // 删除后重新排布，确保剩余节点位置正确
    setTimeout(() => {
      globalLayoutTree();
    }, 100);
  };

  // 处理生成分支 - 使用新的树状数据结构
  const handleGenerateBranches = async (branchesData) => {
    console.log('StoryboardTest: handleGenerateBranches 被调用，数据:', branchesData);

    // 检查数据类型，支持更新现有节点和创建新节点
    if (branchesData.type === 'update_existing') {
      // 更新现有分镜节点的故事脚本
      console.log('StoryboardTest: 更新现有分镜节点');
      await handleUpdateExistingFrames(branchesData);
      return;
    }

    // 创建新的分镜节点（原有逻辑）
    if (branchesData.type === 'create_new') {
      console.log('StoryboardTest: 创建新的分镜节点');
      await handleCreateNewFrames(branchesData);
      return;
    }

    // 兼容旧版本调用方式
    if (Array.isArray(branchesData)) {
      console.log('StoryboardTest: 兼容旧版本调用方式');
      await handleCreateNewFrames({ branches: branchesData });
      return;
    }
  };

  // 处理更新现有分镜节点
  const handleUpdateExistingFrames = async (data) => {
    const { explorationNodeId, updateData, existingFrameIds } = data;
    
    // 找到探索节点
    const explorationNode = getNodeById(explorationNodeId);
    if (!explorationNode) {
      console.error('StoryboardTest: 找不到探索节点:', explorationNodeId);
      return;
    }

    // 更新探索节点的数据
    updateNode(explorationNodeId, {
      explorationData: {
        ...explorationNode.explorationData,
        ...updateData
      },
      createdFrameIds: existingFrameIds
    });

    // 更新现有分镜节点的故事脚本
    existingFrameIds.forEach((frameId, index) => {
      const frameNode = getNodeById(frameId);
      if (frameNode && updateData.predictedFrames[index]) {
        updateNode(frameId, {
          text: updateData.predictedFrames[index],
          prompt: updateData.predictedFrames[index],
          lastUpdated: Date.now()
        });
      }
    });

    console.log('StoryboardTest: 现有分镜节点更新完成');
  };

  // 处理创建新的分镜节点
  const handleCreateNewFrames = async (data) => {
    const branches = data.branches || data;
    const explorationNodeId = data.explorationNodeId;

    // 找到当前选中的探索节点
    const explorationNode = explorationNodeId ? getNodeById(explorationNodeId) : getNodeById(selectedFrameId);
    if (!explorationNode || !(explorationNode.type === NODE_TYPES.EXPLORATION || explorationNode.explorationData?.isExplorationNode)) {
      console.error('StoryboardTest: 找不到探索节点');
      return;
    }

    // 设置当前探索节点ID
    setCurrentExplorationNodeId(explorationNode.id);

    // 获取探索节点所在的分支
    const parentBranchId = explorationNode.branchId;
    const parentBranch = getBranchById(parentBranchId);
    if (!parentBranch) {
      console.error('StoryboardTest: 找不到父分支');
      return;
    }

    // 计算现有的分支数量，用于分配新的分支层级
    const existingChildBranches = Object.values(storyModel.branches).filter(branch =>
      branch.parentBranchId === parentBranchId
    );
    const existingBranchCount = existingChildBranches.length;

    // 记录真实创建的分支起始节点ID
    const createdStartNodeIds = [];

    // 为每个新分支创建分支对象和起始节点
    branches.forEach((branchData, index) => {
      // 创建新的分支对象
      const newBranchId = `branch_${explorationNode.id}_${existingBranchCount + index}_${Date.now()}`;
      const newBranch = {
        id: newBranchId,
        name: `分支 ${String.fromCharCode(65 + existingBranchCount + index)}`,
        originNodeId: explorationNode.id,
        nodeIds: [],
        level: parentBranch.level + 1,
        parentBranchId: parentBranchId
      };

      // 使用节点工厂函数创建分支起始节点
      const branchStartNode = createNode(NODE_TYPES.BRANCH_START, {
        label: `分镜 ${index + 1}`, // 使用索引生成分镜标题
        text: branchData.prompt || branchData.text || '', // 使用API返回的故事选项内容
        prompt: branchData.prompt || branchData.text || '', // 使用API返回的故事选项内容
        branchId: newBranchId,
        nodeIndex: 0,
        parentNodeId: explorationNode.id,
        explorationText: explorationNode.explorationData?.explorationText || '',
        bubbleData: explorationNode.explorationData?.bubbleData || [],
        branchData: {
          branchName: newBranch.name,
          branchLineIndex: existingBranchCount + index,
          branchIndex: existingBranchCount + index
        },
        generationParams: {
          explorationText: explorationNode.explorationData?.explorationText || '',
          bubbleData: explorationNode.explorationData?.bubbleData || [],
          storyOption: branchData.prompt || branchData.text || '' // 保存故事选项数据
        }
      });

      // 将分支对象添加到storyModel.branches中
      addBranch(newBranch);

      // 将节点对象添加到storyModel.nodes中
      addNode(branchStartNode);

      // 将节点添加到分支的nodeIds数组中
      addNodeToBranch(newBranchId, branchStartNode.id);

      // 收集真实创建的起始节点ID
      createdStartNodeIds.push(branchStartNode.id);
    });

    // 更新探索节点的连接关系，连接到新创建的分支起始节点（使用真实ID）
    updateNode(explorationNode.id, {
      connections: createdStartNodeIds,
      createdFrameIds: createdStartNodeIds // 记录已创建的分镜节点ID
    });

    // 重新排布节点，实现递归布局
    setTimeout(() => globalLayoutTree(), 100);
  };





  // 根据当前节点实际宽度动态排布，保持等距 - 现在使用递归布局
  const reflowNodesEvenly = useCallback(() => {
    // 如果是初始分镜（只有一个分镜且标记为初始分镜），不进行重新排布
    if (storyData.length === 1 && storyData[0]?.isInitialFrame) {
      return;
    }

    // 使用新的递归布局算法
    globalLayoutTree();
  }, [selectedFrameId, storyData.length, storyData]);

  // 模拟多份访谈记录数据
  const interviewDataList = [
    {
      id: 1,
      text: `张敏是一位35岁的银行客户经理，每天工作繁忙。她经常在下班后去超市采购食材，但总是面临时间紧张的问题。

"当手机电量比我的耐心先耗尽时，任何精致菜谱都成了讽刺漫画。" 张敏这样描述她的烹饪应用使用体验。她希望能在超市现场快速找到适合的菜谱，但现有的应用推荐算法往往忽视了她实际的时间和库存限制。

在通勤后的超市采购时段（18:30-19:30），她经常单手持手机同时推购物车，处于分心状态。手机低电量警告让她感到焦虑，她潜意识里还在计算明日早餐的准备时间。

张敏对效率流失存在放大镜效应，会为节省2分钟额外支付10元钱。她对进度条和倒计时产生条件反射焦虑，在工具失效时会立即启动备选方案。她将饮食管理视为家庭责任延伸，用工具选择缓解育儿愧疚感。

她常用"至少""起码"等底线思维词汇，倾向量化表达（"15分钟""3种食材"），抱怨时夹杂自嘲式幽默，对营销话术异常敏感。`,
      keywords: []
    },
    {
      id: 2,
      text: `李华是一名28岁的IT工程师，单身，经常加班到深夜。他对于烹饪应用的需求主要集中在简单易做的快手菜。

"我需要的不是米其林三星的复杂菜谱，而是能在15分钟内搞定的营养餐。" 李华表示，他更关注食材的营养搭配和制作效率。

作为一个理性的用户，李华会仔细研究每个菜谱的营养成分和制作时间。他希望应用能够根据他现有的食材智能推荐菜谱，避免频繁购买新食材的麻烦。

李华对于应用的界面设计很敏感，他不喜欢过于花哨的设计，更偏向简洁实用的界面。他经常在深夜使用应用，因此对暗色模式有强烈需求。

他习惯用数据说话，会记录每道菜的制作时间和满意度，并根据这些数据调整自己的菜谱选择。`,
      keywords: []
    },
    {
      id: 3,
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

  // 切换访谈记录时保持关键词，不重置
  useEffect(() => {
    // 不再重置关键词，保持用户已提取的关键词
  }, [currentInterviewIndex]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isReferenceDropdownOpen && !event.target.closest('.reference-dropdown')) {
        setIsReferenceDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isReferenceDropdownOpen]);

  // 关键词类型配置 - 使用统一的颜色系统
  const keywordTypes = [
    {
      id: 'elements',
      name: '元素',
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    },
    {
      id: 'user_traits',
      name: '用户特征',
      color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
    },
    {
      id: 'pain_points',
      name: '痛点',
      color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
    },
    {
      id: 'goals',
      name: '目标',
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
    },
    {
      id: 'emotions',
      name: '情绪',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
    }
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
  }, [initialStoryText]);

  useEffect(() => {
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
          } catch { }
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
            try { selection && selection.removeAllRanges(); } catch { }
          }, 0);
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
        try { selection.removeAllRanges(); } catch { }
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
    try { sel && sel.removeAllRanges(); } catch { }

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
      timestamp: new Date().toISOString(),
      // 添加位置信息用于文本高亮
      startIndex: currentInterview.text.indexOf(text),
      endIndex: currentInterview.text.indexOf(text) + text.length
    };
    const updatedKeywords = [...selectedKeywords, newKeyword];
    setSelectedKeywords(updatedKeywords);

    // 同时更新到当前访谈记录中
    const updatedInterviewList = [...interviewDataList];
    updatedInterviewList[currentInterviewIndex].keywords = updatedKeywords;
    // 这里可以添加保存到本地存储或发送到服务器的逻辑
  };

  // 添加自定义关键词
  const addCustomKeyword = () => {
    if (!customKeywordText.trim()) return;
    
    const newKeyword = {
      id: Date.now(),
      text: customKeywordText.trim(),
      type: customKeywordType,
      importance: 'medium', // 默认权重为中等
      timestamp: new Date().toISOString(),
      isCustom: true // 标记为自定义关键词
    };
    
    setSelectedKeywords(prev => [...prev, newKeyword]);
    setCustomKeywordText(''); // 清空输入框
  };

  // 从关键词池中移除关键词
  const removeFromKeywordPool = (keywordId) => {
    setSelectedKeywords(prev => prev.filter(keyword => keyword.id !== keywordId));
  };



  // 处理拖拽关键词到画布
  const handleDragStart = (e, keyword) => {
    // 根据关键词类型设置对应的颜色和气泡类型 - 使用统一的颜色系统
    let originalColor = null;
    let bubbleType = 'keyword';
    
    switch (keyword.type) {
      case 'emotions':
        originalColor = 'indigo';
        bubbleType = 'immediateFeelings';
        break;
      case 'pain_points':
        originalColor = 'red';
        bubbleType = 'immediateFeelings';
        break;
      case 'goals':
        originalColor = 'amber';
        bubbleType = 'goalAdjustments';
        break;
      case 'user_traits':
        originalColor = 'green';
        bubbleType = 'actionTendencies';
        break;
      case 'elements':
        originalColor = 'blue';
        bubbleType = 'contextualFactors';
        break;

      default:
        originalColor = 'blue';
        bubbleType = 'keyword';
    }

    // 创建包含完整样式信息的关键词数据
    const keywordWithStyle = {
      ...keyword,
      originalColor,
      bubbleType,
      importance: keyword.importance || 'medium', // 确保包含权重信息
      // 添加拖拽源标识
      dragSource: 'keywordPool'
    };

    // 设置多种数据格式以确保兼容性
    e.dataTransfer.setData('keyword', JSON.stringify(keywordWithStyle));
    e.dataTransfer.setData('text/plain', JSON.stringify({ keywordData: keywordWithStyle }));
    e.dataTransfer.setData('explorationBubble', JSON.stringify(keywordWithStyle));
    e.dataTransfer.setData('application/json', JSON.stringify(keywordWithStyle));
  };

  // 渲染带有高亮的文本
  const renderHighlightedText = (text, keywords) => {
    if (!keywords || keywords.length === 0) {
      return text.split('\n').map((paragraph, index) => (
        <p key={index} className="mb-4">
          {paragraph}
        </p>
      ));
    }

    // 按位置排序关键词，确保按顺序渲染
    const sortedKeywords = [...keywords].sort((a, b) => a.startIndex - b.startIndex);
    
    // 创建段落数组
    const paragraphs = text.split('\n');
    
    return paragraphs.map((paragraph, paragraphIndex) => {
      // 计算当前段落在全文中的起始位置
      const paragraphStartIndex = paragraphs.slice(0, paragraphIndex).join('\n').length + (paragraphIndex > 0 ? 1 : 0);
      const paragraphEndIndex = paragraphStartIndex + paragraph.length;
      
      // 找到影响当前段落的关键词
      const paragraphKeywords = sortedKeywords.filter(keyword => 
        keyword.startIndex < paragraphEndIndex && keyword.endIndex > paragraphStartIndex
      );
      
      if (paragraphKeywords.length === 0) {
        return <p key={paragraphIndex} className="mb-4">{paragraph}</p>;
      }
      
      // 渲染带有高亮的段落
      return renderHighlightedParagraph(paragraph, paragraphKeywords, paragraphStartIndex, paragraphIndex);
    });
  };

  // 渲染带有高亮的段落
  const renderHighlightedParagraph = (paragraph, keywords, paragraphStartIndex, paragraphIndex) => {
    const result = [];
    let currentIndex = 0;
    
    // 按在段落中的位置排序关键词
    const sortedKeywords = keywords.map(keyword => ({
      ...keyword,
      relativeStart: Math.max(0, keyword.startIndex - paragraphStartIndex),
      relativeEnd: Math.min(paragraph.length, keyword.endIndex - paragraphStartIndex)
    })).sort((a, b) => a.relativeStart - b.relativeStart);
    
    sortedKeywords.forEach((keyword, keywordIndex) => {
      // 添加关键词前的普通文本
      if (keyword.relativeStart > currentIndex) {
        result.push(
          <span key={`text-${paragraphIndex}-${keywordIndex}`}>
            {paragraph.slice(currentIndex, keyword.relativeStart)}
          </span>
        );
      }
      
      // 添加高亮的关键词
      const keywordText = paragraph.slice(keyword.relativeStart, keyword.relativeEnd);
      const highlightColor = getHighlightColor(keyword.type);
      
      result.push(
        <span
          key={`highlight-${paragraphIndex}-${keywordIndex}`}
          className={`${highlightColor} px-1 rounded`}
          title={`${keyword.type === 'elements' ? '元素' : 
                   keyword.type === 'user_traits' ? '用户特征' : 
                   keyword.type === 'pain_points' ? '痛点' : 
                   keyword.type === 'goals' ? '目标' : 
                   keyword.type === 'emotions' ? '情绪' : '关键词'}: ${keywordText}`}
        >
          {keywordText}
        </span>
      );
      
      currentIndex = keyword.relativeEnd;
    });
    
    // 添加关键词后的普通文本
    if (currentIndex < paragraph.length) {
      result.push(
        <span key={`text-${paragraphIndex}-end`}>
          {paragraph.slice(currentIndex)}
        </span>
      );
    }
    
    return <p key={paragraphIndex} className="mb-4">{result}</p>;
  };

  // 获取高亮颜色
  const getHighlightColor = (type) => {
    switch (type) {
      case 'elements':
        return 'bg-blue-200 text-blue-900';
      case 'user_traits':
        return 'bg-green-200 text-green-900';
      case 'pain_points':
        return 'bg-red-200 text-red-900';
      case 'goals':
        return 'bg-amber-200 text-amber-900';
      case 'emotions':
        return 'bg-indigo-200 text-indigo-900';
      default:
        return 'bg-gray-200 text-gray-900';
    }
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
  const generatePersonas = async () => {
    if (selectedKeywords.length === 0) {
      alert('请先提取一些关键词');
      return;
    }

    try {
      // 显示加载状态
      setIsGeneratingPersonas(true);
      
      // 准备数据：将前端数据转换为API所需的格式
      const interviewData = {
        interview_text: currentInterview,
        selected_bubbles: {
          persona: selectedKeywords.filter(k => k.type === 'user_traits').map(k => k.text),
          context: selectedKeywords.filter(k => k.type === 'elements').map(k => k.text),
          goal: selectedKeywords.filter(k => k.type === 'goals').map(k => k.text),
          pain: selectedKeywords.filter(k => k.type === 'pain_points').map(k => k.text),
          emotion: selectedKeywords.filter(k => k.type === 'emotions').map(k => k.text)
        }
      };
      
      console.log('📤 准备发送到Coze API的数据:', interviewData);
      
      // 调用新的用户画像生成服务
      const result = await generatePersona(interviewData);
      
      console.log('🎯 Coze API返回结果:', result);
      
      if (result.personas && result.personas.length > 0) {
        // 转换API返回的数据格式为前端使用的格式
        const convertedPersonas = result.personas.map(persona => ({
          persona_name: persona.persona_name || '未命名用户',
          persona_summary: persona.persona_summary || '',
          memorable_quote: persona.memorable_quote || '',
          appearance_characteristics: persona.Appearance_characteristics || '',
          persona_details: {
            age: persona.basic_profile?.age || '',
            occupation: persona.basic_profile?.occupation || '',
            lifestyle: persona.usage_context?.join(', ') || '',
            pain_points: persona.domain_pain_points || [],
            goals: persona.domain_goals_and_motivations || [],
            behaviors: persona.general_behavior || [],
            education: persona.basic_profile?.education || '',
            city: persona.basic_profile?.city || '',
            technology_literacy: persona.basic_profile?.technology_literacy || '',
            devices: persona.basic_profile?.devices || [],
            psychological_profile: persona.psychological_profile || [],
            communication_style: persona.communication_style || [],
            tool_expectations: persona.tool_expectations || []
          }
        }));
        
        setPersonas(convertedPersonas);
        
        // 如果API返回了气泡数据，更新关键词
        if (result.bubbles) {
          const newBubbles = [];
          let bubbleId = Date.now();
          
          // 转换气泡数据为关键词格式
          Object.entries(result.bubbles).forEach(([category, texts]) => {
            texts.forEach(text => {
              const keywordType = getBubbleCategoryType(category);
              newBubbles.push({
                id: bubbleId++,
                text: text,
                type: keywordType,
                timestamp: new Date().toISOString(),
                source: 'agent_generated'
              });
            });
          });
          
          // 合并新生成的气泡到现有关键词中
          setSelectedKeywords(prev => [...prev, ...newBubbles]);
        }
        
        console.log('✅ 用户画像生成成功:', convertedPersonas);
      } else {
        console.warn('⚠️ API返回的用户画像数据为空');
        // 生成默认画像
        const defaultPersona = {
          persona_name: '张敏',
          persona_summary: '35岁银行客户经理，工作繁忙，注重效率',
          memorable_quote: '当手机电量比我的耐心先耗尽时，任何精致菜谱都成了讽刺漫画',
          appearance_characteristics: '穿着职业装，经常单手持手机推购物车',
          persona_details: {
            age: '35岁',
            occupation: '银行客户经理',
            lifestyle: '工作繁忙，经常加班',
            education: '本科',
            city: '北京',
            technology_literacy: '中',
            gender: '女',
            pain_points: ['时间紧张', '手机电量焦虑', '效率流失放大镜效应'],
            goals: ['快速找到适合的菜谱', '节省时间', '缓解育儿愧疚感'],
            behaviors: ['单手持手机推购物车', '底线思维', '量化表达'],
            psychological_profile: ['效率导向', '底线思维', '量化表达'],
            communication_style: ['直接表达', '自嘲式幽默', '对营销话术敏感'],
            tool_expectations: ['快速响应', '简单易用', '节省时间'],
            devices: ['智能手机', '平板电脑']
          }
        };
        setPersonas([defaultPersona]);
      }
    } catch (error) {
      console.error('❌ 生成用户画像失败:', error);
      alert('生成用户画像失败，请检查网络连接或稍后重试');
      
      // 生成默认画像作为备选
      const defaultPersona = {
        persona_name: '张敏',
        persona_summary: '35岁银行客户经理，工作繁忙，注重效率',
        memorable_quote: '当手机电量比我的耐心先耗尽时，任何精致菜谱都成了讽刺漫画',
        appearance_characteristics: '穿着职业装，经常单手持手机推购物车',
        persona_details: {
          age: '35岁',
          occupation: '银行客户经理',
          lifestyle: '工作繁忙，经常加班',
          education: '本科',
          city: '北京',
          technology_literacy: '中',
          gender: '女',
          pain_points: ['时间紧张', '手机电量焦虑', '效率流失放大镜效应'],
          goals: ['快速找到适合的菜谱', '节省时间', '缓解育儿愧疚感'],
          behaviors: ['单手持手机推购物车', '底线思维', '量化表达'],
          psychological_profile: ['效率导向', '底线思维', '量化表达'],
          communication_style: ['直接表达', '自嘲式幽默', '对营销话术敏感'],
          tool_expectations: ['快速响应', '简单易用', '节省时间'],
          devices: ['智能手机', '平板电脑']
        }
      };
      setPersonas([defaultPersona]);
    } finally {
      setIsGeneratingPersonas(false);
    }
  };

  // 将气泡类别转换为关键词类型
  const getBubbleCategoryType = (category) => {
    const categoryTypeMap = {
      'persona': 'user_traits',
      'context': 'elements',
      'goal': 'goals',
      'pain': 'pain_points',
      'emotion': 'emotions'
    };
    return categoryTypeMap[category] || 'elements';
  };

  // 处理故事选择
  const handleStorySelect = async (selectedStory) => {
    try {
      console.log('🎯 用户选择了故事:', selectedStory);
      
      // 显示加载状态
      setCurrentStep('loading');
      
      // 调用第三个bot生成分镜节点
      const { generateStoryFrames } = await import('../services/storyToFramesService');
      const framesData = await generateStoryFrames(selectedStory);
      
      console.log('✅ 成功生成分镜节点数据:', framesData);
      
      if (framesData.story_beats && framesData.story_beats.length > 0) {
        // 基于生成的分镜节点创建故事模型
        const storyModel = createStoryModelFromFrames(framesData.story_beats, selectedStory);
        setStoryModel(storyModel);
        setStory(selectedStory.content);
        
        // 跳转到画布界面
        setCurrentStep('canvas');
        
        // 选择第一个分镜
        const firstNodeId = Object.keys(storyModel.nodes)[0];
        if (firstNodeId) {
          setSelectedFrameId(firstNodeId);
        }
        
        // 重置聚焦标志
        window.resetCanvasFocus = true;
        
        // 使用新的递归布局算法
        setTimeout(() => globalLayoutTree(), 100);
        
        console.log('🎉 成功创建分镜节点并跳转到画布界面');
      } else {
        throw new Error('未获取到有效的分镜节点数据');
      }
      
    } catch (error) {
      console.error('❌ 生成分镜节点失败:', error);
      
      // 如果失败，回退到原来的逻辑
      console.log('⚠️ 回退到原来的单节点逻辑');
      setStory(selectedStory.content);
      const initialStoryModel = generateInitialFrames({
        storyScript: selectedStory.content,
        selectedStyle: 'style1',
        frameCount: 1,
        settings: {
          aspectRatio: '16:9',
          model: 'pro',
          enableConnections: true,
          enableBranching: true
        }
      });
      setStoryModel(initialStoryModel);
      setCurrentStep('canvas');
      
      const firstNodeId = Object.keys(initialStoryModel.nodes)[0];
      if (firstNodeId) {
        setSelectedFrameId(firstNodeId);
      }
      window.resetCanvasFocus = true;
      setTimeout(() => globalLayoutTree(), 100);
    }
  };

  // 保存用户画像编辑
  const savePersonaEdit = (updatedPersona) => {
    setPersonas(prev => prev.map(p =>
      p.persona_name === updatedPersona.persona_name ? updatedPersona : p
    ));
  };



  // 根据分镜节点数据创建故事模型
  const createStoryModelFromFrames = (storyBeats, selectedStory) => {
    console.log('🎬 开始根据分镜节点创建故事模型:', storyBeats);
    
    // 计算画布中心位置（考虑左侧边栏宽度）
    const sidebarWidth = 288; // 左侧边栏宽度 (w-72 = 288px)
    const canvasWidth = window.innerWidth - sidebarWidth;
    const canvasHeight = window.innerHeight;
    
    // 节点配置
    const nodeWidth = 280; // 节点宽度
    const nodeHeight = 200; // 节点高度
    const nodeSpacing = 320; // 节点间距
    
    // 创建根分支
    const rootBranchId = 'root-branch';
    const rootBranch = {
      id: rootBranchId,
      name: '主线',
      originNodeId: null,
      nodeIds: [],
      level: 0,
      parentBranchId: null
    };
    
    const nodes = {};
    const branches = { [rootBranchId]: rootBranch };
    
    // 计算起始位置（水平居中，垂直居中）
    const startX = sidebarWidth + (canvasWidth / 2) - ((storyBeats.length - 1) * nodeSpacing / 2);
    const startY = (canvasHeight / 2) - (nodeHeight / 2);
    
    // 为每个分镜节点创建节点
    const nodeIds = [];
    storyBeats.forEach((beat, index) => {
      const nodeId = `node_${Date.now()}_${index}`;
      nodeIds.push(nodeId);
      
      // 计算节点位置
      const posX = startX + (index * nodeSpacing);
      const posY = startY;
      
      // 创建节点
      const node = {
        id: nodeId,
        type: 'story_frame',
        label: `分镜 ${index + 1}`,
        text: beat, // 使用分镜节点的情节提要
        image: null,
        pos: { x: posX, y: posY },
        baseX: posX,
        connections: [],
        styleName: 'style1',
        branchId: rootBranchId,
        nodeIndex: index,
        isInitialFrame: index === 0,
        branchData: null,
        cardState: 'collapsed'
      };
      
      nodes[nodeId] = node;
      rootBranch.nodeIds.push(nodeId);
    });
    
    // 创建节点之间的连接关系
    for (let i = 0; i < nodeIds.length - 1; i++) {
      const currentNodeId = nodeIds[i];
      const nextNodeId = nodeIds[i + 1];
      if (nodes[currentNodeId] && nodes[nextNodeId]) {
        nodes[currentNodeId].connections.push(nextNodeId);
      }
    }
    
    console.log('✅ 成功创建故事模型:', { nodes, branches });
    return { nodes, branches };
  };

  // 生成初始分镜数据 - 使用新的树状数据结构
  const generateInitialFrames = (config) => {
    // 计算画布中心位置（考虑左侧边栏宽度）
    const sidebarWidth = 288; // 左侧边栏宽度 (w-72 = 288px)
    const canvasWidth = window.innerWidth - sidebarWidth;
    const canvasHeight = window.innerHeight;

    // 使用配置中的节点尺寸进行居中计算
    const nodeWidth = DYNAMIC_LAYOUT_CONFIG.NODE_WIDTH.COLLAPSED;
    const nodeHeight = 200; // 默认节点高度
    const centerX = sidebarWidth + (canvasWidth / 2) - (nodeWidth / 2);
    const centerY = (canvasHeight / 2) - (nodeHeight / 2);

    // 创建根分支
    const rootBranchId = 'root-branch';
    const rootBranch = {
      id: rootBranchId,
      name: '主线',
      originNodeId: null, // 根分支没有起源节点
      nodeIds: [],
      level: 0, // 根分支层级为0
      parentBranchId: null // 根分支没有父分支
    };

    // 使用节点工厂函数创建初始节点
    const initialNode = createNode(NODE_TYPES.STORY_FRAME, {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 使用统一的ID格式
      label: '分镜 1',
      text: '',
      image: null,
      pos: { x: centerX, y: centerY },
      baseX: centerX, // 设置基准位置
      connections: [],
      styleName: config.selectedStyle,
      branchId: rootBranchId,
      nodeIndex: 0,
      isInitialFrame: true,
      branchData: null
    });

    // 将节点添加到分支中
    rootBranch.nodeIds.push(initialNode.id);

    // 初始化初始节点的状态
    initializeNodeState(initialNode.id);
    
    // 返回新的数据结构
    return {
      nodes: {
        [initialNode.id]: initialNode
      },
      branches: {
        [rootBranchId]: rootBranch
      }
    };
  };

  // 处理分镜选择
  const handleFrameSelect = (frameId) => {
    setSelectedFrameId(frameId);
  };



  // 处理拖拽排序 - 使用新的树状数据结构
  const handleFrameReorder = (draggedNodeId, insertIndex) => {
    console.log('🔧 handleFrameReorder 被调用:', { draggedNodeId, insertIndex });
    
    // 获取拖拽的节点
    const draggedNode = getNodeById(draggedNodeId);
    if (!draggedNode) {
      console.warn('❌ 拖拽节点不存在');
      return;
    }
    
    const branchId = draggedNode.branchId;
    const branch = getBranchById(branchId);
    if (!branch) {
      console.warn('❌ 分支不存在');
      return;
    }
    
    // 获取当前节点在分支中的位置
    const currentIndex = branch.nodeIds.indexOf(draggedNodeId);
    if (currentIndex === -1) {
      console.warn('❌ 拖拽节点在分支中的位置无效');
      return;
    }
    
    // 如果插入位置与当前位置相同，不需要移动
    if (currentIndex === insertIndex) {
  
      return;
    }
    
    // 创建新的节点ID数组
    const newNodeIds = [...branch.nodeIds];
    
    // 移除拖拽的节点
    newNodeIds.splice(currentIndex, 1);
    
    // 调整插入位置（因为已经移除了一个节点）
    const adjustedInsertIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
    
    // 插入到目标位置
    newNodeIds.splice(adjustedInsertIndex, 0, draggedNodeId);
    
    // 更新分支的节点顺序
    updateBranch(branchId, { nodeIds: newNodeIds });
    
    // 重新分配所有节点的 nodeIndex
    newNodeIds.forEach((nodeId, index) => {
      const node = getNodeById(nodeId);
      if (node && node.nodeIndex !== index) {
        updateNode(nodeId, { nodeIndex: index });
      }
    });
    
    console.log('🔧 节点排序完成，新顺序:', newNodeIds);
    
    // 重新排布节点位置
    setTimeout(() => {
  
      globalLayoutTree();
    }, 100);
  };

  // 处理拖拽状态更新 - 确保左右两侧显示一致
  const handleDragStateUpdate = (draggedNodeId, isDragging, targetIndex = null) => {
    // 更新拖拽状态，确保左侧边栏和右侧内容区域显示一致
    if (isDragging) {
      // 开始拖拽时，清除之前的拖拽状态
      setDraggedNodeId(draggedNodeId);
      setDragTargetIndex(targetIndex);
    } else {
      // 结束拖拽时，清除拖拽状态
      setDraggedNodeId(null);
      setDragTargetIndex(null);
    }
  };

  // 处理节点移动 - 使用新的树状数据结构
  const handleMoveNode = (nodeId, direction) => {
    console.log('🔧 handleMoveNode 被调用:', { nodeId, direction });
    
    // 获取要移动的节点
    const nodeToMove = getNodeById(nodeId);
    if (!nodeToMove) {
      console.warn('❌ 要移动的节点不存在:', nodeId);
      return;
    }

    // 检查是否是情景探索节点，如果是则不允许移动
    if (nodeToMove.type === NODE_TYPES.EXPLORATION || nodeToMove.explorationData?.isExplorationNode) {
      console.log('⚠️ 情景探索节点不允许移动:', nodeId);
      return;
    }

    // 如果节点有branchId，在分支内移动
    if (nodeToMove.branchId) {
      const branch = getBranchById(nodeToMove.branchId);
      if (!branch) {
        console.warn('❌ 分支不存在:', nodeToMove.branchId);
        return;
      }

      // 获取节点在分支中的位置
      const currentIndex = branch.nodeIds.indexOf(nodeId);
      if (currentIndex === -1) {
        console.warn('❌ 节点不在分支中:', nodeId);
        return;
      }

      let newIndex;
      if (direction === 'left' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (direction === 'right' && currentIndex < branch.nodeIds.length - 1) {
        newIndex = currentIndex + 1;
      } else {
        console.log('⚠️ 无法移动: 已经是边界位置');
        return; // 无法移动
      }

      // 在分支内交换节点位置
      const newBranch = {
        ...branch,
        nodeIds: [...branch.nodeIds]
      };
      [newBranch.nodeIds[currentIndex], newBranch.nodeIds[newIndex]] =
        [newBranch.nodeIds[newIndex], newBranch.nodeIds[currentIndex]];

      // 更新分支
      updateBranch(branch.id, { nodeIds: newBranch.nodeIds });

      // 更新节点的nodeIndex
      const swappedNode = getNodeById(newBranch.nodeIds[currentIndex]);
      const targetNode = getNodeById(newBranch.nodeIds[newIndex]);
      
      if (swappedNode) {
        updateNode(swappedNode.id, { nodeIndex: currentIndex });
      }
      if (targetNode) {
        updateNode(targetNode.id, { nodeIndex: newIndex });
      }

      console.log('🔧 分支内节点移动完成:', { from: currentIndex, to: newIndex });
    } else {
      // 如果节点没有branchId，在主线上移动
      console.log('🔧 在主线上移动节点:', nodeId);
      
      // 获取所有主线节点（没有branchId的节点）
      const mainLineNodes = storyData.filter(node => !node.branchId);
      const currentIndex = mainLineNodes.findIndex(node => node.id === nodeId);
      
      if (currentIndex === -1) {
        console.warn('❌ 节点不在主线中:', nodeId);
        return;
      }

      let newIndex;
      if (direction === 'left' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (direction === 'right' && currentIndex < mainLineNodes.length - 1) {
        newIndex = currentIndex + 1;
      } else {
        console.log('⚠️ 无法移动: 已经是边界位置');
        return; // 无法移动
      }

      // 交换主线节点的nodeIndex
      const currentNode = mainLineNodes[currentIndex];
      const targetNode = mainLineNodes[newIndex];
      
      if (currentNode && targetNode) {
        updateNode(currentNode.id, { nodeIndex: newIndex });
        updateNode(targetNode.id, { nodeIndex: currentIndex });
        console.log('🔧 主线节点移动完成:', { from: currentIndex, to: newIndex });
      }
    }

    // 重新排布节点
    setTimeout(() => {
  
      globalLayoutTree();
    }, 100);
  };

  // 处理节点删除 - 使用新的树状数据结构
  const handleDeleteNode = (nodeId) => {
    console.log('🔧 handleDeleteNode 被调用，节点ID:', nodeId);
    
    // 获取要删除的节点
    const nodeToDelete = getNodeById(nodeId);
    if (!nodeToDelete) {
      console.warn('❌ 要删除的节点不存在:', nodeId);
      return;
    }

    // 从分支中移除节点
    if (nodeToDelete.branchId) {
      removeNodeFromBranch(nodeToDelete.branchId, nodeId);
      
      // 更新剩余节点的 nodeIndex
      const branch = getBranchById(nodeToDelete.branchId);
      if (branch) {
        const remainingNodes = branch.nodeIds
          .map(id => getNodeById(id))
          .filter(Boolean);
        
        // 重新分配 nodeIndex
        remainingNodes.forEach((node, index) => {
          if (node.nodeIndex !== index) {
            updateNode(node.id, { nodeIndex: index });
          }
        });
      }
    }

    // 删除节点
    removeNode(nodeId);

    // 如果删除的是当前选中的节点，清除选择
    if (selectedFrameId === nodeId) {
      setSelectedFrameId(null);
    }

    // 删除后重新排布，确保剩余节点位置正确
    setTimeout(() => {
      globalLayoutTree();
    }, 100);
  };

  // 处理文本保存 - 使用新的树状数据结构
  const handleTextSave = (nodeId, text) => {
    updateNode(nodeId, { text });
  };

  // 处理提示词保存 - 使用新的树状数据结构
  const handlePromptSave = (nodeId, prompt) => {
    updateNode(nodeId, { prompt });
  };

  // 处理节点状态变化 - 使用新的树状数据结构
  const handleNodeStateChange = (nodeId, newState) => {
    console.log('🔧 handleNodeStateChange 被调用:', { nodeId, newState });
    
    // 更新节点数据
    updateNode(nodeId, { state: newState });
    
    // 更新节点状态并触发动态重新布局
    // 检查是否为带有图像的折叠状态
    const currentNode = getNodeById ? getNodeById(nodeId) : null;
    const hasImage = currentNode && currentNode.image;
    
    let isExpanded;
    let finalState = newState;
    
    if (newState === 'expanded' || newState === 'editing' || newState === 'generating') {
      isExpanded = true;
    } else if (newState === 'collapsed' && hasImage) {
      // 带有图像的折叠状态，需要特殊处理
      isExpanded = false;
      finalState = 'collapsedWithImage';
      // 确保状态被正确识别为带有图像的折叠状态
      updateNode(nodeId, { state: 'collapsedWithImage' });
    } else {
      isExpanded = false;
    }
    
    console.log('🔧 状态变化处理:', {
      nodeId,
      originalState: newState,
      finalState,
      hasImage,
      isExpanded
    });
    
    updateNodeState(nodeId, finalState, isExpanded);
  };

  // 处理添加新分镜 - 使用新的树状数据结构
  const handleAddNode = (newNode, insertIndex) => {
    // 初始化新节点的状态
    initializeNodeState(newNode.id);
    
    // 添加新节点到数据模型
    addNode(newNode);

    // 如果指定了分支ID，将节点添加到对应分支
    if (newNode.branchId) {
      addNodeToBranch(newNode.branchId, newNode.id, insertIndex);
    }

    // 重新排布节点
    setTimeout(() => globalLayoutTree(), 100);
  };

  // 调整节点间距
  const adjustNodeSpacing = () => {
    globalLayoutTree();
  };

  // 渲染访谈记录处理页面
  const renderInterviewStep = () => (
    <div className="h-[800px] flex gap-4 p-4 overflow-hidden">
      {/* 左侧：用户访谈记录 */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col min-h-0">
        {/* 访谈记录标题和翻页控制 */}
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
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



        {/* 访谈内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto p-3">
          <div
            ref={contentRef}
            className="prose relative max-w-none p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[350px] leading-relaxed text-gray-700 select-text"
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
            {renderHighlightedText(currentInterview.text, selectedKeywords)}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            已提取 {selectedKeywords.length} 个关键词
          </div>
        </div>
      </div>

      {/* 中间：关键词气泡面板 */}
      <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col min-h-0">
        <div className="p-3 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">提取的关键词</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-4">
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
                        className={`inline-flex items-center justify-between p-2 rounded-lg border text-sm ${type.color} max-w-full`}
                      >
                        <span className="flex-1 break-words pr-2">{keyword.text}</span>
                        <button
                          onClick={() => removeKeyword(keyword.id)}
                          className="text-gray-500 hover:text-red-500 flex-shrink-0 p-0.5 rounded hover:bg-red-50 transition-colors"
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
        </div>

        {/* 生成用户画像按钮 - 固定在面板底部 */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={generatePersonas}
            disabled={selectedKeywords.length === 0 || isGeneratingPersonas}
            className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isGeneratingPersonas ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              '生成用户画像'
            )}
          </button>
        </div>
      </div>

      {/* 右侧：用户画像面板 */}
      <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col min-h-0">
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <User className="mr-2 text-blue-500" />
              用户画像
            </h3>
            <button
              onClick={() => setCurrentStep('coze')}
              className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center"
            >
              <Bot className="w-3.5 h-3.5 mr-1.5" />
              AI助手
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {personas.length > 0 ? (
            <div className="space-y-4">
              {personas.map((persona, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">{persona.persona_name}</h4>
                    <button
                      onClick={() => setEditingPersona(persona)}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{persona.persona_summary}</p>

                  {/* 基本信息 */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">年龄</span>
                      <span className="font-medium">{persona.persona_details.age}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">职业</span>
                      <span className="font-medium">{persona.persona_details.occupation}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">生活方式</span>
                      <span className="font-medium">{persona.persona_details.lifestyle}</span>
                    </div>
                    {persona.persona_details.education && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">教育程度</span>
                        <span className="font-medium">{persona.persona_details.education}</span>
                      </div>
                    )}
                    {persona.persona_details.city && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">城市</span>
                        <span className="font-medium">{persona.persona_details.city}</span>
                      </div>
                    )}
                  </div>

                  {/* 代表性话语 */}
                  {persona.memorable_quote && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">代表性话语</div>
                      <div className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-200 italic">
                        "{persona.memorable_quote}"
                      </div>
                    </div>
                  )}

                  {/* 外观特征 */}
                  {persona.appearance_characteristics && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">外观特征</div>
                      <div className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded border border-gray-200">
                        {persona.appearance_characteristics}
                      </div>
                    </div>
                  )}

                  {/* 显示所有维度信息 */}
                  {persona.persona_details.pain_points && persona.persona_details.pain_points.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">痛点问题</div>
                      <div className="space-y-1">
                        {persona.persona_details.pain_points.map((point, idx) => (
                          <div key={idx} className="text-xs bg-rose-50 text-rose-700 px-2 py-1 rounded border border-rose-200">
                            {point}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {persona.persona_details.goals && persona.persona_details.goals.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">目标动机</div>
                      <div className="space-y-1">
                        {persona.persona_details.goals.map((goal, idx) => (
                          <div key={idx} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-200">
                            {goal}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {persona.persona_details.behaviors && persona.persona_details.behaviors.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">行为习惯</div>
                      <div className="space-y-1">
                        {persona.persona_details.behaviors.map((behavior, idx) => (
                          <div key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                            {behavior}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {persona.persona_details.preferences && persona.persona_details.preferences.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">偏好习惯</div>
                      <div className="space-y-1">
                        {persona.persona_details.preferences.map((preference, idx) => (
                          <div key={idx} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200">
                            {preference}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {persona.persona_details.attitudes && persona.persona_details.attitudes.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">态度观点</div>
                      <div className="space-y-1">
                        {persona.persona_details.attitudes.map((attitude, idx) => (
                          <div key={idx} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">
                            {attitude}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {persona.persona_details.frustrations && persona.persona_details.frustrations.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">挫折困扰</div>
                      <div className="space-y-1">
                        {persona.persona_details.frustrations.map((frustration, idx) => (
                          <div key={idx} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded border border-red-200">
                            {frustration}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {persona.persona_details.technologies && persona.persona_details.technologies.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">技术使用</div>
                      <div className="space-y-1">
                        {persona.persona_details.technologies.map((tech, idx) => (
                          <div key={idx} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200">
                            {tech}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 新增字段显示 */}
                  {persona.persona_details.psychological_profile && persona.persona_details.psychological_profile.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">心理特征</div>
                      <div className="space-y-1">
                        {persona.persona_details.psychological_profile.map((profile, idx) => (
                          <div key={idx} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200">
                            {profile}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {persona.persona_details.communication_style && persona.persona_details.communication_style.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">沟通风格</div>
                      <div className="space-y-1">
                        {persona.persona_details.communication_style.map((style, idx) => (
                          <div key={idx} className="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded border border-cyan-200">
                            {style}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {persona.persona_details.tool_expectations && persona.persona_details.tool_expectations.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">工具期望</div>
                      <div className="space-y-1">
                        {persona.persona_details.tool_expectations.map((expectation, idx) => (
                          <div key={idx} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200">
                            {expectation}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {persona.persona_details.devices && persona.persona_details.devices.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">使用设备</div>
                      <div className="space-y-1">
                        {persona.persona_details.devices.map((device, idx) => (
                          <div key={idx} className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded border border-teal-200">
                            {device}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 关键词标签 */}
                  {persona.keywords && persona.keywords.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">关键词标签</div>
                      <div className="flex flex-wrap gap-1">
                        {persona.keywords.map((keyword, idx) => (
                          <div key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-300">
                            {keyword}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 技术熟练度 */}
                  {persona.persona_details.technology_literacy && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">技术熟练度</div>
                      <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                        {persona.persona_details.technology_literacy}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">点击"生成用户画像"按钮</p>
              <p className="text-xs text-gray-400">基于提取的关键词生成用户画像</p>
            </div>
          )}
        </div>

        {/* 确定按钮 - 固定在底部 */}
        {personas.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => setCurrentStep('persona-story')}
              className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              确定并继续
            </button>
          </div>
        )}
      </div>

      {/* 用户画像编辑弹窗 */}
      {editingPersona && (
        <PersonaEditModal
          persona={editingPersona}
          personas={personas}
          onSave={savePersonaEdit}
          onClose={() => setEditingPersona(null)}
        />
      )}
    </div>
  );

  // 旧的渲染函数已删除

  // 渲染画布页面
  const renderCanvasStep = () => (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        {/* 左侧：返回上一步按钮 */}
        <div className="flex items-center">
          <button
            onClick={() => setCurrentStep('persona-story')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>返回上一步</span>
          </button>
        </div>

        {/* 右侧：其他按钮 */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCanvasPersonaModalOpen(true)}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            查看画像
          </button>
          <button
            onClick={() => setIsInterviewModalOpen(true)}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            查看访谈
          </button>


          {/* 画面参考下拉组件 */}
          <div className="relative reference-dropdown">
            <button
              onClick={() => setIsReferenceDropdownOpen(prev => !prev)}
              className="flex items-center space-x-3 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded overflow-hidden border border-gray-200">
                <img
                  src={styleUrls[selectedStyle] || styleUrls.style1}
                  alt="风格参考"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = testImage;
                  }}
                />
              </div>
              <span className="text-gray-700 font-medium">画面参考</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {/* 下拉菜单 */}
            {isReferenceDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700">选择参考风格</h3>
                </div>
                <div className="p-3 space-y-2">
                  {[
                    { id: 'style1', label: '动漫风格', image: styleUrls.style1 },
                    { id: 'style2', label: '写实风格', image: styleUrls.style2 },
                    { id: 'style3', label: '水彩风格', image: styleUrls.style3 },
                    { id: 'style4', label: '插画风格', image: styleUrls.style4 }
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => {
                        setSelectedStyle(style.id);
                        setReferenceImageUrl(style.image);
                        setIsReferenceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${selectedStyle === style.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                        }`}
                    >
                      <div className="w-10 h-10 rounded overflow-hidden border border-gray-200">
                        <img
                          src={style.image}
                          alt={style.label}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = testImage;
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-700">{style.label}</span>
                      {selectedStyle === style.id && (
                        <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 添加分镜按钮 */}
          <button
            onClick={() => {
              // 添加新分镜的逻辑 - 使用新的树状数据结构
              const rootBranch = Object.values(storyModel.branches).find(branch => branch.level === 0);
              if (!rootBranch) {
                return;
              }

              // 如果有选中的节点，插入到其右侧；否则添加到分支末尾
              let insertIndex = 'end';
              let newBaseX;
              
              if (selectedFrameId) {
                // 插入到选中节点右侧
                const selectedNode = getNodeById(selectedFrameId);
                if (selectedNode && selectedNode.branchId === rootBranch.id) {
                  insertIndex = rootBranch.nodeIds.indexOf(selectedFrameId) + 1;
                  const selectedNodeWidth = getNodeDisplayWidth(selectedNode);
                  const dynamicGap = calculateDynamicGap(selectedNode, rootBranch.nodeIds.indexOf(selectedFrameId), rootBranch.nodeIds.map(id => getNodeById(id)).filter(Boolean));
                  newBaseX = selectedNode.pos.x + selectedNodeWidth + dynamicGap;
                }
              }
              
              if (insertIndex === 'end') {
                // 添加到分支末尾
                if (rootBranch.nodeIds.length === 0) {
                  // 第一个节点，使用画布中心
                  const sidebarWidth = 288;
                  const canvasWidth = window.innerWidth - sidebarWidth;
                  const nodeWidth = DYNAMIC_LAYOUT_CONFIG.NODE_WIDTH.COLLAPSED;
                  newBaseX = sidebarWidth + (canvasWidth / 2) - (nodeWidth / 2);
                } else {
                  // 基于前一个节点计算基准位置
                  const lastNodeId = rootBranch.nodeIds[rootBranch.nodeIds.length - 1];
                  const lastNode = getNodeById(lastNodeId);
                  if (lastNode) {
                    const lastNodeWidth = getNodeDisplayWidth(lastNode);
                    const dynamicGap = calculateDynamicGap(lastNode, rootBranch.nodeIds.length - 1, rootBranch.nodeIds.map(id => getNodeById(id)).filter(Boolean));
                    newBaseX = lastNode.pos.x + lastNodeWidth + dynamicGap;
                  } else {
                    newBaseX = 100;
                  }
                }
              }

              const newFrameId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const newFrame = {
                id: newFrameId,
                label: `分镜 ${rootBranch.nodeIds.length + 1}`,
                text: '',
                image: null,
                pos: { x: newBaseX, y: 150 },
                baseX: newBaseX,
                connections: [],
                styleName: selectedStyle,
                branchId: rootBranch.id,
                nodeIndex: typeof insertIndex === 'number' ? insertIndex : rootBranch.nodeIds.length
              };

              // 添加新节点到数据模型
              addNode(newFrame);

              // 将新节点添加到根分支
              addNodeToBranch(rootBranch.id, newFrameId, insertIndex);

              // 如果有前一个节点，将新节点连接到前一个节点
              if (rootBranch.nodeIds.length > 0) {
                const lastNodeId = rootBranch.nodeIds[rootBranch.nodeIds.length - 1];
                const lastNode = getNodeById(lastNodeId);
                if (lastNode) {
                  updateNode(lastNodeId, {
                    connections: [...(lastNode.connections || []), newFrameId]
                  });
                }
              }

              setSelectedFrameId(newFrameId);

              // 立即重新排布节点位置，确保新节点位置正确
              setTimeout(() => globalLayoutTree(), 100);
            }}
            className="flex items-center space-x-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>添加分镜</span>
          </button>
        </div>
      </div>



      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 中间画布区域（全宽） */}
        <div className="flex-1 relative overflow-hidden">
          <StoryboardCanvas
            storyData={storyData}
            storyModel={storyModel}
            selectedFrameId={selectedFrameId}
            onFrameSelect={handleFrameSelect}
            onMoveNode={handleMoveNode}
            onDeleteNode={handleDeleteNode}
            onTextSave={handleTextSave}
            onPromptSave={handlePromptSave}
            onNodeStateChange={handleNodeStateChange}
            onAddNode={handleAddNode}
            onExploreScene={(nodeId) => handleExploreScene(nodeId, personas)}
            onGenerateImage={handleGenerateImage}
            onDeleteFrame={handleDeleteFrame}
            onGenerateBranches={handleGenerateBranches}
            setCurrentExplorationNodeId={setCurrentExplorationNodeId}
            setIsSceneExplorationOpen={setIsSceneExplorationOpen}
            // 传递工具函数
            getNodeById={getNodeById}
            getBranchById={getBranchById}
            addNode={addNode}
            addNodeToBranch={addNodeToBranch}
            updateNode={updateNode}
            // 传递用户画像数据
            personas={personas}
          />

          {/* 悬浮侧栏：分为两个独立卡片 */}
          <div className="absolute left-4 top-4 z-10 space-y-3">
            {/* 故事结构卡片 */}
            <div className={`bg-white/95 backdrop-blur-sm border-r border-gray-200 flex-shrink-0 flex flex-col transition-all duration-300 w-72 rounded-xl shadow-lg ${isSidebarCollapsed ? 'h-12' : 'h-96'}`}>
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-800 text-sm">故事结构</span>
                    <p className="text-xs text-gray-500">拖拽分镜节点可调整顺序</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarCollapsed(v => !v)}
                  className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  {isSidebarCollapsed ? '展开' : '收起'}
                </button>
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                  <StoryboardTree
                    storyModel={storyModel}
                    selectedFrameId={selectedFrameId}
                    onFrameSelect={handleFrameSelect}
                    onFrameReorder={handleFrameReorder}
                    onDragStateUpdate={handleDragStateUpdate}
                    draggedNodeId={draggedNodeId}
                    dragTargetIndex={dragTargetIndex}
                  />
                </div>
              )}
            </div>

            {/* 关键词气泡池卡片 */}
            <div className={`w-72 rounded-xl shadow-lg bg-white/95 backdrop-blur-sm border border-gray-200 flex-shrink-0 flex flex-col ${isKeywordPoolCollapsed ? 'h-12' : 'h-96'}`}>
              <div className="flex items-center justify-between p-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="font-medium text-gray-800 text-sm">关键词气泡池</span>
                </div>

                <button
                  onClick={() => setIsKeywordPoolCollapsed(v => !v)}
                  className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  {isKeywordPoolCollapsed ? '展开' : '收起'}
                </button>
              </div>

              {!isKeywordPoolCollapsed && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* 自定义输入区域 */}
                  <div className="p-3 border-b border-gray-100 flex-shrink-0">
                    <div className="flex gap-2">
                      <select
                        value={customKeywordType}
                        onChange={(e) => setCustomKeywordType(e.target.value)}
                        className="flex-shrink-0 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {keywordTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={customKeywordText}
                        onChange={(e) => setCustomKeywordText(e.target.value)}
                        placeholder="创建气泡..."
                        className="w-28 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && customKeywordText.trim()) {
                            addCustomKeyword();
                          }
                        }}
                      />
                      <button
                        onClick={addCustomKeyword}
                        disabled={!customKeywordText.trim()}
                        className="flex-shrink-0 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        添加
                      </button>
                    </div>
                  </div>

                  {/* 筛选按钮 */}
                  <div className="flex flex-wrap gap-1.5 p-3 pb-2 flex-shrink-0">
                    <button
                      onClick={() => setActiveKeywordTypeCanvas('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeKeywordTypeCanvas === 'all'
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                        }`}
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${activeKeywordTypeCanvas === type.id
                              ? 'bg-gray-900 text-white shadow-sm'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                            }`}
                        >
                          {type.name} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* 关键词气泡 - 带滚动条 */}
                  <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50 hover:scrollbar-thumb-gray-300">
                    <div className="p-3 pt-0 pb-4 space-y-3">
                      {keywordTypes.map(type => {
                        const typeKeywords = selectedKeywords.filter(k => k.type === type.id);
                        if (typeKeywords.length === 0) return null;
                        if (activeKeywordTypeCanvas !== 'all' && activeKeywordTypeCanvas !== type.id) return null;

                        return (
                          <div key={type.id} className="break-inside-avoid">
                            <h3 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                type.id === 'elements' ? 'bg-blue-400' :
                                type.id === 'user_traits' ? 'bg-green-400' :
                                type.id === 'pain_points' ? 'bg-red-400' :
                                type.id === 'goals' ? 'bg-amber-400' :
                                type.id === 'emotions' ? 'bg-indigo-400' : 'bg-gray-400'
                              }`}></span>
                              {type.name}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                              {typeKeywords.map(keyword => (
                                <div
                                  key={keyword.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, keyword)}
                                  className={`${type.color} px-3 py-1.5 rounded-lg text-xs font-medium cursor-move hover:shadow-sm transition-all duration-200 border flex-shrink-0 flex items-center justify-between`}
                                  style={{ maxWidth: 'calc(100% - 6px)' }}
                                >
                                  <span className="break-words leading-relaxed flex-1 pr-1">{keyword.text}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFromKeywordPool(keyword.id);
                                    }}
                                    className="text-gray-400 hover:text-red-500 flex-shrink-0 p-0.5 rounded hover:bg-red-50 transition-colors text-xs ml-1"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {selectedKeywords.length === 0 && (
                        <div className="text-center py-4">
                          <span className="text-xs text-gray-400">暂无关键词</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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

  // 渲染加载状态页面
  const renderLoadingStep = () => {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">正在生成分镜节点</h2>
            <p className="text-gray-600">AI正在将您的故事拆分成5个精彩的分镜，请稍候...</p>
          </div>
          <div className="text-sm text-gray-500">
            <p>这通常需要10-30秒时间</p>
          </div>
        </div>
      </div>
    );
  };

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
      case 'loading':
        return renderLoadingStep();
      case 'canvas':
        return renderCanvasStep();
      case 'coze':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">AI 智能助手</h1>
              <button
                onClick={() => setCurrentStep('interview')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                返回故事板
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <CozeTest onClose={() => setCurrentStep('interview')} />
            </div>
          </div>
        );
      default:
        return renderInterviewStep();
    }
  };



  return (
    <motion.div
      className={`absolute inset-0 z-40 overflow-y-auto ${currentStep === 'canvas' || currentStep === 'persona-story'
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
const StoryboardTest = (props) => {
  return <StoryboardFlow {...props} />;
};

export default StoryboardTest;