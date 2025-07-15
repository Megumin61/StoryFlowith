import React, { useEffect, useState } from 'react';
import { X, FileText, User, Target, MapPin, Heart, Bookmark, Zap } from 'lucide-react';
import { StoryScriptGenerator } from '../utils/StoryScriptGenerator';
import { motion } from 'framer-motion';
import { useLocale } from '../contexts/LocaleContext';

function StoryScript({ storyData, show, onClose }) {
  const t = useLocale();
  const [scriptContent, setScriptContent] = useState('');
  const scriptGenerator = new StoryScriptGenerator(t);
  
  useEffect(() => {
    if (show) {
      const content = scriptGenerator.generateScript(storyData);
      setScriptContent(content);
    }
  }, [storyData, show]);
  
  if (!show) return null;
  
  return (
    <motion.div 
      className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{t.storyScript.title}</h2>
          <button 
            className="p-2 rounded-full hover:bg-gray-200 text-gray-500"
            onClick={onClose}
            aria-label={t.storyScript.closeAriaLabel}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-6">
          <div 
            id="story-script-content"
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: scriptContent }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// 添加脚本生成的函数
export function generateScript(storyData) {
  const storyScriptGenerator = new StoryScriptGenerator();
  return storyScriptGenerator.generateScript(storyData);
}

export default StoryScript; 