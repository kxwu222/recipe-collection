const api = require('../../utils/api')
const util = require('../../utils/util')
const { t, getCookingMethods, getDishTypes, getCookingMethodLabel, getDishTypeLabel } = require('../../utils/i18n')

Page({
  data: {
    recipe: null,
    isLoading: true,
    isAuthenticated: false,
    householdId: null,
    isEditing: false,
    editName: '',
    editDescription: '',
    editCookingMethod: '',
    editDishType: '',
    editCookTime: '',
    editServings: '',
    editSourceUrl: '',
    editIngredients: [],
    editSteps: [],
    editImageUrl: '',
    cookingMethods: [],
    dishTypes: [],
    showCookingMethodDropdown: false,
    showDishTypeDropdown: false,
    t: {}
  },

  onLoad(options) {
    const id = options.id
    const fromWeek = options.fromWeek === 'true'
    const edit = options.edit === 'true'
    this.setData({
      recipeId: parseInt(id),
      fromWeek: fromWeek,
      isEditing: edit,
      cookingMethods: getCookingMethods(),
      dishTypes: getDishTypes()
    })
    this.updateTranslations()
    this.checkAuth()
    
    if (edit) {
      this.loadRecipeForEdit()
    }
  },
  
  loadRecipeForEdit() {
    const { recipe } = this.data
    if (!recipe) {
      setTimeout(() => this.loadRecipeForEdit(), 100)
      return
    }
    
    this.setData({
      editName: recipe.name || '',
      editDescription: recipe.description || '',
      editCookingMethod: recipe.cookingMethod || '',
      editDishType: recipe.dishType || '',
      editCookTime: recipe.cookTimeMinutes ? recipe.cookTimeMinutes.toString() : '',
      editServings: recipe.servings ? recipe.servings.toString() : '',
      editSourceUrl: recipe.sourceUrl || '',
      editIngredients: (recipe.ingredients || []).map(ing => ({
        name: ing.name || '',
        quantity: ing.quantity || '',
        unit: ing.unit || '',
        notes: ing.notes || ''
      })),
      editSteps: (recipe.steps || []).map(step => ({
        instruction: step.instruction || ''
      })),
      editImageUrl: recipe.imageUrl || ''
    })
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
      recipe: t('recipe'),
      back: t('back'),
      edit: t('edit'),
      delete: t('delete'),
      save: t('save'),
      cancel: t('cancel'),
      recipeName: t('recipeName'),
      description: t('description'),
      cookingMethod: t('cookingMethod'),
      dishType: t('dishType'),
      cookTime: t('cookTime'),
      servings: t('servingsLabel'),
      sourceUrl: t('sourceUrl'),
      sourceUrlPlaceholder: t('sourceUrlPlaceholder'),
      copyLink: t('copyLink'),
      ingredients: t('ingredients'),
      steps: t('steps'),
      addIngredient: t('addIngredient'),
      addStep: t('addStep'),
      addToThisWeek: t('addToThisWeek'),
      shareLink: t('shareLink'),
      close: t('close'),
      loading: t('loading'),
      success: t('success'),
      error: t('error'),
      confirm: t('confirm'),
      deleteConfirm: t('deleteConfirm'),
      pleaseEnterRecipeName: t('pleaseEnterRecipeName'),
      pleaseSelectCookingMethod: t('pleaseSelectCookingMethod'),
      pleaseSelectDishType: t('pleaseSelectDishType'),
      requiredFields: t('requiredFields'),
      minutes: t('minutes'),
      // Cooking methods
      stir_fry: t('stir_fry'),
      steam: t('steam'),
      cold_mix: t('cold_mix'),
      braise: t('braise'),
      grill: t('grill'),
      boil: t('boil'),
      // Dish types
      cantonese: t('cantonese'),
      chaoshan: t('chaoshan'),
      hakka: t('hakka'),
      sichuan: t('sichuan'),
      jiangsu: t('jiangsu'),
      other: t('other')
    }
  },

  async loadData() {
    try {
      this.setData({ isLoading: true })
      
      const households = await api.getHouseholds()
      if (households && households.length > 0) {
        this.setData({ householdId: households[0].id })
      }
      
      const recipe = await api.getRecipe(this.data.recipeId)
      this.setData({ recipe })
    } catch (err) {
      console.error('Failed to load recipe:', err)
      util.showError('加载失败')
    } finally {
      this.setData({ isLoading: false })
    }
  },

  startEditing() {
    const { recipe, recipeId, fromWeek } = this.data
    if (!recipe) return

    const fromWeekParam = fromWeek ? '&fromWeek=true' : ''
    wx.navigateTo({
      url: `/pages/recipe/recipe?id=${recipeId}${fromWeekParam}&edit=true`
    })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({ editImageUrl: tempFilePath })
      }
    })
  },

  removeEditImage() {
    this.setData({ editImageUrl: '' })
  },

  cancelEditing() {
    wx.navigateBack()
  },

  onEditInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  toggleCookingMethodDropdown() {
    this.setData({ showCookingMethodDropdown: !this.data.showCookingMethodDropdown })
  },

  toggleDishTypeDropdown() {
    this.setData({ showDishTypeDropdown: !this.data.showDishTypeDropdown })
  },

  closeAllDropdowns() {
    this.setData({
      showCookingMethodDropdown: false,
      showDishTypeDropdown: false
    })
  },

  selectCookingMethod(e) {
    const method = e.currentTarget.dataset.method
    this.setData({
      editCookingMethod: method,
      showCookingMethodDropdown: false
    })
  },

  selectDishType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      editDishType: type,
      showDishTypeDropdown: false
    })
  },

  onIngredientInput(e) {
    const { index, field } = e.currentTarget.dataset
    const editIngredients = [...this.data.editIngredients]
    editIngredients[index][field] = e.detail.value
    this.setData({ editIngredients })
  },

  addIngredient() {
    const editIngredients = [...this.data.editIngredients, { name: '', quantity: '', unit: '', notes: '' }]
    this.setData({ editIngredients })
  },

  removeIngredient(e) {
    const index = e.currentTarget.dataset.index
    const editIngredients = [...this.data.editIngredients]
    editIngredients.splice(index, 1)
    this.setData({ editIngredients })
  },

  onStepInput(e) {
    const { index, field } = e.currentTarget.dataset
    const editSteps = [...this.data.editSteps]
    editSteps[index][field] = e.detail.value
    this.setData({ editSteps })
  },

  addStep() {
    const editSteps = [...this.data.editSteps, { instruction: '' }]
    this.setData({ editSteps })
  },

  removeStep(e) {
    const index = e.currentTarget.dataset.index
    const editSteps = [...this.data.editSteps]
    editSteps.splice(index, 1)
    this.setData({ editSteps })
  },

  async handleSave() {
    const { editName, editCookingMethod, editDishType, editIngredients, editSteps, recipeId, editImageUrl } = this.data

    if (!editName.trim()) {
      util.showError('请输入食谱名称')
      return
    }
    if (!editCookingMethod.trim()) {
      util.showError('请选择烹饪方法')
      return
    }
    if (!editDishType.trim()) {
      util.showError('请选择菜系')
      return
    }

    try {
      util.showLoading('保存中...')

      let imageUrl = editImageUrl
      if (editImageUrl && !editImageUrl.startsWith('http')) {
        try {
          const uploadResult = await api.uploadImage(editImageUrl)
          imageUrl = uploadResult.url || editImageUrl
        } catch (e) {
          console.log('Image upload failed, using local path')
        }
      }
      
      await api.updateRecipe(recipeId, {
        name: this.data.editName,
        description: this.data.editDescription,
        cookingMethod: this.data.editCookingMethod,
        dishType: this.data.editDishType,
        cookTimeMinutes: this.data.editCookTime ? parseInt(this.data.editCookTime) : null,
        servings: this.data.editServings ? parseInt(this.data.editServings) : null,
        ingredients: this.data.editIngredients,
        steps: this.data.editSteps,
        imageUrl: imageUrl || undefined,
        sourceUrl: this.data.editSourceUrl || undefined
      })

      util.hideLoading()
      util.showSuccess('保存成功')
      this.setData({ isEditing: false })
      this.loadData()
    } catch (err) {
      util.hideLoading()
      util.showError(err.message || '保存失败')
    }
  },

  goBack() {
    util.navigateBack()
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  copySourceUrl() {
    const { recipe } = this.data
    if (recipe && recipe.sourceUrl) {
      wx.setClipboardData({
        data: recipe.sourceUrl,
        success: () => {
          util.showSuccess('链接已复制')
        }
      })
    }
  },

  handleShare() {
    // Trigger share via onShareAppMessage
  },

  onShareAppMessage() {
    const { recipe } = this.data
    if (!recipe) return {}

    return {
      title: recipe.name,
      path: `/pages/recipe/recipe?id=${recipe.id}`
    }
  },

  async handleDelete() {
    const { recipe, recipeId } = this.data
    if (!recipe) return

    wx.showModal({
      title: '确认删除',
      content: `确定要删除「${recipe.name}」吗？`,
      confirmColor: '#E87461',
      success: async (res) => {
        if (res.confirm) {
          try {
            util.showLoading('删除中...')
            await api.deleteRecipe(recipeId)
            util.hideLoading()
            util.showSuccess('删除成功')
            
            // 标记需要刷新食谱列表
            const app = getApp()
            app.globalData.needRefreshRecipes = true
            
            setTimeout(() => {
              util.navigateBack()
            }, 1500)
          } catch (err) {
            util.hideLoading()
            util.showError(err.message || '删除失败')
          }
        }
      }
    })
  },

  async handleAddToWeek() {
    const { recipe, householdId } = this.data
    if (!recipe || !householdId) return

    try {
      util.showLoading('添加中...')
      const weekStartDate = util.getWeekStartDate()
      await api.addToWeeklyPlan({
        recipeId: recipe.id,
        householdId,
        weekStartDate
      })
      util.hideLoading()
      util.showSuccess('已添加到本周')
      
      // Set flag to refresh this-week page
      const app = getApp()
      app.globalData.needRefreshThisWeek = true
    } catch (err) {
      util.hideLoading()
      util.showError(err.message || '添加失败')
    }
  }
})
