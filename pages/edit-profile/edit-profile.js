// edit-profile.js
const userService = require('../../utils/userService');

Page({
  data: {
    userInfo: null,
    newPassword: '',
    confirmPassword: ''
  },

  onLoad() {
    this.loadUserInfo();
  },

  async loadUserInfo() {
    try {
      wx.showLoading({
        title: '加载中...'
      });

      const response = await userService.getUserInfo();
      if (response.code === 200) {
        this.setData({
          userInfo: response.data
        });
      } else {
        throw new Error(response.message || '获取用户信息失败');
      }

      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.error('获取用户信息失败:', error);
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    }
  },

  // 输入框事件处理
  onUsernameInput(e) {
    this.setData({
      'userInfo.username': e.detail.value
    });
  },

  onEmailInput(e) {
    this.setData({
      'userInfo.email': e.detail.value
    });
  },

  onPhoneInput(e) {
    this.setData({
      'userInfo.phone': e.detail.value
    });
  },

  onPasswordInput(e) {
    this.setData({
      newPassword: e.detail.value
    });
  },

  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },

  // 上传头像
  async handleUploadAvatar() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      const tempFilePath = res.tempFilePaths[0];
      console.log('选择的图片路径:', tempFilePath);
      
      // 获取图片信息
      const imageInfo = await wx.getImageInfo({
        src: tempFilePath
      });
      console.log('图片信息:', imageInfo);

      // 检查图片大小（限制为2MB）
      const fileSize = res.tempFiles[0].size;
      console.log('图片大小:', fileSize);
      if (fileSize > 2 * 1024 * 1024) {
        wx.showToast({
          title: '图片大小不能超过2MB',
          icon: 'none'
        });
        return;
      }

      // 检查图片格式
      const format = imageInfo.type.toLowerCase();
      console.log('图片格式:', format);
      if (!['jpeg', 'jpg', 'png'].includes(format)) {
        wx.showToast({
          title: '只支持JPG/PNG格式',
          icon: 'none'
        });
        return;
      }

      wx.showLoading({
        title: '上传中...',
        mask: true
      });

      try {
        const response = await userService.uploadProfile(tempFilePath);
        console.log('上传响应:', response);
        
        if (response.code === 200 && response.data) {
          this.setData({
            'userInfo.profile': response.data.profile
          });
          
          wx.showToast({
            title: '上传成功',
            icon: 'success',
            duration: 1500,
            success: () => {
              // 延迟返回，确保用户看到成功提示
              setTimeout(() => {
                // 设置全局数据，用于通知个人主页刷新
                getApp().globalData = getApp().globalData || {};
                getApp().globalData.needRefresh = true;
                // 返回上一页
                wx.navigateBack();
              }, 1500);
            }
          });
        } else {
          throw new Error(response.message || '上传失败');
        }
      } catch (error) {
        console.error('上传失败:', error);
        wx.showToast({
          title: error.message || '上传失败，请重试',
          icon: 'none',
          duration: 2000
        });
      } finally {
        wx.hideLoading();
      }
    } catch (error) {
      wx.hideLoading();
      console.error('选择图片失败:', error);
      wx.showToast({
        title: '选择图片失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 删除头像
  async handleDeleteAvatar() {
    try {
      const that = this;
      wx.showModal({
        title: '提示',
        content: '确定要删除头像吗？',
        async success(res) {
          if (res.confirm) {
            wx.showLoading({
              title: '删除中...'
            });

            const response = await userService.deleteProfile();
            
            if (response.code === 200) {
              that.setData({
                'userInfo.profile': null
              });
              
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });

              // 设置全局刷新标志
              getApp().globalData.needRefresh = true;
            }

            wx.hideLoading();
          }
        }
      });
    } catch (error) {
      wx.hideLoading();
      console.error('删除头像失败:', error);
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    }
  },

  // 保存修改
  async handleSave() {
    try {
      // 验证密码
      if (this.data.newPassword) {
        if (this.data.newPassword !== this.data.confirmPassword) {
          wx.showToast({
            title: '两次输入的密码不一致',
            icon: 'none'
          });
          return;
        }
        if (this.data.newPassword.length < 6) {
          wx.showToast({
            title: '密码长度不能小于6位',
            icon: 'none'
          });
          return;
        }
      }

      wx.showLoading({
        title: '保存中...'
      });

      const updateData = {
        username: this.data.userInfo.username
      };

      if (this.data.newPassword) {
        updateData.password = this.data.newPassword;
      }

      const response = await userService.updateUserInfo(updateData);
      
      if (response.code === 200) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });

        // 返回上一页并刷新
        setTimeout(() => {
          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2];
          prevPage.loadUserInfo();
          wx.navigateBack();
        }, 1500);
      }

      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.error('保存失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  // 上传头像成功后的处理
  handleUploadSuccess(result) {
    if (result.code === 200) {
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });
      
      // 更新头像显示
      this.setData({
        avatarUrl: result.data.profile
      });

      // 设置全局刷新标志
      getApp().globalData.needRefresh = true;

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack({
          delta: 1
        });
      }, 1500);
    } else {
      wx.showToast({
        title: result.message || '上传失败',
        icon: 'none'
      });
    }
  }
}); 