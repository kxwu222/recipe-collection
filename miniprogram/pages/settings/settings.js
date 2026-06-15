const api = require('../../utils/api')
const { t } = require('../../utils/i18n')
const util = require('../../utils/util')

Page({
  data: {
    user: null,
    isAuthenticated: false,
    household: null,
    recipeCount: 0,
    t: {}
  },

  onLoad() {
    this.updateTranslations()
    this.checkAuth()
  },

  onShow() {
    this.updateTranslations()
    this.checkAuth()
  },

  updateTranslations() {
    this.setData({
      t: this.getTranslations()
    })
  },

  getTranslations() {
    return {
      settings: t('settings'),
      user: t('user'),
      family: t('family'),
      household: t('household'),
      noHousehold: t('noHousehold'),
      viewMembers: t('viewMembers'),
      totalRecipes: t('totalRecipes'),
      logout: t('logout'),
      login: t('login')
    }
  },

  checkAuth() {
    const app = getApp()
    const user = app.globalData.user
    if (user) {
      this.setData({
        user,
        isAuthenticated: true
      })
      this.loadData()
    } else {
      this.setData({
        user: null,
        isAuthenticated: false,
        household: null,
        recipeCount: 0
      })
    }
  },

  async loadData() {
    try {
      const households = await api.getHouseholds()
      if (households && households.length > 0) {
        const household = households[0]
        this.setData({ household })

        const recipes = await api.getRecipes(household.id)
        this.setData({ recipeCount: (recipes || []).length })
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  },

  goToFamily() {
    wx.navigateTo({ url: '/pages/family/family' })
  },

  handleLogout() {
    wx.showModal({
      title: '确认',
      content: '确定要登出吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.logout()
          this.setData({
            user: null,
            isAuthenticated: false,
            household: null,
            recipeCount: 0
          })
          util.showSuccess('已登出')
        }
      }
    })
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
