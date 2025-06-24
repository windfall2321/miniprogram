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
    categoryOptions: ['所有类别', '🐱 猫咪', '🐶 狗狗', '🐹 小宠', '🐾 其他'],
    categoryIndex: 0,
    pageSizeOptions: ['5', '10', '20', '50'],
    pageSizeIndex: 1, // 默认选择10
    showModal: false,
    isEditing: false,
    petForm: {},
    formCategoryOptions: ['🐱 猫咪', '🐶 狗狗', '🐹 小宠', '🐾 其他'],
    showDeleteModal: false,
    petToDelete: null,
    debounceTimer: null
  },

  /**
   * 统一请求方法 - 替代axios拦截器功能
   */
  request: function(options) {
    return new Promise((resolve, reject) => {
      // 获取token
      const token = wx.getStorageSync('token');
      
      // 设置请求头
      const headers = options.header || {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      headers['content-type'] = headers['content-type'] || 'application/json';

      wx.request({
        ...options,
        header: headers,
        success: (res) => {
          console.log('请求响应:', res); // 调试日志
          
          // 检查HTTP状态码
          if (res.statusCode >= 400) {
            if (res.statusCode === 401) {
              wx.removeStorageSync('token');
              wx.showModal({
                title: '提示',
                content: '登录已过期，请重新登录',
                showCancel: false,
                success: () => {
                  // 跳转到登录页面
                  wx.navigateTo({
                    url: '/pages/login/login'
                  });
                }
              });
            } else {
              console.error('HTTP错误:', res.statusCode, res.data);
            }
            reject(res);
            return;
          }
          
          resolve(res);
        },
        fail: (error) => {
          console.error('请求失败:', error);
          reject(error);
        }
      });
    });
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
    
    // 构建请求参数
    const params = {
      pageNum: this.data.currentPage,
      pageSize: this.data.pageSize
    };
  
    // 添加搜索条件到API请求参数
    if (this.data.searchKeyword && this.data.searchKeyword.trim()) {
      params.variety_name = this.data.searchKeyword.trim();
    }
    if (this.data.categoryFilter) {
      params.category = this.data.categoryFilter;
    }
  
    return this.request({
      url: 'http://localhost:8080/pet/api/petEncy/page',
      method: 'GET',
      data: params
    }).then((res) => {
      if (res.data.code === 200) {
        const pets = res.data.data.items.map(pet => ({
          ...pet,
          showDetails: false,
          imageError: false // 初始化图片错误状态
        }));
        
        // 如果后端搜索无效，可以临时在前端再次筛选
        let displayedPets;
        if (this.data.searchKeyword || this.data.categoryFilter) {
          displayedPets = pets.filter(pet => {
            const matchesSearch = !this.data.searchKeyword ||
                pet.variety_name.toLowerCase().includes(this.data.searchKeyword.toLowerCase());

            const matchesCategory = !this.data.categoryFilter ||
                pet.category === this.data.categoryFilter;

            return matchesSearch && matchesCategory;
          });
        } else {
          displayedPets = [...pets];
        }
        
        this.setData({
          pets: pets,
          displayedPets: displayedPets, // 使用筛选后的数据
          totalItems: res.data.data.total,
          totalPages: Math.ceil(res.data.data.total / this.data.pageSize),
          loading: false
        });
      } else {
        console.error('获取宠物数据失败:', res.data.message);
        wx.showToast({
          title: '获取数据失败',
          icon: 'error'
        });
        this.setData({ loading: false });
      }
    }).catch((error) => {
      console.error('API请求错误:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'error'
      });
      this.setData({ loading: false });
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
      this.setData({
        currentPage: 1 // 重置到第一页
      });
      this.fetchPets(); // 调用API重新获取数据
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
      // 提取类别名称，与Vue版本保持一致
      const selectedOption = this.data.categoryOptions[index];
      if (selectedOption === '🐱 猫咪') {
        categoryFilter = '猫咪';
      } else if (selectedOption === '🐶 狗狗') {
        categoryFilter = '狗狗';
      } else if (selectedOption === '🐹 小宠') {
        categoryFilter = '小宠';
      } else if (selectedOption === '🐾 其他') {
        categoryFilter = '其他';
      }
    }
    
    this.setData({
      categoryIndex: index,
      categoryFilter: categoryFilter,
      currentPage: 1 // 重置到第一页
    });
    this.fetchPets(); // 调用API重新获取数据
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
   * 图片加载错误处理
   */
  onImageError: function (e) {
    const index = e.currentTarget.dataset.index;
    const displayedPets = this.data.displayedPets;
    displayedPets[index].imageError = true;
    
    this.setData({
      displayedPets: displayedPets
    });
    
    console.log('图片加载失败:', displayedPets[index].image);
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
    
    // 找到类别在表单选项中的索引，与Vue版本保持一致
    let categoryIndex = 0;
    this.data.formCategoryOptions.forEach((option, index) => {
      if ((option === '🐱 猫咪' && pet.category === '猫咪') ||
          (option === '🐶 狗狗' && pet.category === '狗狗') ||
          (option === '🐹 小宠' && pet.category === '小宠') ||
          (option === '🐾 其他' && pet.category === '其他')) {
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
    const selectedOption = this.data.formCategoryOptions[index];
    let category = '';
    
    // 提取类别名称，与Vue版本保持一致
    if (selectedOption === '🐱 猫咪') {
      category = '猫咪';
    } else if (selectedOption === '🐶 狗狗') {
      category = '狗狗';
    } else if (selectedOption === '🐹 小宠') {
      category = '小宠';
    } else if (selectedOption === '🐾 其他') {
      category = '其他';
    }
    
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

    // 完全复制表单数据，参考Vue成功版本
    const formData = { ...petForm };
    
    // 移除UI相关字段
    delete formData.categoryIndex;
    delete formData.showDetails;
    delete formData.imageError;
    
    const url = isEditing ? 
      'http://localhost:8080/pet/api/petEncy/update' : 
      'http://localhost:8080/pet/api/petEncy/add';
    const method = isEditing ? 'PUT' : 'POST';

    if (!isEditing) {
      // 使用与Vue相同的ID生成方式
      formData.pet_ency_id = 0;
    } else {
      // 确保编辑时ID不为空
      if (!formData.pet_ency_id) {
        wx.showToast({
          title: '宠物ID不能为空',
          icon: 'error'
        });
        return;
      }
    }

    console.log('提交数据:', formData); // 调试日志
    console.log('请求URL:', url);
    console.log('请求方法:', method);

    wx.showLoading({
      title: isEditing ? '保存中...' : '添加中...'
    });

    this.request({
      url: url,
      method: method,
      data: formData
    }).then((res) => {
      wx.hideLoading();
      console.log('响应数据:', res.data); // 调试日志
      if (res.data.code === 200) {
        wx.showToast({
          title: isEditing ? '更新成功' : '添加成功',
          icon: 'success'
        });
        this.closeModal();
        this.fetchPets();
      } else {
        console.error('操作失败:', res.data);
        wx.showToast({
          title: '操作失败: ' + (res.data.message || '未知错误'),
          icon: 'error'
        });
      }
    }).catch((error) => {
      wx.hideLoading();
      console.error('API请求错误:', error);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'error'
      });
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

    this.request({
      url: `http://localhost:8080/pet/api/petEncy/delete/${pet.pet_ency_id}`,
      method: 'DELETE'
    }).then((res) => {
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
    }).catch((error) => {
      wx.hideLoading();
      console.error('API请求错误:', error);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'error'
      });
    });
  },

  /**
   * 获取空的宠物表单对象
   */
  getEmptyPetForm: function () {
    return {
      pet_ency_id: 0,
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