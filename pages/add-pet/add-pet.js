const http = require('../../utils/request.js');

Page({
  data: {
    formData: {
      name: '',
      breed: '',
      gender: '0',
      city: ''
    },
    submitting: false
  },

  onLoad() {
    // 检查用户是否登录
    const userId = wx.getStorageSync('userId');
    if (!userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 2000);
      return;
    }
  },

  // 输入事件处理
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    });
  },

  onBreedInput(e) {
    this.setData({
      'formData.breed': e.detail.value
    });
  },

  onGenderChange(e) {
    this.setData({
      'formData.gender': e.detail.value
    });
  },

  onCityInput(e) {
    this.setData({
      'formData.city': e.detail.value
    });
  },

  // 表单验证
  validateForm() {
    const { name, breed, city } = this.data.formData;
    if (!name.trim()) {
      wx.showToast({
        title: '请输入宠物名称',
        icon: 'none'
      });
      return false;
    }
    if (!breed.trim()) {
      wx.showToast({
        title: '请输入宠物品种',
        icon: 'none'
      });
      return false;
    }
    if (!city.trim()) {
      wx.showToast({
        title: '请输入所在城市',
        icon: 'none'
      });
      return false;
    }
    return true;
  },

  // 提交表单
  handleSubmit() {
    if (this.data.submitting) return;
    
    if (!this.validateForm()) return;

    this.setData({ submitting: true });

    const userId = wx.getStorageSync('userId');
    const formData = {
      ...this.data.formData,
      ownerId: userId
    };

    http.post('/pet/add', formData)
      .then(res => {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        wx.showToast({
          title: err.message || '添加失败',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ submitting: false });
      });
  }
}); 