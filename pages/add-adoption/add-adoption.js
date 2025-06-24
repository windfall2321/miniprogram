// pages/add-adoption/add-adoption.js
const http = require('../../utils/request');
const config = require('../../utils/config.js');

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

  /**
   * 页面的初始数据
   */
  data: {
    formData: {
      petName: '',
      petType: '',
      petBreed: '',
      gender: '0',
      petCity: '',
      description: '',
      petImage: ''
    },
    petTypes: [
      { label: '狗', value: 'dog' },
      { label: '猫', value: 'cat' },
      { label: '其他', value: 'other' }
    ],
    petTypeIndex: 0,
    submitting: false,
    tempImagePath: '', // 临时存储选择的图片路径
    uploadedImageUrl: '' // 存储上传后的图片URL
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  onPetTypeChange(e) {
    const index = e.detail.value;
    this.setData({
      petTypeIndex: index,
      'formData.petType': this.data.petTypes[index].value
    });
  },

  onGenderChange(e) {
    this.setData({
      'formData.gender': e.detail.value
    });
  },

  async chooseImage() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      const tempFilePath = res.tempFilePaths[0];
      // 检查图片大小，最大10MB
      wx.getFileInfo({
        filePath: tempFilePath,
        success: (info) => {
          if (info.size > 10 * 1024 * 1024) {
            wx.showToast({
              title: '图片不能超过10MB',
              icon: 'none'
            });
            return;
          }
          // 只更新预览图片
          this.setData({
            'formData.petImage': tempFilePath,
            tempImagePath: tempFilePath
          });
        },
        fail: () => {
          wx.showToast({
            title: '获取图片信息失败',
            icon: 'none'
          });
        }
      });
    } catch (err) {
      console.error('选择图片失败:', err);
      wx.showToast({
        title: '选择图片失败',
        icon: 'error'
      });
    }
  },

  deleteImage() {
    this.setData({
      'formData.petImage': '',
      tempImagePath: '',
      uploadedImageUrl: ''
    });
  },

  validateForm() {
    const { petName, petType, petBreed, gender, petCity, description } = this.data.formData;
    if (!petName.trim()) {
      throw new Error('请输入宠物名称');
    }
    if (!petType) {
      throw new Error('请选择宠物类型');
    }
    if (!petBreed.trim()) {
      throw new Error('请输入宠物品种');
    }
    if (!gender) {
      throw new Error('请选择宠物性别');
    }
    if (!petCity.trim()) {
      throw new Error('请输入所在城市');
    }
    if (!description.trim()) {
      throw new Error('请输入领养描述');
    }
    if (!this.data.tempImagePath) {
      throw new Error('请选择宠物图片');
    }
  },

  async onSubmit(e) {
    if (this.data.submitting) return;
    
    try {
      this.validateForm();
      
      this.setData({ submitting: true });
      wx.showLoading({ title: '发布中...', mask: true });

      // 1. 先上传图片
      const token = wx.getStorageSync('token');
      if (!token) {
        throw new Error('请先登录');
      }

      // 创建宠物记录
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.userId) {
        throw new Error('请先登录');
      }

      const petData = {
        name: this.data.formData.petName,
        type: this.data.formData.petType,
        breed: this.data.formData.petBreed,
        gender: Number(this.data.formData.gender),
        city: this.data.formData.petCity,
        ownerId: userInfo.userId,
        image: '/default-pet.jpg' // 先使用默认图片
      };

      const petRes = await http.post('/pet/add', petData);
      if (petRes.code !== 200 || !petRes.data || !petRes.data.petId) {
        throw new Error(petRes.message || '创建宠物记录失败');
      }

      const petId = petRes.data.petId;

      // 上传图片
      console.log('开始上传图片，临时文件路径:', this.data.tempImagePath);

      const uploadRes = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: `${config.BASE_URL}/pet/image/upload`,
          filePath: this.data.tempImagePath,
          name: 'file',
          formData: {
            petId: petId
          },
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: (res) => {
            console.log('上传响应:', res);
            if (res.statusCode === 200) {
              try {
                const result = JSON.parse(res.data);
                console.log('解析后的响应数据:', result);
                if (result.code === 200 && result.data) {
                  resolve(result);
                } else {
                  reject(new Error(result.message || '上传失败'));
                }
              } catch (e) {
                console.error('解析响应数据失败:', e, '原始数据:', res.data);
                reject(new Error('解析响应数据失败'));
              }
            } else {
              console.error('上传失败，状态码:', res.statusCode, '响应数据:', res.data);
              reject(new Error(res.data || '上传失败'));
            }
          },
          fail: (error) => {
            console.error('上传请求失败:', error);
            reject(new Error('网络请求失败'));
          }
        });
      });

      if (uploadRes.code !== 200 || !uploadRes.data || !uploadRes.data.image) {
        throw new Error(uploadRes.message || '上传图片失败');
      }

      const imageUrl = uploadRes.data.image;
      console.log('上传成功，图片URL:', imageUrl);

      // 2. 创建领养信息
      const adoptionRes = await http.post('/adoption-listings/add', null, {
        params: {
          petId: petId,
          description: this.data.formData.description,
          city: this.data.formData.petCity,
          image: imageUrl
        }
      });

      if (adoptionRes.code !== 200) {
        throw new Error(adoptionRes.message || '创建领养信息失败');
      }

      console.log('领养信息创建成功，图片URL:', imageUrl);

      wx.showToast({
        title: '发布成功',
        icon: 'success'
      });

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (err) {
      console.error('发布失败:', err);
      wx.showToast({
        title: err.message || '发布失败',
        icon: 'error'
      });
    } finally {
      this.setData({ submitting: false });
      wx.hideLoading();
    }
  }
})