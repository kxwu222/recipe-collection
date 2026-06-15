const api = require('../../utils/api')
const util = require('../../utils/util')
const { t, getCookingMethodLabel, getDishTypeLabel } = require('../../utils/i18n')

Page({
  data: {
    user: null,
    household: null,
    recentRecipes: [],
    isLoading: true,
    isAuthenticated: false,
    t: {}
  },

  onLoad() {
    this.updateTranslations()
  },

  onShow() {
    this.updateTranslations()
    this.checkAuth()
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
        isAuthenticated: false,
        isLoading: false
      })
    }
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
      loginHint: t('loginHint'),
      browseRecipes: t('browseRecipes'),
      home: t('home'),
      quickActions: t('quickActions'),
      addRecipe: t('addRecipe'),
      thisWeek: t('thisWeek'),
      toBuyList: t('toBuyList'),
      search: t('search'),
      viewAllRecipes: t('viewAllRecipes'),
      household: t('household'),
      viewMembers: t('viewMembers'),
      view: t('view'),
      createHousehold: t('createHousehold'),
      recentRecipes: t('recentRecipes'),
      viewAll: t('viewAll'),
      loading: t('loading'),
      noRecipes: t('noRecipes'),
      addYourFirstRecipe: t('addYourFirstRecipe'),
      welcomeBack: t('welcomeBack'),
      welcomeToKitchen: t('welcomeToKitchen'),
      wechatLogin: t('wechatLogin')
    }
  },

  async loadData() {
    try {
      this.setData({ isLoading: true })
      
      const households = await api.getHouseholds()
      
      if (households && households.length > 0) {
        const household = households[0]
        this.setData({ household })
        
        const recipes = await api.getRecipes(household.id)
        
        // Process recipes to add translated labels
        const recentRecipes = (recipes || []).slice(0, 4).map(recipe => ({
          ...recipe,
          cookingMethodLabel: getCookingMethodLabel(recipe.cookingMethod),
          dishTypeLabel: getDishTypeLabel(recipe.dishType)
        }))
        
        this.setData({ recentRecipes })
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      this.setData({ isLoading: false })
    }
  },

  goToAddRecipe() {
    wx.navigateTo({ url: '/pages/add-recipe/add-recipe' })
  },

  goToThisWeek() {
    wx.switchTab({ url: '/pages/this-week/this-week' })
  },

  goToToBuyList() {
    // 先设置全局变量，再切换tab
    const app = getApp()
    app.globalData.switchToBuyTab = true
    wx.switchTab({ url: '/pages/this-week/this-week' })
  },

  goToSearch() {
    wx.switchTab({ url: '/pages/recipes/recipes' })
  },

  goToRecipe(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/recipe/recipe?id=${id}` })
  },

  goToRecipes() {
    wx.switchTab({ url: '/pages/recipes/recipes' })
  },

  goToFamily() {
    wx.navigateTo({ url: '/pages/family/family' })
  },

  goToCreateHousehold() {
    wx.navigateTo({ url: '/pages/family/family' })
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
