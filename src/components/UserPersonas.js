import React, { useEffect, useState } from 'react';
import { X, UserPlus, Sparkles, User, Users, UserCircle } from 'lucide-react';
import { UserPersonaManager } from '../utils/UserPersonaManager';
import { motion } from 'framer-motion';

function UserPersonas({ show, onClose }) {
  const [userPersonaManager] = useState(() => new UserPersonaManager());
  const [selectedPersona, setSelectedPersona] = useState(null);
  
  useEffect(() => {
    if (show) {
      // ��ʼ��UI
      setTimeout(() => {
        userPersonaManager.initializeUI();
      }, 0);
    }
  }, [show, userPersonaManager]);
  
  const handleAddPersona = () => {
    const newPersona = {
      id: Date.now(),
      name: '',
      age: '',
      occupation: '',
      goals: '',
      scenarios: '',
      frustrations: '',
      techLevel: 'intermediate'
    };
    
    setSelectedPersona(newPersona);
    userPersonaManager.personas.push(newPersona);
    userPersonaManager.selectedPersonaId = newPersona.id;
  };
  
  const handleAiGenerate = () => {
    const researchData = document.getElementById('research-data-input')?.value;
    
    if (!researchData?.trim()) {
      alert('���������û���������');
      return;
    }
    
    // �򻯴�����ʵ����Ŀ��Ӧ����API
    const newPersona = {
      id: Date.now(),
      name: '���ɵ��û�',
      age: '25-35��',
      occupation: '���ڵ������ݵ�ְҵ',
      goals: '���ݵ������ݷ����ó���Ŀ��',
      scenarios: '���ڵ������ݵ�ʹ�ó���',
      frustrations: '�����з��ֵ���Ҫʹ��',
      techLevel: 'intermediate'
    };
    
    setSelectedPersona(newPersona);
    userPersonaManager.personas.push(newPersona);
    userPersonaManager.selectedPersonaId = newPersona.id;
  };
  
  const handleSavePersona = () => {
    if (!selectedPersona) return;
    
    const updatedPersona = {
      ...selectedPersona,
      name: document.getElementById('persona-name')?.value || '',
      age: document.getElementById('persona-age')?.value || '',
      occupation: document.getElementById('persona-occupation')?.value || '',
      goals: document.getElementById('persona-goals')?.value || '',
      scenarios: document.getElementById('persona-scenarios')?.value || '',
      frustrations: document.getElementById('persona-frustrations')?.value || '',
      techLevel: document.getElementById('persona-tech-level')?.value || 'intermediate',
    };
    
    const index = userPersonaManager.personas.findIndex(p => p.id === selectedPersona.id);
    if (index !== -1) {
      userPersonaManager.personas[index] = updatedPersona;
      setSelectedPersona(updatedPersona);
      alert('�û���ɫ�ѱ���');
    }
  };
  
  const handleDeletePersona = () => {
    if (!selectedPersona) return;
    
    if (window.confirm('ȷ��Ҫɾ������û���ɫ��')) {
      userPersonaManager.personas = userPersonaManager.personas.filter(
        p => p.id !== selectedPersona.id
      );
      setSelectedPersona(null);
    }
  };
  
  const handleSelectPersona = (persona) => {
    setSelectedPersona(persona);
    userPersonaManager.selectedPersonaId = persona.id;
  };

  if (!show) return null;
  
  return (
    <motion.div 
      className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">�û���ɫ����</h2>
          <button 
            className="p-2 rounded-full hover:bg-gray-200 text-gray-500"
            onClick={onClose}
            aria-label="�ر��û���ɫ"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-grow overflow-hidden flex">
          <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">�����½�ɫ</h3>
              <button 
                className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all mb-4"
                onClick={handleAddPersona}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                <span>�ֶ�������ɫ</span>
              </button>
              <button 
                className="w-full flex items-center justify-center bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-green-700 transition-all"
                onClick={handleAiGenerate}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                <span>AI ���ɽ�ɫ</span>
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">�����û���������</h4>
              <textarea 
                id="research-data-input" 
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm" 
                placeholder="ճ���û���̸��¼���ʾ������������������..."
              ></textarea>
            </div>
            
            <div id="personas-list">
              <h4 className="text-sm font-medium text-gray-700 mb-3">�Ѵ����Ľ�ɫ</h4>
              <div id="personas-list-content" className="space-y-2">
                {userPersonaManager.personas.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">�����û���ɫ</p>
                  </div>
                ) : (
                  userPersonaManager.personas.map(persona => (
                    <div 
                      key={persona.id}
                      className={`persona-item p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedPersona && persona.id === selectedPersona.id ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                      onClick={() => handleSelectPersona(persona)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium text-gray-900">{persona.name || 'δ�����û�'}</h4>
                          <p className="text-sm text-gray-500">{persona.occupation || 'ְҵδ����'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-grow p-6 overflow-y-auto">
            {!selectedPersona ? (
              <div id="persona-editor-placeholder" className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <UserCircle className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">ѡ��򴴽��û���ɫ</h3>
                <p className="text-sm">����ഴ���µ��û���ɫ����ѡ�����н�ɫ���б༭</p>
              </div>
            ) : (
              <div id="persona-editor" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">����</label>
                    <input 
                      id="persona-name" 
                      type="text" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      defaultValue={selectedPersona.name}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">����</label>
                    <input 
                      id="persona-age" 
                      type="text" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      defaultValue={selectedPersona.age}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ְҵ����</label>
                  <input 
                    id="persona-occupation" 
                    type="text" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={selectedPersona.occupation}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">��ΪĿ��</label>
                  <textarea 
                    id="persona-goals" 
                    rows="3" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={selectedPersona.goals}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ʹ�ó���</label>
                  <textarea 
                    id="persona-scenarios" 
                    rows="3" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={selectedPersona.scenarios}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ʹ�������</label>
                  <textarea 
                    id="persona-frustrations" 
                    rows="3" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={selectedPersona.frustrations}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">����������</label>
                  <select 
                    id="persona-tech-level" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={selectedPersona.techLevel}
                  >
                    <option value="beginner">�����û�</option>
                    <option value="intermediate">�м��û�</option>
                    <option value="advanced">�߼��û�</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button 
                    className="flex-1 bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all"
                    onClick={handleSavePersona}
                  >
                    �����ɫ
                  </button>
                  <button 
                    className="bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-red-700 transition-all"
                    onClick={handleDeletePersona}
                  >
                    ɾ��
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default UserPersonas; 