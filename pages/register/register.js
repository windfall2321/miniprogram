const userService = require('../../utils/userService');

Page({
  data: {
    username: '',
    password: '',
    confirmPassword: ''
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

  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },

  async handleRegister() {
    const { username, password, confirmPassword } = this.data;
    
    if (!username || !password || !confirmPassword) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({
        title: '注册中...'
      });

      await userService.register({
        username,
        password
      });
      
      wx.hideLoading();
      wx.showToast({
        title: '注册成功',
        icon: 'success'
      });

      // 注册成功后跳转到登录页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      wx.hideLoading();
      console.error('注册失败:', error);
    }
  },

  goToLogin() {
    wx.navigateBack();
  }
}); 