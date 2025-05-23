const ENV = {
  development: {
    BASE_URL: 'http://localhost:8080/pet/api'
  },
  production: {
    BASE_URL: 'https://api.yourdomain.com/pet/api'
  }
};

// 根据编译环境选择配置
const config = ENV[process.env.NODE_ENV || 'development'];

export default config; 