const api = require('../../utils/api')
const util = require('../../utils/util')
const { t, getCookingMethods, getDishTypes, getCookingMethodLabel, getDishTypeLabel } = require('../../utils/i18n')

Page({
  data: {
    recipes: [],
    filteredRecipes: [],
    isLoading: true,
    isAuthenticated: false,
    householdId: null,
    searchQuery: '',
    selectedMethod: null,
    selectedType: null,
    cookingMethods: [],
    dishTypes: [],
    t: {}
  },

  onLoad(options) {
    this.setData({
      cookingMethods: getCookingMethods(),
      dishTypes: getDishTypes()
    })
    this.updateTranslations()
    this.checkAuth()
    
    if (options.focusSearch === 'true') {
      setTimeout(() => {
        this.setData({ focusSearch: true })
      }, 100)
    }
  },

  onShow() {
    this.updateTranslations()
    this.checkAuth()
  },

  checkAuth() {
    const app = getApp()
    const user = app.globalData.user
    if (user) {
      this.setData({ isAuthenticated: true })
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
      recipes: t('recipes'),
      wechatLogin: t('wechatLogin'),
      login: t('login'),
      loginToContinue: t('loginToContinue'),
      addRecipe: t('addRecipe'),
      searchByIngredient: t('searchByIngredient'),
      cookingMethod: t('cookingMethod'),
      dishType: t('dishType'),
      loading: t('loading'),
      noRecipes: t('noRecipes'),
      addYourFirstRecipe: t('addYourFirstRecipe'),
      all: t('all')
    }
  },

  async loadData() {
    try {
      this.setData({ isLoading: true })
      
      const households = await api.getHouseholds()
      if (households && households.length > 0) {
        const householdId = households[0].id
        this.setData({ householdId })
        
        const recipes = await api.getRecipes(householdId)
        
        // 处理食谱，添加翻译标签
        const processedRecipes = (recipes || []).map(recipe => ({
          ...recipe,
          cookingMethodLabel: getCookingMethodLabel(recipe.cookingMethod),
          dishTypeLabel: getDishTypeLabel(recipe.dishType)
        }))
        
        console.log('[Recipes Page] Loaded recipes:', processedRecipes)
        this.setData({
          recipes: processedRecipes,
          filteredRecipes: processedRecipes
        })
        this.filterRecipes()
      }
    } catch (err) {
      console.error('Failed to load recipes:', err)
    } finally {
      this.setData({ isLoading: false })
    }
  },

  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value })
    this.filterRecipes()
  },

  clearSearch() {
    this.setData({ searchQuery: '' })
    this.filterRecipes()
  },

  selectMethod(e) {
    const method = e.currentTarget.dataset.method
    this.setData({
      selectedMethod: this.data.selectedMethod === method ? null : method
    })
    this.filterRecipes()
  },

  selectType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      selectedType: this.data.selectedType === type ? null : type
    })
    this.filterRecipes()
  },

  async filterRecipes() {
    const { recipes, searchQuery, selectedMethod, selectedType, householdId } = this.data
    
    let filtered = [...recipes]
    
    if (selectedMethod) {
      filtered = filtered.filter(r => r.cookingMethod === selectedMethod)
    }
    
    if (selectedType) {
      filtered = filtered.filter(r => r.dishType === selectedType)
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const nameMatches = filtered.filter(r => 
        r.name.toLowerCase().includes(query)
      )
      
      try {
        if (householdId) {
          const searchedByIngredient = await api.searchRecipes(householdId, query)
          const ingredientIds = (searchedByIngredient || []).map(r => r.id)
          const ingredientMatches = filtered.filter(r => ingredientIds.includes(r.id))
          
          const combined = new Set([...nameMatches, ...ingredientMatches])
          filtered = Array.from(combined)
        } else {
          filtered = nameMatches
        }
      } catch (err) {
        filtered = nameMatches
      }
    }
    
    this.setData({ filteredRecipes: filtered })
  },

  goToRecipe(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/recipe/recipe?id=${id}` })
  },

  goToAddRecipe() {
    wx.navigateTo({ url: '/pages/add-recipe/add-recipe' })
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
