const store = require('../../utils/store.js')

Component({
  properties: {
    show: { type: Boolean, value: false },
    member: { type: Object, value: null },
    task: { type: Object, value: null },
    evolved: { type: Boolean, value: false },
    stage: { type: Object, value: null },
    photo: { type: String, value: '' },
    verse: { type: Object, value: null }
  },

  data: {
    growRatio: 0,
    titleText: '签到成功！',
    messageText: '',
    buttonText: '太棒了',
    coupleBond: false,
    starList: [1, 2, 3, 4, 5]
  },

  observers: {
    'member, task, evolved': function (member, task, evolved) {
      if (!member) {
        this.setData({ growRatio: 0, titleText: '签到成功！', messageText: '', buttonText: '太棒了', coupleBond: false })
        return
      }
      const ratio = member.totalGrow ? Math.round((member.grow / member.totalGrow) * 100) : 0
      let title = '签到成功！'
      let message = ''
      let button = '太棒了'

      if (member.age <= 4) {
        title = '好棒呀！'
        message = member.pet.name + ' 又长大了一点点！⭐ +' + ((task && task.points) || 5)
        button = '再玩一次！'
      } else if (member.age >= 55) {
        title = '主赐平安'
        message = '恩典值 +' + ((task && task.grace) || 10) + ' · ' + member.pet.name + ' 安心成长'
        button = '阿们'
      } else {
        message = '积分 +' + ((task && task.points) || 10) + ' · ' + member.pet.name + ' 成长 +10'
      }
      if (evolved) title = '宠物进化了！'

      const isCouple = member.id === 'dad' || member.id === 'mom'
      const coupleBond = isCouple && store.getCoupleBond()

      this.setData({
        growRatio: ratio,
        titleText: title,
        messageText: message,
        buttonText: button,
        coupleBond
      })
    }
  },

  methods: {
    onClose() {
      this.triggerEvent('close')
    },
    noop() {}
  }
})
