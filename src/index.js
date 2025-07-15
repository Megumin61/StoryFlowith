import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// 全局解决ResizeObserver循环错误问题
const originalError = window.console.error;
window.console.error = (...args) => {
  if (
    args.length > 0 && 
    typeof args[0] === 'string' && 
    args[0].includes('ResizeObserver loop')
  ) {
    // 忽略ResizeObserver循环错误
    return;
  }
  originalError.apply(console, args);
};

// 防止ResizeObserver循环错误抛出
window.addEventListener('error', (event) => {
  if (event && event.message && event.message.includes('ResizeObserver loop')) {
    event.stopImmediatePropagation();
    event.preventDefault();
    return false;
  }
});

// 设置文档语言
document.documentElement.lang = 'zh-CN';
// document.characterSet是只读属性，无法直接修改
console.log('当前文档字符集:', document.characterSet);

// 字体引用
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
document.head.appendChild(link);

// 加载Tailwind CSS
const tailwindScript = document.createElement('script');
tailwindScript.src = 'https://cdn.tailwindcss.com?plugins=typography';
document.head.appendChild(tailwindScript);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
