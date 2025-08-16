import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ExplorationNode from './ExplorationNode';

const ExplorationNodeTest = () => {
  const [selectedFrameId, setSelectedFrameId] = useState(null);
  const [storyData, setStoryData] = useState([
    {
      id: 'exploration_1',
      text: '探索情景',
      prompt: '基于当前分镜探索新的情景可能性',
      imagePrompt: '',
      image: null,
      state: 'expanded',
      pos: { x: 100, y: 150 },
      connections: [],
      nodeIndex: 0,
      explorationData: {
        parentNodeId: 'frame_1',
        isExplorationNode: true,
        explorationText: '探索用户在不同场景下的使用体验',
        branchCount: 3,
        generatedIdeas: [],
        selectedIdeas: [],
        onDataChange: (newData) => {
          console.log('探索节点数据更新:', newData);
          setStoryData(prev => prev.map(frame => 
            frame.id === 'exploration_1' 
              ? { ...frame, explorationData: { ...frame.explorationData, ...newData } }
              : frame
          ));
        }
      }
    }
  ]);

  const handleGenerateBranches = (selectedIdeas) => {
    console.log('生成分支:', selectedIdeas);
    
    const newBranches = selectedIdeas.map((idea, index) => ({
      id: `branch_${Date.now()}_${index}`,
      text: idea.text,
      prompt: `基于探索方向: ${idea.text}`,
      imagePrompt: '',
      image: null,
      state: 'collapsed',
      pos: { x: 500 + index * 300, y: 150 },
      connections: [],
      nodeIndex: index + 1,
      branchData: {
        parentNodeId: 'exploration_1',
        generationParams: idea,
        branchIndex: index,
        explorationText: idea.text
      }
    }));

    setStoryData(prev => [...prev, ...newBranches]);
  };

  const onDeleteNode = (nodeId) => {
    setStoryData(prev => prev.filter(frame => frame.id !== nodeId));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">探索节点测试</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">探索节点功能测试</h2>
          
          <div className="flex flex-wrap gap-6">
            {storyData.map((frameData) => (
              <div key={frameData.id}>
                {frameData.explorationData?.isExplorationNode ? (
                  <ExplorationNode 
                    data={frameData}
                    selected={frameData.id === selectedFrameId}
                    onNodeClick={() => setSelectedFrameId(frameData.id)}
                    onNodeDelete={() => onDeleteNode(frameData.id)}
                    onGenerateBranches={handleGenerateBranches}
                  />
                ) : (
                  <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 w-80">
                    <h3 className="font-medium text-blue-800 mb-2">分支节点</h3>
                    <p className="text-sm text-blue-700">{frameData.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorationNodeTest; 