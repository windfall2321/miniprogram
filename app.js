// app.js
const config = require('./utils/config');

App({
  onLaunch() {
    // 检查登录状态
    const token = wx.getStorageSync('data');
    if (token) {
      // 如果有token，跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
    // 如果没有token，保持在登录页面

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })

    // 初始化全局数据
    this.globalData = {
      userInfo: null,
      needRefresh: false,
      config: config
    };
  },
  globalData: {
    userInfo: null,
    needRefresh: false,
    config: null
  }
})
