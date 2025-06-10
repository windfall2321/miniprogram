// petEncy.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    pets: [],
    displayedPets: [],
    loading: false,
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    searchKeyword: '',
    categoryFilter: '',
    categoryOptions: ['所有类别', '🐱 猫', '🐶 狗', '🦜 鸟', '🐾 其他'],
    categoryIndex: 0,
    pageSizeOptions: ['5', '10', '20', '50'],
    pageSizeIndex: 1, // 默认选择10
    showModal: false,
    isEditing: false,
    petForm: {},
    formCategoryOptions: ['🐱 猫', '🐶 狗', '🦜 鸟', '🐾 其他'],
    showDeleteModal: false,
    petToDelete: null,
    debounceTimer: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.fetchPets();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 页面显示时的逻辑
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({
      currentPage: 1
    });
    this.fetchPets().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.currentPage < this.data.totalPages) {
      this.changePage({
        currentTarget: {
          dataset: {
            page: this.data.currentPage + 1
          }
        }
      });
    }
  },

  /**
   * 获取分页数据
   */
  fetchPets: function () {
    this.setData({ loading: true });
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://localhost:8080/pet/api/petEncy/page',
        method: 'GET',
        data: {
          pageNum: this.data.currentPage,
          pageSize: this.data.pageSize
        },
        success: (res) => {
          if (res.data.code === 200) {
            const pets = res.data.data.items.map(pet => ({
              ...pet,
              showDetails: false
            }));
            
            this.setData({
              pets: pets,
              displayedPets: [...pets],
              totalItems: res.data.data.total,
              totalPages: Math.ceil(res.data.data.total / this.data.pageSize),
              loading: false
            });
            resolve(res);
          } else {
            console.error('获取宠物数据失败:', res.data.message);
            wx.showToast({
              title: '获取数据失败',
              icon: 'error'
            });
            this.setData({ loading: false });
            reject(res);
          }
        },
        fail: (error) => {
          console.error('API请求错误:', error);
          wx.showToast({
            title: '网络错误',
            icon: 'error'
          });
          this.setData({ loading: false });
          reject(error);
        }
      });
    });
  },

  /**
   * 切换页码
   */
  changePage: function (e) {
    const page = e.currentTarget.dataset.page;
    if (page < 1 || page > this.data.totalPages) return;
    
    this.setData({
      currentPage: page
    });
    this.fetchPets();
  },

  /**
   * 修改每页数量
   */
  handlePageSizeChange: function (e) {
    const index = e.detail.value;
    const pageSize = parseInt(this.data.pageSizeOptions[index]);
    
    this.setData({
      currentPage: 1, // 切换回第一页
      pageSize: pageSize,
      pageSizeIndex: index
    });
    this.fetchPets();
  },

  /**
   * 搜索处理（防抖）
   */
  handleSearch: function (e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    
    // 清除之前的定时器
    if (this.data.debounceTimer) {
      clearTimeout(this.data.debounceTimer);
    }
    
    // 设置新的定时器
    const timer = setTimeout(() => {
      this.filterPets();
    }, 300);
    
    this.setData({
      debounceTimer: timer
    });
  },

  /**
   * 筛选处理
   */
  handleFilterChange: function (e) {
    const index = e.detail.value;
    let categoryFilter = '';
    
    if (index > 0) {
      categoryFilter = this.data.categoryOptions[index].split(' ')[1];
    }
    
    this.setData({
      categoryIndex: index,
      categoryFilter: categoryFilter
    });
    this.filterPets();
  },

  /**
   * 筛选宠物列表
   */
  filterPets: function () {
    const { pets, searchKeyword, categoryFilter } = this.data;
    
    if (!searchKeyword && !categoryFilter) {
      this.setData({
        displayedPets: [...pets]
      });
      return;
    }

    const filteredPets = pets.filter(pet => {
      const matchesSearch = !searchKeyword || 
        pet.variety_name.toLowerCase().includes(searchKeyword.toLowerCase());
      
      const matchesCategory = !categoryFilter || 
        pet.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });

    this.setData({
      displayedPets: filteredPets
    });
  },

  /**
   * 展开/收起详情
   */
  toggleDetails: function (e) {
    const index = e.currentTarget.dataset.index;
    const displayedPets = this.data.displayedPets;
    displayedPets[index].showDetails = !displayedPets[index].showDetails;
    
    this.setData({
      displayedPets: displayedPets
    });
  },

  /**
   * 显示添加模态框
   */
  showAddModal: function () {
    this.setData({
      isEditing: false,
      petForm: this.getEmptyPetForm(),
      showModal: true
    });
  },

  /**
   * 编辑宠物信息
   */
  editPet: function (e) {
    const pet = e.currentTarget.dataset.pet;
    
    // 找到类别在表单选项中的索引
    let categoryIndex = 0;
    this.data.formCategoryOptions.forEach((option, index) => {
      if (option.includes(pet.category)) {
        categoryIndex = index;
      }
    });
    
    this.setData({
      isEditing: true,
      petForm: { 
        ...pet,
        categoryIndex: categoryIndex
      },
      showModal: true
    });
  },

  /**
   * 关闭模态框
   */
  closeModal: function () {
    this.setData({
      showModal: false,
      petForm: {}
    });
  },

  /**
   * 表单输入处理
   */
  onFormInput: function (e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`petForm.${field}`]: value
    });
  },

  /**
   * 类别选择处理
   */
  onCategoryChange: function (e) {
    const index = e.detail.value;
    const category = this.data.formCategoryOptions[index].split(' ')[1];
    
    this.setData({
      'petForm.category': category,
      'petForm.categoryIndex': index
    });
  },

  /**
   * 提交表单
   */
  submitForm: function () {
    const { petForm, isEditing } = this.data;
    
    // 表单验证
    if (!petForm.variety_name || !petForm.category) {
      wx.showToast({
        title: '请填写必填项',
        icon: 'error'
      });
      return;
    }

    const requestData = { ...petForm };
    delete requestData.categoryIndex; // 移除表单用的索引字段
    
    const url = isEditing ? 
      'http://localhost:8080/pet/api/petEncy/update' : 
      'http://localhost:8080/pet/api/petEncy/add';
    const method = isEditing ? 'PUT' : 'POST';

    if (!isEditing) {
      requestData.pet_ency_id = parseInt(Date.now() / 1000000000);
    }

    wx.showLoading({
      title: isEditing ? '保存中...' : '添加中...'
    });

    wx.request({
      url: url,
      method: method,
      data: requestData,
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200) {
          wx.showToast({
            title: isEditing ? '更新成功' : '添加成功',
            icon: 'success'
          });
          this.closeModal();
          this.fetchPets();
        } else {
          console.error('操作失败:', res.data.message);
          wx.showToast({
            title: '操作失败: ' + res.data.message,
            icon: 'error'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('API请求错误:', error);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'error'
        });
      }
    });
  },

  /**
   * 确认删除
   */
  confirmDelete: function (e) {
    const pet = e.currentTarget.dataset.pet;
    
    if (!pet.pet_ency_id) {
      wx.showToast({
        title: '宠物ID不能为空',
        icon: 'error'
      });
      return;
    }

    this.setData({
      petToDelete: pet,
      showDeleteModal: true
    });
  },

  /**
   * 取消删除
   */
  cancelDelete: function () {
    this.setData({
      showDeleteModal: false,
      petToDelete: null
    });
  },

  /**
   * 删除宠物信息
   */
  deletePet: function () {
    const pet = this.data.petToDelete;
    
    if (!pet || !pet.pet_ency_id) {
      wx.showToast({
        title: '宠物ID不能为空',
        icon: 'error'
      });
      return;
    }

    wx.showLoading({
      title: '删除中...'
    });

    wx.request({
      url: `http://localhost:8080/pet/api/petEncy/delete/${pet.pet_ency_id}`,
      method: 'DELETE',
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          this.cancelDelete();
          this.fetchPets();
        } else {
          console.error('删除失败:', res.data.message);
          wx.showToast({
            title: '删除失败: ' + res.data.message,
            icon: 'error'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('API请求错误:', error);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'error'
        });
      }
    });
  },

  /**
   * 获取空的宠物表单对象
   */
  getEmptyPetForm: function () {
    return {
      pet_ency_id: 1,
      variety_name: '',
      category: '',
      categoryIndex: 0,
      bodily_form: '',
      height: '',
      weight: '',
      lifetime: '',
      feature_tail: '',
      feature_ear: '',
      feature_eye: '',
      coat_color: '',
      coat_length: '',
      introduction: '',
      feeding_matters: '',
      image: ''
    };
  }
});