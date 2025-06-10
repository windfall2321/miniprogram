// 开发环境配置
const config = {
  // 开发环境API地址 - 使用本机IP地址
  BASE_URL: 'http://127.0.0.1:8080/pet/api',
  // 图片服务器地址
  IMAGE_BASE_URL: 'http://127.0.0.1:8080/pet'
};

// 生产环境配置
const prodConfig = {
  BASE_URL: 'https://api.yourdomain.com/pet/api',
  IMAGE_BASE_URL: 'https://api.yourdomain.com/pet'
};

// 根据编译环境选择配置
// 在微信小程序中，可以通过 __wxConfig 判断环境
const isDev = __wxConfig.envVersion === 'develop' || __wxConfig.envVersion === 'trial';
const finalConfig = isDev ? config : prodConfig;

module.exports = finalConfig; 