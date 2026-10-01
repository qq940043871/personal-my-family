<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { onMounted } from 'vue'
import { onRotateWatch, BREAKPOINTS } from '@/utils/pad-layout-helper'

onLaunch(() => {
  console.log('全家签到 App 启动')
  // 首跳由首页 pages/index/index 的 onMounted 负责（H5 上 onLaunch 时页面栈未就绪，reLaunch 会静默失败）
})

onShow(() => {
  console.log('全家签到 App 显示')
  // 不在这里跳转：用户从三栏页 navigateTo 到详情/3D 页后，回前台不应被拉回
})

onHide(() => {
  console.log('全家签到 App 隐藏')
})

onMounted(() => {
  // 监听屏幕翻转，若切为竖屏则强制锁回横屏（仅真机生效）
  onRotateWatch((res) => {
    if (!res.landscape) {
      try {
        plus.screen.lockOrientation('landscape-primary')
      } catch (e) {
        console.warn('锁定横屏失败（H5 预览环境不支持）', e)
      }
      return
    }
    // 旋转进入三栏区间时自动切换布局（已在三栏页则跳过）
    if (res.w >= BREAKPOINTS.TABLET_PORT) {
      tryRedirectToLandscape()
    }
  })
})

function tryRedirectToLandscape() {
  try {
    const info = uni.getWindowInfo()
    // 三栏布局区间：横屏且宽度 >= 680dp（小米规范）
    if (info.windowWidth >= BREAKPOINTS.TABLET_PORT && info.windowWidth > info.windowHeight) {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      if (currentPage && currentPage.route === 'pages/landscape/landscape') return
      uni.reLaunch({ url: '/pages/landscape/landscape' })
    }
  } catch {
    // 静默
  }
}
</script>

<style lang="scss">
@import '@/uni.scss';
</style>
