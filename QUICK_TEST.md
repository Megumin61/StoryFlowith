# 快速测试说明

## 立即测试（推荐）

我已经修改了代码使用在线CORS代理服务，您现在可以：

1. **刷新浏览器页面** - 重新加载应用
2. **进入Coze测试页面** - 点击"Coze 测试"卡片
3. **发送测试消息** - 输入任何问题并发送

## 如果CORS代理不可用

如果 `cors-anywhere.herokuapp.com` 不可用，请：

1. 访问 https://cors-anywhere.herokuapp.com/corsdemo
2. 点击 "Request temporary access to the demo server"
3. 等待激活后返回测试

## 备用方案

如果在线代理不可用，请使用本地代理服务器：

### 快速启动本地代理

```bash
# 安装依赖
npm install express cors http-proxy-middleware

# 启动代理服务器
node proxy-server.js
```

然后修改 `src/components/CozeTest.js` 中的API_URL：

```javascript
const COZE_API_URL = 'http://localhost:3001/api/coze/chat';
```

## 测试步骤

1. **启动应用**: 确保前端应用正在运行
2. **进入测试**: 导航到Coze测试页面
3. **发送消息**: 输入简单问题如"你好"
4. **查看响应**: 等待AI回复
5. **检查状态**: 查看控制台和网络面板

## 预期结果

- ✅ 消息成功发送
- ✅ 收到AI回复
- ✅ 流式响应正常工作
- ✅ 无CORS错误

## 故障排除

### 仍然有CORS错误
- 确认使用了代理服务
- 检查网络面板中的请求URL
- 查看控制台错误信息

### API调用失败
- 验证API Token是否正确
- 确认Bot ID有效
- 检查网络连接

### 流式响应不工作
- 确认stream参数为true
- 检查响应头设置
- 查看代理服务器日志

## 成功标志

当您看到以下情况时，说明测试成功：

1. 消息成功发送到API
2. 收到Coze智能助手的回复
3. 回复内容逐步显示（流式效果）
4. 无错误信息
5. 对话历史正常保存

## 下一步

测试成功后，您可以：

1. 测试不同类型的消息
2. 调整设置参数
3. 测试错误处理
4. 验证多轮对话
5. 测试文件上传等功能 