import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from '../contexts/LocaleContext';
import { Plus, X, User, Trash2 } from 'lucide-react';

function RefinementPage({ initialStoryText, onComplete }) {
  const t = useLocale();
  const [story, setStory] = useState('');
  const [personas, setPersonas] = useState([{ id: 1, name: '', description: '' }]);

  useEffect(() => {
    // 基于 initialStoryText 简单的生成一个初始故事框架
    if (initialStoryText) {
        const generatedStory = `${t.refinement.generated.title}
"${initialStoryText}"

${t.refinement.generated.section1}
[${t.refinement.generated.placeholder1}]

${t.refinement.generated.section2}
[${t.refinement.generated.placeholder2}]

${t.refinement.generated.section3}
[${t.refinement.generated.placeholder3}]
`;
        setStory(generatedStory);
    }
  }, [initialStoryText, t]);

  const handlePersonaChange = (index, field, value) => {
    const newPersonas = [...personas];
    newPersonas[index][field] = value;
    setPersonas(newPersonas);
  };

  const addPersona = () => {
    setPersonas([...personas, { id: Date.now(), name: '', description: '' }]);
  };

  const removePersona = (index) => {
    const newPersonas = personas.filter((_, i) => i !== index);
    setPersonas(newPersonas);
  };

  const handleComplete = () => {
    // 过滤掉空的画像
    const finalPersonas = personas.filter(p => p.name.trim() !== '' && p.description.trim() !== '');
    // 这里未来可以对 story 文本进行解析，暂时直接传递
    onComplete(story, finalPersonas);
  };

  return (
    <motion.div
      className="absolute inset-0 bg-gray-50 z-40 p-4 sm:p-6 lg:p-8 overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">{t.refinement.title}</h1>
          <p className="text-lg text-gray-600 mb-8">{t.refinement.description}</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Story Script Section */}
            <div className="bg-gray-50 rounded-xl p-6 border">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="mr-3 text-blue-500" />
                {t.refinement.storyTitle}
              </h2>
              <textarea
                className="w-full h-96 p-4 bg-white border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-base font-mono"
                value={story}
                onChange={(e) => setStory(e.target.value)}
              />
            </div>

            {/* User Personas Section */}
            <div className="bg-gray-50 rounded-xl p-6 border">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="mr-3 text-green-500" />
                {t.refinement.personaTitle}
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {personas.map((persona, index) => (
                  <div key={persona.id} className="bg-white p-4 rounded-lg border border-gray-200 relative">
                    <button 
                      onClick={() => removePersona(index)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      aria-label={t.refinement.removePersona}
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.refinement.personaName}</label>
                      <input
                        type="text"
                        placeholder={t.refinement.personaNamePlaceholder}
                        className="w-full p-2 border-gray-300 rounded-md"
                        value={persona.name}
                        onChange={(e) => handlePersonaChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.refinement.personaDescription}</label>
                      <textarea
                        placeholder={t.refinement.personaDescriptionPlaceholder}
                        className="w-full p-2 border-gray-300 rounded-md"
                        rows="3"
                        value={persona.description}
                        onChange={(e) => handlePersonaChange(index, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addPersona}
                className="mt-4 w-full flex items-center justify-center space-x-2 text-sm font-medium text-blue-600 bg-blue-100/50 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus size={16} />
                <span>{t.refinement.addPersona}</span>
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={handleComplete}
              className="bg-blue-600 text-white font-semibold py-3 px-12 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
            >
              {t.refinement.button}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default RefinementPage; 