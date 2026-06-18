// 获取北京时间
function getBeijingDate() {
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const beijingTime = new Date(utc + (8 * 3600000))
  return beijingTime
}

function getWeekStartDate() {
  const beijingTime = getBeijingDate()
  const day = beijingTime.getDay()
  const diff = beijingTime.getDate() - day
  const weekStart = new Date(beijingTime)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getTodayStr() {
  const beijingTime = getBeijingDate()
  return formatDate(beijingTime)
}

function formatTime(minutes) {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

function showToast(title, icon = 'none') {
  wx.showToast({ title, icon, duration: 2000 })
}

function showSuccess(title) {
  showToast(title, 'success')
}

function showError(title) {
  showToast(title, 'error')
}

function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true })
}

function hideLoading() {
  wx.hideLoading()
}

function showConfirm(content) {
  return new Promise((resolve) => {
    wx.showModal({
      title: '确认',
      content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

function navigateTo(url) {
  wx.navigateTo({ url })
}

function redirectTo(url) {
  wx.redirectTo({ url })
}

function switchTab(url) {
  wx.switchTab({ url })
}

function navigateBack(delta = 1) {
  wx.navigateBack({ delta })
}

function requireAuth() {
  const app = getApp()
  if (!app.globalData.user) {
    wx.navigateTo({ url: '/pages/login/login' })
    return false
  }
  return true
}

module.exports = {
  getBeijingDate,
  getWeekStartDate,
  formatDate,
  getTodayStr,
  formatTime,
  showToast,
  showSuccess,
  showError,
  showLoading,
  hideLoading,
  showConfirm,
  navigateTo,
  redirectTo,
  switchTab,
  navigateBack,
  requireAuth
}
