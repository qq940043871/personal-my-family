<template>
  <view class="rank-item" :class="{ highlight: index === 0 }">
    <text class="rank-num" :class="rankClass">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1) }}</text>
    <text class="rank-emoji">{{ item.emoji }}</text>
    <text class="rank-name">{{ item.name }}</text>
    <text class="rank-rate">{{ item.rate }}%</text>
    <text class="rank-extra" v-if="item.petGrow">🐾 +{{ item.petGrow }}</text>
    <text class="rank-extra" v-else-if="item.totalPoints">{{ item.totalPoints.toLocaleString() }}分</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, required: true }
})

const rankClass = computed(() => {
  if (props.index === 0) return 'gold'
  if (props.index === 1) return 'silver'
  if (props.index === 2) return 'bronze'
  return ''
})
</script>

<style scoped>
.rank-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 16rpx 24rpx;
  background: rgba(255,255,255,0.7);
  border-radius: 16rpx;
  transition: transform 0.15s ease, background 0.2s ease;
}
.rank-item:active {
  transform: scale(0.98);
}
.rank-item.highlight {
  background: rgba(255,215,0,0.12);
}
.rank-num {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
}
.rank-num.gold { font-size: 40rpx; }
.rank-num.silver { font-size: 36rpx; color: #94A3B8; }
.rank-num.bronze { font-size: 32rpx; color: #D97706; }
.rank-emoji { font-size: 40rpx; }
.rank-name { flex: 1; font-size: 28rpx; font-weight: 500; }
.rank-rate { font-size: 26rpx; font-weight: 600; color: #10B981; }
.rank-extra { font-size: 22rpx; color: #64748B; }
</style>
