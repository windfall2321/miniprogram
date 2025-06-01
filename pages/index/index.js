// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
const userService = require('../../utils/userService');

Page({
  data: {
    motto: 'Hello World',
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    // 每次显示页面时重新加载用户信息
    this.loadUserInfo();
  },

  async loadUserInfo() {
    try {
      wx.showLoading({
        title: '加载中...'
      });

      const response = await userService.getUserInfo();
      if (response.code === 200) {
        this.setData({
          userInfo: response.data
        });
      }

      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.error('获取用户信息失败:', error);
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    }
  },

  handleEditProfile() {
    // 处理编辑资料
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  async handleLogout() {
    try {
      wx.showLoading({
        title: '退出中...'
      });

      await userService.logout();
      
      wx.hideLoading();
      wx.showToast({
        title: '退出成功',
        icon: 'success'
      });

      // 退出后跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      });
    } catch (error) {
      wx.hideLoading();
      console.error('退出失败:', error);
      wx.showToast({
        title: '退出失败',
        icon: 'none'
      });
    }
  },

  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const { nickName } = this.data.userInfo
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  onInputChange(e) {
    const nickName = e.detail.value
    const { avatarUrl } = this.data.userInfo
    this.setData({
      "userInfo.nickName": nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  handleAction(e) {
    const { type } = e.currentTarget.dataset;
    // 处理快捷功能点击
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  }
})
