// app.js
const config = require('./utils/config');

App({
  onLaunch() {
    // 集成云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-7g78qxua49dbbf9c',
        traceUser: true,
      });
    }

    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      // 如果没有token，跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      });
      return;
    }

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
