const store = require('../../utils/store.js')

const ROUNDS = [
  { delay: 600, atk: 1, dmgMin: 15, dmgRange: 15 },
  { delay: 1200, atk: 2, dmgMin: 15, dmgRange: 15 },
  { delay: 1800, atk: 1, dmgMin: 12, dmgRange: 18 },
  { delay: 2400, atk: 2, dmgMin: 12, dmgRange: 18 },
  { delay: 3000, atk: 1, dmgMin: 20, dmgRange: 10 }
]

Page({
  data: {
    playerList: [],
    player1Id: '',
    player2Id: '',
    player1: null,
    player2: null,
    phase: 'idle',
    roundText: '',
    hp1: 100,
    hp2: 100,
    logLines: [],
    attrCompare: [],
    showArena: false
  },

  onLoad() {
    this.timers = []
    this.refreshPlayers()
  },

  onUnload() {
    this.clearTimers()
  },

  onHide() {
    this.clearTimers()
  },

  clearTimers() {
    (this.timers || []).forEach(t => clearTimeout(t))
    this.timers = []
  },

  refreshPlayers() {
    const members = store.getRankingMembers()
    const playerList = members.map(m => {
      const pet = store.getActivePet(m.id)
      const stage = store.stageFor(m)
      return {
        id: m.id,
        name: m.name,
        emoji: m.emoji,
        petIcon: (pet && pet.icon) || stage.icon,
        petName: (pet && pet.name) || (m.pet && m.pet.name) || '',
        power: store.getPetTotalPower(m),
        bonus: store.toddlerBattleBonus(m),
        isToddler: store.toddlerBattleBonus(m) > 0
      }
    })
    this.setData({ playerList })
    this.syncPlayers()
  },

  buildPlayer(id) {
    const m = store.findMember(id)
    if (!m) return null
    const pet = store.getActivePet(m.id)
    const stage = store.stageFor(m)
    const bonus = store.toddlerBattleBonus(m)
    return {
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      petName: (pet && pet.name) || (m.pet && m.pet.name) || '',
      petIcon: (pet && pet.icon) || stage.icon,
      power: store.getPetTotalPower(m),
      bonus: bonus,
      isToddler: bonus > 0
    }
  },

  syncPlayers() {
    const player1 = this.buildPlayer(this.data.player1Id)
    const player2 = this.buildPlayer(this.data.player2Id)

    let attrCompare = []
    if (player1 && player2) {
      const m1 = store.findMember(player1.id)
      const m2 = store.findMember(player2.id)
      attrCompare = store.PET_ATTRS.map(attr => ({
        key: attr.key,
        label: attr.icon + ' ' + attr.label,
        v1: store.getPetAttrs(m1)[attr.key] || 0,
        v2: store.getPetAttrs(m2)[attr.key] || 0
      }))
    }

    this.setData({
      player1,
      player2,
      attrCompare,
      showArena: !!(player1 && player2 && this.data.phase !== 'idle')
    })
  },

  pick1(e) {
    this.clearTimers()
    const id = e.currentTarget.dataset.id
    this.setData({
      player1Id: id,
      player2Id: id === this.data.player2Id ? '' : this.data.player2Id,
      phase: 'idle',
      showArena: false,
      hp1: 100,
      hp2: 100,
      logLines: [],
      roundText: ''
    })
    this.syncPlayers()
  },

  pick2(e) {
    this.clearTimers()
    const id = e.currentTarget.dataset.id
    this.setData({
      player2Id: id,
      player1Id: id === this.data.player1Id ? '' : this.data.player1Id,
      phase: 'idle',
      showArena: false,
      hp1: 100,
      hp2: 100,
      logLines: [],
      roundText: ''
    })
    this.syncPlayers()
  },

  toReady() {
    this.setData({ phase: 'ready', roundText: '准备', showArena: true, logLines: [] })
  },

  addLog(text) {
    const lines = this.data.logLines.concat([text])
    while (lines.length > 6) lines.shift()
    this.setData({ logLines: lines })
  },

  startFight() {
    const m1 = store.findMember(this.data.player1Id)
    const m2 = store.findMember(this.data.player2Id)
    if (!m1 || !m2) return

    const result = store.doBattle(m1, m2)
    if (!result) {
      wx.showToast({ title: '请选择两位不同的选手', icon: 'none' })
      this.setData({ phase: 'idle', showArena: false })
      return
    }

    const a1 = store.getPetAttrs(m1)
    const a2 = store.getPetAttrs(m2)
    const t1 = result.basePower1 + result.bonus1
    const t2 = result.basePower2 + result.bonus2
    const bonusLine = (result.bonus1 || result.bonus2)
      ? ('🍼 萌宠加成 ' + this.data.player1.name + ' +' + result.bonus1 +
        ' / ' + this.data.player2.name + ' +' + result.bonus2)
      : ''

    this.clearTimers()
    this.setData({ phase: 'fighting', roundText: '战斗中', hp1: 100, hp2: 100, logLines: [] })
    this.addLog('⚡ ' + this.data.player1.petName + ' 战力 ' + t1 + ' vs ' + this.data.player2.petName + ' 战力 ' + t2)
    if (bonusLine) this.addLog(bonusLine)

    let hp1 = 100
    let hp2 = 100

    ROUNDS.forEach(r => {
      const timer = setTimeout(() => {
        const isP1 = r.atk === 1
        const dmg = r.dmgMin + Math.floor(Math.random() * r.dmgRange)
        const attacker = isP1 ? this.data.player1 : this.data.player2
        const patch = { phase: isP1 ? 'attack1' : 'attack2' }
        this.setData(patch)
        this.addLog('💥 ' + attacker.petName + ' 攻击！造成 ' + dmg + ' 点伤害')

        const t2s = setTimeout(() => {
          if (isP1) {
            hp2 = Math.max(0, hp2 - dmg)
          } else {
            hp1 = Math.max(0, hp1 - dmg)
          }
          this.setData({
            phase: isP1 ? 'hit2' : 'hit1',
            hp1: Math.round(hp1),
            hp2: Math.round(hp2)
          })
        }, 200)
        this.timers.push(t2s)

        const t3s = setTimeout(() => {
          this.setData({ phase: 'fighting' })
        }, 400)
        this.timers.push(t3s)
      }, r.delay)
      this.timers.push(timer)
    })

    const finishTimer = setTimeout(() => {
      const p1Win = result.winner.id === m1.id
      this.setData({
        hp1: p1Win ? 100 : 0,
        hp2: p1Win ? 0 : 100,
        phase: 'finish',
        roundText: '决出胜负!'
      })
      this.addLog('🏆 ' + result.winner.pet.name + ' 获胜！' + result.winner.emoji + ' ' + result.winner.name + ' 的宠物更强！')
      this.addLog('🎉 胜者获得 30 积分奖励')
      store.rewardBattleWinner(result.winner.id, 30)
      this.refreshPlayers()
    }, 3600)
    this.timers.push(finishTimer)
  },

  rematch() {
    this.clearTimers()
    this.setData({
      player1Id: '',
      player2Id: '',
      player1: null,
      player2: null,
      phase: 'idle',
      roundText: '',
      hp1: 100,
      hp2: 100,
      logLines: [],
      attrCompare: [],
      showArena: false
    })
  },

  resetBattle() {
    this.clearTimers()
    this.setData({ phase: 'idle', roundText: '', showArena: false })
  }
})
