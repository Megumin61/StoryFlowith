# StoryFlowith

基于React的故事分镜工具，支持与Liblib AI API集成的图像生成功能。

## 配置API密钥

在项目根目录创建一个 `.env` 文件，添加以下内容：

```
# Liblib AI API 配置
REACT_APP_LIBLIB_ACCESS_KEY=你的AccessKey
REACT_APP_LIBLIB_SECRET_KEY=你的SecretKey
```

请将 `你的AccessKey` 和 `你的SecretKey` 替换为从Liblib开放平台获取的实际密钥。

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start
```

## 图像生成功能说明

本项目使用Liblib的Kontext模型进行图像生成，支持以下功能：

1. 单个分镜的图像生成
2. 批量生成所有分镜图像
3. 更改全局风格并重新生成图像
4. 对单个分镜图像的重新生成

## API消耗说明

根据Liblib开放平台的计费规则，每次生成图像会消耗积分：
- Kontext Pro版本：29积分/张
- Kontext Max版本：58积分/张

请合理使用API以控制积分消耗。
