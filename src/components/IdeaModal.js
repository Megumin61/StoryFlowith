import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from '../contexts/LocaleContext';

function IdeaModal({ onGenerate, onTestStoryboard }) {
  const [isLoading, setIsLoading] = useState(false);
  const [idea, setIdea] = useState('');
  const locale = useLocale();

  const handleGenerate = () => {
    setIsLoading(true);
    onGenerate(idea);
  };

  const handleTestStoryboard = () => {
    setIsLoading(true);
    onTestStoryboard(idea);
  };

  return (
    <motion.div 
      className="absolute inset-0 bg-white flex items-center justify-center z-40 p-4"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl w-full text-center">
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">{locale.idea.title}</h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">{locale.idea.description}</p>
          <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
            <textarea 
              id="idea-input" 
              className="w-full h-32 p-4 bg-white border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-base" 
              placeholder={locale.idea.placeholder}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            ></textarea>
          </div>
          <div className="mt-8 flex items-center justify-center space-x-4">
          <button 
            id="generate-canvas-btn" 
              className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
            onClick={handleGenerate}
            disabled={isLoading}
          >
            <span className="btn-text" style={{ display: isLoading ? 'none' : 'inline' }}>{locale.idea.button}</span>
            <div className={`loader ${isLoading ? '' : 'hidden'}`}></div>
          </button>
            
            <button 
              id="test-storyboard-btn" 
              className="bg-green-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
              onClick={handleTestStoryboard}
              disabled={isLoading}
            >
              <span className="btn-text" style={{ display: isLoading ? 'none' : 'inline' }}>测试分镜</span>
              <div className={`loader ${isLoading ? '' : 'hidden'}`}></div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default IdeaModal; 