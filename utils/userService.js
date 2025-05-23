const http = require('./request');

const userService = {
  // 用户注册
  register: async function(userData) {
    return http.post('/user/register', userData);
  },

  // 用户登录
  login: async function(username, password) {
    const response = await http.post(`/user/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
    // 从响应中获取token
    if (response.code === 200 && response.data) {
      // 保存token
      wx.setStorageSync('token', response.data);
      return response;
    } else {
      throw new Error(response.message || '登录失败');
    }
  },

  // 获取用户信息
  getUserInfo: async function() {
    return http.get('/user/info');
  },

  // 更新用户信息
  updateUserInfo: async function(userData) {
    return http.put('/user/updateinfo', userData);
  },

  // 退出登录
  logout: async function() {
    const response = await http.post('/user/logout');
    // 清除token
    wx.removeStorageSync('token');
    return response;
  }
};

module.exports = userService; 