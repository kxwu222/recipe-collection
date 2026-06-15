const app = getApp()

function request(options) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    const baseUrl = app.globalData.baseUrl || ''

    // If no baseUrl configured, use mock data for development
    if (!baseUrl) {
      console.log('[API] No baseUrl configured, using mock data')
      resolve(getMockData(options.url, options.data))
      return
    }

    const timer = setTimeout(() => {
      reject(new Error('请求超时，请检查网络'))
    }, options.timeout || 15000)

    wx.request({
      url: `${baseUrl}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: options.timeout || 15000,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.header || {})
      },
      success: (res) => {
        clearTimeout(timer)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('user')
          app.globalData.user = null
          wx.redirectTo({ url: '/pages/login/login' })
          reject(new Error('未授权，请重新登录'))
        } else {
          reject(new Error(res.data?.error || `请求失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        clearTimeout(timer)
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

// Mock data for development/testing - 持久化到本地存储
const defaultRecipes = [
  { id: 1, name: '番茄炒蛋', cookingMethod: 'stir_fry', dishType: 'cantonese', nameEn: 'Tomato Scrambled Eggs', cookTimeMinutes: 15, servings: 2, householdId: 1 },
  { id: 2, name: '清蒸鱼', cookingMethod: 'steam', dishType: 'cantonese', nameEn: 'Steamed Fish', cookTimeMinutes: 20, servings: 4, householdId: 1 },
  { id: 3, name: '凉拌黄瓜', cookingMethod: 'cold_mix', dishType: 'cantonese', nameEn: 'Cucumber Salad', cookTimeMinutes: 10, servings: 2, householdId: 1 }
]

// 从本地存储加载或使用默认数据
function loadMockRecipes() {
  try {
    const saved = wx.getStorageSync('mockRecipes')
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved
    }
  } catch (e) {
    console.log('[API] Failed to load mock recipes:', e)
  }
  return defaultRecipes
}

function saveMockRecipes(recipes) {
  try {
    wx.setStorageSync('mockRecipes', recipes)
  } catch (e) {
    console.log('[API] Failed to save mock recipes:', e)
  }
}

let mockHousehold = { id: 1, name: '我的家庭', inviteCode: 'abc123' }
let mockWeeklyPlan = []
let mockToBuyList = []
let mockRecipes = loadMockRecipes()

function getRecipeById(id) {
  return mockRecipes.find(r => r.id === id) || mockRecipes[0]
}

function getMockData(url, data) {
  console.log('[API Mock]', url, data)
  
  if (url.includes('/household/list')) {
    return [mockHousehold]
  }
  if (url.includes('/household/update')) {
    console.log('[API Mock] Update household:', data)
    if (data && data.name) {
      mockHousehold.name = data.name
    }
    return { success: true }
  }
  if (url.includes('/recipe/list')) {
    console.log('[API Mock] Get recipes list:', mockRecipes.length, 'recipes')
    console.log('[API Mock] Recipes:', mockRecipes.map(r => r.name))
    return mockRecipes
  }
  if (url.includes('/recipe/create')) {
    const newRecipe = {
      id: mockRecipes.length + 1,
      name: data?.name || '未命名',
      cookingMethod: data?.cookingMethod || '',
      dishType: data?.dishType || '',
      cookTimeMinutes: data?.cookTimeMinutes || null,
      servings: data?.servings || null,
      ingredients: data?.ingredients || [],
      steps: data?.steps || [],
      sourceUrl: data?.sourceUrl || null,
      imageUrl: data?.imageUrl || null,
      householdId: data?.householdId || 1
    }
    mockRecipes.push(newRecipe)
    saveMockRecipes(mockRecipes)
    console.log('[API Mock] Created recipe:', newRecipe)
    console.log('[API Mock] Total recipes now:', mockRecipes.length)
    return { id: newRecipe.id, success: true }
  }
  if (url.includes('/recipe/get')) {
    const recipe = mockRecipes.find(r => r.id === data?.id) || mockRecipes[0]
    return {
      ...recipe,
      description: recipe.description || '经典家常菜',
      ingredients: recipe.ingredients || [
        { id: 1, name: '番茄', nameEn: 'Tomato', quantity: '2', unit: '个' },
        { id: 2, name: '鸡蛋', nameEn: 'Eggs', quantity: '3', unit: '个' }
      ],
      steps: recipe.steps || [
        { id: 1, instruction: '番茄切块', instructionEn: 'Cut tomatoes into pieces' },
        { id: 2, instruction: '鸡蛋打散', instructionEn: 'Beat the eggs' },
        { id: 3, instruction: '先炒鸡蛋，再炒番茄', instructionEn: 'Scramble eggs first, then stir-fry tomatoes' }
      ]
    }
  }
  if (url.includes('/recipe/update')) {
    const recipeIndex = mockRecipes.findIndex(r => r.id === data?.id)
    if (recipeIndex !== -1) {
      mockRecipes[recipeIndex] = { ...mockRecipes[recipeIndex], ...data.data }
      saveMockRecipes(mockRecipes)
      return { success: true }
    }
    return { success: true }
  }
  if (url.includes('/recipe/delete')) {
    const recipeIndex = mockRecipes.findIndex(r => r.id === data?.id)
    if (recipeIndex !== -1) {
      mockRecipes.splice(recipeIndex, 1)
      saveMockRecipes(mockRecipes)
      console.log('[API Mock] Deleted recipe, remaining:', mockRecipes.length)
    }
    return { success: true }
  }
  if (url.includes('/recipe/search')) {
    return []
  }
  if (url.includes('/recipe/extract')) {
    // Mock URL extraction - simulate different recipe based on URL
    const urlStr = data?.url || '';
    const extractedRecipes = [
      {
        id: mockRecipes.length + 1,
        name: '红烧肉',
        cookingMethod: 'braise',
        dishType: 'cantonese',
        description: '经典家常菜，肥而不腻',
        cookTimeMinutes: 60,
        servings: 4,
        sourceUrl: urlStr,
        ingredients: [
          { name: '五花肉', quantity: '500', unit: 'g' },
          { name: '生姜', quantity: '3', unit: '片' },
          { name: '葱', quantity: '2', unit: '根' },
          { name: '酱油', quantity: '2', unit: '勺' },
          { name: '冰糖', quantity: '30', unit: 'g' }
        ],
        steps: [
          { instruction: '五花肉切块，焯水去血沫' },
          { instruction: '锅中放油，加冰糖炒出糖色' },
          { instruction: '放入五花肉翻炒上色' },
          { instruction: '加入酱油、姜片、葱段和适量水' },
          { instruction: '大火烧开后转小火炖45分钟' },
          { instruction: '大火收汁即可' }
        ]
      },
      {
        id: mockRecipes.length + 2,
        name: '蒜蓉西兰花',
        cookingMethod: 'stir_fry',
        dishType: 'cantonese',
        description: '清淡健康的快手菜',
        cookTimeMinutes: 10,
        servings: 2,
        sourceUrl: urlStr,
        ingredients: [
          { name: '西兰花', quantity: '1', unit: '棵' },
          { name: '大蒜', quantity: '5', unit: '瓣' },
          { name: '盐', quantity: '适量', unit: '' }
        ],
        steps: [
          { instruction: '西兰花切小朵，焯水' },
          { instruction: '大蒜切末' },
          { instruction: '锅中放油，爆香蒜末' },
          { instruction: '放入西兰花翻炒，加盐调味' }
        ]
      }
    ]
    // Pick a recipe based on URL content
    const index = urlStr.includes('肉') ? 0 : 1
    return extractedRecipes[index]
  }
  if (url.includes('/weekly-plan/list')) {
    // Return all items (mock doesn't filter by date)
    return mockWeeklyPlan
  }
  if (url.includes('/weekly-plan/add')) {
    const recipe = getRecipeById(data?.recipeId)
    const newItem = {
      id: mockWeeklyPlan.length + 1,
      recipeId: data?.recipeId,
      recipe: recipe,
      weekStartDate: data?.weekStartDate
    }
    mockWeeklyPlan.push(newItem)
    console.log('[API Mock] Added to weekly plan:', newItem)
    console.log('[API Mock] Current weekly plan:', mockWeeklyPlan)
    return { success: true }
  }
  if (url.includes('/to-buy-list/list')) {
    return mockToBuyList
  }
  if (url.includes('/to-buy-list/add')) {
    const newItem = {
      id: mockToBuyList.length + 1,
      itemName: data?.itemName || '',
      quantity: data?.quantity || '',
      unit: data?.unit || '',
      isChecked: false
    }
    mockToBuyList.push(newItem)
    return { success: true, id: newItem.id }
  }
  if (url.includes('/to-buy-list/check')) {
    const item = mockToBuyList.find(i => i.id === data?.id)
    if (item) {
      item.isChecked = data?.isChecked
    }
    return { success: true }
  }
  if (url.includes('/to-buy-list/delete')) {
    mockToBuyList = mockToBuyList.filter(i => i.id !== data?.id)
    return { success: true }
  }
  if (url.includes('/household/members')) {
    return [
      { id: 1, userId: 1, role: 'admin', user: { name: '测试用户', email: 'test@example.com' } }
    ]
  }
  
  return {}
}

function get(url, data) {
  return request({ url, method: 'GET', data })
}

function post(url, data) {
  return request({ url, method: 'POST', data })
}

function put(url, data) {
  return request({ url, method: 'PUT', data })
}

function del(url, data) {
  return request({ url, method: 'DELETE', data })
}

// Household API
function getHouseholds() {
  return get('/household/list')
}

function createHousehold(name) {
  return post('/household/create', { name })
}

function updateHousehold(id, data) {
  return put('/household/update', { id, ...data })
}

function joinHousehold(inviteCode) {
  return post('/household/join', { inviteCode })
}

function getHouseholdMembers(householdId) {
  return get('/household/members', { householdId })
}

// Recipe API
function getRecipes(householdId) {
  return get('/recipe/list', { householdId })
}

function getRecipe(id) {
  return get('/recipe/get', { id })
}

function createRecipe(data) {
  return post('/recipe/create', data)
}

function updateRecipe(id, data) {
  return put('/recipe/update', { id, data })
}

function deleteRecipe(id) {
  return del('/recipe/delete', { id })
}

function extractRecipe(url) {
  return post('/recipe/extract', { url })
}

function searchRecipes(householdId, ingredientName) {
  return get('/recipe/search', { householdId, ingredientName })
}

// Weekly Plan API
function getWeeklyPlan(householdId, weekStartDate) {
  return get('/weekly-plan/list', { householdId, weekStartDate })
}

function addToWeeklyPlan(data) {
  return post('/weekly-plan/add', data)
}

function removeFromWeeklyPlan(id) {
  return del('/weekly-plan/remove', { id })
}

function getChecklist(weeklyPlanId) {
  return get('/weekly-plan/checklist', { weeklyPlanId })
}

function checkIngredient(checklistId, isChecked) {
  return post('/weekly-plan/check-ingredient', { checklistId, isChecked })
}

// To-Buy List API
function getToBuyList(householdId, weekStartDate) {
  return get('/to-buy-list/list', { householdId, weekStartDate })
}

function addToBuyListItem(data) {
  return post('/to-buy-list/add', data)
}

function checkToBuyItem(id, isChecked) {
  return post('/to-buy-list/check', { id, isChecked })
}

function deleteToBuyItem(id) {
  return del('/to-buy-list/delete', { id })
}

// Auth API
function wechatLogin(code) {
  return post('/auth/wechat-login', { code })
}

function getMe() {
  return get('/auth/me')
}

function logout() {
  return post('/auth/logout')
}

// Upload API
function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    const baseUrl = app.globalData.baseUrl || ''

    wx.uploadFile({
      url: `${baseUrl}/upload`,
      filePath: filePath,
      name: 'file',
      header: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = JSON.parse(res.data)
          resolve(data)
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '上传失败'))
      }
    })
  })
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  getHouseholds,
  createHousehold,
  updateHousehold,
  joinHousehold,
  getHouseholdMembers,
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  extractRecipe,
  searchRecipes,
  getWeeklyPlan,
  addToWeeklyPlan,
  removeFromWeeklyPlan,
  getChecklist,
  checkIngredient,
  getToBuyList,
  addToBuyListItem,
  checkToBuyItem,
  deleteToBuyItem,
  wechatLogin,
  getMe,
  logout,
  uploadImage
}
