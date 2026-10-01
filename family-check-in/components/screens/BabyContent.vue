<template>
  <view class="baby-content">
    <!-- ===== 顶部：可爱问候 ===== -->
    <view class="bc-header">
      <view class="bc-header-left">
        <text class="bc-greeting">🐣 小宝今天真棒！</text>
        <text class="bc-stars">⭐ {{ member.stars || 0 }} 颗星星</text>
      </view>
    </view>

    <!-- ===== 宠物进化预览 ===== -->
    <view class="bc-evolve-card">
      <view class="bc-evolve-visual">
        <!-- 当前形态 -->
        <view class="bc-evolve-stage" :class="{ active: currentStage.level >= 1 }">
          <text class="bc-evolve-emoji">🥚</text>
          <text class="bc-evolve-label">蛋宝宝</text>
        </view>
        <text class="bc-evolve-arrow">→</text>
        <view class="bc-evolve-stage" :class="{ active: currentStage.level >= 2 }">
          <text class="bc-evolve-emoji">🐥</text>
          <text class="bc-evolve-label">小鸡</text>
        </view>
        <text class="bc-evolve-arrow">→</text>
        <view class="bc-evolve-stage" :class="{ active: currentStage.level >= 3 }">
          <text class="bc-evolve-emoji">🐔</text>
          <text class="bc-evolve-label">大公鸡</text>
        </view>
      </view>
      <view class="bc-evolve-progress">
        <view class="bc-evolve-track">
          <view
            class="bc-evolve-fill"
            :style="{ width: growPct + '%' }"
          ></view>
        </view>
        <text class="bc-evolve-pct">{{ growPct }}%</text>
      </view>
    </view>

    <!-- ===== 3个超大任务按钮 ===== -->
    <view class="bc-task-grid">
      <view
        v-for="t in member.tasks"
        :key="t.id"
        class="bc-task-btn"
        :class="{ done: t.done }"
        @click="onCheckin(t)"
      >
        <view class="bc-task-icon-area">
          <text class="bc-task-emoji">{{ t.icon }}</text>
        </view>
        <text class="bc-task-name">{{ t.name }}</text>
        <view class="bc-task-status">
          <text v-if="t.done" class="bc-task-done-mark">⭐ 完成!</text>
          <text v-else class="bc-task-tap">👆 点我</text>
        </view>
      </view>
    </view>

    <!-- ===== 星星掉落动画 ===== -->
    <view class="bc-stars-area" v-if="showStars">
      <text
        v-for="i in 8"
        :key="i"
        class="bc-star-particle"
        :style="{
          left: (10 + Math.random() * 80) + '%',
          animationDelay: (i * 0.2) + 's',
        }"
      >⭐</text>
    </view>

    <!-- ===== 和哥哥的友好记录 ===== -->
    <view class="bc-friendly">
      <text class="bc-friendly-icon">🤝</text>
      <text class="bc-friendly-text">和小龙哥哥一起玩</text>
      <text class="bc-friendly-badge">🍬 平局糖果 × 3</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { stageFor } from '@/store/index.js'

const props = defineProps({
  member: { type: Object, default: null },
})

const emit = defineEmits(['checkin'])

const currentStage = computed(() => {
  if (!props.member) return { stage: '', level: 1, icon: '🥚' }
  return stageFor(props.member)
})

const growPct = computed(() => {
  if (!props.member) return 0
  return Math.round((props.member.grow / props.member.totalGrow) * 100)
})

// 星星动画
const showStars = ref(false)
watch(() => props.member?.stars, () => {
  showStars.value = true
  setTimeout(() => { showStars.value = false }, 3000)
})

function onCheckin(task) {
  if (task.done || !props.member) return
  // 单人视角 + 拍照必填：小宝也要拍照，不拍照不给签到、不给星星
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      const path = (res.tempFilePaths && res.tempFilePaths[0]) || ''
      if (path) emit('checkin', props.member.id, task.id, path)
    },
    fail: (err) => {
      if (err.errMsg !== 'chooseImage:fail cancel') {
        uni.showToast({ title: '拍照失败，请重试', icon: 'none' })
      }
    }
  })
}
</script>

<style scoped>
.baby-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 24px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  position: relative;
  background: linear-gradient(180deg, #FFF6F0 0%, #FFF0E6 100%);
}
.baby-content::-webkit-scrollbar {
  width: 0;
}

/* 头部 */
.bc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.bc-greeting {
  font-size: 22px;
  font-weight: 800;
  color: #F59E0B;
  display: block;
}
.bc-stars {
  font-size: 16px;
  font-weight: 700;
  color: #FBBF24;
  display: block;
  margin-top: 4px;
}

/* 进化预览 */
.bc-evolve-card {
  padding: 16px 20px;
  background: #FFFFFF;
  border-radius: 24px;
  border: 2px solid #FDE68A;
  box-shadow: 0 4px 16px rgba(251,191,36,0.15);
}
.bc-evolve-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}
.bc-evolve-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  opacity: 0.3;
  transition: all 0.5s ease;
}
.bc-evolve-stage.active {
  opacity: 1;
  transform: scale(1.1);
}
.bc-evolve-emoji {
  font-size: 40px;
}
.bc-evolve-label {
  font-size: 12px;
  font-weight: 600;
  color: #8A8178;
}
.bc-evolve-arrow {
  font-size: 24px;
  color: #E2D6CC;
}
.bc-evolve-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bc-evolve-track {
  flex: 1;
  height: 12px;
  background: #F3EDE5;
  border-radius: 6px;
  overflow: hidden;
}
.bc-evolve-fill {
  height: 100%;
  background: linear-gradient(90deg, #FBBF24, #F59E0B);
  border-radius: 6px;
  transition: width 0.6s ease;
}
.bc-evolve-pct {
  font-size: 16px;
  font-weight: 800;
  color: #F59E0B;
  min-width: 44px;
  text-align: right;
}

/* 超大任务按钮 */
.bc-task-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.bc-task-btn {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 24px 28px;
  background: #FFFFFF;
  border-radius: 28px;
  border: 3px solid #FDE68A;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 72px;
}
.bc-task-btn:active {
  transform: scale(0.96);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.bc-task-btn.done {
  opacity: 0.7;
  border-color: #34D399;
  background: #ECFDF5;
}
.bc-task-icon-area {
  width: 56px;
  height: 56px;
  min-width: 56px;
  border-radius: 50%;
  background: #FFFBEB;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #FDE68A;
}
.bc-task-emoji {
  font-size: 30px;
}
.bc-task-btn.done .bc-task-icon-area {
  background: #D1FAE5;
  border-color: #34D399;
}
.bc-task-name {
  flex: 1;
  font-size: 22px;
  font-weight: 800;
  color: #1A1A1A;
}
.bc-task-btn.done .bc-task-name {
  color: #8A8178;
}
.bc-task-status {
  flex-shrink: 0;
}
.bc-task-done-mark {
  font-size: 18px;
  font-weight: 700;
  color: #10B981;
}
.bc-task-tap {
  font-size: 18px;
  font-weight: 700;
  color: #F59E0B;
  animation: bounce 1.5s ease-in-out infinite;
}

/* 星星动画 */
.bc-stars-area {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
}
.bc-star-particle {
  position: absolute;
  top: -20px;
  font-size: 24px;
  animation: starFall 2s ease forwards;
}
@keyframes starFall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* 友好记录 */
.bc-friendly {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: #FEF3C7;
  border-radius: 16px;
  border: 1px solid #FDE68A;
}
.bc-friendly-icon {
  font-size: 24px;
}
.bc-friendly-text {
  font-size: 16px;
  font-weight: 700;
  color: #92400E;
  flex: 1;
}
.bc-friendly-badge {
  font-size: 14px;
  font-weight: 700;
  color: #B45309;
  background: #FFFFFF;
  padding: 6px 14px;
  border-radius: 16px;
}
</style>