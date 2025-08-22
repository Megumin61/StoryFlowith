// 全局统一的气泡样式配置系统
export const BUBBLE_STYLES = {
  // 基础样式
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    maxWidth: '100%',
    wordBreak: 'break-word'
  },

  // 颜色配置 - 对应六个维度
  colors: {
    // 元素/场景 - 蓝色系
    blue: {
      backgroundColor: '#eff6ff',
      color: '#2563eb',
      border: '1px solid #bfdbfe',
      hover: {
        backgroundColor: '#dbeafe',
        border: '1px solid #93c5fd'
      }
    },
    // 用户特征 - 绿色系
    green: {
      backgroundColor: '#f0fdf4',
      color: '#16a34a',
      border: '1px solid #bbf7d0',
      hover: {
        backgroundColor: '#dcfce7',
        border: '1px solid #86efac'
      }
    },
    // 痛点 - 红色系
    red: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca',
      hover: {
        backgroundColor: '#fee2e2',
        border: '1px solid #fca5a5'
      }
    },
    // 目标 - 琥珀色系
    amber: {
      backgroundColor: '#fffbeb',
      color: '#d97706',
      border: '1px solid #fde68a',
      hover: {
        backgroundColor: '#fef3c7',
        border: '1px solid #fcd34d'
      }
    },
    // 情绪 - 靛蓝色系
    indigo: {
      backgroundColor: '#eef2ff',
      color: '#4f46e5',
      border: '1px solid #c7d2fe',
      hover: {
        backgroundColor: '#e0e7ff',
        border: '1px solid #a5b4fc'
      }
    },

    // 紫色 - 角色相关
    purple: {
      backgroundColor: '#faf5ff',
      color: '#7c3aed',
      border: '1px solid #ddd6fe',
      hover: {
        backgroundColor: '#f3e8ff',
        border: '1px solid #c4b5fd'
      }
    },

    // 默认灰色
    gray: {
      backgroundColor: '#f9fafb',
      color: '#374151',
      border: '1px solid #d1d5db',
      hover: {
        backgroundColor: '#f3f4f6',
        border: '1px solid #9ca3af'
      }
    }
  },

  // 类型到颜色的映射 - 统一五个维度
  typeToColor: {
    // 元素/场景 - 蓝色
    elements: 'blue',
    scenarios: 'blue',
    
    // 用户特征 - 石色
    user_traits: 'green',
    
    // 痛点 - 红色
    pain_points: 'red',
    
    // 目标 - 琥珀色
    goals: 'amber',
    
    // 情绪 - 靛蓝色
    emotions: 'indigo',
    

    
    // 兼容旧的映射
    immediateFeelings: 'red',
    actionTendencies: 'green',
    goalAdjustments: 'amber',
    contextualFactors: 'blue',
    
    // 默认
    keyword: 'blue',
    default: 'gray'
  }
};

// 获取气泡样式的函数
export const getBubbleStyle = (type, originalColor = null, variant = 'default') => {
  // 如果有原始颜色，优先使用原始颜色
  let colorKey = originalColor;
  
  // 如果没有原始颜色，根据类型映射
  if (!colorKey) {
    colorKey = BUBBLE_STYLES.typeToColor[type] || BUBBLE_STYLES.typeToColor.default;
  }
  
  // 获取颜色配置
  const colorConfig = BUBBLE_STYLES.colors[colorKey] || BUBBLE_STYLES.colors.gray;
  
  // 合并基础样式和颜色样式
  return {
    ...BUBBLE_STYLES.base,
    ...colorConfig,
    ...(variant === 'hover' ? colorConfig.hover : {})
  };
};

// 根据类型获取对应的颜色名称
export const getColorForType = (type) => {
  return BUBBLE_STYLES.typeToColor[type] || BUBBLE_STYLES.typeToColor.default;
};

// 获取Tailwind CSS类名（用于现有组件）
export const getTailwindClasses = (type, originalColor = null, variant = 'default') => {
  let colorKey = originalColor || getColorForType(type);
  
  const classMap = {
    blue: {
      default: 'bg-blue-50 text-blue-700 border-blue-200',
      hover: 'hover:bg-blue-100 hover:border-blue-300'
    },
      green: {
    default: 'bg-green-50 text-green-700 border-green-200',
    hover: 'hover:bg-green-100 hover:border-green-300'
  },
    red: {
      default: 'bg-red-50 text-red-700 border-red-200',
      hover: 'hover:bg-red-100 hover:border-red-300'
    },
    amber: {
      default: 'bg-amber-50 text-amber-700 border-amber-200',
      hover: 'hover:bg-amber-100 hover:border-amber-300'
    },
    indigo: {
      default: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      hover: 'hover:bg-indigo-100 hover:border-indigo-300'
    },

    purple: {
      default: 'bg-purple-50 text-purple-700 border-purple-200',
      hover: 'hover:bg-purple-100 hover:border-purple-300'
    },

    gray: {
      default: 'bg-gray-50 text-gray-700 border-gray-200',
      hover: 'hover:bg-gray-100 hover:border-gray-300'
    }
  };
  
  const colorClasses = classMap[colorKey] || classMap.gray;
  return variant === 'hover' ? colorClasses.hover : colorClasses.default;
}; 