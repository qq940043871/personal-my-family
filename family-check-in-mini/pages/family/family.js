const store = require('../../utils/store.js')

const PERIODS = [
  { key: 'weekly', label: '每周' },
  { key: 'monthly', label: '每月' },
  { key: 'yearly', label: '每年' }
]

const REWARDS = {
  weekly: ['🥇 第1名：周冠军勋章 + 50 积分', '🎁 全员全勤：家庭宝箱（双倍积分）', '📊 周报已生成，周日家庭会议见'],
  monthly: ['🥇 第1名：决定周末家庭活动', '🎁 月度全勤：月金牌勋章 + 200 积分', '⏸ 免家务券：由其他成员代劳一次', '🐣 满级宠物：解锁稀有品种'],
  yearly: ['🏆 年度MVP：颁发年度大奖', '📖 年度成长年鉴已生成', '🎊 全家累计签到数据回顾']
}

Page({
  data: {
    // 家庭总览
    familyName: '',
    memberCount: 0,
    memberCards: [],
    stats: {},
    todayRate: 0,
    totalScore: '0',
    coupleBond: false,
    challenge: {},
    challengePercent: 0,
    challengeDone: false,
    // 结算（并入本页）
    periods: PERIODS,
    currentPeriod: 'weekly',
    periodLabel: '本周结算',
    dateLabel: '',
    rankList: [],
    rewards: [],
    achievements: []
  },

  onShow() {
    this.refresh()
  },

  onPullDownRefresh() {
    this.refresh()
    wx.stopPullDownRefresh()
  },

  refresh() {
    const me = store.getCurrentMember()
    const members = store.getMembers()
    const stats = store.getFamilyStats()
    const todayRate = stats.todayTotal === 0
      ? 0
      : Math.round((stats.todayDone / stats.todayTotal) * 100)

    const totalScore = members
      .reduce((s, m) => s + (m.points || 0) + (m.grace || 0) + (m.stars || 0), 0)
      .toLocaleString()

    // 全家成员卡（紧凑，一人一行）
    const memberCards = members.map(m => {
      const stage = store.stageFor(m)
      return {
        id: m.id,
        name: m.name,
        emoji: m.emoji,
        role: m.role,
        age: m.age,
        themeColor: m.themeColor,
        avatarUrl: m.avatarUrl || '',
        isMe: !!me && m.id === me.id,
        petIcon: (store.getActivePet(m.id) || {}).icon || (m.pet && m.pet.type) || '🐾',
        petName: (m.pet && m.pet.name) || '',
        stageName: stage.stage,
        streak: m.streak,
        doneCount: m.tasks.filter(t => t.done).length,
        totalCount: m.tasks.length,
        rate: store.doneRate(m),
        scoreValue: store.scoreValue(m),
        scoreLabel: store.scoreLabel(m)
      }
    })

    const challenge = store.familyChallenge
    const challengePercent = challenge.target
      ? Math.min(100, Math.round((challenge.current / challenge.target) * 100))
      : 0

    /* ===== 结算（原结算页逻辑） ===== */
    const period = this.data.currentPeriod
    let periodLabel = ''
    let dateLabel = ''

    if (period === 'weekly') {
      periodLabel = '本周结算'
      dateLabel = '本周 第 2 周'
    } else if (period === 'monthly') {
      periodLabel = '本月结算'
      dateLabel = this.monthLabel()
    } else {
      periodLabel = '年度结算'
      dateLabel = new Date().getFullYear() + '年度'
    }

    // 统一排行榜：全家都上榜（含 3 岁小宝和奶奶），按完成率 → 战力排序
    const baseRank = store.getFamilyRanking()
    const list = baseRank.map((item, index) => {
      let medal = String(index + 1)
      if (index === 0) medal = '🥇'
      else if (index === 1) medal = '🥈'
      else if (index === 2) medal = '🥉'
      const scoreText = item.isToddler
        ? ('⭐ ' + item.scoreValue)
        : (item.scoreValue.toLocaleString() + item.scoreLabel)
      return Object.assign({}, item, {
        medal,
        rankClass: index === 0 ? 'gold' : (index === 1 ? 'silver' : (index === 2 ? 'bronze' : '')),
        highlight: index === 0,
        extra: scoreText + ' · 🐾' + item.petGrow,
        bonusText: item.isToddler ? ('🍼 萌宠 +' + item.bonus) : '',
        stageText: item.stageName || ''
      })
    })

    const earnedIds = []
    Object.keys(store.memberAchievements).forEach(k => {
      store.memberAchievements[k].forEach(id => {
        if (earnedIds.indexOf(id) === -1) earnedIds.push(id)
      })
    })
    const achievements = store.achievements.map(a => Object.assign({}, a, {
      earned: earnedIds.indexOf(a.id) !== -1
    }))

    const photoWall = store.getFamilyPhotos()
    const photoTotal = photoWall.reduce((s, m) => s + m.count, 0)

    this.setData({
      familyName: store.getFamilyInfo().name,
      memberCount: members.length,
      memberCards,
      stats,
      todayRate,
      totalScore,
      coupleBond: store.getCoupleBond(),
      challenge,
      challengePercent,
      challengeDone: challenge.current >= challenge.target,
      rankList: list,
      periodLabel,
      dateLabel,
      rewards: REWARDS[period] || [],
      achievements,
      photoWall,
      photoTotal,
      allPhotos: photoWall.reduce((arr, m) => arr.concat(m.photos.map(p => p.photo)), [])
    })
  },

  monthLabel() {
    const d = new Date()
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月'
  },

  switchPeriod(e) {
    this.setData({ currentPeriod: e.currentTarget.dataset.key }, () => this.refresh())
  },

  openDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id })
  },

  previewFamilyPhoto(e) {
    const src = e.currentTarget.dataset.src
    const list = this.data.allPhotos || []
    wx.previewImage({ current: src, urls: list.length ? list : [src] })
  },

  goBattle() {
    wx.navigateTo({ url: '/pages/battle/battle' })
  },

  goCheckin() {
    wx.switchTab({ url: '/pages/checkin/checkin' })
  },

  onAvatarError(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const memberCards = this.data.memberCards.map(m =>
      m.id === id ? Object.assign({}, m, { avatarUrl: '' }) : m)
    this.setData({ memberCards })
  }
})
