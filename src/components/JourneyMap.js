import React from 'react';
import { X, Frown, Meh, Smile, Lightbulb, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale } from '../contexts/LocaleContext';

function JourneyMap({ storyData, onClose }) {
  const t = useLocale();

  // 创建主路径
  const createPath = () => {
    let path = [];
    let currentFrame = storyData.length > 0 ? storyData.find(f => f.id === 1) : null;
    const visited = new Set();
    
    while (currentFrame && !visited.has(currentFrame.id)) {
      path.push(currentFrame);
      visited.add(currentFrame.id);
      if (currentFrame.connections && currentFrame.connections.length > 0) {
        const nextId = currentFrame.connections[0];
        currentFrame = storyData.find(f => f.id === nextId);
      } else {
        currentFrame = null;
      }
    }
    
    return path;
  };

  const emotionMap = {
    'frown': { icon: <Frown className="w-5 h-5" />, color: 'text-red-500', label: t.emotions.frustrated },
    'meh': { icon: <Meh className="w-5 h-5" />, color: 'text-yellow-600', label: t.emotions.neutral },
    'smile': { icon: <Smile className="w-5 h-5" />, color: 'text-green-500', label: t.emotions.relieved },
    'lightbulb': { icon: <Lightbulb className="w-5 h-5" />, color: 'text-blue-500', label: t.emotions.inspired },
    'frustrated': { icon: <Frown className="w-5 h-5" />, color: 'text-red-500', label: t.emotions.frustrated },
    'neutral': { icon: <Meh className="w-5 h-5" />, color: 'text-yellow-600', label: t.emotions.neutral },
    'relieved': { icon: <Smile className="w-5 h-5" />, color: 'text-green-500', label: t.emotions.relieved }
  };
  
  const opportunities = t.journeyMap.opportunityList;

  const path = createPath();

  return (
    <motion.div 
      className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col p-6 md:p-8">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{t.journeyMap.title}</h2>
          <button 
            id="close-journey-map-btn" 
            className="p-2 rounded-full hover:bg-gray-200 text-gray-500"
            onClick={onClose}
            aria-label={t.journeyMap.closeAriaLabel}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-grow overflow-x-auto overflow-y-hidden">
          <div className="inline-flex h-full space-x-6 pb-4">
            {path.map((frame, index) => {
              const emotion = emotionMap[frame.emotion] || { icon: <Meh className="w-5 h-5" />, color: 'text-gray-400', label: t.emotions.unknown };
              const title = frame.title.includes('. ') ? frame.title.split('. ')[1] : 
                            frame.title.includes('：') ? frame.title.split('：')[1] :
                            frame.title;
              
              return (
                <div key={frame.id} className="w-64 flex-shrink-0 h-full">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 h-full flex flex-col">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex-shrink-0">{index + 1}</span>
                      <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-4 flex-grow flex flex-col justify-between">
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">{t.journeyMap.actions}</p>
                        <p>{frame.description}</p>
                      </div>
                      
                      <div className="mt-4">
                        <p className="font-semibold text-gray-800 mb-1">{t.journeyMap.emotion}</p>
                        <div className={`flex items-center space-x-2 ${emotion.color}`}>
                          {emotion.icon}
                          <span>{emotion.label}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="font-semibold text-gray-800 mb-1">{t.journeyMap.opportunities}</p>
                        <div className="flex items-start space-x-2 text-green-600">
                          <KeyRound className="w-4 h-4 mt-1 flex-shrink-0" />
                          <p className="text-sm">{opportunities[index % opportunities.length]}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default JourneyMap; 