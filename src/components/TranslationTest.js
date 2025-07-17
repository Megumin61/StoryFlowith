import React, { useState } from 'react';
import { testTranslation, smartTranslate } from '../services/translateService';

const TranslationTest = () => {
  const [inputText, setInputText] = useState('不要参考图中的人物只参考图像的风格，为我生成故事板分镜画面：一个女孩在公园里看书');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('请输入要翻译的文本');
      return;
    }

    setLoading(true);
    setError(null);
    addLog(`开始翻译: "${inputText}"`);

    try {
      // 使用我们的翻译服务
      const result = await smartTranslate(inputText);
      setTranslatedText(result);
      addLog(`翻译成功: "${result}"`);
    } catch (error) {
      console.error('翻译测试失败:', error);
      setError(`翻译失败: ${error.message}`);
      addLog(`翻译错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">翻译测试工具</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">输入中文文本:</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full p-2 border rounded-md"
          rows={4}
        />
      </div>
      
      <button
        onClick={handleTranslate}
        disabled={loading}
        className={`px-4 py-2 rounded-md ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
      >
        {loading ? '翻译中...' : '翻译'}
      </button>
      
      {error && (
        <div className="mt-4 p-2 bg-red-100 border border-red-300 rounded-md text-red-700">
          {error}
        </div>
      )}
      
      {translatedText && (
        <div className="mt-4">
          <h2 className="text-lg font-medium mb-2">翻译结果:</h2>
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            {translatedText}
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-lg font-medium mb-2">日志:</h2>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md max-h-60 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">暂无日志</p>
          ) : (
            <ul className="space-y-1">
              {logs.map((log, index) => (
                <li key={index} className="text-xs font-mono">{log}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslationTest; 