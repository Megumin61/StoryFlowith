import React, { createContext, useContext } from 'react';
import zh from '../locales/zh';

// �������ػ�������
const LocaleContext = createContext();

// ���ػ��ṩ�����
export function LocaleProvider({ children }) {
  // Ŀǰֻ֧������
  const locale = zh;

  return (
    <LocaleContext.Provider value={locale}>
      {children}
    </LocaleContext.Provider>
  );
}

// �Զ��平�ӣ�����������з��ʱ��ػ��ı�
export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
} 