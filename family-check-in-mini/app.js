const store = require('./utils/store.js')

App({
  globalData: {
    launchedAt: 0
  },

  onLaunch() {
    this.globalData.launchedAt = Date.now()
    // 触发一次本地数据装载，确保存储可用
    store.loadMembers()
    console.log('全家签到小程序启动，成员数：', store.getMembers().length)
  },

  onShow() {
    console.log('全家签到小程序显示')
  },

  onHide() {
    console.log('全家签到小程序隐藏')
  },

  onError(err) {
    console.error('小程序运行错误', err)
  }
})
