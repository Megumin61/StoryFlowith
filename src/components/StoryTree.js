import React, { useEffect, useState } from 'react';
import { PanelLeft, PanelLeftClose, Folder, Film, ChevronDown, CornerDownRight } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';

function StoryTree({ storyData, selectedFrameId, onFrameSelect }) {
  const t = useLocale();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    renderStoryTree();
  }, [storyData, selectedFrameId]);

  const renderStoryTree = () => {
    const nodesById = new Map(storyData.map(node => [node.id, node]));
    const childrenOf = new Map();
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
          <span>{t.storyTree.mainStory}</span>
        </li>
        {mainPath.map((node, index) => {
          const emotionMap = { 'frustrated': '?', 'neutral': '?', 'relieved': '?', 'frown': '?', 'meh': '?', 'smile': '?', 'lightbulb': '?' };
          const emotionIcon = emotionMap[node.emotion] || '?';
          const titleText = node.title.length > 20 ? node.title.substring(0, 20) + '...' : node.title;
          
          const hasBranches = node.connections && node.connections.length > 1;
          
          return (
            <li key={node.id} className={`story-tree-node ${hasBranches ? 'has-branches' : ''} is-main`}>
              <div 
                className={`node-content w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer ${node.id === selectedFrameId ? 'active' : ''}`}
                onClick={() => onFrameSelect(node.id)}
              >
                <Film className="w-4 h-4 flex-shrink-0 text-gray-500" />
                <span className="flex-grow text-sm text-gray-800 truncate" title={node.title}>{titleText}</span>
                <span className="flex-shrink-0">{emotionIcon}</span>
              </div>
              
              {hasBranches && (
                <ul className="branch-container pl-4">
                  {node.connections.slice(1).map((branchId, idx) => {
                    branchCounter++;
                    const branchName = t.storyTree.branchNameTemplate.replace('{letter}', String.fromCharCode(64 + branchCounter));
                    
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
      <div className="flex-grow overflow-y-auto p-2" id="story-tree-container">
        {renderStoryTree()}
      </div>
    </aside>
  );
}

function BranchNode({ branchId, branchName, nodesById, selectedFrameId, onFrameSelect }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  const renderBranchNodes = (nodeId) => {
    const node = nodesById.get(nodeId);
    if (!node) return null;
    
    const emotionMap = { 'frustrated': '?', 'neutral': '?', 'relieved': '?', 'frown': '?', 'meh': '?', 'smile': '?', 'lightbulb': '?' };
    const emotionIcon = emotionMap[node.emotion] || '?';
    const titleText = node.title.length > 20 ? node.title.substring(0, 20) + '...' : node.title;
    
    return (
      <li key={node.id} className="story-tree-node is-branch">
        <div 
          className={`node-content w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer ${node.id === selectedFrameId ? 'active' : ''}`}
          onClick={() => onFrameSelect(node.id)}
        >
          <Film className="w-4 h-4 flex-shrink-0 text-gray-500" />
          <span className="flex-grow text-sm text-gray-800 truncate" title={node.title}>{titleText}</span>
          <span className="flex-shrink-0">{emotionIcon}</span>
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

export default StoryTree; 