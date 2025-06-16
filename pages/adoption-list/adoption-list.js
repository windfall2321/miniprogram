const http = require('../../utils/request');
const config = require('../../utils/config');

// 处理图片URL
function processImageUrl(url) {
  if (!url) return '/assets/default-avatar.jpg';
  // 如果已经是完整的URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // 如果是相对路径，添加图片服务器基础URL
  return `${config.IMAGE_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

Page({
  data: {
    adoptions: [],
    searchKeyword: '',
    originalAdoptions: [], // 用于存储原始数据，重置时使用
    showModal: false,
    selectedPet: null,
    applicationReason: '', // 申请理由
    reasonLength: 0, // 申请理由字数
    modalType: 'detail', // 弹窗类型：detail 或 application
    defaultImage: '/assets/default-avatar.jpg' // Added for the new getPetTypeText method
  },

  onLoad() {
    this.fetchAdoptionList();
  },

  onShow() {
    // 每次页面显示时刷新列表
    this.fetchAdoptionList();
  },

  async fetchAdoptionList() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    try {
      const res = await http.get('/adoption-listings/get');
      console.log('后端响应:', res);

      if (res.code !== 200 || !Array.isArray(res.data)) {
        throw new Error(res.message || '数据格式错误');
      }

      // 获取当前用户信息
      const userInfo = wx.getStorageSync('userInfo');
      const userId = userInfo ? userInfo.userId : null;

      // 过滤掉用户自己发布的领养信息
      const list = res.data
        .filter(item => item.userId !== userId)  // 过滤掉用户自己发布的
        .map(item => ({
          ...item,
          image: processImageUrl(item.petImage),  // 处理图片URL
          petGender: item.petGender || 'male',  // 确保性别字段有默认值
          petBreed: this.getPetTypeText(item.petBreed) // 转换宠物类型为中文
        }));

      this.setData({
        adoptions: list,
        originalAdoptions: list // 保存原始数据
      });
    } catch (err) {
      console.error('加载失败:', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'error',
        duration: 2000
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 搜索输入处理
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索处理
  handleSearch() {
    const keyword = this.data.searchKeyword.trim().toLowerCase();
    if (!keyword) {
      this.setData({
        adoptions: this.data.originalAdoptions
      });
      return;
    }

    const filteredList = this.data.originalAdoptions.filter(item => {
      if (!item) return false;
      // 搜索多个字段
      return (
        (item.petName && item.petName.toLowerCase().includes(keyword)) ||
        (item.petBreed && item.petBreed.toLowerCase().includes(keyword)) ||
        (item.petType && item.petType.toLowerCase().includes(keyword)) ||
        (item.city && item.city.toLowerCase().includes(keyword)) ||
        (item.description && item.description.toLowerCase().includes(keyword))
      );
    });

    this.setData({
      adoptions: filteredList
    });

    if (filteredList.length === 0) {
      wx.showToast({
        title: '未找到匹配的宠物',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 重置搜索
  handleReset() {
    this.setData({
      searchKeyword: '',
      adoptions: this.data.originalAdoptions
    });
  },

  // 显示详情弹窗
  async apply(e) {
    const id = e.currentTarget.dataset.id;
    const pet = this.data.adoptions.find(item => item.adoptionId === id);
  
    if (pet) {
      this.setData({
        selectedPet: pet,
        showModal: true,
        modalType: 'detail'
      });
    }
  },

  // 显示申请弹窗
  showApplicationModal(e) {
    const id = e.currentTarget.dataset.id;
    const pet = this.data.adoptions.find(item => item.adoptionId === id);
  
    if (pet) {
      this.setData({
        selectedPet: pet,
        showModal: true,
        modalType: 'application',
        applicationReason: '',
        reasonLength: 0
      });
    }
  },

  // 处理申请理由输入
  onReasonInput(e) {
    const value = e.detail.value;
    this.setData({
      applicationReason: value,
      reasonLength: value.length
    });
  },

  closeModal() {
    this.setData({
      showModal: false,
      selectedPet: null,
      applicationReason: '',
      reasonLength: 0,
      modalType: 'detail'
    });
  },

  async submitApplication(e) {
    const id = e.currentTarget.dataset.id;
    const pet = this.data.adoptions.find(item => item.adoptionId === id);
  
    if (!pet) return;

    // 验证申请理由
    if (!this.data.applicationReason || this.data.reasonLength < 10) {
      wx.showToast({
        title: '请输入至少10个字的申请理由',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showLoading({
      title: '提交中...',
      mask: true
    });

    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.userId) {
        throw new Error('请先登录');
      }

      const res = await http.post('/adoption-applications/add', null, {
        params: {
          adoptionId: pet.adoptionId,
          applicantId: userInfo.userId,
          status: 'pending',
          reason: this.data.applicationReason
        }
      });

      if (res.code !== 200) {
        throw new Error(res.message || '申请失败');
      }
      
      wx.showToast({
        title: `已申请 ${pet.petName}`,
        icon: 'success',
        duration: 2000
      });

      this.closeModal();
    } catch (err) {
      console.error('申请失败:', err);
      wx.showToast({
        title: err.message || '申请失败',
        icon: 'error',
        duration: 2000
      });
    } finally {
      wx.hideLoading();
    }
  },
  
  goToAddAdoption() {
    wx.navigateTo({
      url: '/pages/add-adoption/add-adoption'
    });
  },

  // 导航到我的领养管理页面
  navigateToMyAdoption() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    wx.navigateTo({
      url: '/pages/my_adoption/my_adoption',
      success: () => {
        wx.hideLoading();
      },
      fail: (err) => {
        console.error('导航失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '页面跳转失败',
          icon: 'error',
          duration: 2000
        });
      }
    });
  },

  // 获取宠物类型文本
  getPetTypeText(type) {
    const types = {
      'cat': '猫咪',
      'dog': '狗狗',
      'other': '其他'
    }
    return types[type] || type
  }
});
