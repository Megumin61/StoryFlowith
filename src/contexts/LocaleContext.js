import React, { createContext, useContext } from 'react';
import zh from '../locales/zh';

// 创建本地化上下文
const LocaleContext = createContext();

// 本地化提供器组件
export function LocaleProvider({ children }) {
  // 目前只支持中文
  const locale = zh;

  return (
    <LocaleContext.Provider value={locale}>
      {children}
    </LocaleContext.Provider>
  );
}

// 自定义钩子，用于在组件中访问本地化文本
export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
} 