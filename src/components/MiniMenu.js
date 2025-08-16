import React from 'react';
import { Plus, Search, Image, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MiniMenu = ({ 
  isVisible, 
  position, 
  onAddFrame, 
  onExploreScene, 
  onGenerateImage, 
  onDeleteFrame,
  onClose 
}) => {
  if (!isVisible) return null;

  const menuItems = [
    {
      id: 'add-frame',
      icon: Plus,
      label: '新分镜',
      action: onAddFrame,
      color: 'bg-blue-500 hover:bg-blue-600',
      tooltip: '在当前位置添加新分镜'
    },
    {
      id: 'explore-scene',
      icon: Search,
      label: '情景探索',
      action: onExploreScene,
      color: 'bg-green-500 hover:bg-green-600',
      tooltip: '探索当前情景的更多可能性'
    },
    {
      id: 'generate-image',
      icon: Image,
      label: '画面生成',
      action: onGenerateImage,
      color: 'bg-purple-500 hover:bg-purple-600',
      tooltip: '生成当前分镜的画面'
    },
    {
      id: 'delete-frame',
      icon: Trash2,
      label: '删除分镜',
      action: onDeleteFrame,
      color: 'bg-red-500 hover:bg-red-600',
      tooltip: '删除当前分镜'
    }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed z-50"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -100%)'
          }}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* 菜单容器 */}
          <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-2 min-w-[200px]">
                      {/* 小三角箭头 */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45" />
            
            {/* 菜单项 */}
            <div className="space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white font-medium text-sm
                      transition-all duration-200 transform hover:scale-105
                      ${item.color}
                      shadow-sm hover:shadow-md
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      item.action();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    title={item.tooltip}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MiniMenu; 