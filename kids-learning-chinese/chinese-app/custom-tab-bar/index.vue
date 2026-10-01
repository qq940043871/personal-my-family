<template>
  <view class="tab-bar">
    <view class="tab-item" :class="{ active: current === 0 }" @click="switchTab(0)">
      <view class="tab-content"><text class="tab-icon">🏠</text><text class="tab-label">首页</text></view>
    </view>
    <view class="tab-item" :class="{ active: current === 1 }" @click="switchTab(1)">
      <view class="tab-content"><text class="tab-icon">📖</text><text class="tab-label">浏览</text></view>
    </view>
    <view class="tab-item" :class="{ active: current === 2 }" @click="switchTab(2)">
      <view class="tab-content"><text class="tab-icon">📊</text><text class="tab-label">报告</text></view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CustomTabBar',
  props: { selected: { type: Number, default: 0 } },
  data() {
    return {
      current: 0,
      pages: ['/pages/index/index', '/pages/learning/learning', '/pages/report/report']
    };
  },
  watch: { selected(val) { this.current = val; } },
  mounted() { this.current = this.selected; },
  methods: {
    switchTab(idx) {
      if (this.current === idx) return;
      uni.switchTab({ url: this.pages[idx] });
    }
  }
};
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 100rpx;
  background: #F0F4FA;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 12rpx;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 3rpx solid rgba(255,255,255,0.85);
  box-shadow: 0 -4rpx 24rpx rgba(0,0,0,0.06);
  z-index: 9999;
}
.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 200rpx;
  height: 72rpx;
  border-radius: 24rpx;
  color: #999;
  transition: all 0.2s ease;
}
.tab-item.active {
  color: #5B7FFF;
  background: rgba(91,127,255,0.08);
}
.tab-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  flex-wrap: nowrap;
}
.tab-icon {
  font-size: 36rpx;
  line-height: 36rpx;
  display: inline-block;
  flex-shrink: 0;
}
.tab-label {
  font-size: 20rpx;
  font-weight: 700;
  line-height: 20rpx;
  display: inline-block;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
}
</style>
