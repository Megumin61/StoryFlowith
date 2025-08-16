import React, { useState } from 'react';
import StoryTree from './StoryTree';
import { testBranchStructureData } from '../testData/branchStructureTest';

const StoryTreeTest = () => {
  const [selectedFrameId, setSelectedFrameId] = useState(null);

  const handleFrameSelect = (frameId) => {
    setSelectedFrameId(frameId);
    console.log('选中节点:', frameId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 左侧故事结构面板 */}
      <StoryTree 
        storyData={testBranchStructureData}
        selectedFrameId={selectedFrameId}
        onFrameSelect={handleFrameSelect}
      />
      
      {/* 右侧内容区域 */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            分支关系显示测试
          </h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              测试说明
            </h2>
            <div className="space-y-2 text-gray-600">
              <p>• 左侧面板显示了故事的分支结构</p>
              <p>• 探索节点C生成了三个分支：D、F、G</p>
              <p>• D和E属于主线继续（同一水平线）</p>
              <p>• F和F1属于分支A</p>
              <p>• G和G1属于分支B</p>
              <p>• 点击节点可以选中并查看详细信息</p>
            </div>
          </div>
          
          {selectedFrameId && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                选中节点信息
              </h2>
              <div className="space-y-2">
                <p><strong>节点ID:</strong> {selectedFrameId}</p>
                <p><strong>节点标题:</strong> {
                  testBranchStructureData.find(node => node.id === selectedFrameId)?.title || '未知'
                }</p>
                <p><strong>节点内容:</strong> {
                  testBranchStructureData.find(node => node.id === selectedFrameId)?.text || '无内容'
                }</p>
                {testBranchStructureData.find(node => node.id === selectedFrameId)?.branchData && (
                  <p><strong>分支信息:</strong> {
                    testBranchStructureData.find(node => node.id === selectedFrameId)?.branchData.branchName || '未知分支'
                  }</p>
                )}
                {testBranchStructureData.find(node => node.id === selectedFrameId)?.explorationData && (
                  <p><strong>探索内容:</strong> {
                    testBranchStructureData.find(node => node.id === selectedFrameId)?.explorationData.explorationText || '无探索内容'
                  }</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryTreeTest; 