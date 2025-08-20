#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动 Coze API 后端服务...');

// 启动后端服务
const cozeAPI = spawn('node', [path.join(__dirname, 'src', 'services', 'cozeAPI.js')], {
  stdio: 'inherit',
  shell: true
});

cozeAPI.on('error', (error) => {
  console.error('❌ 启动 Coze API 服务失败:', error);
});

cozeAPI.on('close', (code) => {
  console.log(`🔚 Coze API 服务已退出，退出码: ${code}`);
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务...');
  cozeAPI.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭服务...');
  cozeAPI.kill('SIGTERM');
  process.exit(0);
}); 