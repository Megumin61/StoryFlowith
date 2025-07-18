import React, { useState, useRef } from 'react';
import FalAI from '../services/falai';
import testImage from '../images/test.png';

const FalaiTest = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('style1');
  const fileInputRef = useRef(null);
  const resultImageRef = useRef(null);

  const addLog = (message) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleStyleChange = (e) => {
    setSelectedStyle(e.target.value);
  };

  const handleFileUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      addLog(`开始上传文件: ${file.name} (${Math.round(file.size / 1024)} KB)`);
      setIsLoading(true);
      setError(null);

      // 使用 FalAI 的 uploadImageToFal 方法上传文件
      const uploadedImageUrl = await FalAI.uploadImageToFal(file);
      addLog(`文件上传成功: ${uploadedImageUrl}`);
      setUploadedUrl(uploadedImageUrl);
      setIsLoading(false);
    } catch (err) {
      setError(`文件上传失败: ${err.message}`);
      addLog(`文件上传失败: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleTestOfficialExample = async () => {
    try {
      addLog('开始测试官方示例');
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      const startTime = new Date();
      addLog(`开始时间: ${startTime.toLocaleTimeString()}`);

      // 调用 FalAI 的官方示例
      const response = await FalAI.testOfficialExample();
      
      const endTime = new Date();
      const timeTaken = (endTime - startTime) / 1000;
      addLog(`官方示例测试成功! 耗时: ${timeTaken}秒`);
      
      // 检查响应格式
      if (!response || !response.data || !response.data.images || !response.data.images[0] || !response.data.images[0].url) {
        console.error('API返回格式不正确:', response);
        addLog('API返回格式不正确，无法获取图像URL');
        throw new Error('API返回结果中没有图像URL');
      }
      
      setResult(response.data.images[0].url);
      setIsLoading(false);
    } catch (err) {
      setError(`测试官方示例失败: ${err.message}`);
      addLog(`测试官方示例失败: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleGenerateFromText = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    try {
      addLog(`开始文生图生成: ${prompt}`);
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      const startTime = new Date();
      addLog(`开始时间: ${startTime.toLocaleTimeString()}`);

      // 调用 FalAI 的文生图 API
      const response = await FalAI.generateTextToImage(prompt);
      
      const endTime = new Date();
      const timeTaken = (endTime - startTime) / 1000;
      addLog(`文生图生成成功! 耗时: ${timeTaken}秒`);
      
      // 获取生成的图像URL
      if (!response || !response.data || !response.data.images || !response.data.images[0]) {
        console.error('API返回格式不正确:', response);
        addLog('API返回格式不正确，无法获取图像URL');
        throw new Error('API返回结果中没有图像URL');
      }
      
      const imageUrl = response.data.images[0];
      addLog(`生成的图像URL: ${imageUrl}`);
      
      setResult(imageUrl);
      setIsLoading(false);
    } catch (err) {
      setError(`文生图生成失败: ${err.message}`);
      addLog(`文生图生成失败: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleGenerateFromImage = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    if (!uploadedUrl) {
      setError('请先上传参考图像');
      return;
    }

    try {
      addLog(`开始图生图生成, 提示词: ${prompt}, 参考图: ${uploadedUrl}`);
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      const startTime = new Date();
      addLog(`开始时间: ${startTime.toLocaleTimeString()}`);

      // 调用 FalAI 的图生图 API
      const response = await FalAI.generateImageToImage(prompt, [uploadedUrl], false, selectedStyle);
      
      const endTime = new Date();
      const timeTaken = (endTime - startTime) / 1000;
      addLog(`图生图生成成功! 耗时: ${timeTaken}秒`);
      
      // 获取生成的图像URL
      if (!response || !response.data || !response.data.images || !response.data.images[0]) {
        console.error('API返回格式不正确:', response);
        addLog('API返回格式不正确，无法获取图像URL');
        throw new Error('API返回结果中没有图像URL');
      }
      
      const imageUrl = response.data.images[0];
      addLog(`生成的图像URL: ${imageUrl}`);
      
      setResult(imageUrl);
      setIsLoading(false);
    } catch (err) {
      setError(`图生图生成失败: ${err.message}`);
      addLog(`图生图生成失败: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleGenerateFromStyle = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    try {
      addLog(`开始使用风格参考图生成, 提示词: ${prompt}, 风格: ${selectedStyle}`);
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      const startTime = new Date();
      addLog(`开始时间: ${startTime.toLocaleTimeString()}`);

      // 获取风格图像URL
      const styleUrl = FalAI.STYLE_URLS[selectedStyle] || FalAI.STYLE_URLS.style1;
      if (!styleUrl) {
        throw new Error(`找不到风格 ${selectedStyle} 的参考图像URL`);
      }
      
      addLog(`使用风格图像URL: ${styleUrl}`);

      // 调用 FalAI 的图生图 API，直接使用风格URL
      const apiResponse = await FalAI.generateImageToImage(prompt, [styleUrl], false, selectedStyle);
      
      const endTime = new Date();
      const timeTaken = (endTime - startTime) / 1000;
      addLog(`风格图生成成功! 耗时: ${timeTaken}秒`);
      
      // 获取生成的图像URL
      if (!apiResponse || !apiResponse.data || !apiResponse.data.images || !apiResponse.data.images[0]) {
        console.error('API返回格式不正确:', apiResponse);
        addLog('API返回格式不正确，无法获取图像URL');
        throw new Error('API返回结果中没有图像URL');
      }
      
      const imageUrl = apiResponse.data.images[0];
      addLog(`生成的图像URL: ${imageUrl}`);
      
      setResult(imageUrl);
      setIsLoading(false);
    } catch (err) {
      setError(`风格图生成失败: ${err.message}`);
      addLog(`风格图生成失败: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    addLog('图像加载失败，使用备用图像');
    setError('图像加载失败，已使用备用图像');
    
    // 使用本地测试图像作为备选
    if (resultImageRef.current) {
      resultImageRef.current.src = testImage;
      addLog('已使用本地测试图像作为备选');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">FalAI API 测试</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">提示词</h2>
        <textarea
          className="w-full p-2 border border-gray-300 rounded mb-2"
          rows="3"
          placeholder="输入提示词..."
          value={prompt}
          onChange={handlePromptChange}
        />
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">参考图像上传</h2>
        <div className="flex items-center gap-4 mb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={isLoading}
          >
            选择图像
          </button>
          {uploadedUrl && (
            <span className="text-green-600">
              图像已上传! URL: {uploadedUrl.substring(0, 30)}...
            </span>
          )}
        </div>
        {uploadedUrl && (
          <div className="mb-4">
            <img
              src={uploadedUrl}
              alt="上传的图像"
              className="max-h-40 rounded border border-gray-300"
              onError={(e) => {
                addLog('上传图像加载失败');
                e.target.onerror = null; // 防止无限循环
                e.target.src = testImage;
              }}
            />
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">风格选择</h2>
        <div className="flex items-center gap-4">
          <select
            value={selectedStyle}
            onChange={handleStyleChange}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="style1">动漫风格</option>
            <option value="style2">写实风格</option>
            <option value="style3">水彩风格</option>
            <option value="style4">插画风格</option>
          </select>
          <div className="w-12 h-12 border border-gray-300 rounded overflow-hidden">
            <img 
              src={testImage} 
              alt={`风格 ${selectedStyle}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                addLog(`风格图像加载失败: ${selectedStyle}`);
                e.target.onerror = null; // 防止无限循环
                e.target.src = testImage;
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={handleTestOfficialExample}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          disabled={isLoading}
        >
          测试官方示例
        </button>
        <button
          onClick={handleGenerateFromText}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={isLoading}
        >
          文生图生成
        </button>
        <button
          onClick={handleGenerateFromImage}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={isLoading || !uploadedUrl}
        >
          使用上传图像生成
        </button>
        <button
          onClick={handleGenerateFromStyle}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          disabled={isLoading}
        >
          使用风格图生成
        </button>
      </div>
      
      {isLoading && (
        <div className="mb-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          <span>处理中...</span>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-600 rounded">
          <strong>错误:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">结果图像</h2>
          <div className="border border-gray-300 rounded p-2 bg-gray-50">
            <img
              ref={resultImageRef}
              src={result}
              alt="生成的图像"
              className="max-w-full rounded"
              onError={handleImageError}
            />
            <div className="mt-2 text-sm text-gray-600">
              <p>图像 URL: {result}</p>
              <button 
                onClick={() => window.open(result, '_blank')}
                className="mt-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              >
                在新窗口打开
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">日志</h2>
          <button
            onClick={clearLogs}
            className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            清除日志
          </button>
        </div>
        <div className="p-3 bg-gray-100 border border-gray-300 rounded max-h-60 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">暂无日志</p>
          ) : (
            logs.map((log, index) => <div key={index} className="text-sm mb-1">{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
};

export default FalaiTest; 