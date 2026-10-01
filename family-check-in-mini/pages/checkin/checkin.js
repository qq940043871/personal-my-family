const store = require('../../utils/store.js')

Page({
  data: {
    me: null,
    cardTitle: '我的任务',
    tasks: [],
    doneCount: 0,
    totalCount: 0,
    percent: 0,
    photoCount: 0,
    photoList: [],
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

    // 未完成的排前面
    const list = me.tasks.slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0))
    const tasks = list.map(t => ({
      id: t.id,
      memberId: me.id,
      name: t.name,
      icon: t.icon,
      category: t.category,
      points: t.points || t.grace || 0,
      done: t.done,
      photo: t.photo || '',
      hasPhoto: !!t.photo
    }))

    const doneCount = tasks.filter(t => t.done).length
    const percent = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0

    this.setData({
      me: {
        id: me.id,
        name: me.name,
        emoji: me.emoji,
        role: me.role,
        avatarUrl: me.avatarUrl || ''
      },
      cardTitle: me.name + '的任务',
      tasks,
      doneCount,
      totalCount: tasks.length,
      percent,
      photoCount: tasks.filter(t => t.photo).length,
      photoList: tasks.filter(t => t.photo).map(t => t.photo)
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

  /* ===== 拍照签到（拍照必填：不拍不算完成） ===== */

  // 点任务行：未完成 → 调起相机；已完成 → 看大图
  onTaskTap(e) {
    const d = e.currentTarget.dataset
    const done = d.done === true || d.done === 'true'
    if (done) {
      if (d.photo) this.previewPhoto({ currentTarget: { dataset: { src: d.photo } } })
      return
    }
    this.onCamera({ currentTarget: { dataset: { memberId: d.memberId, taskId: d.taskId } } })
  },

  onCamera(e) {
    const { memberId, taskId } = e.currentTarget.dataset
    this.choosePhoto((path) => {
      this.doCheckin(memberId, taskId, path)
    })
  },

  // 已完成的任务重拍
  retakePhoto(e) {
    const { memberId, taskId } = e.currentTarget.dataset
    this.choosePhoto((path) => {
      const res = store.updateTaskPhoto(memberId, taskId, path)
      if (res.success) {
        wx.showToast({ title: '照片已更新', icon: 'success' })
        this.refresh()
      } else {
        wx.showToast({ title: res.msg || '更新失败', icon: 'none' })
      }
    })
  },

  choosePhoto(onOk) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      sizeType: ['compressed'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        if (typeof onOk === 'function') onOk(file.tempFilePath)
      },
      fail: (err) => {
        const msg = (err && err.errMsg) || ''
        if (msg.indexOf('cancel') === -1) {
          wx.showToast({ title: '拍照失败，请重试', icon: 'none' })
        }
      }
    })
  },

  // 大图预览：可左右滑看今天全部签到照片
  previewPhoto(e) {
    const src = e.currentTarget.dataset.src
    const list = this.data.photoList || []
    wx.previewImage({
      current: src,
      urls: list.length ? list : [src]
    })
  },

  // 只删照片，签到与积分保留
  removePhoto(e) {
    const { memberId, taskId, taskName } = e.currentTarget.dataset
    wx.showModal({
      title: '删除签到照片',
      content: '删除「' + (taskName || '该任务') + '」的照片？签到记录和积分不受影响。',
      confirmText: '删除',
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return
        const r = store.clearTaskPhoto(memberId, taskId)
        if (r.success) {
          wx.showToast({ title: '照片已删除', icon: 'success' })
          this.refresh()
        } else {
          wx.showToast({ title: r.msg || '删除失败', icon: 'none' })
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
  }
})
