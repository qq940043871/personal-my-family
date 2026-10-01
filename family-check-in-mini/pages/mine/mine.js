const store = require('../../utils/store.js')

Page({
  data: {
    me: null,
    myStage: null,
    myDoneCount: 0,
    myTotalCount: 0,
    // 家庭管理
    familyName: '',
    familyMembers: [],
    memberCount: 0,
    stats: {},
    statsTotalPoints: '0'
  },

  onShow() {
    if (!store.isOnboarded()) {
      wx.reLaunch({ url: '/pages/welcome/welcome' })
      return
    }
    this.refresh()
  },

  refresh() {
    const me = store.getCurrentMember()
    if (!me) {
      wx.reLaunch({ url: '/pages/welcome/welcome' })
      return
    }
    const members = store.getMembers()
    const stats = store.getFamilyStats()
    const stage = store.stageFor(me)

    const familyMembers = members.map(m => ({
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      role: m.role,
      age: m.age,
      themeColor: m.themeColor,
      avatarUrl: m.avatarUrl || '',
      isMe: m.id === me.id
    }))

    this.setData({
      me: {
        id: me.id,
        name: me.name,
        emoji: me.emoji,
        role: me.role,
        age: me.age,
        themeColor: me.themeColor,
        avatarUrl: me.avatarUrl || '',
        petName: (me.pet && me.pet.name) || '',
        streak: me.streak,
        points: store.scoreValue(me),
        scoreLabel: store.scoreLabel(me)
      },
      myStage: stage,
      myDoneCount: me.tasks.filter(t => t.done).length,
      myTotalCount: me.tasks.length,
      familyName: store.getFamilyInfo().name,
      familyMembers,
      memberCount: members.length,
      stats,
      statsTotalPoints: stats.totalPoints.toLocaleString()
    })
  },

  /* ===== 切换身份 ===== */
  switchRole() {
    const members = store.getMembers()
    const list = members.slice(0, 6)
    wx.showActionSheet({
      itemList: list.map(m => (m.id === this.data.me.id ? '✓ ' + m.name + '（当前）' : m.name)),
      success: (res) => {
        const target = list[res.tapIndex]
        if (!target || target.id === this.data.me.id) return
        if (store.setCurrentMember(target.id)) {
          wx.showToast({ title: '已切换为「' + target.name + '」', icon: 'none' })
          this.refresh()
        }
      }
    })
  },

  /* ===== 我的资料 ===== */
  openMyEdit() {
    wx.navigateTo({ url: '/pages/member/member?id=' + this.data.me.id })
  },

  openMyDetail() {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + this.data.me.id })
  },

  goFamily() {
    wx.switchTab({ url: '/pages/family/family' })
  },

  /* ===== 家庭管理 ===== */
  openAdd() {
    wx.navigateTo({ url: '/pages/member/member?mode=add' })
  },

  openEdit(e) {
    wx.navigateTo({ url: '/pages/member/member?id=' + e.currentTarget.dataset.id })
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    const isMe = id === this.data.me.id
    wx.showModal({
      title: '删除成员',
      content: isMe
        ? '「' + name + '」是当前视角身份，删除后将回到身份选择页。确定删除吗？'
        : '确定删除「' + name + '」吗？该成员的签到数据将一并清除。',
      confirmText: '删除',
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return
        const result = store.removeMember(id)
        if (result.success) {
          wx.showToast({ title: '已删除', icon: 'success' })
          this.refresh()
          // 删除的是自己 → 回引导页重新选择
          if (!store.isOnboarded()) {
            setTimeout(() => wx.reLaunch({ url: '/pages/welcome/welcome' }), 500)
          }
        } else {
          wx.showToast({ title: result.msg || '删除失败', icon: 'none' })
        }
      }
    })
  },

  onReset() {
    wx.showModal({
      title: '恢复初始数据',
      content: '将清空全部改动，恢复到 5 位家庭成员的初始演示数据。确定继续吗？',
      confirmText: '恢复',
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return
        store.resetAll()
        wx.showToast({ title: '已恢复初始数据', icon: 'success' })
        this.refresh()
      }
    })
  }
})
