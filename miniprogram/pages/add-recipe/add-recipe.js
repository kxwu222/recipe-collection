const api = require('../../utils/api')
const util = require('../../utils/util')
const { t, getCookingMethods, getDishTypes, getCookingMethodLabel } = require('../../utils/i18n')

Page({
  data: {
    isAuthenticated: false,
    householdId: null,
    smartText: '',
    sourceUrl: '',
    isParsing: false,
    parsedResult: null,
    imageUrl: '',
    imageFile: null,
    cookingMethods: [],
    dishTypes: [],
    showParsedCookingMethodDropdown: false,
    showParsedDishTypeDropdown: false,
    t: {}
  },

  onLoad() {
    this.setData({
      cookingMethods: getCookingMethods(),
      dishTypes: getDishTypes()
    })
    this.updateTranslations()
    this.checkAuth()
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
      this.loadHousehold()
    } else {
      // For development with mock data, allow access without auth
      this.setData({ 
        isAuthenticated: true,
        householdId: 'mock-household-1'
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
      addRecipe: t('addRecipe'),
      smartRecognition: t('smartRecognition'),
      pasteRecipeText: t('pasteRecipeText'),
      smartRecognitionPlaceholder: t('smartRecognitionPlaceholder'),
      parseAndFill: t('parseAndFill'),
      parsedResult: t('parsedResult'),
      parsedResultHint: t('parsedResultHint'),
      useParsedData: t('useParsedData'),
      imageUpload: t('imageUpload'),
      recipeName: t('recipeName'),
      cookingMethod: t('cookingMethod'),
      dishType: t('dishType'),
      cookTime: t('cookTime'),
      servings: t('servings'),
      sourceUrl: t('sourceUrl'),
      sourceUrlPlaceholder: t('sourceUrlPlaceholder'),
      ingredients: t('ingredients'),
      pleaseSelectCookingMethod: t('pleaseSelectCookingMethod'),
      pleaseSelectDishType: t('pleaseSelectDishType'),
      stir_fry: t('stir_fry'),
      steam: t('steam'),
      cold_mix: t('cold_mix'),
      braise: t('braise'),
      grill: t('grill'),
      boil: t('boil'),
      cantonese: t('cantonese'),
      chaoshan: t('chaoshan'),
      hakka: t('hakka'),
      sichuan: t('sichuan'),
      jiangsu: t('jiangsu'),
      other: t('other'),
      loginToContinue: t('loginToContinue'),
      wechatLogin: t('wechatLogin'),
      loading: t('loading')
    }
  },

  async loadHousehold() {
    try {
      const households = await api.getHouseholds()
      if (households && households.length > 0) {
        this.setData({ householdId: households[0].id })
      }
    } catch (err) {
      console.error('Failed to load household:', err)
    }
  },

  onSmartTextInput(e) {
    this.setData({ smartText: e.detail.value })
  },

  onSourceUrlInput(e) {
    this.setData({ sourceUrl: e.detail.value })
  },

  handleSmartParse() {
    const { smartText } = this.data
    
    if (!smartText.trim()) {
      util.showError('请输入菜谱文字')
      return
    }

    this.setData({ isParsing: true })

    try {
      const result = this.parseRecipeText(smartText)
      this.setData({ 
        parsedResult: result,
        isParsing: false 
      })
    } catch (err) {
      this.setData({ isParsing: false })
      util.showError('解析失败，请检查文字格式')
    }
  },

  parseRecipeText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l)
    let name = ''
    let cookingMethod = ''
    let dishType = ''
    let cookTime = ''
    let servings = ''
    let ingredients = []
    let steps = []
    let inStepsSection = false

    const cookingMethodKeywords = {
      'stir_fry': ['炒', '爆炒', '翻炒', '快炒', '小炒', '煸炒'],
      'steam': ['蒸', '清蒸', '隔水蒸'],
      'cold_mix': ['凉拌', '拌', '白灼'],
      'braise': ['炖', '焖', '红烧', '卤', '煲'],
      'grill': ['烤', '烧烤', '炙', '煎'],
      'boil': ['煮', '水煮', '白煮', '汆']
    }

    const dishTypeKeywords = {
      'cantonese': ['粤菜', '广式', '广东', '广州'],
      'chaoshan': ['潮汕', '潮州', '潮式'],
      'hakka': ['客家', '客家菜']
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (i === 0 && !name) {
        name = line.replace(/[:：\-—].*$/, '').trim()
        if (name.length > 20) name = name.substring(0, 20)
      }

      if (line.match(/^(步骤|做法|制作方法|做法步骤)[:：]?\s*$/)) {
        inStepsSection = true
        continue
      }

      const timeMatch = line.match(/(\d+)\s*分钟/)
      if (timeMatch) {
        cookTime = timeMatch[1]
      }

      const servingsMatch = line.match(/(\d+)\s*[人份位]/)
      if (servingsMatch) {
        servings = servingsMatch[1]
      }

      for (const [method, keywords] of Object.entries(cookingMethodKeywords)) {
        if (keywords.some(kw => line.includes(kw))) {
          cookingMethod = method
          break
        }
      }

      for (const [type, keywords] of Object.entries(dishTypeKeywords)) {
        if (keywords.some(kw => line.includes(kw))) {
          dishType = type
          break
        }
      }

      const ingredientMatch = line.match(/^[-•]?\s*(.+?)[\s:：]+(\d+\s*[个只条块斤克两袋包根片朵碗杯勺gmlml]*)$/)
      if (ingredientMatch && !inStepsSection) {
        ingredients.push({
          name: ingredientMatch[1].trim(),
          quantity: ingredientMatch[2].trim(),
          unit: ''
        })
        continue
      }

      const stepMatch = line.match(/^\d+[.、)\]】]\s*(.+)/)
      if (stepMatch || (inStepsSection && line.length > 5)) {
        const stepText = stepMatch ? stepMatch[1].trim() : line
        steps.push({ instruction: stepText })
      }
    }

    if (!cookingMethod) {
      cookingMethod = 'stir_fry'
    }

    return {
      name,
      cookingMethod,
      cookingMethodLabel: getCookingMethodLabel(cookingMethod),
      dishType,
      cookTime,
      servings,
      ingredients,
      steps
    }
  },

  onParsedNameInput(e) {
    this.setData({ 'parsedResult.name': e.detail.value })
  },

  onParsedCookTimeInput(e) {
    this.setData({ 'parsedResult.cookTime': e.detail.value })
  },

  onParsedServingsInput(e) {
    this.setData({ 'parsedResult.servings': e.detail.value })
  },

  toggleParsedCookingMethodDropdown() {
    this.setData({ showParsedCookingMethodDropdown: !this.data.showParsedCookingMethodDropdown })
  },

  selectParsedCookingMethod(e) {
    const method = e.currentTarget.dataset.method
    this.setData({
      'parsedResult.cookingMethod': method,
      showParsedCookingMethodDropdown: false
    })
  },

  toggleParsedDishTypeDropdown() {
    this.setData({ showParsedDishTypeDropdown: !this.data.showParsedDishTypeDropdown })
  },

  selectParsedDishType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      'parsedResult.dishType': type,
      showParsedDishTypeDropdown: false
    })
  },

  onParsedIngredientInput(e) {
    const { index, field } = e.currentTarget.dataset
    const ingredients = [...this.data.parsedResult.ingredients]
    ingredients[index] = { ...ingredients[index], [field]: e.detail.value }
    this.setData({ 'parsedResult.ingredients': ingredients })
  },

  addParsedIngredient() {
    const ingredients = [...this.data.parsedResult.ingredients, { name: '', quantity: '', unit: '' }]
    this.setData({ 'parsedResult.ingredients': ingredients })
  },

  removeParsedIngredient(e) {
    const index = e.currentTarget.dataset.index
    const ingredients = this.data.parsedResult.ingredients.filter((_, i) => i !== index)
    this.setData({ 'parsedResult.ingredients': ingredients })
  },

  onParsedStepInput(e) {
    const { index, field } = e.currentTarget.dataset
    const steps = [...this.data.parsedResult.steps]
    steps[index] = { ...steps[index], [field]: e.detail.value }
    this.setData({ 'parsedResult.steps': steps })
  },

  addParsedStep() {
    const steps = [...this.data.parsedResult.steps, { instruction: '' }]
    this.setData({ 'parsedResult.steps': steps })
  },

  removeParsedStep(e) {
    const index = e.currentTarget.dataset.index
    const steps = this.data.parsedResult.steps.filter((_, i) => i !== index)
    this.setData({ 'parsedResult.steps': steps })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({
          imageUrl: tempFilePath,
          imageFile: res.tempFiles[0]
        })
      }
    })
  },

  removeImage() {
    this.setData({
      imageUrl: '',
      imageFile: null
    })
  },

  async handleApplyParsed() {
    const { parsedResult, householdId, imageUrl, sourceUrl } = this.data
    
    if (!parsedResult) return

    if (!householdId) {
      util.showError('请先创建或加入家庭')
      return
    }

    try {
      util.showLoading('添加中...')

      let finalImageUrl = imageUrl
      if (imageUrl && !imageUrl.startsWith('http')) {
        try {
          const uploadResult = await api.uploadImage(imageUrl)
          finalImageUrl = uploadResult.url || imageUrl
        } catch (e) {
          console.log('Image upload failed, using local path')
        }
      }
      
      const result = await api.createRecipe({
        name: parsedResult.name || '',
        cookingMethod: parsedResult.cookingMethod || '',
        dishType: parsedResult.dishType || '',
        cookTimeMinutes: parsedResult.cookTime ? parseInt(parsedResult.cookTime) : undefined,
        servings: parsedResult.servings ? parseInt(parsedResult.servings) : undefined,
        ingredients: (parsedResult.ingredients || []).filter(i => i.name.trim()),
        steps: (parsedResult.steps || []).filter(s => s.instruction.trim()),
        imageUrl: finalImageUrl || undefined,
        sourceUrl: sourceUrl || undefined,
        householdId
      })
      
      util.hideLoading()
      util.showSuccess('添加成功')
      
      this.setData({
        parsedResult: null,
        smartText: '',
        sourceUrl: '',
        imageUrl: '',
        imageFile: null
      })
      
      const app = getApp()
      app.globalData.needRefreshRecipes = true
    } catch (err) {
      util.hideLoading()
      util.showError(err.message || '添加失败')
    }
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
