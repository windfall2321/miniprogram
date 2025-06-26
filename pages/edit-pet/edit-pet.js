const http = require('../../utils/request.js');
const config = require('../../utils/config');
const app = getApp();

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
    formData: {
      name: '',
      breed: '',
      gender: '0',
      city: ''
    },
    tempImagePath: '',
    cloudImageUrl: '',
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

    // 获取宠物信息
    if (options.pet) {
      try {
        const petInfo = JSON.parse(options.pet);
        this.setData({
          petId: petInfo.petId,
          petInfo,
          formData: {
            name: petInfo.name,
            breed: petInfo.breed,
            gender: petInfo.gender,
            city: petInfo.city
          }
        });
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

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          tempImagePath: tempFilePath
        });
        // 新增：上传到云开发
        try {
          const cloudPath = 'pet-images/' + Date.now() + '-' + Math.floor(Math.random() * 1000) + tempFilePath.match(/\.[^.]+?$/)[0];
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath,
            filePath: tempFilePath
          });
          const fileID = uploadRes.fileID;
          // 获取临时 HTTPS 链接
          const tempUrlRes = await wx.cloud.getTempFileURL({
            fileList: [fileID]
          });
          const cloudImageUrl = tempUrlRes.fileList[0].tempFileURL;
          this.setData({
            cloudImageUrl
          });
        } catch (err) {
          wx.showToast({
            title: '云开发图片上传失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 删除图片
  deleteImage() {
    this.setData({
      tempImagePath: '',
      'petInfo.image': ''
    });
  },

  // 输入事件处理
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    });
  },

  onBreedInput(e) {
    this.setData({
      'formData.breed': e.detail.value
    });
  },

  onGenderChange(e) {
    this.setData({
      'formData.gender': e.detail.value
    });
  },

  onCityInput(e) {
    this.setData({
      'formData.city': e.detail.value
    });
  },

  // 表单验证
  validateForm() {
    const { name, breed, city } = this.data.formData;
    if (!name.trim()) {
      wx.showToast({
        title: '请输入宠物名称',
        icon: 'none'
      });
      return false;
    }
    if (!breed.trim()) {
      wx.showToast({
        title: '请输入宠物品种',
        icon: 'none'
      });
      return false;
    }
    if (!city.trim()) {
      wx.showToast({
        title: '请输入所在城市',
        icon: 'none'
      });
      return false;
    }
    return true;
  },

  // 提交表单
  handleSubmit() {
    if (this.data.submitting) return;
    
    if (!this.validateForm()) return;

    this.setData({ submitting: true });

    const userId = wx.getStorageSync('userId');
    const formData = {
      ...this.data.formData,
      petId: this.data.petId,
      ownerId: userId
    };

    console.log('提交的宠物信息:', formData);

    // 先更新宠物信息
    http.put('/pet/update', formData)
      .then(res => {
        console.log('更新宠物响应:', res);
        if (res.code === 200) {
          // 如果有新图片，上传图片
          if (this.data.tempImagePath) {
            return this.uploadPetImage();
          }
          // 如果没有新图片，直接返回成功
          wx.showToast({
            title: '修改成功',
            icon: 'success'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          throw new Error(res.message || '修改失败');
        }
      })
      .catch(err => {
        console.error('修改宠物失败:', err);
        wx.showToast({
          title: err.message || '修改失败',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ submitting: false });
      });
  },

  // 上传宠物图片
  uploadPetImage() {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${config.BASE_URL}/pet/image/upload`,
        filePath: this.data.tempImagePath,
        name: 'file',
        formData: {
          petId: this.data.petId
        },
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        success: (res) => {
          try {
            const result = JSON.parse(res.data);
            if (result.code === 200) {
              wx.showToast({
                title: '修改成功',
                icon: 'success'
              });
              this.setData({
                'petInfo.image': result.data.image
              });
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
              resolve(result);
            } else {
              throw new Error(result.message || '上传图片失败');
            }
          } catch (error) {
            console.error('上传图片失败:', error);
            wx.showToast({
              title: '上传图片失败',
              icon: 'none'
            });
            reject(error);
          }
        },
        fail: (error) => {
          console.error('上传图片失败:', error);
          wx.showToast({
            title: '上传图片失败',
            icon: 'none'
          });
          reject(error);
        }
      });
    });
  }
}); 