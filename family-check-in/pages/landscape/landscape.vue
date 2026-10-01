<template>
  <view class="pad-land-page">
    <PadLandLayout />
  </view>
</template>

<script setup>
import { onMounted } from 'vue'
import PadLandLayout from '@/components/layout/PadLandLayout.vue'

onMounted(() => {
  // 隐藏底部 TabBar，交由左栏导航接管
  try { uni.hideTabBar({ animation: false }) } catch {}
})
</script>

<style scoped>
.pad-land-page {
  /* app-plus 基座 webview 的 CSS 布局视口(960px)可能小于 windowWidth(1097px)，
     100vw 会被截断；优先用 uni-app 注入的 --window-width/--window-height */
  width: var(--window-width, 100vw);
  height: var(--window-height, 100vh);
  overflow: hidden;
  background: #FFF6F0;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: border-box;
  position: relative;
}
</style>