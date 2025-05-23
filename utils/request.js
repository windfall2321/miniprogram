const BASE_URL = 'http://localhost:8080/pet/api'; // 开发环境API地址

const request = (url, options = {}) => {
  console.log('请求URL:', `${BASE_URL}${url}`);
  console.log('请求参数:', options);

  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.request({
      url: `${BASE_URL}${url}`,
      ...options,
      header: {
        'content-type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success: (res) => {
        console.log('响应数据:', res);
        
        if (res.statusCode === 401) {
          console.error('Token过期:', res);
          wx.removeStorageSync('token');
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          });
          wx.redirectTo({
            url: '/pages/login/login'
          });
          reject(res);
          return;
        }
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 直接返回响应数据，让业务层处理
          resolve(res.data);
        } else {
          console.error('请求失败:', res);
          wx.showToast({
            title: res.data.message || '请求失败',
            icon: 'none'
          });
          reject(res);
        }
      },
      fail: (error) => {
        console.error('请求错误:', error);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        reject(error);
      }
    });
  });
};

const http = {
  get: (url, data) => request(url, { method: 'GET', data }),
  post: (url, data) => request(url, { method: 'POST', data }),
  put: (url, data) => request(url, { method: 'PUT', data }),
  delete: (url, data) => request(url, { method: 'DELETE', data })
};

module.exports = http; 