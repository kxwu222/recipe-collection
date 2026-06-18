const api = require('../../utils/api')
const { t, getCookingMethods, getDishTypes, addCustomCookingMethod, removeCustomCookingMethod, addCustomDishType, removeCustomDishType } = require('../../utils/i18n')
const util = require('../../utils/util')

Page({
  data: {
    user: null,
    isAuthenticated: false,
    household: null,
    recipeCount: 0,
    cookingMethods: [],
    dishTypes: [],
    showMethodSection: false,
    showTypeSection: false,
    t: {}
  },

  onLoad() {
    this.updateTranslations()
    this.checkAuth()
  },

  onShow() {
    this.updateTranslations()
    this.loadCustomLists()
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
      login: t('login'),
      cookingMethod: t('cookingMethod'),
      dishType: t('dishType')
    }
  },

  loadCustomLists() {
    this.setData({
      cookingMethods: getCookingMethods(),
      dishTypes: getDishTypes()
    })
  },

  toggleMethodSection() {
    this.setData({ showMethodSection: !this.data.showMethodSection })
  },

  toggleTypeSection() {
    this.setData({ showTypeSection: !this.data.showTypeSection })
  },

  addCookingMethod() {
    wx.showModal({
      title: '添加烹饪方法',
      editable: true,
      placeholderText: '例如：煎、炸、焗',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          addCustomCookingMethod(res.content.trim())
          this.loadCustomLists()
          wx.showToast({ title: '已添加', icon: 'success' })
        }
      }
    })
  },

  deleteCookingMethod(e) {
    const id = e.currentTarget.dataset.id
    const label = e.currentTarget.dataset.label
    wx.showModal({
      title: '删除确认',
      content: `确定删除「${label}」吗？`,
      success: (res) => {
        if (res.confirm) {
          removeCustomCookingMethod(id)
          this.loadCustomLists()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  addDishType() {
    wx.showModal({
      title: '添加菜系',
      editable: true,
      placeholderText: '例如：川菜、湘菜、鲁菜',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          addCustomDishType(res.content.trim())
          this.loadCustomLists()
          wx.showToast({ title: '已添加', icon: 'success' })
        }
      }
    })
  },

  deleteDishType(e) {
    const id = e.currentTarget.dataset.id
    const label = e.currentTarget.dataset.label
    wx.showModal({
      title: '删除确认',
      content: `确定删除「${label}」吗？`,
      success: (res) => {
        if (res.confirm) {
          removeCustomDishType(id)
          this.loadCustomLists()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
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
