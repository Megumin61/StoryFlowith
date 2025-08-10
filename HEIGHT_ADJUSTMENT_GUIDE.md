# Page1 面板高度调整指南

## 概述
Page1 (RefinementPage) 包含三个主要步骤，每个步骤都有不同的面板布局。本文档说明如何调整各个面板的高度。

## 高度配置位置
配置文件位于：`src/components/RefinementPage.js` 文件顶部的 `HEIGHT_CONFIG` 常量

## 配置项说明

### 1. 访谈记录分析页面 (第一步)

```javascript
interview: {
  contentMinHeight: 'min-h-[250px]',  // 访谈记录内容最小高度
  contentMaxHeight: 'max-h-[400px]',  // 访谈记录内容最大高度
  keywordsMaxHeight: 'max-h-[300px]', // 关键词区域最大高度
}
```

**调整建议：**
- `contentMinHeight`: 建议范围 `200px - 350px`
- `contentMaxHeight`: 建议范围 `350px - 500px`
- `keywordsMaxHeight`: 建议范围 `250px - 400px`

### 2. 故事脚本完善页面 (第三步)

```javascript
story: {
  textareaHeight: 'h-72',             // 文本域高度 (288px)
  personasMaxHeight: 'max-h-72',      // 用户画像区域最大高度 (288px)
}
```

**调整建议：**
- `textareaHeight`: 建议范围 `h-64` (256px) 到 `h-96` (384px)
- `personasMaxHeight`: 建议范围 `max-h-64` 到 `max-h-96`

### 3. 通用设置

```javascript
common: {
  panelPadding: 'p-4',               // 面板内边距
  gap: 'gap-4',                      // 面板间距
}
```

## 常用高度值对照表

| Tailwind类名 | 像素值 | 说明 |
|-------------|--------|------|
| `h-64` | 256px | 较小高度 |
| `h-72` | 288px | 中等高度 |
| `h-80` | 320px | 较大高度 |
| `h-96` | 384px | 最大高度 |
| `min-h-[200px]` | 200px | 自定义最小高度 |
| `min-h-[250px]` | 250px | 自定义最小高度 |
| `min-h-[300px]` | 300px | 自定义最小高度 |
| `max-h-[300px]` | 300px | 自定义最大高度 |
| `max-h-[400px]` | 400px | 自定义最大高度 |

## 调整步骤

### 1. 降低整体高度
```javascript
// 将高度值调小
interview: {
  contentMinHeight: 'min-h-[200px]',  // 从250px降低到200px
  contentMaxHeight: 'max-h-[350px]',  // 从400px降低到350px
  keywordsMaxHeight: 'max-h-[250px]', // 从300px降低到250px
}
```

### 2. 增加整体高度
```javascript
// 将高度值调大
story: {
  textareaHeight: 'h-96',             // 从h-72增加到h-96
  personasMaxHeight: 'max-h-96',      // 从max-h-72增加到max-h-96
}
```

### 3. 调整间距
```javascript
common: {
  panelPadding: 'p-6',               // 从p-4增加到p-6
  gap: 'gap-6',                      // 从gap-4增加到gap-6
}
```

## 布局原理

### Flexbox布局
- 使用 `flex flex-col` 创建垂直布局
- 使用 `flex-shrink-0` 固定标题和按钮区域
- 使用 `flex-1 min-h-0` 让内容区域自动填充

### 高度控制策略
1. **最小高度**: 确保内容有足够的显示空间
2. **最大高度**: 防止内容过长导致页面滚动
3. **自动填充**: 使用Flexbox让内容区域自适应剩余空间

## 常见问题

### Q: 如何让某个面板更高？
A: 增加对应的 `max-h-` 或 `h-` 值

### Q: 如何让某个面板更矮？
A: 减少对应的 `min-h-` 或 `h-` 值

### Q: 如何让所有面板高度一致？
A: 将不同面板的高度值设置为相同的值

### Q: 如何让面板高度自适应内容？
A: 移除 `max-h-` 限制，使用 `flex-1 min-h-0`

## 示例配置

### 紧凑布局
```javascript
const HEIGHT_CONFIG = {
  interview: {
    contentMinHeight: 'min-h-[200px]',
    contentMaxHeight: 'max-h-[300px]',
    keywordsMaxHeight: 'max-h-[250px]',
  },
  story: {
    textareaHeight: 'h-64',
    personasMaxHeight: 'max-h-64',
  },
  common: {
    panelPadding: 'p-3',
    gap: 'gap-3',
  }
};
```

### 宽松布局
```javascript
const HEIGHT_CONFIG = {
  interview: {
    contentMinHeight: 'min-h-[300px]',
    contentMaxHeight: 'max-h-[500px]',
    keywordsMaxHeight: 'max-h-[400px]',
  },
  story: {
    textareaHeight: 'h-96',
    personasMaxHeight: 'max-h-96',
  },
  common: {
    panelPadding: 'p-6',
    gap: 'gap-6',
  }
};
```

## 注意事项

1. **保持比例**: 调整高度时注意保持左右面板的高度比例
2. **测试响应式**: 在不同屏幕尺寸下测试布局效果
3. **内容适配**: 确保调整后的高度能完整显示内容
4. **滚动条**: 避免出现不必要的滚动条 