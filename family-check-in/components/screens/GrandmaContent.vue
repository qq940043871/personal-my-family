<template>
  <view class="grandma-content">
    <!-- ===== 顶部：问候 ===== -->
    <view class="gc-header">
      <view class="gc-header-left">
        <text class="gc-greeting">🙏 主赐平安</text>
        <text class="gc-name">{{ member.name }} · {{ member.age }}岁</text>
      </view>
      <view class="gc-header-right">
        <text class="gc-grace">恩典值 {{ member.grace || 0 }}</text>
      </view>
    </view>

    <!-- ===== 宠物：恩典 ===== -->
    <view class="gc-pet-card">
      <view class="gc-pet-left">
        <text class="gc-pet-emoji">🐢</text>
      </view>
      <view class="gc-pet-body">
        <text class="gc-pet-name">恩典 · {{ stage.stage }}</text>
        <view class="gc-pet-track">
          <view
            class="gc-pet-fill"
            :style="{ width: growPct + '%', background: '#A88B6A' }"
          ></view>
        </view>
        <text class="gc-pet-num">{{ member.grow }}/{{ member.totalGrow }}</text>
      </view>
    </view>

    <!-- ===== 今日经文 ===== -->
    <view class="gc-verse-card">
      <text class="gc-verse-icon">📖</text>
      <text class="gc-verse-title">今日经文</text>
      <text class="gc-verse-text">"{{ verseText }}"</text>
      <text class="gc-verse-ref">— {{ verseRef }}</text>
    </view>

    <!-- ===== 养生任务 ===== -->
    <text class="gc-section-title">🍃 今日养生</text>
    <view class="gc-task-grid">
      <view
        v-for="t in member.tasks"
        :key="t.id"
        class="gc-task-card"
        :class="{ done: t.done }"
        @click="onCheckin(t)"
      >
        <view class="gc-task-icon-area">
          <text class="gc-task-icon">{{ t.icon }}</text>
        </view>
        <text class="gc-task-name">{{ t.name }}</text>
        <text class="gc-task-grace">恩典 +{{ t.grace || 10 }}</text>
        <view class="gc-task-check" :class="{ done: t.done }">
          <text v-if="t.done">✓</text>
        </view>
      </view>
    </view>

    <!-- ===== 属灵果实 ===== -->
    <view class="gc-fruit-section">
      <text class="gc-section-title">🕊️ 属灵果实</text>
      <view class="gc-fruit-grid">
        <view
          v-for="f in fruitList"
          :key="f.id"
          class="gc-fruit-item"
        >
          <text class="gc-fruit-icon">{{ f.icon }}</text>
          <text class="gc-fruit-name">{{ f.name }}</text>
          <text class="gc-fruit-desc">{{ f.desc }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { stageFor, getTodayVerse, SPIRITUAL_FRUITS } from '@/store/index.js'

const props = defineProps({
  member: { type: Object, default: null },
})

const emit = defineEmits(['checkin'])

const stage = computed(() => {
  if (!props.member) return { stage: '' }
  return stageFor(props.member)
})

const growPct = computed(() => {
  if (!props.member) return 0
  return Math.round((props.member.grow / props.member.totalGrow) * 100)
})

// 经文
const verseText = computed(() => {
  if (!props.member) return ''
  if (props.member.todayVerse?.text) return props.member.todayVerse.text
  return getTodayVerse().text
})
const verseRef = computed(() => {
  if (!props.member) return ''
  if (props.member.todayVerse?.ref) return props.member.todayVerse.ref
  return getTodayVerse().ref
})

// 属灵果实
const fruitList = computed(() => {
  if (!props.member || !props.member.spiritualFruits) return []
  return props.member.spiritualFruits.map(id => SPIRITUAL_FRUITS.find(f => f.id === id)).filter(Boolean)
})

function onCheckin(task) {
  if (task.done || !props.member) return
  // 单人视角 + 拍照必填：奶奶同样要拍照，不拍照不给签到、不给恩典值
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
.grandma-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  /* 奶奶全局大字模式：1.2x 基准 */
  font-size: 1.2em;
}
.grandma-content::-webkit-scrollbar {
  width: 4px;
}
.grandma-content::-webkit-scrollbar-thumb {
  background: #D4C8B8;
  border-radius: 2px;
}

/* 头部 */
.gc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.gc-greeting {
  font-size: 24px;
  font-weight: 800;
  color: #A88B6A;
  display: block;
}
.gc-name {
  font-size: 16px;
  color: #8A8178;
  font-weight: 600;
  display: block;
  margin-top: 4px;
}
.gc-grace {
  font-size: 16px;
  font-weight: 700;
  color: #B45309;
  background: #FFFBEB;
  padding: 8px 18px;
  border-radius: 24px;
}

/* 宠物卡 */
.gc-pet-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #F5F0EB;
  border-radius: 20px;
  border: 1px solid #E2D6CC;
}
.gc-pet-emoji {
  font-size: 40px;
}
.gc-pet-body {
  flex: 1;
}
.gc-pet-name {
  font-size: 18px;
  font-weight: 700;
  color: #57534E;
  display: block;
  margin-bottom: 6px;
}
.gc-pet-track {
  height: 10px;
  background: #E2D6CC;
  border-radius: 5px;
  overflow: hidden;
}
.gc-pet-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.6s ease;
}
.gc-pet-num {
  font-size: 13px;
  color: #8A8178;
  text-align: right;
  display: block;
  margin-top: 4px;
}

/* 经文卡 */
.gc-verse-card {
  padding: 20px;
  background: #FFFBEB;
  border-radius: 20px;
  border-left: 6px solid #A88B6A;
}
.gc-verse-icon {
  font-size: 22px;
}
.gc-verse-title {
  font-size: 16px;
  font-weight: 700;
  color: #A88B6A;
  margin-left: 8px;
}
.gc-verse-text {
  font-size: 20px;
  color: #57534E;
  line-height: 1.7;
  font-style: italic;
  display: block;
  margin-top: 10px;
}
.gc-verse-ref {
  font-size: 15px;
  color: #A88B6A;
  font-weight: 600;
  display: block;
  margin-top: 8px;
}

/* 分区标题 */
.gc-section-title {
  font-size: 18px;
  font-weight: 700;
  color: #57534E;
}

/* 任务网格 */
.gc-task-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.gc-task-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  background: #FFFFFF;
  border-radius: 18px;
  border: 2px solid #E2D6CC;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 80px;
}
.gc-task-card:active {
  transform: scale(0.97);
}
.gc-task-card.done {
  opacity: 0.7;
  border-color: #A88B6A !important;
  background: #F5F0EB;
}
.gc-task-icon-area {
  display: flex;
  align-items: center;
  gap: 8px;
}
.gc-task-icon {
  font-size: 28px;
}
.gc-task-name {
  font-size: 17px;
  font-weight: 700;
  color: #1A1A1A;
  line-height: 1.4;
}
.gc-task-card.done .gc-task-name {
  color: #8A8178;
}
.gc-task-grace {
  font-size: 14px;
  font-weight: 700;
  color: #A88B6A;
}
.gc-task-check {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #E2D6CC;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #FFFFFF;
  align-self: flex-end;
}
.gc-task-check.done {
  background: #A88B6A;
  border-color: #A88B6A;
}

/* 属灵果实 */
.gc-fruit-section {
  margin-top: 4px;
}
.gc-fruit-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
}
.gc-fruit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #E2D6CC;
}
.gc-fruit-icon {
  font-size: 28px;
}
.gc-fruit-name {
  font-size: 15px;
  font-weight: 700;
  color: #1A1A1A;
}
.gc-fruit-desc {
  font-size: 12px;
  color: #8A8178;
  text-align: center;
}
</style>