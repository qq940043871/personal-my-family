const store = require('../../utils/store.js')

const EMOJI_PRESETS = ['👨', '👩', '👦', '👧', '👶', '👵', '👴', '🧑']
const COLOR_PRESETS = ['#2563EB', '#EC4899', '#F59E0B', '#FBBF24', '#A88B6A', '#10B981', '#8B5CF6', '#EF4444']

Page({
  data: {
    emojiPresets: EMOJI_PRESETS,
    colorPresets: COLOR_PRESETS,
    isEdit: false,
    memberId: '',
    form: {
      name: '',
      age: '',
      emoji: '🧑',
      themeColor: COLOR_PRESETS[5],
      petName: ''
    },
    roleHint: '—',
    ageInput: ''
  },

  onLoad(options) {
    const id = options && options.id
    if (id) {
      const member = store.findMember(id)
      if (member) {
        const form = {
          name: member.name,
          age: String(member.age),
          emoji: member.emoji || EMOJI_PRESETS[7],
          themeColor: member.themeColor || COLOR_PRESETS[5],
          petName: (member.pet && member.pet.name) || ''
        }
        this.setData({
          isEdit: true,
          memberId: member.id,
          form,
          ageInput: form.age,
          roleHint: store.roleForAge(member.age)
        })
        wx.setNavigationBarTitle({ title: '编辑成员' })
        return
      }
    }
    this.setData({
      isEdit: false,
      memberId: '',
      form: {
        name: '',
        age: '',
        emoji: EMOJI_PRESETS[7],
        themeColor: COLOR_PRESETS[5],
        petName: ''
      },
      ageInput: '',
      roleHint: '—'
    })
    wx.setNavigationBarTitle({ title: '添加成员' })
  },

  pickEmoji(e) {
    this.setData({ 'form.emoji': e.currentTarget.dataset.value })
  },

  pickColor(e) {
    this.setData({ 'form.themeColor': e.currentTarget.dataset.value })
  },

  onNameInput(e) {
    this.setData({ 'form.name': e.detail.value })
  },

  onPetNameInput(e) {
    this.setData({ 'form.petName': e.detail.value })
  },

  onAgeInput(e) {
    const value = e.detail.value
    const age = Number(value)
    this.setData({
      'form.age': value,
      ageInput: value,
      roleHint: (value === '' || Number.isNaN(age)) ? '—' : store.roleForAge(age)
    })
  },

  onSave() {
    const form = this.data.form
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    const age = Number(form.age)
    if (form.age === '' || Number.isNaN(age) || age < 0 || age > 120) {
      wx.showToast({ title: '请输入正确的年龄（0-120）', icon: 'none' })
      return
    }

    const data = {
      name: form.name,
      age,
      emoji: form.emoji,
      themeColor: form.themeColor,
      petName: form.petName
    }

    if (this.data.isEdit) {
      store.updateMember(this.data.memberId, data)
      wx.showToast({ title: '已保存', icon: 'success' })
    } else {
      store.addMember(data)
      wx.showToast({ title: '已添加', icon: 'success' })
    }
    setTimeout(() => wx.navigateBack({ delta: 1 }), 500)
  },

  onDelete() {
    const member = store.findMember(this.data.memberId)
    if (!member) return
    wx.showModal({
      title: '删除成员',
      content: '确定删除「' + member.name + '」吗？该成员的签到数据将一并清除。',
      confirmText: '删除',
      confirmColor: '#EF4444',
      success: (res) => {
        if (!res.confirm) return
        const result = store.removeMember(member.id)
        if (!result.success) {
          wx.showToast({ title: result.msg || '删除失败', icon: 'none' })
          return
        }
        wx.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => wx.navigateBack({ delta: 1 }), 500)
      }
    })
  }
})
