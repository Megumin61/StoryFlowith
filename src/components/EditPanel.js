import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Edit, Save } from 'lucide-react';

function EditPanel({ node, onUpdateNode, onClose }) {
  const [text, setText] = useState(node?.data?.text || '');
  const [prompt, setPrompt] = useState(node?.data?.imagePrompt || '');

  useEffect(() => {
    setText(node?.data?.text || '');
    setPrompt(node?.data?.imagePrompt || node?.data?.text || '');
  }, [node]);

  if (!node) return null;

  const handleTextUpdate = () => {
    onUpdateNode(node.id, { text });
  };
  
  const handlePromptUpdate = () => {
    onUpdateNode(node.id, { imagePrompt: prompt });
    // Maybe trigger regeneration here as well
  };

  return (
    <AnimatePresence>
      <motion.div
        className="absolute top-0 right-0 h-full w-96 bg-white shadow-lg border-l border-gray-200 z-10 flex flex-col"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">编辑: {node.data.label}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow p-4 overflow-y-auto">
          {/* Text Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">文字描述</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleTextUpdate}
              className="w-full p-2 border border-gray-300 rounded-md min-h-[120px]"
              placeholder="输入分镜描述..."
            />
          </div>

          {/* Image Prompt Editor */}
          {node.data.image && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">图像提示词</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onBlur={handlePromptUpdate}
                className="w-full p-2 border border-gray-300 rounded-md min-h-[80px]"
                placeholder="输入用于生成图像的提示词..."
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default EditPanel; 