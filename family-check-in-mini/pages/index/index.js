const store = require('../../utils/store.js')

Page({
  data: {
    me: null,
    stage: null,
    growPercent: 0,
    doneRate: 0,
    scoreValue: 0,
    scoreLabel: '积分',
    dateText: '',
    newAdoptCount: 0,
    // 我的任务
    myTasks: [],
    myDoneCount: 0,
    myTotalCount: 0,
    // 家庭速览条
    familyStrip: [],
    memberCount: 0,
    // 家庭挑战
    challenge: {},
    challengePercent: 0,
    challengeDone: false,
    // 签到弹窗
    modalShow: false,
    modalMember: null,
    modalTask: null,
    modalEvolved: false,
    modalStage: null,
    modalPhoto: '',
    modalVerse: null
  },

  onShow() {
    if (!store.isOnboarded()) {
      wx.reLaunch({ url: '/pages/welcome/welcome' })
      return
    }
    this.refresh()
  },

  onPullDownRefresh() {
    this.refresh()
    wx.stopPullDownRefresh()
  },

  refresh() {
    const me = store.getCurrentMember()
    if (!me) {
      wx.reLaunch({ url: '/pages/welcome/welcome' })
      return
    }

    const d = new Date()
    const dateText = (d.getMonth() + 1) + '月' + d.getDate() + '日'

    const stage = store.stageFor(me)
    const activePet = store.getActivePet(me.id)

    // 我的任务（未完成在前）
    const list = me.tasks.slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0))
    const myTasks = list.map(t => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      category: t.category,
      points: t.points || t.grace || 0,
      done: t.done,
      photo: t.photo || '',
      hasPhoto: !!t.photo
    }))

    // 家庭速览条
    const members = store.getMembers()
    const familyStrip = members.map(m => ({
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      avatarUrl: m.avatarUrl || '',
      isMe: m.id === me.id,
      rate: store.doneRate(m),
      themeColor: m.themeColor
    }))

    const challenge = store.familyChallenge
    const challengePercent = challenge.target
      ? Math.min(100, Math.round((challenge.current / challenge.target) * 100))
      : 0

    this.setData({
      me: {
        id: me.id,
        name: me.name,
        emoji: me.emoji,
        role: me.role,
        age: me.age,
        themeColor: me.themeColor,
        avatarUrl: me.avatarUrl || ''
      },
      stage,
      petIcon: (activePet && activePet.icon) || (me.pet && me.pet.type) || '🐾',
      petName: (me.pet && me.pet.name) || '',
      petSpecies: (me.pet && me.pet.species) || '',
      growPercent: store.growPercent(me),
      doneRate: store.doneRate(me),
      scoreValue: store.scoreValue(me),
      scoreLabel: store.scoreLabel(me),
      streak: me.streak,
      dateText,
      newAdoptCount: store.getNewAdoptableCount(),
      myTasks,
      myDoneCount: myTasks.filter(t => t.done).length,
      myTotalCount: myTasks.length,
      familyStrip,
      memberCount: members.length,
      challenge,
      challengePercent,
      challengeDone: challenge.current >= challenge.target,
      photoCount: myTasks.filter(t => t.photo).length,
      photoList: myTasks.filter(t => t.photo).map(t => t.photo)
    })
  },

  /* ===== 切换身份 ===== */
  switchRole() {
    const members = store.getMembers()
    // wx.showActionSheet 最多 6 项
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

  /* ===== 跳转 ===== */
  goFamily() {
    wx.switchTab({ url: '/pages/family/family' })
  },

  goCheckin() {
    wx.switchTab({ url: '/pages/checkin/checkin' })
  },

  goPets() {
    wx.switchTab({ url: '/pages/pets/pets' })
  },

  openMyDetail() {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + this.data.me.id })
  },

  /* ===== 打卡（拍照必填：不拍不算完成） ===== */
  checkTask(e) {
    const d = e.currentTarget.dataset
    const memberId = this.data.me.id
    const done = d.done === true || d.done === 'true'

    // 已完成：点一下看照片
    if (done) {
      if (d.photo) {
        const list = this.data.photoList || []
        wx.previewImage({ current: d.photo, urls: list.length ? list : [d.photo] })
      }
      return
    }

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      sizeType: ['compressed'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        this.doCheckin(memberId, d.taskId, file.tempFilePath)
      },
      fail: (err) => {
        const msg = (err && err.errMsg) || ''
        if (msg.indexOf('cancel') === -1) {
          wx.showToast({ title: '拍照失败，请重试', icon: 'none' })
        }
      }
    })
  },

  doCheckin(memberId, taskId, photoPath) {
    const result = store.doCheckin(memberId, taskId, photoPath || null)
    if (result && result.blocked) {
      wx.showToast({ title: result.msg || '请先拍照再签到', icon: 'none' })
      return
    }
    if (!result) {
      wx.showToast({ title: '该任务已完成', icon: 'none' })
      return
    }
    this.refresh()
    this.setData({
      modalShow: true,
      modalMember: result.member,
      modalTask: result.task,
      modalEvolved: result.evolved,
      modalStage: result.newStage,
      modalPhoto: result.photo || '',
      modalVerse: result.verse
    })
    wx.vibrateShort && wx.vibrateShort({ type: 'light' })
  },

  closeModal() {
    this.setData({ modalShow: false })
  },

  onAvatarError() {
    this.setData({ 'me.avatarUrl': '' })
  }
})
