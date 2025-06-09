const http = require('../../utils/request');

Page({
  data: {
    adoptions: []
  },

  onLoad() {
    this.fetchAdoptionList();
  },

  fetchAdoptionList() {
    http.get('/adoption-listings/get').then((res) => {
      console.log('后端响应:', res);

      const list = res.data.map(item => ({
        ...item,
        image: item.petImage || '/assets/default-avatar.jpg'  // 用 petImage 替代原 image
      }));

      this.setData({
        adoptions: list
      });
    }).catch(err => {
      console.error('加载失败:', err);
    });
  },

  apply(e) {
    const id = e.currentTarget.dataset.id;
    const pet = this.data.adoptions.find(item => item.adoptionId === id);
  
    if (pet) {
      this.setData({
        selectedPet: pet,
        showModal: true
      });
    }
  },

  closeModal() {
    this.setData({
      showModal: false
    });
  },
  submitApplication(e) {
    const id = e.currentTarget.dataset.id;
    const pet = this.data.adoptions.find(item => item.adoptionId === id);
  
    if (pet) {
      wx.showToast({
        title: `已申请 ${pet.petName}`,
        icon: 'success',
        duration: 2000
      });
  
      // 你可以在这里补充实际的申请逻辑，比如发送 POST 请求等
    }
  },
  
  goToAddAdoption() {
    wx.navigateTo({
      url: '/pages/add-adoption/add-adoption'
    });
  }
});
