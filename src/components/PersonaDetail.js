import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Edit3, Save, Plus, Trash2, User, Target, Heart, AlertTriangle, MapPin, MessageCircle, Brain, Settings } from 'lucide-react';

function PersonaDetail({ persona, onClose, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPersona, setEditedPersona] = useState(persona);

  // 维度配置
  const dimensions = [
    {
      key: 'basic_profile',
      title: '基本信息',
      icon: User,
      color: 'blue',
      fields: [
        { key: 'name', label: '姓名', type: 'text' },
        { key: 'age', label: '年龄', type: 'text' },
        { key: 'gender', label: '性别', type: 'text' },
        { key: 'occupation', label: '职业', type: 'text' },
        { key: 'education', label: '教育背景', type: 'text' },
        { key: 'city', label: '所在城市', type: 'text' },
        { key: 'technology_literacy', label: '技术熟练度', type: 'text' },
        { key: 'devices', label: '使用设备', type: 'array' }
      ]
    },
    {
      key: 'domain_pain_points',
      title: '痛点问题',
      icon: AlertTriangle,
      color: 'red',
      type: 'list'
    },
    {
      key: 'domain_goals_and_motivations',
      title: '目标动机',
      icon: Target,
      color: 'green',
      type: 'list'
    },
    {
      key: 'usage_context',
      title: '使用场景',
      icon: MapPin,
      color: 'purple',
      type: 'list'
    },
    {
      key: 'tool_expectations',
      title: '工具期望',
      icon: Settings,
      color: 'yellow',
      type: 'list'
    },
    {
      key: 'general_behavior',
      title: '行为特征',
      icon: Brain,
      color: 'indigo',
      type: 'list'
    },
    {
      key: 'psychological_profile',
      title: '心理特征',
      icon: Heart,
      color: 'pink',
      type: 'list'
    },
    {
      key: 'communication_style',
      title: '沟通风格',
      icon: MessageCircle,
      color: 'teal',
      type: 'list'
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      pink: 'bg-pink-50 border-pink-200 text-pink-800',
      teal: 'bg-teal-50 border-teal-200 text-teal-800'
    };
    return colorMap[color] || colorMap.blue;
  };

  const handleSave = () => {
    onSave(editedPersona);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPersona(persona);
    setIsEditing(false);
  };

  const addListItem = (key) => {
    setEditedPersona(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), '']
    }));
  };

  const updateListItem = (key, index, value) => {
    setEditedPersona(prev => ({
      ...prev,
      [key]: prev[key].map((item, i) => i === index ? value : item)
    }));
  };

  const removeListItem = (key, index) => {
    setEditedPersona(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  const updateField = (key, value) => {
    setEditedPersona(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderField = (dimension, field) => {
    const value = editedPersona[dimension.key]?.[field.key];
    
    if (field.type === 'array') {
      return (
        <div className="space-y-2">
          {value?.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateListItem(dimension.key, index, e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                disabled={!isEditing}
              />
              {isEditing && (
                <button
                  onClick={() => removeListItem(dimension.key, index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          {isEditing && (
            <button
              onClick={() => addListItem(dimension.key)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
            >
              <Plus size={14} />
              <span>添加设备</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => updateField(field.key, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md text-sm"
        disabled={!isEditing}
      />
    );
  };

  const renderList = (dimension) => {
    const items = editedPersona[dimension.key] || [];
    
    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start space-x-2">
            <span className={`mt-2 w-2 h-2 rounded-full bg-${dimension.color}-500 flex-shrink-0`}></span>
            {isEditing ? (
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateListItem(dimension.key, index, e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={() => removeListItem(dimension.key, index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-700">{item}</span>
            )}
          </div>
        ))}
        {isEditing && (
          <button
            onClick={() => addListItem(dimension.key)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
          >
            <Plus size={14} />
            <span>添加</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{editedPersona.persona_name}</h2>
            <p className="text-gray-600 mt-1">{editedPersona.persona_summary}</p>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Save size={16} />
                  <span>保存</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400"
                >
                  取消
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg border border-blue-200 hover:border-blue-300"
              >
                <Edit3 size={16} />
                <span>编辑</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dimensions.map((dimension) => (
              <div
                key={dimension.key}
                className={`p-4 rounded-xl border ${getColorClasses(dimension.color)}`}
              >
                <div className="flex items-center space-x-2 mb-4">
                  <dimension.icon className={`w-5 h-5 text-${dimension.color}-600`} />
                  <h3 className="font-semibold">{dimension.title}</h3>
                </div>
                
                {dimension.type === 'list' ? (
                  renderList(dimension)
                ) : (
                  <div className="space-y-3">
                    {dimension.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium mb-1">
                          {field.label}
                        </label>
                        {renderField(dimension, field)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PersonaDetail; 