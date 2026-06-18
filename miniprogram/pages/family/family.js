const api = require('../../utils/api')
const util = require('../../utils/util')
const { t } = require('../../utils/i18n')

Page({
  data: {
    household: null,
    members: [],
    isLoading: true,
    isAuthenticated: false,
    showCreateForm: false,
    isEditing: false,
    householdName: '',
    editHouseholdName: '',
    t: {}
  },

  onLoad(options) {
    this.updateTranslations()
    this.checkAuth()
    
    // Handle invite from share link
    if (options.inviteCode) {
      this.handleJoinByInvite(options.inviteCode)
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
      family: t('family'),
      household: t('household'),
      members: t('members'),
      createHousehold: t('createHousehold'),
      editHouseholdName: t('editHouseholdName'),
      cancel: t('cancel'),
      save: t('save'),
      loading: t('loading'),
      noHousehold: t('noHousehold'),
      familyName: t('familyName'),
      shareLink: t('shareLink'),
      inviteFriend: t('inviteFriend'),
      edit: t('edit'),
      user: t('user'),
      admin: t('admin'),
      member: t('member'),
      wechatLogin: t('wechatLogin'),
      loginToContinue: t('loginToContinue')
    }
  },

  async loadData() {
    try {
      this.setData({ isLoading: true })
      
      const households = await api.getHouseholds()
      if (households && households.length > 0) {
        const household = households[0]
        this.setData({ household })
        
        const members = await api.getHouseholdMembers(household.id)
        this.setData({ members: members || [] })
      }
    } catch (err) {
      console.error('Failed to load household:', err)
    } finally {
      this.setData({ isLoading: false })
    }
  },

  showCreate() {
    this.setData({ showCreateForm: true })
  },

  cancelForms() {
    this.setData({ showCreateForm: false })
  },

  onHouseholdNameInput(e) {
    this.setData({ householdName: e.detail.value })
  },

  async handleCreateHousehold() {
    if (!util.requireAuth()) return
    
    const { householdName } = this.data
    if (!householdName.trim()) {
      util.showError('请输入群名')
      return
    }

    try {
      util.showLoading('创建中...')
      await api.createHousehold({ name: householdName })
      util.hideLoading()
      util.showSuccess('创建成功')
      this.setData({ showCreateForm: false, householdName: '' })
      this.loadData()
    } catch (err) {
      util.hideLoading()
      util.showError(err.message || '创建失败')
    }
  },

  startEditing() {
    this.setData({
      isEditing: true,
      editHouseholdName: this.data.household.name || ''
    })
  },

  cancelEditing() {
    this.setData({ isEditing: false, editHouseholdName: '' })
  },

  onEditHouseholdNameInput(e) {
    this.setData({ editHouseholdName: e.detail.value })
  },

  async handleUpdateHousehold() {
    if (!util.requireAuth()) return
    
    const { editHouseholdName, household } = this.data
    if (!editHouseholdName.trim()) {
      util.showError('请输入群名')
      return
    }

    try {
      util.showLoading('保存中...')
      await api.updateHousehold(household.id, { name: editHouseholdName })
      util.hideLoading()
      util.showSuccess('保存成功')
      this.setData({ isEditing: false, editHouseholdName: '' })
      this.loadData()
    } catch (err) {
      util.hideLoading()
      util.showError(err.message || '保存失败')
    }
  },

  onShareAppMessage() {
    const { household } = this.data
    if (!household) return {}

    return {
      title: `邀请你加入「${household.name}」`,
      path: `/pages/family/family?inviteCode=${household.inviteCode}`
    }
  },

  async handleJoinByInvite(inviteCode) {
    const app = getApp()
    const user = app.globalData.user
    
    if (!user) {
      // Save invite code and redirect to login
      app.globalData.pendingInviteCode = inviteCode
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }

    try {
      util.showLoading('加入中...')
      await api.joinHousehold(inviteCode)
      util.hideLoading()
      util.showSuccess('已成功加入该群')
      this.loadData()
    } catch (err) {
      util.hideLoading()
      util.showError(err.message || '加入失败')
    }
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  }
})
