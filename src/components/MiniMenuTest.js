import React, { useState } from 'react';
import MiniMenu from './MiniMenu';

const MiniMenuTest = () => {
  const [menuState, setMenuState] = useState({
    isVisible: false,
    position: { x: 0, y: 0 },
    targetNodeId: null
  });

  const handleRightClick = (e) => {
    e.preventDefault();
    console.log('测试页面右键点击:', { x: e.clientX, y: e.clientY });
    setMenuState({
      isVisible: true,
      position: { x: e.clientX, y: e.clientY },
      targetNodeId: 'test-node'
    });
  };

  const handleClose = () => {
    console.log('关闭Mini-Menu');
    setMenuState({
      isVisible: false,
      position: { x: 0, y: 0 },
      targetNodeId: null
    });
  };

  const handleAddFrame = () => {
    console.log('添加新分镜');
    handleClose();
  };

  const handleExploreScene = () => {
    console.log('探索情景');
    handleClose();
  };

  const handleGenerateImage = () => {
    console.log('生成画面');
    handleClose();
  };

  const handleDeleteFrame = () => {
    console.log('删除分镜');
    handleClose();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mini-Menu 功能测试</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试说明</h2>
          <p className="text-gray-600 mb-4">
            在下面的测试区域右键点击，应该会弹出Mini-Menu菜单。
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>右键点击任意位置触发菜单</li>
            <li>点击菜单项查看控制台输出</li>
            <li>点击外部区域关闭菜单</li>
            <li>菜单应该出现在鼠标位置上方</li>
          </ul>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">调试信息</h3>
            <p className="text-sm text-blue-700">
              菜单状态: {menuState.isVisible ? '显示' : '隐藏'}<br/>
              位置: ({menuState.position.x}, {menuState.position.y})<br/>
              目标节点: {menuState.targetNodeId || '无'}
            </p>
          </div>
        </div>

        {/* 测试区域 */}
        <div 
          className="bg-white rounded-lg shadow-md p-8 border-2 border-dashed border-gray-300 min-h-[400px] flex items-center justify-center"
          onContextMenu={handleRightClick}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">右键点击这里</h3>
            <p className="text-gray-600">在任意位置右键点击来测试Mini-Menu功能</p>
            <p className="text-sm text-gray-400 mt-2">菜单应该出现在鼠标位置上方</p>
          </div>
        </div>

        {/* Mini-Menu组件 */}
        <MiniMenu
          isVisible={menuState.isVisible}
          position={menuState.position}
          onAddFrame={handleAddFrame}
          onExploreScene={handleExploreScene}
          onGenerateImage={handleGenerateImage}
          onDeleteFrame={handleDeleteFrame}
          onClose={handleClose}
        />
      </div>
    </div>
  );
};

export default MiniMenuTest; 