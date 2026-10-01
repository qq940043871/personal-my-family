const store = require('../../utils/store.js')

Page({
  data: {
    memberId: '',
    member: null,
    activePet: null,
    pets: [],
    stageName: '',
    growPercent: 0,
    attrList: [],
    scoreValue: 0,
    scoreLabel: '',
    fruitList: [],
    milestoneList: [],
    scaleList: [],
    // 弹窗
    modalShow: false,
    modalMember: null,
    modalTask: null,
    modalEvolved: false,
    modalStage: null,
    modalPhoto: '',
    modalVerse: null
  },

  onLoad(options) {
    const id = (options && options.id) || ''
    this.setData({ memberId: id })
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    let id = this.data.memberId
    let member = store.findMember(id)
    // 成员被删除或未传参 → 回退到第一位成员
    if (!member) {
      const all = store.getMembers()
      member = all[0] || null
      if (member) {
        id = member.id
        this.setData({ memberId: id })
        wx.setNavigationBarTitle({ title: member.name + ' · 详情' })
      }
    }
    if (!member) {
      this.setData({ member: null })
      return
    }

    const stage = store.stageFor(member)
    const activePet = store.getActivePet(member.id)
    const pets = store.getMemberPets(member.id)
    const attrs = store.getPetAttrs(member)

    const view = {
      id: member.id,
      name: member.name,
      emoji: member.emoji,
      age: member.age,
      role: member.role,
      themeColor: member.themeColor,
      avatarUrl: member.avatarUrl || '',
      grow: member.grow,
      totalGrow: member.totalGrow,
      streak: member.streak,
      totalCheckins: member.totalCheckins,
      dragonScales: member.dragonScales,
      hasDragonScales: member.dragonScales !== undefined,
      tasks: member.tasks.map(t => ({
        id: t.id,
        name: t.name,
        icon: t.icon,
        category: t.category,
        done: t.done,
        points: t.points || t.grace || 0,
        iconBg: member.themeColor + '1A',
        photo: t.photo || ''
      })),
      skills: member.skills || null,
      milestones: member.milestones || null
    }

    const fruitList = (member.spiritualFruits || [])
      .map(fid => store.SPIRITUAL_FRUITS.find(f => f.id === fid))
      .filter(Boolean)

    const growPercent = store.growPercent(member)
    const milestoneList = (member.milestones && member.milestones.length)
      ? member.milestones
      : [
        { label: '第一次签到', reached: member.totalCheckins > 0 },
        { label: '坚持一周', sub: '连签 7 天', reached: member.streak >= 7 },
        { label: '宠物进化', sub: '成长值过半', reached: growPercent >= 50 }
      ]

    // 龙鳞格子（最多 12 格）
    const scales = []
    for (let i = 1; i <= 12; i++) {
      scales.push({ i, on: i <= (member.dragonScales || 0) })
    }

    this.setData({
      member: view,
      activePet: activePet ? {
        id: activePet.id,
        icon: activePet.icon,
        name: activePet.name,
        species: activePet.species
      } : null,
      pets: pets.map(p => ({ id: p.id, icon: p.icon, name: p.name, active: p.active })),
      stageName: stage.stage,
      growPercent,
      attrList: [
        { key: 'strength', label: '力量', value: attrs.strength, color: '#FF6B6B' },
        { key: 'wisdom', label: '智慧', value: attrs.wisdom, color: '#6366F1' },
        { key: 'vitality', label: '活力', value: attrs.vitality, color: '#10B981' },
        { key: 'charm', label: '魅力', value: attrs.charm, color: '#F59E0B' }
      ],
      scoreValue: store.scoreValue(member),
      scoreLabel: store.scoreLabel(member),
      fruitList,
      milestoneList,
      scaleList: scales,
      photos: store.getMemberPhotos(member.id),
      photoList: store.getMemberPhotos(member.id).map(p => p.photo),
      photoCount: store.getMemberPhotos(member.id).length
    })
  },

  /* ===== 拍照签到（拍照必填） ===== */
  checkTask(e) {
    const d = e.currentTarget.dataset
    const done = d.done === true || d.done === 'true'
    // 已完成：点一下看照片
    if (done) {
      if (d.photo) this.previewPhoto({ currentTarget: { dataset: { src: d.photo } } })
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
        this.doCheck(d.id, file.tempFilePath)
      },
      fail: (err) => {
        const msg = (err && err.errMsg) || ''
        if (msg.indexOf('cancel') === -1) {
          wx.showToast({ title: '拍照失败，请重试', icon: 'none' })
        }
      }
    })
  },

  doCheck(taskId, photoPath) {
    const result = store.doCheckin(this.data.memberId, taskId, photoPath || null)
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

  previewPhoto(e) {
    const src = e.currentTarget.dataset.src
    const list = this.data.photoList || []
    wx.previewImage({ current: src, urls: list.length ? list : [src] })
  },

  switchPet(e) {
    const petId = e.currentTarget.dataset.id
    if (store.switchActivePet(this.data.memberId, petId)) {
      this.refresh()
    }
  },

  goPets() {
    // 单人视角：宠物页始终展示「当前身份」。若在别人的详情页点宠物，
    // 先把视角切到该成员再跳转，保证看到的是 TA 的宠物。
    if (store.getCurrentMemberId() !== this.data.memberId) {
      store.setCurrentMember(this.data.memberId)
    }
    wx.switchTab({ url: '/pages/pets/pets' })
  },

  closeModal() {
    this.setData({ modalShow: false })
  },

  // 头像加载失败 → 回退为 emoji，避免出现空白/破图
  onAvatarError() {
    this.setData({ 'member.avatarUrl': '' })
  }
})
