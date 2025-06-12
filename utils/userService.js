const http = require('./request');
const config = require('./config');

// 处理图片URL
function processImageUrl(url) {
  if (!url) return '';
  // 如果已经是完整的URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // 如果是相对路径，添加图片服务器基础URL
  return `${config.IMAGE_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

const userService = {
  // 用户注册
  register: async function(userData) {
    const response = await http.post('/user/register', userData);
    if (response.code === 200 && response.data) {
      // 保存token
      wx.setStorageSync('token', response.data.token);
      return response;
    } else {
      throw new Error(response.message || '注册失败');
    }
  },

  // 用户登录
  login: async function(username, password) {
    const response = await http.post('/user/login', {
      username: username,
      password: password
    });
    // 从响应中获取token
    if (response.code === 200 && response.data) {
      // 保存token
      wx.setStorageSync('token', response.data);
      
      // 获取并保存用户信息
      try {
        const userInfoRes = await this.getUserInfo();
        if (userInfoRes.code === 200 && userInfoRes.data) {
          wx.setStorageSync('userInfo', userInfoRes.data);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        // 即使获取用户信息失败，也不影响登录流程
      }
      
      return response;
    } else {
      throw new Error(response.message || '登录失败');
    }
  },

  // 获取用户信息
  getUserInfo: async function() {
    const response = await http.get('/user/info');
    if (response.code === 200 && response.data) {
      // 处理图片URL
      if (response.data.profile) {
        response.data.profile = processImageUrl(response.data.profile);
      }
    }
    return response;
  },

  // 更新用户信息
  async updateUserInfo(userInfo) {
    try {
      const response = await http.put('/user/updateinfo', userInfo);
      return response;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  },

  // 上传头像
  async uploadProfile(filePath) {
    try {
      console.log('开始上传头像，文件路径:', filePath);
      
      return new Promise((resolve, reject) => {
        const uploadTask = wx.uploadFile({
          url: `${config.BASE_URL}/user/profile/upload`,
          filePath: filePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          success: (res) => {
            console.log('上传响应:', res);
            
            if (res.statusCode === 200) {
              try {
                const result = JSON.parse(res.data);
                console.log('解析后的响应数据:', result);
                
                if (result.code === 200 && result.data) {
                  // 处理返回的图片URL
                  if (result.data.profile) {
                    result.data.profile = processImageUrl(result.data.profile);
                  }
                  resolve(result);
                } else {
                  reject(new Error(result.message || '上传失败'));
                }
              } catch (e) {
                console.error('解析响应数据失败:', e, '原始数据:', res.data);
                reject(new Error('服务器响应格式错误'));
              }
            } else {
              console.error('上传失败，状态码:', res.statusCode, '响应数据:', res.data);
              reject(new Error(res.data || '上传失败'));
            }
          },
          fail: (error) => {
            console.error('上传请求失败:', error);
            reject(new Error('网络请求失败'));
          }
        });

        // 监听上传进度
        uploadTask.onProgressUpdate((res) => {
          console.log('上传进度:', res.progress);
        });
      });
    } catch (error) {
      console.error('上传头像失败:', error);
      throw error;
    }
  },

  // 删除头像
  async deleteProfile() {
    try {
      const response = await http.delete('/user/profile');
      return response;
    } catch (error) {
      console.error('删除头像失败:', error);
      throw error;
    }
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