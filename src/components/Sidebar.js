import React, { useState, useEffect } from 'react';
import { X, GitFork, CheckCircle, MousePointerClick, Frown, Meh, Smile, Lightbulb, Edit3, CornerDownRight, RotateCw, FilePenLine, ChevronDown } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';

function Sidebar({ 
  storyData, 
  selectedFrameId, 
  onClose, 
  onUpdate,
  onAddBranch,
  selectedStyle, 
  onStyleChange,
  onRegenerateStyle,
  userPersonas = []
}) {
  const t = useLocale();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agentId, setAgentId] = useState('');
  const [emotion, setEmotion] = useState('neutral');
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const [whatIfPrompt, setWhatIfPrompt] = useState('');
  const [branchCount, setBranchCount] = useState(3);
  const [framesPerBranch, setFramesPerBranch] = useState(3);
  const [useAgentSimulation, setUseAgentSimulation] = useState(true);

  useEffect(() => {
    if (selectedFrameId) {
      const frameData = storyData.find(f => f.id === selectedFrameId);
      if (frameData) {
        setTitle(frameData.title);
        setDescription(frameData.description);
        setEmotion(frameData.emotion || 'neutral');
        setAgentId(frameData.agentId || '');
      }
    }
  }, [selectedFrameId, storyData]);

  const handleUpdateFrame = () => {
    onUpdate(title, description, emotion, agentId);
  };

  const handleAddBranch = () => {
    onAddBranch(whatIfPrompt, {
      branchCount,
      framesPerBranch,
      useAgentSimulation
    });
  };

  const handleEmotionSelect = (newEmotion) => {
    setEmotion(newEmotion);
  };

  const toggleAdvancedParams = () => {
    setShowAdvancedParams(!showAdvancedParams);
  };

  const renderEmotionButtons = () => {
    const emotions = [
      { id: 'neutral', emoji: '?', label: t.emotions.neutral },
      { id: 'frustrated', emoji: '?', label: t.emotions.frustrated },
      { id: 'relieved', emoji: '?', label: t.emotions.relieved },
    ];

    return emotions.map(item => (
      <button 
        key={item.id}
        data-emotion={item.id}
        className={`emotion-tag-btn flex items-center space-x-2 px-3 py-1.5 text-sm rounded-full transition-colors ${
          emotion === item.id ? 'selected' : ''
        }`}
        onClick={() => handleEmotionSelect(item.id)}
      >
        <span>{item.emoji}</span>
        <span>{item.label}</span>
      </button>
    ));
  };

  return (
    <aside id="sidebar" className="w-96 bg-white border-l border-gray-200 h-full flex-shrink-0 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
      {!selectedFrameId ? (
        <div id="sidebar-placeholder">
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <MousePointerClick className="w-12 h-12 mb-4" />
            <h3 className="font-semibold text-lg text-gray-700">{t.sidebar.placeholderTitle}</h3>
            <p className="text-sm mt-1">{t.sidebar.placeholderDescription}</p>
          </div>
        </div>
      ) : (
        <div id="sidebar-editor">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold text-gray-900">{t.sidebar.title}</h3>
              <button 
                id="close-editor-btn" 
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                onClick={onClose}
                aria-label={t.sidebar.closeAriaLabel}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label htmlFor="editor-title-input" className="block text-sm font-medium text-gray-600 mb-1.5">{t.sidebar.frameTitle}</label>
                <input 
                  id="editor-title-input" 
                  type="text" 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition duration-150 ease-in-out text-base"
                  placeholder={t.sidebar.titlePlaceholder}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="editor-description" className="block text-sm font-medium text-gray-600 mb-1.5">{t.sidebar.frameDesc}</label>
                <textarea 
                  id="editor-description" 
                  rows="4" 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition duration-150 ease-in-out text-base"
                  placeholder={t.sidebar.descriptionPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">{t.sidebar.emotions}</label>
                <div id="emotion-selector" className="flex flex-wrap gap-2">
                  {renderEmotionButtons()}
                </div>
              </div>
              
              <div>
                <label htmlFor="editor-user-agent" className="block text-sm font-medium text-gray-600 mb-1.5">{t.sidebar.userRole}</label>
                <select 
                  id="editor-user-agent" 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition duration-150 ease-in-out text-base appearance-none"
                  style={{backgroundImage: `url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3e%3c/svg%3e')`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em'}}
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                >
                  <option value="">{t.sidebar.noAgent}</option>
                  {userPersonas.map(persona => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name || t.sidebar.unnamed} ({persona.occupation || t.sidebar.role})
                    </option>
                  ))}
                </select>
              </div>
              
              <button 
                id="edit-visuals-btn" 
                className="w-full flex items-center justify-center space-x-2 bg-white text-gray-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>{t.sidebar.editVisuals}</span>
              </button>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6 space-y-3">
              <button 
                id="update-frame-btn" 
                className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all"
                onClick={handleUpdateFrame}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>{t.sidebar.applyChanges}</span>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6"></div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">{t.sidebar.whatIf}</h3>
            <div className="space-y-5">
              <div>
                <label htmlFor="what-if-prompt" className="block text-sm font-medium text-gray-600 mb-1.5">{t.sidebar.prompt}</label>
                <input 
                  id="what-if-prompt" 
                  type="text" 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition duration-150 ease-in-out text-base"
                  placeholder={t.sidebar.whatIfPlaceholder}
                  value={whatIfPrompt}
                  onChange={(e) => setWhatIfPrompt(e.target.value)}
                />
              </div>
              
              <div>
                <button 
                  className="flex items-center justify-between w-full text-sm font-medium text-gray-600 hover:text-gray-900"
                  onClick={toggleAdvancedParams}
                >
                  <span>{t.sidebar.advancedSettings}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedParams ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`${showAdvancedParams ? '' : 'hidden'} mt-3 space-y-4 pt-4 pl-4 border-l-2 border-gray-200`} id="what-if-params">
                  <div className="flex justify-between items-center">
                    <label htmlFor="branch-count" className="text-sm text-gray-600">{t.sidebar.branchCount}</label>
                    <input 
                      id="branch-count" 
                      type="number" 
                      min="1" 
                      max="5" 
                      value={branchCount}
                      onChange={(e) => setBranchCount(Number(e.target.value))}
                      className="w-20 p-1.5 text-center border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <label htmlFor="frames-per-branch" className="text-sm text-gray-600">{t.sidebar.framesPerBranch}</label>
                    <input 
                      id="frames-per-branch" 
                      type="number" 
                      min="1" 
                      max="5" 
                      value={framesPerBranch}
                      onChange={(e) => setFramesPerBranch(Number(e.target.value))}
                      className="w-20 p-1.5 text-center border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3 pt-1">
                    <input 
                      id="use-agent-simulation" 
                      type="checkbox" 
                      checked={useAgentSimulation}
                      onChange={(e) => setUseAgentSimulation(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                    />
                    <label htmlFor="use-agent-simulation" className="text-sm text-gray-600">{t.sidebar.useAgent}</label>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 space-y-3">
                <button 
                  id="generate-branch-btn" 
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={handleAddBranch}
                >
                  <GitFork className="w-4 h-4" />
                  <span>{t.sidebar.generateBranch}</span>
                </button>
                
                <button 
                  id="regenerate-path-btn" 
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>重新生成当前路径</span>
                </button>
                
                <button 
                  id="edit-original-script-btn" 
                  className="w-full flex items-center justify-center space-x-2 bg-gray-800 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
                >
                  <FilePenLine className="w-4 h-4" />
                  <span>修改原始脚本</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar; 