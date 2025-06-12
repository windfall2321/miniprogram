// pages/allTopics/allTopics.js
const topicService = require('../../utils/topicandcomment');

Page({
  data: {
    topics: []
  },

  onLoad() {
    this.loadTopics();
  },

  async loadTopics() {
    try {
      const topics = await topicService.getAllTopics();
      this.setData({ topics });
    } catch (error) {
      console.error('获取帖子失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/topicDetail/topicDetail?id=${id}`
    });
  }
});
