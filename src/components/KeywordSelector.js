import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag } from 'lucide-react';

function KeywordSelector({ 
  selectedText, 
  position, 
  onSelectType, 
  onCancel, 
  keywordTypes 
}) {
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.keyword-selector')) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    onSelectType(selectedText, typeId);
  };

  if (!position) return null;

  // 计算位置，避免超出屏幕
  const calculatePosition = () => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const panelHeight = 300; // 预估面板高度
    const panelWidth = 220; // 预估面板宽度
    
    let top = position.y + 20;
    let left = position.x;
    
    // 如果底部超出屏幕，显示在文本上方
    if (top + panelHeight > viewportHeight - 20) {
      top = position.y - panelHeight - 20;
    }
    
    // 如果右侧超出屏幕，向左调整
    if (left + panelWidth > viewportWidth - 20) {
      left = viewportWidth - panelWidth - 20;
    }
    
    // 确保不超出左边界
    if (left < 20) {
      left = 20;
    }
    
    return { top, left };
  };

  const adjustedPosition = calculatePosition();

  // 获取选项的样式配置
  const getOptionStyle = (type, isSelected) => {
    const baseStyle = "w-full text-left p-3 rounded-lg text-sm font-medium transition-all duration-200 transform";
    
    if (isSelected) {
      // 选中状态：使用对应颜色的深色版本
      switch (type.id) {
        case 'elements':
          return `${baseStyle} bg-blue-100 text-blue-800 border-2 border-blue-300 shadow-md scale-105`;
        case 'user_traits':
          return `${baseStyle} bg-green-100 text-green-800 border-2 border-green-300 shadow-md scale-105`;
        case 'pain_points':
          return `${baseStyle} bg-red-100 text-red-800 border-2 border-red-300 shadow-md scale-105`;
        case 'goals':
          return `${baseStyle} bg-amber-100 text-amber-800 border-2 border-amber-300 shadow-md scale-105`;
        case 'emotions':
          return `${baseStyle} bg-indigo-100 text-indigo-800 border-2 border-indigo-300 shadow-md scale-105`;
        default:
          return `${baseStyle} bg-gray-100 text-gray-800 border-2 border-gray-300 shadow-md scale-105`;
      }
    } else {
      // 默认状态：使用对应颜色的浅色版本
      switch (type.id) {
        case 'elements':
          return `${baseStyle} bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm hover:scale-102`;
        case 'user_traits':
          return `${baseStyle} bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 hover:shadow-sm hover:scale-102`;
        case 'pain_points':
          return `${baseStyle} bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 hover:shadow-sm hover:scale-102`;
        case 'goals':
          return `${baseStyle} bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 hover:shadow-sm hover:scale-102`;
        case 'emotions':
          return `${baseStyle} bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-sm hover:scale-102`;
        default:
          return `${baseStyle} bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm hover:scale-102`;
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="keyword-selector fixed z-50"
        style={{
          left: adjustedPosition.left,
          top: adjustedPosition.top,
        }}
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[180px] max-w-[220px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-800 flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              选择关键词类型
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {keywordTypes.map((type) => (
              <motion.button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className={getOptionStyle(type, selectedType === type.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {type.name}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default KeywordSelector; 