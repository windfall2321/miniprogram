const http = require('../../utils/request');
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
    pets: [],
    ownerId: null,
    loading: true
  },

  onLoad: function() {
    // 从本地存储获取用户ID
    const ownerId = wx.getStorageSync('userId');
    if (ownerId) {
      this.setData({ ownerId });
      this.fetchPets(ownerId);
    } else {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login'
        });
      }, 1500);
    }
  },

  onShow: function() {
    // 每次页面显示时刷新列表
    if (this.data.ownerId) {
      this.fetchPets(this.data.ownerId);
    }
  },

  fetchPets: function(ownerId) {
    this.setData({ loading: true });
    
    http.get(`/pet/owner/${ownerId}`)
      .then(res => {
        if (res.code === 200) {
          // 处理每个宠物的图片URL
          const pets = res.data.map(pet => ({
            ...pet,
            image: processImageUrl(pet.image)
          }));
          this.setData({ pets });
        } else {
          wx.showToast({
            title: res.message || '获取宠物信息失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('获取宠物信息失败:', err);
        wx.showToast({
          title: '获取宠物信息失败',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  // 导航到添加宠物页面
  navigateToAddPet() {
    wx.navigateTo({
      url: '/pages/add-pet/add-pet'
    });
  },

  // 编辑宠物信息
  editPet(e) {
    const pet = e.currentTarget.dataset.pet;
    wx.navigateTo({
      url: `/pages/edit-pet/edit-pet?pet=${JSON.stringify(pet)}`
    });
  },

  // 查看健康记录
  viewHealthRecord(e) {
    const pet = e.currentTarget.dataset.pet;
    wx.navigateTo({
      url: `/pages/health-list/health-list?pet=${JSON.stringify(pet)}`
    });
  },

  // 确认删除宠物
  confirmDelete(e) {
    const pet = e.currentTarget.dataset.pet;
    wx.showModal({
      title: '确认删除',
      content: `确定要删除宠物"${pet.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.deletePet(pet.petId);
        }
      }
    });
  },

  // 删除宠物
  deletePet(petId) {
    wx.showLoading({
      title: '删除中...'
    });

    http.delete(`/pet/delete?petId=${petId}`)
      .then(res => {
        if (res.code === 200) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          // 重新加载宠物列表
          this.fetchPets(this.data.ownerId);
        } else {
          wx.showToast({
            title: res.message || '删除失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('删除宠物失败:', err);
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  onPullDownRefresh: function() {
    if (this.data.ownerId) {
      this.fetchPets(this.data.ownerId);
    }
    wx.stopPullDownRefresh();
  }
}); 