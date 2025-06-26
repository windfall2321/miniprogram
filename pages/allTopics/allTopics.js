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
    },
    cloudCommentImageUrl: ''
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
  // async submitPost() {
  //   const { title, content } = this.data.newPost;
  //   if (!title || !content) {
  //     wx.showToast({ title: '请填写完整', icon: 'none' });
  //     return;
  //   }
  
  //   try {
  //     await require('../../utils/topicandcomment').addTopic({
  //       title,
  //       content
  //     });
  //     wx.showToast({ title: '发布成功', icon: 'success' });
  //     this.setData({ showPostModal: false });
  //     this.loadTopics(); // 重新加载帖子
  //   } catch (err) {
  //     wx.showToast({ title: '发布失败', icon: 'none' });
  //   }
  // }

  async submitPost() {
    const { title, content, images } = this.data.newPost;
  
    if (!title || !content) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }
  
    try {
      const topicService = require('../../utils/topicandcomment');
  
      // 1. 创建帖子
      const res = await topicService.addTopic({ title, content });
  
      let topicId = null;
      if (res && res.data && res.data.topicId) {
        topicId = res.data.topicId;
      } else {
        throw new Error('帖子创建失败，未返回topicId');
      }
      console.log('上传图片使用的topicId:', topicId);

      // 2. 上传图片（如果有）
      if (Array.isArray(images) && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const filePath = images[i];
          await topicService.uploadImage(filePath, 'topic', topicId);
        }
        
      }
  
      // 3. 成功提示 + 清空表单
      wx.showToast({ title: '发布成功', icon: 'success' });
      this.setData({
        showPostModal: false,
        newPost: { title: '', content: '', images: [] }
      });
      this.loadTopics();
  
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '发布失败', icon: 'none' });
    }
  },

  async handleChooseCommentImage() {
    const res = await wx.chooseImage({ count: 1 });
    const tempFilePath = res.tempFilePaths[0];
    // 原有上传逻辑...
    // 新增：上传到云开发
    try {
      const cloudPath = 'comment-images/' + Date.now() + '-' + Math.floor(Math.random() * 1000) + tempFilePath.match(/\.[^.]+?$/)[0];
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath
      });
      const fileID = uploadRes.fileID;
      // 获取临时 HTTPS 链接
      const tempUrlRes = await wx.cloud.getTempFileURL({
        fileList: [fileID]
      });
      const cloudCommentImageUrl = tempUrlRes.fileList[0].tempFileURL;
      this.setData({
        cloudCommentImageUrl
      });
    } catch (err) {
      wx.showToast({
        title: '云开发图片上传失败',
        icon: 'none'
      });
    }
  }
});
