const http = require('../../utils/request.js');
const config = require('../../utils/config');

// 处理图片URL
function processImageUrl(url) {
  if (!url) return '';
  // 如果已经是完整的URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // 如果是相对路径，添加图片服务器基础URL
  return `${config.IMAGE_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

Page({
  data: {
    petId: null,
    petInfo: null,
    healthRecords: [],
    loading: true
  },

  onLoad(options) {
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

    // 获取宠物信息
    if (options.pet) {
      try {
        const petInfo = JSON.parse(options.pet);
        this.setData({
          petId: petInfo.petId,
          petInfo: {
            ...petInfo,
            image: processImageUrl(petInfo.image)
          }
        });
        this.fetchHealthRecords(petInfo.petId);
      } catch (error) {
        console.error('解析宠物信息失败:', error);
        wx.showToast({
          title: '参数错误',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShow() {
    // 每次页面显示时刷新列表
    if (this.data.petId) {
      this.fetchHealthRecords(this.data.petId);
    }
  },

  // 获取健康记录
  fetchHealthRecords(petId) {
    this.setData({ loading: true });
    
    http.get(`/health/pet/${petId}`)
      .then(res => {
        if (res.code === 200) {
          this.setData({ healthRecords: res.data });
        } else {
          wx.showToast({
            title: res.message || '获取健康记录失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('获取健康记录失败:', err);
        wx.showToast({
          title: '获取健康记录失败',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  // 导航到添加健康记录页面
  navigateToAddHealth() {
    wx.navigateTo({
      url: `/pages/add-health/add-health?petId=${this.data.petId}`
    });
  },

  // 编辑健康记录
  editHealthRecord(e) {
    const record = e.currentTarget.dataset.record;
    wx.navigateTo({
      url: `/pages/edit-health/edit-health?record=${JSON.stringify(record)}`
    });
  },

  // 确认删除健康记录
  confirmDeleteRecord(e) {
    const record = e.currentTarget.dataset.record;
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条健康记录吗？`,
      success: (res) => {
        if (res.confirm) {
          this.deleteHealthRecord(record.recordId);
        }
      }
    });
  },

  // 删除健康记录
  deleteHealthRecord(recordId) {
    wx.showLoading({
      title: '删除中...'
    });

    http.delete(`/health/delete/${recordId}`)
      .then(res => {
        if (res.code === 200) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          // 重新加载健康记录列表
          this.fetchHealthRecords(this.data.petId);
        } else {
          wx.showToast({
            title: res.message || '删除失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('删除健康记录失败:', err);
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  onPullDownRefresh() {
    if (this.data.petId) {
      this.fetchHealthRecords(this.data.petId);
    }
    wx.stopPullDownRefresh();
  }
}); 