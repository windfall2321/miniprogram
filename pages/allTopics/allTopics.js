// pages/allTopics/allTopics.js
const topicService = require('../../utils/topicandcomment');

Page({
  data: {
    topics: [],
    showPostModal: false,
    newPost: {
      title: '',
      content: '',
      images: [],
      uploadedImageUrls: []
    }
    

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
  },
  openPostModal() {
    this.setData({
      showPostModal: true,
      newPost: { title: '', content: '' }
    });
  },
  
  closePostModal() {
    this.setData({ showPostModal: false });
  },
  
  onInputTitle(e) {
    this.setData({ 'newPost.title': e.detail.value });
  },
  
  onInputContent(e) {
    this.setData({ 'newPost.content': e.detail.value });
  },
  chooseImage() {
    wx.chooseMedia({
      count: 3, // 最多选3张
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFiles = res.tempFiles.map(file => file.tempFilePath);
        this.setData({
          'newPost.images': tempFiles
        });
      }
    });
  },
  async submitPost() {
    const { title, content } = this.data.newPost;
    if (!title || !content) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }
  
    try {
      await require('../../utils/topicandcomment').addTopic({
        title,
        content
      });
      wx.showToast({ title: '发布成功', icon: 'success' });
      this.setData({ showPostModal: false });
      this.loadTopics(); // 重新加载帖子
    } catch (err) {
      wx.showToast({ title: '发布失败', icon: 'none' });
    }
  }
  
  
  
  
  
});
