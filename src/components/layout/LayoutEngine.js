// 布局引擎模块 - 负责故事板节点的动态布局计算

// 动态布局常量
export const DYNAMIC_LAYOUT_CONFIG = {
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

// 节点状态引用
export const nodeStatesRef = {};

// 全局变量用于存储 layoutTree 的参数
let globalStoryModel = null;
let globalSelectedFrameId = null;
let globalGetNodeById = null;
let globalGetBranchById = null;
let globalUpdateNode = null;

// 获取节点的实际显示宽度（用于布局计算）
export const getNodeDisplayWidth = (node) => {
  if (!node) return DYNAMIC_LAYOUT_CONFIG.NODE_WIDTH.COLLAPSED;
  
  // 严格检查是否为探索节点
  const isExplorationNode = node.type === 'exploration' || node.explorationData?.isExplorationNode;
  
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
  } else {
    // 折叠状态：240px
    baseWidth = 240;
  }
  
  // 如果显示悬浮面板，加上面板宽度
  const showPanel = node.showFloatingPanel;
  const totalWidth = baseWidth + (showPanel ? DYNAMIC_LAYOUT_CONFIG.PANEL_WIDTH : 0);
  
  console.log('🔧 节点宽度计算:', {
    nodeId: node.id,
    nodeState: node.state,
    baseWidth,
    showPanel,
    panelWidth: showPanel ? DYNAMIC_LAYOUT_CONFIG.PANEL_WIDTH : 0,
    totalWidth
  });
  
  return totalWidth;
};

// 辅助函数：动态计算节点高度
export const getNodeHeight = (node) => {
  if (!node) return 200;
  
  // 根据节点状态和内容计算高度 - 直接检查nodeStatesRef
  const nodeState = nodeStatesRef[node.id];
  if (nodeState && nodeState.isExpanded) {
    return 400; // 展开状态 - 调整为新的压缩布局高度
  }
  
  return 200; // 默认折叠状态
};

// 动态间距计算函数 - 分别处理分镜节点和探索节点
export const calculateDynamicGap = (currentNode, currentIndex, allNodes) => {
  const { HORIZONTAL_GAP } = DYNAMIC_LAYOUT_CONFIG;
  let gap = HORIZONTAL_GAP;
  
  // 检查当前节点和下一个节点的类型
  const isCurrentExploration = currentNode.type === 'exploration' || currentNode.explorationData?.isExplorationNode;
  const nextNode = allNodes[currentIndex + 1];
  const isNextExploration = nextNode?.type === 'exploration' || nextNode?.explorationData?.isExplorationNode;
  
  // 分镜节点之间的间距 - 保持恒定间距
  if (!isCurrentExploration && !isNextExploration) {
    // 两个都是分镜节点，使用固定间距
    gap = 50;
  }
  // 分镜节点与探索节点之间的间距
  else if (!isCurrentExploration && isNextExploration) {
    // 当前是分镜节点，下一个是探索节点
    gap = 50;
  }
  // 探索节点与分镜节点之间的间距
  else if (isCurrentExploration && !isNextExploration) {
    // 当前是探索节点，下一个是分镜节点
    gap = 60;
  }
  // 探索节点之间的间距
  else if (isCurrentExploration && isNextExploration) {
    // 两个都是探索节点
    gap = 60;
  }
  
  // 添加调试日志
  console.log('🔧 动态间距计算:', {
    currentNodeId: currentNode.id,
    currentIndex,
    isCurrentExploration,
    isNextExploration,
    calculatedGap: gap
  });
  
  return gap;
};

// 递归布局算法 - 支持无限嵌套的树状结构和动态间距调整
export const layoutTree = (storyModel, selectedFrameId, getNodeById, getBranchById, updateNode) => {
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

    console.log('🔧 分支节点排序结果:', branchNodes.map(n => ({ id: n.id, nodeIndex: n.nodeIndex, label: n.label })));

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
      } else {
        // 其他节点：基于前一个节点的位置计算
        const prevNode = branchNodes[index - 1];
        const prevNodeWidth = getNodeDisplayWidth(prevNode); // 使用显示宽度确保一致性
        const dynamicGap = calculateDynamicGap(prevNode, index - 1, branchNodes);
        node.pos = { x: prevNode.pos.x + prevNodeWidth + dynamicGap, y: startY };
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
        node.type === 'exploration' || node.explorationData?.isExplorationNode
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
export const globalLayoutTree = () => {
  if (globalStoryModel && globalSelectedFrameId !== null && globalGetNodeById && globalGetBranchById && globalUpdateNode) {
    layoutTree(globalStoryModel, globalSelectedFrameId, globalGetNodeById, globalGetBranchById, globalUpdateNode);
  }
};

// 节点状态管理函数
export const updateNodeState = (nodeId, state, isExpanded) => {
  // 更新节点状态引用
  nodeStatesRef[nodeId] = {
    state,
    isExpanded,
    lastUpdated: Date.now()
  };
  
  console.log('🔧 updateNodeState 被调用:', { nodeId, state, isExpanded });
  
  // 立即触发动态重新布局，确保节点间距保持动态不变
  requestAnimationFrame(() => {
    const currentNode = globalGetNodeById ? globalGetNodeById(nodeId) : null;
    if (!currentNode) return;

    const isExplorationNode = currentNode.type === 'exploration' || currentNode.explorationData?.isExplorationNode;

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
        console.log('🔧 无法找到分支，执行全局布局');
        globalLayoutTree();
      }
    } else {
      // 兜底：无法定位分支时执行全局布局
      console.log('🔧 兜底：执行全局布局');
      globalLayoutTree();
    }
  });
};

// 智能重新布局函数 - 保持节点间距动态不变
export const smartRelayout = (branch, changedNodeId) => {
  if (!globalGetNodeById || !globalUpdateNode) return;
  
  const uniqueIds = Array.from(new Set(branch.nodeIds));
  const branchNodes = uniqueIds
    .map(nodeId => globalGetNodeById(nodeId))
    .filter(Boolean)
    .sort((a, b) => (a.nodeIndex || 0) - (b.nodeIndex || 0));
  
  const changedNodeIndex = branchNodes.findIndex(node => node.id === changedNodeId);
  if (changedNodeIndex === -1) return;
  
  console.log('🔧 开始智能重新布局，变更节点索引:', changedNodeIndex, '分支节点数量:', branchNodes.length);
  console.log('🔧 变更节点信息:', {
    id: changedNodeId,
    state: branchNodes[changedNodeIndex]?.state,
    width: getNodeDisplayWidth(branchNodes[changedNodeIndex])
  });
  
  // 从变更节点开始，重新计算所有后续节点的位置
  for (let i = changedNodeIndex; i < branchNodes.length; i++) {
    const node = branchNodes[i];
    
    if (i === 0) {
      // 第一个节点保持基准位置
      if (node.baseX !== undefined) {
        const newX = node.baseX;
        if (Math.abs(node.pos.x - newX) > 1) {
          globalUpdateNode(node.id, {
            pos: { x: newX, y: node.pos.y }
          });
          console.log('🔧 更新第一个节点位置:', node.id, '->', newX);
        }
      }
    } else {
      // 其他节点基于前一个节点的位置和宽度计算
      const prevNode = branchNodes[i - 1];
      
      if (prevNode && prevNode.pos && typeof prevNode.pos.x === 'number') {
        const prevNodeWidth = getNodeDisplayWidth(prevNode); // 使用实时显示宽度
        const dynamicGap = calculateDynamicGap(prevNode, i - 1, branchNodes);
        const newX = prevNode.pos.x + prevNodeWidth + dynamicGap;
        
        // 只有当位置真正需要改变时才更新
        if (Math.abs(node.pos.x - newX) > 1) {
          globalUpdateNode(node.id, {
            pos: { x: newX, y: node.pos.y }
          });
          console.log('🔧 更新节点位置:', node.id, '->', newX, '前一个节点宽度:', prevNodeWidth, '间距:', dynamicGap);
        }
      }
    }
  }
  
  console.log('🔧 智能重新布局完成');
};

// 初始化节点状态函数
export const initializeNodeState = (nodeId) => {
  if (!nodeStatesRef[nodeId]) {
    nodeStatesRef[nodeId] = {
      state: 'collapsed',
      isExpanded: false,
      lastUpdated: Date.now()
    };
  }
  return nodeStatesRef[nodeId];
};

// 设置全局 layoutTree 参数的函数
export const setLayoutTreeParams = (storyModel, selectedFrameId, getNodeById, getBranchById, updateNode) => {
  globalStoryModel = storyModel;
  globalSelectedFrameId = selectedFrameId;
  globalGetNodeById = getNodeById;
  globalGetBranchById = getBranchById;
  globalUpdateNode = updateNode;
}; 