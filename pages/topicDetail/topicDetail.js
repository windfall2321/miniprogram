// pages/topicDetail/topicDetail.js
const topicService = require('../../utils/topicandcomment');

Page({
  data: {
    topicId: null,
    topic: null,
    comments: [],
    loading: true
  },

  async onLoad(options) {
    const topicId = options.id;
    this.setData({ topicId });

    try {
      const [topic, comments] = await Promise.all([
        topicService.getTopicDetail(topicId),
        topicService.getComments(topicId)
      ]);

      this.setData({
        topic,
        comments,
        loading: false
      });
    } catch (err) {
      console.error('加载失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  }
});
