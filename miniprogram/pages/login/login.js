const api = require('../../utils/api')
const util = require('../../utils/util')
const { t } = require('../../utils/i18n')

Page({
  data: {
    isLoading: false,
    t: {}
  },

  onLoad() {
    this.updateTranslations()
  },

  onShow() {
    this.updateTranslations()
  },

  updateTranslations() {
    this.setData({
      t: this.getTranslations()
    })
  },

  getTranslations() {
    return {
      appName: t('appName'),
      appDesc: t('appDesc'),
      wechatLogin: t('wechatLogin'),
      loading: t('loading'),
      success: t('success'),
      error: t('error')
    }
  },

  async handleWechatLogin() {
    try {
      this.setData({ isLoading: true })
      util.showLoading(this.data.t.loading || '登录中...')
      
      // wx.login with timeout
      const loginResult = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('登录超时，请重试'))
        }, 10000)
        
        wx.login({
          success: (res) => {
            clearTimeout(timer)
            resolve(res)
          },
          fail: (err) => {
            clearTimeout(timer)
            reject(err)
          }
        })
      })
      
      const app = getApp()
      
      // Check if baseUrl is configured
      if (!app.globalData.baseUrl) {
        // In development mode, skip actual API call
        // Use mock data for testing
        const mockUser = {
          id: 1,
          name: '测试用户',
        }
        wx.setStorageSync('token', 'mock-token')
        wx.setStorageSync('user', mockUser)
        app.globalData.user = mockUser
        
        util.hideLoading()
        this.setData({ isLoading: false })
        util.showSuccess('登录成功（测试模式）')
        
        setTimeout(() => {
          // Check for pending invite
          const app = getApp()
          if (app.globalData.pendingInviteCode) {
            const inviteCode = app.globalData.pendingInviteCode
            app.globalData.pendingInviteCode = null
            wx.redirectTo({ url: `/pages/family/family?inviteCode=${inviteCode}` })
          } else {
            wx.navigateBack()
          }
        }, 1000)
        return
      }
      
      // Production: call actual API
      const result = await app.login(loginResult.code)
      
      util.hideLoading()
      this.setData({ isLoading: false })
      util.showSuccess('登录成功')
      
      setTimeout(() => {
        // Check for pending invite
        const app = getApp()
        if (app.globalData.pendingInviteCode) {
          const inviteCode = app.globalData.pendingInviteCode
          app.globalData.pendingInviteCode = null
          wx.redirectTo({ url: `/pages/family/family?inviteCode=${inviteCode}` })
        } else {
          wx.navigateBack()
        }
      }, 1000)
    } catch (err) {
      util.hideLoading()
      this.setData({ isLoading: false })
      util.showError(err.message || '登录失败')
    }
  },

  goBack() {
    util.navigateBack()
  }
})
