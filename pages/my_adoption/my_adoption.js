const http = require('../../utils/request.js')

Page({
  data: {
    activeTab: 'myListings', // 当前激活的标签页：myListings, receivedApplications, myApplications
    myListings: [], // 我发布的领养列表
    receivedApplications: [], // 我收到的申请列表
    myApplications: [], // 我的申请列表
    loading: false,
    defaultImage: '/images/default-pet.jpg'
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.activeTab === 'myListings') {
      this.fetchMyListings()
    } else if (this.data.activeTab === 'receivedApplications') {
      this.fetchReceivedApplications()
    } else if (this.data.activeTab === 'myApplications') {
      this.fetchMyApplications()
    }
  },

  // 检查登录状态
  checkLogin() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000,
        success: () => {
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/login/login'
            })
          }, 2000)
        }
      })
      return false
    }
    return true
  },

  // 切换标签页
  handleTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    
    // 根据标签页加载对应数据
    if (tab === 'myListings') {
      this.fetchMyListings()
    } else if (tab === 'receivedApplications') {
      this.fetchReceivedApplications()
    } else if (tab === 'myApplications') {
      this.fetchMyApplications()
    }
  },

  // 获取宠物类型文本
  getPetTypeText(type) {
    const types = {
      'cat': '猫咪',
      'dog': '狗狗',
      'other': '其他'
    }
    return types[type] || type
  },

  // 获取我发布的领养列表
  async fetchMyListings() {
    if (!this.checkLogin()) return

    this.setData({ loading: true })
    try {
      const res = await http.get('/adoption-listings/getbyuserid')
      if (res.code === 200) {
        this.setData({
          myListings: res.data.map(listing => ({
            ...listing,
            petImage: listing.petImage || this.data.defaultImage,
            petBreed: this.getPetTypeText(listing.petBreed) // 转换宠物类型为中文
          }))
        })
      } else {
        wx.showToast({
          title: res.message || '获取列表失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取我的领养列表失败:', error)
      wx.showToast({
        title: '获取列表失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 获取我收到的申请
  async fetchReceivedApplications() {
    if (!this.checkLogin()) return

    this.setData({ loading: true })
    try {
      const allApplications = []
      // 获取所有收到的申请
      for (const listing of this.data.myListings) {
        const res = await http.get('/adoption-applications/getbyadoptionid', {
          id: listing.adoptionId
        })
        if (res.code === 200 && res.data) {
          // 为每个申请添加宠物信息
          const applicationsWithPetInfo = res.data.map(app => ({
            ...app,
            petName: listing.petName,
            petType: this.getPetTypeText(listing.petBreed), // 转换宠物类型为中文
            petImage: listing.petImage
          }))
          allApplications.push(...applicationsWithPetInfo)
        }
      }
      this.setData({ receivedApplications: allApplications })
    } catch (error) {
      console.error('获取收到的申请失败:', error)
      wx.showToast({
        title: '获取申请失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 获取我的申请
  async fetchMyApplications() {
    if (!this.checkLogin()) return

    this.setData({ loading: true })
    try {
      const res = await http.get('/adoption-applications/getbyuserid')
      console.log('获取到的申请列表原始数据:', res)
      
      if (res.code === 200) {
        // 过滤出我的申请（即我申请其他人的领养）
        const myApplications = res.data.filter(app =>
          !this.data.myListings.some(listing => listing.adoptionId === app.adoptionId)
        )
        console.log('过滤后的申请列表:', myApplications)
        
        // 为每个申请获取宠物信息
        const applicationsWithPetInfo = []
        for (const app of myApplications) {
          try {
            console.log('正在获取申请ID:', app.adoptionApplicationId, '的宠物信息')
            const listingRes = await http.get('/adoption-listings/get', {
              id: app.adoptionId
            })
            console.log('获取到的宠物信息:', listingRes)
            
            if (listingRes.code === 200 && listingRes.data) {
              const appWithInfo = {
                ...app,
                petName: listingRes.data.petName,
                petType: this.getPetTypeText(listingRes.data.petBreed), // 转换宠物类型为中文
                petImage: listingRes.data.petImage
              }
              console.log('处理后的申请信息:', appWithInfo)
              applicationsWithPetInfo.push(appWithInfo)
            }
          } catch (error) {
            console.error('获取宠物信息失败:', error)
            // 如果获取宠物信息失败，仍然保留申请信息
            applicationsWithPetInfo.push(app)
          }
        }
        
        console.log('最终设置的申请列表:', applicationsWithPetInfo)
        this.setData({ myApplications: applicationsWithPetInfo })
      } else {
        wx.showToast({
          title: res.message || '获取申请失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取我的申请失败:', error)
      wx.showToast({
        title: '获取申请失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 处理申请状态（同意/拒绝）
  async handleApplicationStatus(e) {
    const { id, status } = e.currentTarget.dataset
    if (!this.checkLogin()) return

    try {
      const res = await http.patch('/adoption-applications/update', {
        adoptionApplicationId: id,
        status: status,
        reviewedBy: wx.getStorageSync('userInfo').userId
      })

      if (res.code === 200) {
        wx.showToast({
          title: status === 'approved' ? '已同意申请' : '已拒绝申请',
          icon: 'success'
        })
        // 刷新申请列表
        this.fetchReceivedApplications()
        // 如果同意申请，同时更新领养状态
        if (status === 'approved') {
          this.fetchMyListings()
        }
      } else {
        wx.showToast({
          title: res.message || '操作失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('处理申请状态失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },

  // 取消申请
  async handleCancelApplication(e) {
    const { id } = e.currentTarget.dataset
    if (!this.checkLogin()) return

    try {
      const res = await http.delete('/adoption-applications/delete', {
        id: id
      })

      if (res.code === 200) {
        wx.showToast({
          title: '取消成功',
          icon: 'success'
        })
        this.fetchMyApplications()
      } else {
        wx.showToast({
          title: res.message || '取消失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('取消申请失败:', error)
      wx.showToast({
        title: '取消失败',
        icon: 'none'
      })
    }
  },

  // 删除领养信息
  async handleDeleteListing(e) {
    const { id } = e.currentTarget.dataset
    if (!this.checkLogin()) return

    wx.showModal({
      title: '提示',
      content: '确认删除该领养信息吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await http.delete('/adoption-listings/delete', {
              id: id
            })
            if (result.code === 200) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.fetchMyListings()
            } else {
              wx.showToast({
                title: result.message || '删除失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('删除领养信息失败:', error)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 获取申请状态文本
  getApplicationStatusText(status) {
    const statusMap = {
      'pending': '待审核',
      'approved': '已通过',
      'rejected': '已拒绝',
      'cancelled': '已取消'
    }
    return statusMap[status] || '未知状态'
  },

  // 获取申请状态类型
  getApplicationStatusType(status) {
    const typeMap = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'error',
      'cancelled': 'info'
    }
    return typeMap[status] || 'info'
  },

  // 格式化日期
  formatDate(date) {
    if (!date) return '未知时间'
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return '无效时间'

    const now = new Date()
    const diff = now - d
    const oneDay = 24 * 60 * 60 * 1000
    const oneHour = 60 * 60 * 1000
    const oneMinute = 60 * 1000

    // 如果是今天
    if (diff < oneDay && d.getDate() === now.getDate()) {
      if (diff < oneHour) {
        const minutes = Math.floor(diff / oneMinute)
        return `${minutes}分钟前`
      }
      const hours = Math.floor(diff / oneHour)
      return `${hours}小时前`
    }

    // 如果是昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.getDate() === yesterday.getDate() && 
        d.getMonth() === yesterday.getMonth() && 
        d.getFullYear() === yesterday.getFullYear()) {
      return `昨天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    }

    // 如果是今年
    if (d.getFullYear() === now.getFullYear()) {
      return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    }

    // 其他情况显示完整日期
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  },

  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset
    wx.previewImage({
      urls: [url],
      current: url
    })
  }
}) 