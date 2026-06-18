const api = require('../../utils/api')
const util = require('../../utils/util')
const { t, getCookingMethodLabel, getDishTypeLabel } = require('../../utils/i18n')

Page({
  data: {
    weeklyPlan: [],
    toBuyList: [],
    isLoading: true,
    householdId: null,
    weekStartDate: null,
    activeTab: 'plan',
    t: {},
    dateRangeType: 'week',
    startDate: '',
    endDate: '',
    dateDisplayText: '',
    isDateRangeExpanded: false
  },

  onLoad() {
    this.updateTranslations()
    this.initDateRange()
    this.loadData()
  },

  initDateRange() {
    const weekStart = util.getWeekStartDate()
    const startDate = util.formatDate(weekStart)
    const endDate = this.getWeekEndDate(startDate)
    this.setData({
      startDate,
      endDate,
      dateDisplayText: `${startDate} - ${endDate}`
    })
  },

  onShow() {
    this.updateTranslations()
    this.loadData()
    
    // Check if we need to refresh data
    const app = getApp()
    if (app.globalData.needRefreshThisWeek) {
      app.globalData.needRefreshThisWeek = false
      this.loadData()
    }
    
    // Check if we need to switch to tobuy tab
    if (app.globalData.switchToBuyTab) {
      app.globalData.switchToBuyTab = false
      this.setData({ activeTab: 'tobuy' })
    }
  },

  updateTranslations() {
    this.setData({
      t: this.getTranslations()
    })
  },

  getTranslations() {
    return {
      thisWeek: t('thisWeek'),
      wechatLogin: t('wechatLogin'),
      login: t('login'),
      loginToContinue: t('loginToContinue'),
      weeklyPlan: t('weeklyPlan'),
      toBuyList: t('toBuyList'),
      addToWeek: t('addToWeek'),
      noRecipes: t('noRecipes'),
      loading: t('loading'),
      noItems: t('noItems'),
      addItem: t('addItem'),
      itemName: t('itemName'),
      quantityAndUnit: t('quantityAndUnit'),
      cancel: t('cancel'),
      confirm: t('confirm'),
      dateRange: t('dateRange'),
      today: t('today'),
      thisWeekLabel: t('thisWeek'),
      customRange: t('customRange'),
      startDate: t('startDate'),
      endDate: t('endDate')
    }
  },

  async loadData() {
    try {
      this.setData({ isLoading: true })
      
      const households = await api.getHouseholds()
      if (households && households.length > 0) {
        const householdId = households[0].id
        
        let weekStartDate = this.data.startDate
        if (!weekStartDate || this.data.dateRangeType === 'week') {
          const weekStart = util.getWeekStartDate()
          weekStartDate = util.formatDate(weekStart)
          const weekEndDate = this.getWeekEndDate(weekStartDate)
          this.setData({ 
            householdId, 
            weekStartDate,
            startDate: weekStartDate,
            endDate: weekEndDate,
            dateDisplayText: `${weekStartDate} - ${weekEndDate}`
          })
        } else {
          this.setData({ householdId, weekStartDate })
        }
        
        const [weeklyPlan, toBuyList] = await Promise.all([
          api.getWeeklyPlan(householdId, weekStartDate),
          api.getToBuyList(householdId, weekStartDate)
        ])
        
        // Process weekly plan to add translated labels
        const processedPlan = (weeklyPlan || []).map(item => ({
          ...item,
          recipe: {
            ...item.recipe,
            cookingMethodLabel: getCookingMethodLabel(item.recipe.cookingMethod),
            dishTypeLabel: getDishTypeLabel(item.recipe.dishType)
          }
        }))
        
        this.setData({
          weeklyPlan: processedPlan,
          toBuyList: toBuyList || []
        })
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      this.setData({ isLoading: false })
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  toggleDateRange() {
    this.setData({ isDateRangeExpanded: !this.data.isDateRangeExpanded })
  },

  setDateRange(e) {
    const type = e.currentTarget.dataset.type
    let startDate = ''
    let endDate = ''
    let dateDisplayText = ''

    if (type === 'today') {
      const todayStr = util.getTodayStr()
      startDate = todayStr
      endDate = todayStr
      dateDisplayText = todayStr
    } else if (type === 'week') {
      const weekStart = util.formatDate(util.getWeekStartDate())
      const weekEnd = this.getWeekEndDate(weekStart)
      startDate = weekStart
      endDate = weekEnd
      dateDisplayText = `${weekStart} - ${weekEnd}`
    }

    this.setData({
      dateRangeType: type,
      startDate,
      endDate,
      dateDisplayText
    })
    this.loadData()
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  getWeekEndDate(startDate) {
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return this.formatDate(end)
  },

  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value })
    this.loadData()
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value })
    this.loadData()
  },

  goToRecipe(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/recipe/recipe?id=${id}&fromWeek=true` })
  },

  goToAddToWeek() {
    wx.switchTab({ url: '/pages/recipes/recipes' })
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  async handleRemoveFromWeek(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认移除',
      content: '确定要从本周计划中移除吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.removeFromWeeklyPlan(id)
            this.loadData()
          } catch (err) {
            util.showError('移除失败')
          }
        }
      }
    })
  },

  async handleCheckToBuyItem(e) {
    const { id, checked } = e.currentTarget.dataset
    
    try {
      await api.checkToBuyItem(id, !checked)
      this.loadData()
    } catch (err) {
      util.showError('更新失败')
    }
  },

  async handleDeleteToBuyItem(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此物品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteToBuyItem(id)
            this.loadData()
          } catch (err) {
            util.showError('删除失败')
          }
        }
      }
    })
  },

  showAddItemModal() {
    this.setData({
      showAddModal: true,
      newItemName: '',
      newItemQuantity: '',
      newItemUnit: ''
    })
  },

  hideAddItemModal() {
    this.setData({ showAddModal: false })
  },

  preventBubble() {
    // 阻止事件冒泡
  },

  onNewItemNameInput(e) {
    this.setData({ newItemName: e.detail.value })
  },

  onNewItemQuantityInput(e) {
    this.setData({ newItemQuantity: e.detail.value })
  },

  onNewItemUnitInput(e) {
    this.setData({ newItemUnit: e.detail.value })
  },

  async handleAddToBuyItem() {
    const { newItemName, newItemQuantity, householdId, weekStartDate } = this.data
    
    if (!newItemName.trim()) {
      util.showError('请输入物品名称')
      return
    }

    // Parse quantity and unit from combined input (e.g., "2个" -> quantity: "2", unit: "个")
    let quantity = ''
    let unit = ''
    if (newItemQuantity.trim()) {
      const match = newItemQuantity.trim().match(/^(\d+)(.*)$/)
      if (match) {
        quantity = match[1]
        unit = match[2].trim()
      } else {
        quantity = newItemQuantity.trim()
      }
    }

    try {
      await api.addToBuyListItem({
        householdId,
        weekStartDate,
        itemName: newItemName.trim(),
        quantity: quantity || undefined,
        unit: unit || undefined
      })
      
      this.setData({ showAddModal: false })
      this.loadData()
    } catch (err) {
      util.showError('添加失败')
    }
  }
})
