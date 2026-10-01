<template>
  <view class="pet-card" @click="onClick">
    <text class="pet-icon" :class="{ grow: animating }">{{ stageInfo.icon }}</text>
    <text class="pet-name">{{ pet.name }}</text>
    <text class="pet-member">{{ member.emoji }} {{ member.name }}</text>
    <text class="pet-stage">{{ stageInfo.stage }}</text>
    <view class="progress-wrap">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: ratio + '%' }"></view>
      </view>
      <text class="progress-text">{{ ratio }}%</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { stageFor } from '@/store/index.js'

const props = defineProps({
  member: { type: Object, required: true }
})

const emit = defineEmits(['click'])
const animating = ref(false)

const stageInfo = computed(() => stageFor(props.member))
const ratio = computed(() => Math.round((props.member.grow / props.member.totalGrow) * 100))

function onClick() {
  animating.value = true
  setTimeout(() => { animating.value = false }, 500)
  emit('click', props.member.id)
}

defineExpose({ triggerGrow: () => { animating.value = true; setTimeout(() => animating.value = false, 500) } })
</script>

<style scoped>
.pet-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 12rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
  min-width: 140rpx;
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.2s ease;
  cursor: pointer;
}
.pet-card:active {
  transform: scale(0.95);
}
.pet-icon {
  font-size: 64rpx;
  line-height: 1.2;
  transition: transform 0.3s;
}
.pet-icon.grow {
  animation: bounce 0.5s ease;
}
@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}
.pet-name {
  font-size: 24rpx;
  font-weight: 600;
  color: #1A1A1A;
}
.pet-member {
  font-size: 20rpx;
  color: #8A8178;
}
.pet-stage {
  font-size: 20rpx;
  color: #FF8A65;
  font-weight: 600;
  margin-top: 4rpx;
}
.progress-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 6rpx;
}
.progress-bar {
  width: 80rpx;
  height: 10rpx;
  background: #F3EDE5;
  border-radius: 5rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #FF8A65;
  border-radius: 5rpx;
  transition: width 0.6s ease;
}
.progress-text {
  font-size: 18rpx;
  color: #8A8178;
}
</style>
