/**
 * 图像处理工具函数
 */

// 获取公网预设图片URL（用于备选）
const PUBLIC_IMAGES = {
  cartoon: 'https://i.imgur.com/lrL7scV.jpg',  // 卡通风格参考
  realistic: 'https://i.imgur.com/xRUHuKt.jpg', // 写实风格参考
  default: 'https://static-mp-ba33f5b1-550e-4c1f-8c15-cd4190c3c69b.next.bspapp.com/style1.png' // 使用用户提供的URL作为默认参考图
};

// 将本地图像转换为Base64数据URL，用于测试或开发环境
export const imageToBase64 = (imgUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // 处理跨域问题
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg');
        resolve(dataURL);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = imgUrl;
  });
};

/**
 * 获取可公网访问的图片URL
 * 
 * 由于浏览器环境中无法直接将本地图片转为公网URL（这通常需要后端服务）
 * 所以这里我们使用预设的公网图片URL作为替代
 * 
 * @param {string} imagePath - 本地图片路径或名称
 * @param {string} styleType - 风格类型，如'cartoon'或'realistic'
 * @returns {string} 可公网访问的图片URL
 */
export const getPublicImageUrl = (imagePath, styleType = 'default') => {
  // 记录请求信息
  console.log(`尝试获取图片: ${imagePath}, 风格: ${styleType}`);
  
  // 简单的根据文件名判断风格类型
  let inferredStyle = styleType;
  if (imagePath && typeof imagePath === 'string') {
    const lowerPath = imagePath.toLowerCase();
    if (lowerPath.includes('cartoon') || lowerPath.includes('style1')) {
      inferredStyle = 'cartoon';
    } else if (lowerPath.includes('realistic') || lowerPath.includes('style2')) {
      inferredStyle = 'realistic';
    }
  }
  
  // 返回对应风格的公网图片
  return PUBLIC_IMAGES[inferredStyle] || PUBLIC_IMAGES.default;
};

// 在浏览器中打开图片
export const openImageInNewTab = (imgUrl) => {
  if (!imgUrl) return;
  window.open(imgUrl, '_blank');
}; 