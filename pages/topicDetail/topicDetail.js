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
    const { title, content, images } = this.data.newPost;
    const topicId = this.data.topicId;
  
    if (!title || !content) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }
  
    try {
      // 1. 创建评论
      const res = await topicService.addComment({topicId , content});
  
      let commentId = null;
      if (res && res.data && res.data.commentId) {
        commentId = res.data.commentId;
      } else {
        throw new Error('评论创建失败，未返回commentId');
      }
  
      console.log('上传图片使用的commentId:', commentId);
  
      // 2. 上传图片（如果有）
      if (Array.isArray(images) && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const filePath = images[i];
          await topicService.uploadImage(filePath, 'comment', null, commentId);
        }
      }
  
      // 3. 成功提示 + 清空表单
      wx.showToast({ title: '评论成功', icon: 'success' });
      this.setData({
        showPostModal: false,
        newPost: { title: '', content: '', images: [] }
      });
  
      // 4. 重新加载评论列表
      const comments = await topicService.getComments(topicId);
      this.setData({ comments });
  
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '评论失败', icon: 'none' });
    }
  }
  
  
  
});
