<template>
  <web-view :src="viewerUrl"></web-view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const viewerUrl = ref('')

onLoad((options) => {
  // 使用本地HTTP服务器地址，生产环境需替换为实际部署地址
  viewerUrl.value = 'http://localhost:18899/viewer.html'
})
</script>

<style scoped>
/* web-view 全屏 */
</style>
