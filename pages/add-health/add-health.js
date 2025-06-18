const http = require('../../utils/request.js');

Page({
  data: {
    petId: null,
    type: '',
    description: '',
    recordDate: '',
    typeOptions: [
      { value: '疫苗', label: '疫苗' },
      { value: '体检', label: '体检' },
      { value: '疾病', label: '疾病' },
      { value: '其他', label: '其他' }
    ],
    submitting: false
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

    // 获取宠物ID
    if (options.petId) {
      this.setData({
        petId: parseInt(options.petId)
      });
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }

    // 设置默认日期为今天
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.setData({
      recordDate: `${year}-${month}-${day}`
    });
  },

  // 选择健康记录类型
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ type });
  },

  // 输入描述
  inputDescription(e) {
    this.setData({
      description: e.detail.value
    });
  },

  // 选择日期
  selectDate(e) {
    this.setData({
      recordDate: e.detail.value
    });
  },

  // 提交表单
  submitForm() {
    const { petId, type, description, recordDate } = this.data;

    // 验证表单
    if (!type) {
      wx.showToast({
        title: '请选择记录类型',
        icon: 'none'
      });
      return;
    }

    if (!description.trim()) {
      wx.showToast({
        title: '请输入描述信息',
        icon: 'none'
      });
      return;
    }

    if (!recordDate) {
      wx.showToast({
        title: '请选择记录日期',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    const requestData = {
      petId: petId,
      type: type,
      description: description.trim(),
      recordDate: recordDate
    };

    console.log('提交健康记录数据:', requestData);

    http.post('/health/add', requestData)
      .then(res => {
        if (res.code === 200) {
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });
          
          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: res.message || '添加失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('添加健康记录失败:', err);
        wx.showToast({
          title: '添加失败',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ submitting: false });
      });
  },

  // 取消
  cancel() {
    wx.navigateBack();
  }
}); 