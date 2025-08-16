import React from 'react';
import StoryNode from './StoryNode';
import ExplorationNode from './ExplorationNode';

// 节点类型常量
export const NODE_TYPES = {
  STORY_FRAME: 'story_frame',        // 分镜节点
  EXPLORATION: 'exploration',        // 探索节点
  BRANCH_START: 'branch_start',      // 分支起始节点
  BRANCH_FRAME: 'branch_frame',      // 分支分镜节点
};

// 节点类型判断函数
export const getNodeType = (node) => {
  if (!node) return NODE_TYPES.STORY_FRAME;
  
  // 探索节点
  if (node.type === NODE_TYPES.EXPLORATION || node.explorationData?.isExplorationNode) {
    return NODE_TYPES.EXPLORATION;
  }
  
  // 分支起始节点
  if (node.branchData?.isIndependent) {
    return NODE_TYPES.BRANCH_START;
  }
  
  // 分支分镜节点
  if (node.branchData && !node.branchData.isIndependent) {
    return NODE_TYPES.BRANCH_FRAME;
  }
  
  // 默认为分镜节点
  return NODE_TYPES.STORY_FRAME;
};

// 节点渲染组件
const NodeRenderer = ({
  node,
  selected,
  onNodeClick,
  onNodeDelete,
  onGenerateBranches,
  onMoveNode,
  onTextSave,
  onPromptSave,
  onNodeStateChange,
  onAddFrame,
  onExploreScene,
  onGenerateImage,
  onDeleteFrame,
  onUpdateNode
}) => {
  const nodeType = getNodeType(node);

  // 渲染探索节点
  if (nodeType === NODE_TYPES.EXPLORATION) {
    return (
      <ExplorationNode
        data={{
          ...node,
          onUpdateNode,
          onNodeStateChange: (newState) => onNodeStateChange(node.id, newState)
        }}
        selected={selected}
        onNodeClick={onNodeClick}
        onNodeDelete={onNodeDelete}
        onGenerateBranches={onGenerateBranches}
      />
    );
  }

  // 渲染分镜节点（包括分支节点）
  return (
    <StoryNode
      data={{
        ...node,
        onMoveNode,
        onDeleteNode: onNodeDelete,
        onTextSave: (text) => onTextSave(node.id, text),
        onPromptSave: (prompt) => onPromptSave(node.id, prompt),
        onNodeStateChange: (newState) => onNodeStateChange(node.id, newState),
        onStateChange: (nodeId, state, isExpanded) => onNodeStateChange(nodeId, state),
        onAddFrame,
        onExploreScene,
        onGenerateImage,
        onDeleteFrame,
        onUpdateNode
      }}
      selected={selected}
    />
  );
};

// 创建节点的工厂函数
export const createNode = (type, data = {}) => {
  const baseNode = {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: type, // 添加type属性
    pos: { x: 0, y: 0 },
    ...data
  };

  switch (type) {
    case NODE_TYPES.EXPLORATION:
      return {
        ...baseNode,
        explorationData: {
          isExplorationNode: true,
          keywords: data.keywords || [],
          ...data.explorationData
        }
      };
    case NODE_TYPES.BRANCH_START:
      return {
        ...baseNode,
        branchData: {
          isIndependent: true,
          ...data.branchData
        }
      };
    case NODE_TYPES.BRANCH_FRAME:
      return {
        ...baseNode,
        branchData: {
          isIndependent: false,
          ...data.branchData
        }
      };
    default:
      return baseNode;
  }
};

export default NodeRenderer; 