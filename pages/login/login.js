const userService = require('../../utils/userService');

Page({
  data: {
    username: '',
    password: ''
  },

  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  handleLogin() {
    const { username, password } = this.data;
    
    if (!username || !password) {
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '登录中...'
    });

    userService.login(username, password)
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        // 修改这里：使用 redirectTo 而不是 switchTab
        wx.redirectTo({
          url: '/pages/index/index'
        });
      })
      .catch(error => {
        wx.hideLoading();
        console.error('登录失败:', error);
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      });
  },

  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  }
}); 