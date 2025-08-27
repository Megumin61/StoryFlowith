import React, { useEffect, useState } from 'react';
import { PanelLeft, PanelLeftClose, Folder, Film, ChevronDown, CornerDownRight, GitBranch } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';

function StoryTree({ storyData, selectedFrameId, onFrameSelect }) {
  const t = useLocale();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    renderStoryTree();
  }, [storyData, selectedFrameId]);

  // 分析故事结构，识别主线和分支
  const analyzeStoryStructure = () => {
    const nodesById = new Map(storyData.map(node => [node.id, node]));
    const childrenOf = new Map();
    const explorationNodes = new Map(); // 探索节点映射
    const branchGroups = new Map(); // 分支组映射
    
    // 构建父子关系
    storyData.forEach(node => {
      if (node.connections) {
        node.connections.forEach(childId => {
          if (!childrenOf.has(childId)) childrenOf.set(childId, []);
          childrenOf.get(childId).push(node.id);
        });
      }
    });

    // 识别探索节点和分支
    storyData.forEach(node => {
      // 检查是否为探索节点
      if (node.explorationData?.isExplorationNode || node.type === 'exploration') {
        explorationNodes.set(node.id, node);
        
        // 查找从该探索节点生成的分支
        const branches = storyData.filter(n => 
          n.branchData && n.branchData.parentNodeId === node.id
        );
        
        if (branches.length > 0) {
          branchGroups.set(node.id, {
            explorationNode: node,
            branches: branches.sort((a, b) => (a.branchData.branchIndex || 0) - (b.branchData.branchIndex || 0))
          });
        }
      }
    });

    return { nodesById, childrenOf, explorationNodes, branchGroups };
  };

  const renderStoryTree = () => {
    const { nodesById, childrenOf, explorationNodes, branchGroups } = analyzeStoryStructure();
    
    // 找到根节点
    const rootId = storyData.find(node => !childrenOf.has(node.id))?.id || (storyData.length > 0 ? storyData[0].id : null);
    
    return rootId ? renderPath(rootId, nodesById, childrenOf, explorationNodes, branchGroups) : null;
  };
  
  const renderPath = (nodeId, nodesById, childrenOf, explorationNodes, branchGroups) => {
    const visited = new Set();
    const mainPath = [];
    let branchCounter = 0;
    
    let currentNodeId = nodeId;
    
    // 构建主线路径
    while (currentNodeId && !visited.has(currentNodeId)) {
      const currentNode = nodesById.get(currentNodeId);
      if (!currentNode) break;
      
      visited.add(currentNodeId);
      mainPath.push(currentNode);
      
      // 如果是探索节点，不继续主线路径
      if (explorationNodes.has(currentNodeId)) {
        break;
      }
      
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
          <span>{t.storyTree.mainStory}</span>
        </li>
        {mainPath.map((node, index) => {
          const isExplorationNode = explorationNodes.has(node.id);
          const hasBranches = branchGroups.has(node.id);
          const titleText = node.title?.length > 20 ? node.title.substring(0, 20) + '...' : (node.label || `分镜 ${index + 1}`);
          
          return (
            <li key={node.id} className={`story-tree-node ${hasBranches ? 'has-branches' : ''} is-main`}>
              <div 
                className={`node-content w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors ${node.id === selectedFrameId ? 'bg-blue-100 border border-blue-500' : ''}`}
                onClick={() => onFrameSelect(node.id)}
              >
                {isExplorationNode ? (
                  <GitBranch className="w-4 h-4 flex-shrink-0 text-purple-500" />
                ) : (
                  <Film className="w-4 h-4 flex-shrink-0 text-gray-500" />
                )}
                <span className="flex-grow text-sm text-gray-800 truncate" title={node.title || node.label}>
                  {isExplorationNode ? '🔍 探索节点' : titleText}
                </span>
                <span className="flex-shrink-0 text-xs">
                  {isExplorationNode ? '🔍' : '📽️'}
                </span>
              </div>
              
              {/* 显示分支组 */}
              {hasBranches && (
                <ul className="branch-container pl-4 mt-1">
                  {branchGroups.get(node.id).branches.map((branchNode, idx) => {
                    branchCounter++;
                    const branchName = branchNode.branchData?.branchName || `分支 ${String.fromCharCode(64 + branchCounter)}`;
                    
                    return (
                      <BranchNode 
                        key={branchNode.id} 
                        branchId={branchNode.id}
                        branchName={branchName} 
                        nodesById={nodesById}
                        selectedFrameId={selectedFrameId}
                        onFrameSelect={onFrameSelect}
                        explorationNode={node}
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
    <aside id="left-sidebar" className={`w-72 bg-white/95 backdrop-blur-sm border-r border-gray-200 flex-shrink-0 flex flex-col ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 h-16">
        <h2 className="font-bold text-lg text-gray-800">{t.storyTree.title}</h2>
        <button 
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? t.storyTree.expandAriaLabel : t.storyTree.collapseAriaLabel}
        >
          {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300" id="story-tree-container">
        {renderStoryTree()}
      </div>
    </aside>
  );
}

function BranchNode({ branchId, branchName, nodesById, selectedFrameId, onFrameSelect, explorationNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  const renderBranchNodes = (nodeId) => {
    const node = nodesById.get(nodeId);
    if (!node) return null;
    
    const isExplorationNode = node.explorationData?.isExplorationNode || node.type === 'exploration';
    const titleText = node.title?.length > 20 ? node.title.substring(0, 20) + '...' : (node.label || '分镜');
    
    return (
      <li key={node.id} className="story-tree-node is-branch">
        <div 
          className={`node-content w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors ${node.id === selectedFrameId ? 'bg-blue-100 border border-blue-500' : ''}`}
          onClick={() => onFrameSelect(node.id)}
        >
          {isExplorationNode ? (
            <GitBranch className="w-4 h-4 flex-shrink-0 text-purple-500" />
          ) : (
            <Film className="w-4 h-4 flex-shrink-0 text-gray-500" />
          )}
          <span className="flex-grow text-sm text-gray-800 truncate" title={node.title || node.label}>
            {isExplorationNode ? '🔍 探索节点' : titleText}
          </span>
          <span className="flex-shrink-0 text-xs">
            {isExplorationNode ? '🔍' : '📽️'}
          </span>
        </div>
        
        {/* 递归渲染分支内的子节点 */}
        {node.connections && node.connections.length > 0 && (
          <ul className="pl-4 mt-1">
            {node.connections.map(childId => renderBranchNodes(childId))}
          </ul>
        )}
      </li>
    );
  };
  
  return (
    <li>
      <div 
        className="branch-header flex items-center gap-2 p-2 cursor-pointer text-sm font-medium text-blue-700 bg-blue-50/80 rounded-md my-1 hover:bg-blue-100/80 transition-colors"
        onClick={toggleExpand}
      >
        <CornerDownRight className="w-4 h-4 flex-shrink-0" />
        <span className="flex-grow">{branchName}</span>
        <ChevronDown className={`w-4 h-4 expand-icon transition-transform ${!isExpanded ? 'rotate-180' : ''}`} />
      </div>
      
      <ul className={`branch-content pl-4 border-l-2 border-blue-200 ${isExpanded ? '' : 'hidden'}`}>
        {renderBranchNodes(branchId)}
      </ul>
    </li>
  );
}

export default StoryTree; 