const store = require('../../utils/store.js')

// 年龄 → 默认头像 emoji
function emojiForAge(age) {
  if (age <= 4) return '👶'
  if (age <= 17) return '🧒'
  if (age >= 55) return '👴'
  return '🧑'
}

Page({
  data: {
    members: [],
    selectedId: '',
    creating: false,
    newName: '',
    newAge: '',
    familyName: '我们家',
    canConfirm: false
  },

  onLoad() {
    // 已完成引导 → 直接进首页，避免闪屏
    if (store.isOnboarded()) {
      wx.switchTab({ url: '/pages/index/index' })
      return
    }
    this.refresh()
  },

  onShow() {
    if (store.isOnboarded() && this.data.members.length) {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  refresh() {
    const members = store.getMembers().map(m => ({
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      role: m.role,
      age: m.age,
      themeColor: m.themeColor,
      avatarUrl: m.avatarUrl || ''
    }))
    this.setData({
      members,
      familyName: store.getFamilyInfo().name,
      canConfirm: !!this.data.selectedId || this.data.creating
    })
  },

  selectMember(e) {
    const id = e.currentTarget.dataset.id
    const next = id === this.data.selectedId ? '' : id
    this.setData({ selectedId: next, creating: false, canConfirm: !!next })
  },

  startCreate() {
    this.setData({ creating: true, selectedId: '', canConfirm: true })
  },

  cancelCreate() {
    this.setData({ creating: false, newName: '', newAge: '', canConfirm: !!this.data.selectedId })
  },

  onNameInput(e) {
    this.setData({ newName: e.detail.value })
  },

  onAgeInput(e) {
    this.setData({ newAge: e.detail.value })
  },

  onFamilyName(e) {
    this.setData({ familyName: e.detail.value })
  },

  confirm() {
    let id = this.data.selectedId

    if (this.data.creating) {
      const name = (this.data.newName || '').trim()
      if (!name) {
        wx.showToast({ title: '先给自己起个名字吧', icon: 'none' })
        return
      }
      const age = parseInt(this.data.newAge, 10)
      if (!age || age < 1 || age > 120) {
        wx.showToast({ title: '请填写 1-120 的年龄', icon: 'none' })
        return
      }
      const member = store.addMember({ name, age, emoji: emojiForAge(age) })
      id = member.id
    }

    if (!id) {
      wx.showToast({ title: '选择「我是谁」', icon: 'none' })
      return
    }

    const familyName = (this.data.familyName || '').trim()
    if (familyName) store.setFamilyInfo({ name: familyName })
    store.setCurrentMember(id)

    wx.showToast({ title: '欢迎回家', icon: 'success' })
    setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 500)
  }
})
