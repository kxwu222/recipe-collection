App({
  globalData: {
    user: null,
    householdId: null,
    baseUrl: '' // 留空使用mock数据
  },

  onLaunch() {
    this.checkLogin()
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    const user = wx.getStorageSync('user')
    if (token && user) {
      this.globalData.user = user
    }
  },

  login(code) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('登录超时，请重试'))
      }, 15000)
      
      wx.request({
        url: `${this.globalData.baseUrl}/api/auth/wechat-login`,
        method: 'POST',
        data: { code },
        timeout: 15000,
        success: (res) => {
          clearTimeout(timer)
          if (res.statusCode === 200 && res.data.token) {
            wx.setStorageSync('token', res.data.token)
            wx.setStorageSync('user', res.data.user)
            this.globalData.user = res.data.user
            resolve(res.data)
          } else {
            reject(new Error(res.data.error || '登录失败'))
          }
        },
        fail: (err) => {
          clearTimeout(timer)
          reject(new Error(err.errMsg || '网络请求失败'))
        }
      })
    })
  },

  logout() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('user')
    this.globalData.user = null
    this.globalData.householdId = null
  },

  isLoggedIn() {
    return !!this.globalData.user
  }
})
