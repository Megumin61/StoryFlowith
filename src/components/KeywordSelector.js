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

  return (
    <AnimatePresence>
      <motion.div
        className="keyword-selector fixed z-50"
        style={{
          left: position.x,
          top: position.y + 20,
        }}
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[200px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-800 flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              选择关键词类型
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-2">已选择文本：</p>
            <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded border">
              "{selectedText}"
            </p>
          </div>
          
          <div className="space-y-2">
            {keywordTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                  selectedType === type.id
                    ? `${type.color} border-2 border-current`
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default KeywordSelector; 