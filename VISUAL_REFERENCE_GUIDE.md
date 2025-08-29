# 视觉参考图片替换指南

## 概述
分镜节点中的视觉参考图片用于帮助用户选择不同的艺术风格来生成图像。本文档说明如何替换这些参考图片。

## 当前图片位置

### 1. 分镜节点中的视觉参考
位置：`src/components/StoryNode.js` 第2350-2380行
```javascript
{[
  { id: 'style1', image: FalAI.STYLE_URLS.style1 },
  { id: 'style2', image: FalAI.STYLE_URLS.style2 },
  { id: 'style3', image: FalAI.STYLE_URLS.style3 },
  { id: 'style4', image: FalAI.STYLE_URLS.style4 }
].map((style) => (
  // 渲染图片按钮
))}
```

### 2. 图片URL定义
位置：`src/services/falai.js` 第25-30行
```javascript
const STYLE_URLS = {
  style1: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style1.png", // 动漫风格
  style2: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style2.png", // 写实风格  
  style3: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style3.png", // 水彩风格
  style4: "https://storyboard-1304373505.cos.ap-guangzhou.myqcloud.com/style4.png"  // 插画风格
};
```

## 替换方法

### 方法一：使用云存储服务（推荐）

1. **准备新图片**
   - 建议尺寸：200x200px 或 400x400px
   - 格式：PNG、JPG、WebP
   - 内容：代表不同艺术风格的示例图片

2. **上传到云存储**
   - 腾讯云COS
   - 阿里云OSS
   - 七牛云
   - 或其他云存储服务

3. **更新URL**
   在 `src/services/falai.js` 中更新 `STYLE_URLS` 对象：
   ```javascript
   const STYLE_URLS = {
     style1: "你的新图片URL1",
     style2: "你的新图片URL2", 
     style3: "你的新图片URL3",
     style4: "你的新图片URL4"
   };
   ```

### 方法二：使用本地图片

1. **将图片放在public目录**
   ```
   public/
   ├── images/
   │   ├── style1.png
   │   ├── style2.png
   │   ├── style3.png
   │   └── style4.png
   ```

2. **更新URL为相对路径**
   ```javascript
   const STYLE_URLS = {
     style1: "/images/style1.png",
     style2: "/images/style2.png",
     style3: "/images/style3.png", 
     style4: "/images/style4.png"
   };
   ```

### 方法三：使用import导入

1. **将图片放在src/images目录**
   ```
   src/
   ├── images/
   │   ├── style1.png
   │   ├── style2.png
   │   ├── style3.png
   │   └── style4.png
   ```

2. **在falai.js中导入**
   ```javascript
   import style1Image from '../images/style1.png';
   import style2Image from '../images/style2.png';
   import style3Image from '../images/style3.png';
   import style4Image from '../images/style4.png';

   const STYLE_URLS = {
     style1: style1Image,
     style2: style2Image,
     style3: style3Image,
     style4: style4Image
   };
   ```

## 图片要求

### 技术规格
- **尺寸**：建议 200x200px 到 400x400px
- **格式**：PNG、JPG、WebP
- **文件大小**：建议小于 500KB
- **透明度**：支持透明背景

### 内容建议
- **style1（动漫风格）**：动漫人物或场景
- **style2（写实风格）**：真实照片风格
- **style3（水彩风格）**：水彩画风格
- **style4（插画风格）**：插画或手绘风格

## 测试步骤

1. **替换图片后，重启开发服务器**
   ```bash
   npm start
   ```

2. **测试功能**
   - 打开分镜节点
   - 点击"生成图像"按钮
   - 在视觉参考区域查看新图片是否正确显示
   - 选择不同风格测试图像生成

3. **检查控制台**
   - 确保没有图片加载错误
   - 确认图片URL正确

## 注意事项

1. **图片URL必须可公开访问**
2. **建议使用HTTPS链接**
3. **图片加载失败时会显示默认占位图**
4. **更改后需要重新构建项目**

## 故障排除

### 图片不显示
- 检查URL是否正确
- 确认图片文件存在
- 检查网络连接

### 图片加载慢
- 压缩图片文件大小
- 使用CDN加速
- 考虑使用WebP格式

### 样式不匹配
- 确保图片风格与标签一致
- 调整图片尺寸和比例
- 测试不同设备的显示效果 