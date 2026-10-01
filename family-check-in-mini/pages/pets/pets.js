const store = require('../../utils/store.js')

const RARITY_ORDER = ['mythic', 'legendary', 'epic', 'rare', 'common']

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'adopt', label: '可领养' },
  { key: 'owned', label: '已拥有' }
]

Page({
  data: {
    tab: 'adopt',
    rarityOrder: RARITY_ORDER,

    // 当前视角成员
    me: null,

    // 领养中心（合并后的图鉴）
    filter: 'all',
    filters: FILTERS,
    adoptableCount: 0,
    groups: [],
    groupEmpty: false,

    // 收集进度（原「宠物图鉴」Tab 的核心信息）
    totalCollected: 0,
    catalogTotal: 0,
    collectPercent: 0,
    remainCount: 0,

    // 我的宠物（单人）
    my: null,

    // 弹窗
    detailPet: null,
    detailOwned: false,
    detailActive: false,
    detailCanAdopt: false,
    detailUnlocked: false,
    detailMemberScore: 0,
    detailScoreLabel: '积分',
    adoptShow: false,
    adoptPet: null,
    adoptMember: null,
    adoptRarityColor: '#94A3B8',
    adoptRarityLabel: '',
    adoptRarityBonus: 0,
    adoptTotalPower: 0
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

    const meView = {
      id: me.id,
      name: me.name,
      emoji: me.emoji,
      avatarUrl: me.avatarUrl || '',
      themeColor: me.themeColor,
      age: me.age,
      score: store.scoreValue(me),
      scoreLabel: store.scoreLabel(me)
    }

    // 领养中心 = 全量图鉴 + 归属状态（一个数据源同时服务「可领养」与「已拥有」）
    const catalog = store.getCatalogWithOwnership(me.id)
    const grouped = {}
    catalog.forEach(p => {
      if (!grouped[p.rarity]) grouped[p.rarity] = []
      grouped[p.rarity].push({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        species: p.species,
        icon: p.icon,
        rarity: p.rarity,
        requiredPoints: p.requiredPoints,
        basePower: p.basePower,
        totalPower: p.totalPower,
        desc: p.desc,
        skills: p.skills,
        owned: p.owned,
        active: p.active,
        canAdopt: p.canAdopt,
        locked: p.locked,
        isDefault: p.isDefault,
        unlockText: p.unlockText
      })
    })

    const filter = this.data.filter || 'all'
    const matchFilter = (p) => {
      if (filter === 'adopt') return p.canAdopt
      if (filter === 'owned') return p.owned
      return true
    }

    let visibleTotal = 0
    const groups = []
    RARITY_ORDER.forEach(r => {
      const all = grouped[r] || []
      if (!all.length) return
      const pets = all.filter(matchFilter)
      visibleTotal += pets.length
      groups.push({
        rarity: r,
        label: store.RARITY_INFO[r].label,
        color: store.RARITY_INFO[r].color,
        bg: store.RARITY_INFO[r].bg,
        borderColor: store.RARITY_INFO[r].borderColor,
        count: pets.length,
        total: all.length,
        collected: all.filter(p => p.owned).length,
        pets
      })
    })

    const totalCollected = catalog.filter(p => p.owned).length
    const catalogTotal = catalog.length

    // 我的宠物（单人）
    const stage = store.stageFor(me)
    const myPets = store.getMemberPets(me.id)
    const activePet = store.getActivePet(me.id)
    const attrs = store.getPetAttrs(me)
    const my = {
      id: me.id,
      name: me.name,
      emoji: me.emoji,
      avatarUrl: me.avatarUrl || '',
      themeColor: me.themeColor,
      score: store.scoreValue(me),
      scoreLabel: store.scoreLabel(me),
      totalCheckins: me.totalCheckins,
      grow: me.grow,
      totalGrow: me.totalGrow,
      growPercent: store.growPercent(me),
      stageName: stage.stage,
      pets: myPets,
      activePet: activePet ? { id: activePet.id, name: activePet.name, icon: activePet.icon, species: activePet.species } : null,
      attrList: [
        { key: 'strength', label: '力量', value: attrs.strength },
        { key: 'wisdom', label: '智慧', value: attrs.wisdom },
        { key: 'vitality', label: '活力', value: attrs.vitality },
        { key: 'charm', label: '魅力', value: attrs.charm }
      ]
    }

    this.setData({
      me: meView,
      adoptableCount: catalog.filter(p => p.canAdopt).length,
      groups,
      groupEmpty: visibleTotal === 0,
      totalCollected,
      catalogTotal,
      collectPercent: catalogTotal ? Math.round((totalCollected / catalogTotal) * 100) : 0,
      remainCount: Math.max(0, catalogTotal - totalCollected),
      isToddlerView: (me.age || 0) <= 4,
      growPercent: store.growPercent(me),
      my
    })

    // 详情弹窗打开时同步刷新其内容
    if (this.data.detailPet) {
      const fresh = store.findPetInCatalog(this.data.detailPet.id)
      if (fresh) this.openPetDetailById(fresh.id)
    }
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab })
  },

  switchFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.filter }, () => {
      this.refresh()
    })
  },

  /* ===== 宠物详情弹窗 ===== */

  openPetDetail(e) {
    this.openPetDetailById(e.currentTarget.dataset.id)
  },

  openPetDetailById(petId) {
    const me = store.getCurrentMember()
    if (!me) return
    const pet = store.findPetInCatalog(petId)
    if (!pet) return
    const entry = store.getCatalogWithOwnership(me.id).find(p => p.id === petId)
    const memberScore = store.scoreValue(me)
    const rarity = store.RARITY_INFO[pet.rarity] || {}
    const owned = entry ? entry.owned : false
    const active = entry ? entry.active : false
    const canAdopt = entry ? entry.canAdopt : false
    this.setData({
      detailPet: {
        id: pet.id,
        name: (entry && entry.displayName) || pet.name,
        species: pet.species,
        icon: pet.icon,
        desc: pet.desc,
        skills: pet.skills || [],
        basePower: pet.basePower,
        requiredPoints: pet.requiredPoints,
        rarityColor: rarity.color || '#94A3B8',
        rarityLabel: rarity.label || '',
        rarityBonus: rarity.powerBonus || 0,
        totalPower: pet.basePower + (rarity.powerBonus || 0)
      },
      detailOwned: owned,
      detailActive: active,
      detailCanAdopt: canAdopt,
      detailUnlocked: !owned && store.petUnlockedFor(me, pet),
      detailMemberScore: memberScore,
      detailScoreLabel: store.scoreLabel(me),
      detailUnlockText: (entry && entry.unlockText) || '',
      detailToddler: (me.age || 0) <= 4
    })
  },

  closePetDetail() {
    this.setData({ detailPet: null })
  },

  adoptFromDetail() {
    const pet = this.data.detailPet
    if (!pet) return
    this.setData({ detailPet: null })
    this.confirmAdopt(pet)
  },

  // 已拥有的宠物：详情里直接设为出战
  setActiveFromDetail() {
    const pet = this.data.detailPet
    const me = store.getCurrentMember()
    if (!pet || !me) return
    if (store.switchActivePet(me.id, pet.id)) {
      wx.showToast({ title: '出战：' + pet.name, icon: 'none' })
    }
    this.setData({ detailPet: null })
    this.refresh()
  },

  renameFromDetail() {
    const pet = this.data.detailPet
    const me = store.getCurrentMember()
    if (!pet || !me) return
    this.setData({ detailPet: null })
    this.renamePet({ currentTarget: { dataset: { memberId: me.id, petId: pet.id } } })
  },

  releaseFromDetail() {
    const pet = this.data.detailPet
    const me = store.getCurrentMember()
    if (!pet || !me) return
    this.setData({ detailPet: null })
    this.releasePet({ currentTarget: { dataset: { memberId: me.id, petId: pet.id } } })
  },

  /* ===== 领养 ===== */

  confirmAdopt(pet) {
    const me = store.getCurrentMember()
    if (!me) return
    const result = store.adoptPet(me.id, pet.id)
    if (!result.success) {
      wx.showToast({ title: result.msg || '领养失败', icon: 'none' })
      return
    }
    const rarity = store.RARITY_INFO[result.pet.rarity] || {}
    wx.vibrateShort && wx.vibrateShort({ type: 'medium' })
    this.setData({
      adoptShow: true,
      adoptPet: result.pet,
      adoptMember: {
        name: result.member.name,
        emoji: result.member.emoji
      },
      adoptRarityColor: rarity.color || '#94A3B8',
      adoptRarityLabel: rarity.label || '',
      adoptRarityBonus: rarity.powerBonus || 0,
      adoptTotalPower: result.pet.basePower + (rarity.powerBonus || 0)
    })
    this.refresh()
  },

  closeAdopt() {
    this.setData({ adoptShow: false })
  },

  /* ===== 我的宠物 ===== */

  switchPet(e) {
    const { memberId, petId } = e.currentTarget.dataset
    if (store.switchActivePet(memberId, petId)) {
      this.refresh()
      const pet = store.findPetInCatalog(petId)
      wx.showToast({ title: '出战：' + (pet ? pet.name : ''), icon: 'none' })
    }
  },

  renamePet(e) {
    const { memberId, petId } = e.currentTarget.dataset
    const pet = store.findPetInCatalog(petId)
    if (!pet) return
    wx.showModal({
      title: '给「' + pet.name + '」改名',
      editable: true,
      placeholderText: '输入新名字（留空恢复默认）',
      content: '',
      success: (res) => {
        if (!res.confirm) return
        const result = store.renamePet(memberId, petId, res.content)
        if (result.success) {
          wx.showToast({ title: '已改名', icon: 'success' })
          this.refresh()
        } else {
          wx.showToast({ title: result.msg || '改名失败', icon: 'none' })
        }
      }
    })
  },

  releasePet(e) {
    const { memberId, petId } = e.currentTarget.dataset
    const pet = store.findPetInCatalog(petId)
    if (!pet) return
    wx.showModal({
      title: '放归宠物',
      content: '确定将「' + pet.name + '」放归吗？放归后可以重新领养。',
      confirmText: '放归',
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return
        const result = store.releasePet(memberId, petId)
        if (result.success) {
          wx.showToast({ title: '已放归', icon: 'success' })
          this.refresh()
        } else {
          wx.showToast({ title: result.msg || '放归失败', icon: 'none' })
        }
      }
    })
  },

  goBattle() {
    wx.navigateTo({ url: '/pages/battle/battle' })
  },

  noop() {}
})
