// pages/adoption-list/adoption-list.js
Page({
  data: {
    adoptions: []
  },

  onLoad() {
    this.fetchAdoptionList();
  },

  fetchAdoptionList() {
    console.log('fetchAdoptionList triggered');
    // 模拟延迟加载
    setTimeout(() => {
      const mockData = [
        {
          adoptionId: 1,
          listedBy: 101,
          description: "一只可爱的金毛，性格温顺，喜欢跑步。",
          status: "待领养",
          listedAt: "2024-06-01T10:00:00",
          image: "/assets/mock/pet1.jpg",
          petName: "豆豆",
          petBreed: "金毛寻回犬",
          petGender: 1
        },
        {
          adoptionId: 2,
          listedBy: 102,
          description: "活泼的小猫咪，适合家庭养。",
          status: "待领养",
          listedAt: "2024-06-02T14:30:00",
          image: "/assets/mock/pet2.jpg",
          petName: "小橘",
          petBreed: "橘猫",
          petGender: 0
        }
      ];
  
      this.setData({
        adoptions: mockData
      });
    }, 300); // 模拟网络延迟 300ms
  },

  apply(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/adoption-detail/adoption-detail?adoptionId=${id}`
    });
  },

  goToAddAdoption() {
    wx.navigateTo({
      url: '/pages/add-adoption/add-adoption' 
    });
  }
});
