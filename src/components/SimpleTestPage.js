import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

const SimpleTestPage = ({ onClose, onNavigateTo }) => {
  // 只保留Coze测试选项
  const testOptions = [
    {
      id: 'coze',
      title: 'Coze 测试',
      description: '测试Coze智能助手的对话功能',
      icon: Settings,
      color: 'from-red-500 to-pink-600',
      hoverColor: 'hover:from-red-600 hover:to-pink-700'
    }
  ];

  const handleTestClick = (testId) => {
    if (testId === 'coze') {
      onNavigateTo('coze');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4"
    >
      <div className="max-w-4xl w-full">
        {/* 标题区域 */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            StoryFlow 测试中心
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            专注于Coze智能助手的测试和验证，体验先进的AI对话技术
          </p>
        </motion.div>

        {/* 测试选项网格 */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6 max-w-2xl mx-auto">
          {testOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <div
                onClick={() => handleTestClick(option.id)}
                className={`bg-gradient-to-r ${option.color} ${option.hoverColor} 
                  rounded-2xl p-8 cursor-pointer transform transition-all duration-300 
                  shadow-2xl hover:shadow-3xl border border-white/20`}
              >
                <div className="flex items-center space-x-6">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <option.icon className="w-12 h-12 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {option.title}
                    </h3>
                    <p className="text-blue-100 text-lg leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                  <div className="text-white/60 group-hover:text-white transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 底部说明 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-blue-200 text-lg">
            点击上方卡片开始测试Coze智能助手
          </p>
          <p className="text-blue-300 text-sm mt-2">
            使用真实的API密钥和Bot ID进行测试
          </p>
        </motion.div>

        {/* 关闭按钮 */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={onClose}
          className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm hover:bg-white/30 
            text-white rounded-full p-3 transition-all duration-300 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SimpleTestPage; 