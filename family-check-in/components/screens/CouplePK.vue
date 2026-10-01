<template>
  <view class="couple-pk">
    <!-- ===== 标题 ===== -->
    <view class="pk-header">
      <text class="pk-title">⚔️ 夫妻PK对比</text>
      <text class="pk-subtitle">今日话语权争夺</text>
    </view>

    <!-- ===== SplitView 可拖拽分割面板（手势只绑在分割条上） ===== -->
    <view class="pk-split" ref="splitRef">
      <!-- 爸爸侧 -->
      <view class="pk-side" :style="{ width: splitRatio + '%' }">
        <view class="pk-side-header" :style="{ background: dad.themeColor + '15' }">
          <text class="pk-side-emoji">👨</text>
          <text class="pk-side-name" :style="{ color: dad.themeColor }">{{ dad.name }}</text>
          <text v-if="currentId === 'dad'" class="pk-side-me">我</text>
          <text class="pk-side-pet">🐶 {{ dad.pet.name }}</text>
        </view>

        <view class="pk-side-body">
          <!-- 任务进度 -->
          <text class="pk-side-label">今日任务</text>
          <view class="pk-side-tasks">
            <view
              v-for="t in dad.tasks"
              :key="t.id"
              class="pk-side-task"
              :class="{ done: t.done }"
            >
              <view class="pk-side-task-check" :class="{ done: t.done }" :style="t.done ? { background: dad.themeColor } : {}">
                <text v-if="t.done">✓</text>
              </view>
              <text class="pk-side-task-name">{{ t.name }}</text>
            </view>
          </view>

          <!-- 完成进度 -->
          <view class="pk-side-progress">
            <text class="pk-side-progress-label">完成率</text>
            <view class="pk-side-progress-track">
              <view
                class="pk-side-progress-fill"
                :style="{ width: dadRate + '%', background: dad.themeColor }"
              ></view>
            </view>
            <text class="pk-side-progress-val">{{ dadRate }}%</text>
          </view>

          <!-- 宠物成长 -->
          <view class="pk-side-pet-grow">
            <text class="pk-side-label">宠物成长</text>
            <view class="pk-side-pet-track">
              <view
                class="pk-side-pet-fill"
                :style="{ width: dadGrow + '%', background: dad.themeColor }"
              ></view>
            </view>
            <text class="pk-side-pet-val">{{ dad.grow }}/{{ dad.totalGrow }}</text>
          </view>
        </view>
      </view>

      <!-- 拖拽分割条 -->
      <view
        class="pk-divider"
        :class="{ dragging: isDragging }"
        @touchstart="onDragStart"
        @touchmove.stop.prevent="onDragMove"
        @touchend="onDragEnd"
        @mousedown="onDragStart"
        @mousemove="onDragMove"
        @mouseup="onDragEnd"
        @mouseleave="onDragEnd"
      >
        <view class="pk-divider-handle">
          <text class="pk-divider-icon">⚖️</text>
        </view>
      </view>

      <!-- 妈妈侧 -->
      <view class="pk-side" :style="{ width: (100 - splitRatio) + '%' }">
        <view class="pk-side-header" :style="{ background: mom.themeColor + '15' }">
          <text class="pk-side-emoji">👩</text>
          <text class="pk-side-name" :style="{ color: mom.themeColor }">{{ mom.name }}</text>
          <text v-if="currentId === 'mom'" class="pk-side-me">我</text>
          <text class="pk-side-pet">🐱 {{ mom.pet.name }}</text>
        </view>

        <view class="pk-side-body">
          <!-- 任务进度 -->
          <text class="pk-side-label">今日任务</text>
          <view class="pk-side-tasks">
            <view
              v-for="t in mom.tasks"
              :key="t.id"
              class="pk-side-task"
              :class="{ done: t.done }"
            >
              <view class="pk-side-task-check" :class="{ done: t.done }" :style="t.done ? { background: mom.themeColor } : {}">
                <text v-if="t.done">✓</text>
              </view>
              <text class="pk-side-task-name">{{ t.name }}</text>
            </view>
          </view>

          <!-- 完成进度 -->
          <view class="pk-side-progress">
            <text class="pk-side-progress-label">完成率</text>
            <view class="pk-side-progress-track">
              <view
                class="pk-side-progress-fill"
                :style="{ width: momRate + '%', background: mom.themeColor }"
              ></view>
            </view>
            <text class="pk-side-progress-val">{{ momRate }}%</text>
          </view>

          <!-- 宠物成长 -->
          <view class="pk-side-pet-grow">
            <text class="pk-side-label">宠物成长</text>
            <view class="pk-side-pet-track">
              <view
                class="pk-side-pet-fill"
                :style="{ width: momGrow + '%', background: mom.themeColor }"
              ></view>
            </view>
            <text class="pk-side-pet-val">{{ mom.grow }}/{{ mom.totalGrow }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ===== 今日话语权 ===== -->
    <view class="pk-winner-banner" :style="{ background: winnerBg }">
      <text class="pk-winner-icon">{{ winnerIcon }}</text>
      <view class="pk-winner-body">
        <text class="pk-winner-title">今日话语权</text>
        <text class="pk-winner-name">{{ winnerName }}</text>
      </view>
      <text class="pk-winner-badge">{{ winnerRate }}%</text>
    </view>

    <!-- ===== 夫妻合体技 ===== -->
    <view class="pk-combo" v-if="bothDone">
      <text class="pk-combo-icon">💕</text>
      <view class="pk-combo-body">
        <text class="pk-combo-title">夫妻合体技激活！</text>
        <text class="pk-combo-desc">全员完成成长值 ×1.5</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getCurrentMemberId } from '@/store/index.js'

const props = defineProps({
  members: { type: Array, default: () => [] },
})

// 单人视角：PK 页保留双人对比，但标出「我」是哪一方，便于对照
const currentId = computed(() => getCurrentMemberId())

const dad = computed(() => props.members.find(m => m.id === 'dad') || { tasks: [], grow: 0, totalGrow: 100, themeColor: '#2563EB' })
const mom = computed(() => props.members.find(m => m.id === 'mom') || { tasks: [], grow: 0, totalGrow: 100, themeColor: '#EC4899' })

// 分割比例
const splitRatio = ref(50)
const isDragging = ref(false)
let startX = 0
let startRatio = 50
const containerWidth = ref(400)

function onDragStart(e) {
  isDragging.value = true
  const touch = e.touches ? e.touches[0] : e
  startX = touch.clientX
  startRatio = splitRatio.value
  if (e.target && e.target.closest) {
    const container = e.target.closest('.pk-split')
    if (container) containerWidth.value = container.offsetWidth
  }
}
function onDragMove(e) {
  if (!isDragging.value) return
  e.preventDefault()
  const touch = e.touches ? e.touches[0] : e
  const dx = touch.clientX - startX
  const delta = (dx / containerWidth.value) * 100
  splitRatio.value = Math.max(30, Math.min(70, startRatio + delta))
}
function onDragEnd() {
  isDragging.value = false
}

// 完成率
const dadRate = computed(() => {
  const t = dad.value.tasks || []
  const done = t.filter(x => x.done).length
  return t.length ? Math.round((done / t.length) * 100) : 0
})
const momRate = computed(() => {
  const t = mom.value.tasks || []
  const done = t.filter(x => x.done).length
  return t.length ? Math.round((done / t.length) * 100) : 0
})

const dadGrow = computed(() => {
  return Math.round((dad.value.grow / (dad.value.totalGrow || 100)) * 100)
})
const momGrow = computed(() => {
  return Math.round((mom.value.grow / (mom.value.totalGrow || 100)) * 100)
})

// 话语权判定
const winnerName = computed(() => {
  if (dadRate.value > momRate.value) return dad.value.name || '爸爸'
  if (momRate.value > dadRate.value) return mom.value.name || '妈妈'
  return '平局 🤝'
})
const winnerRate = computed(() => Math.max(dadRate.value, momRate.value))
const winnerBg = computed(() => {
  if (dadRate.value > momRate.value) return '#DBEAFE'
  if (momRate.value > dadRate.value) return '#FCE7F3'
  return '#F3F4F6'
})
const winnerIcon = computed(() => {
  if (dadRate.value > momRate.value) return '👨'
  if (momRate.value > dadRate.value) return '👩'
  return '🤝'
})

// 夫妻合体技
const bothDone = computed(() => {
  const dadAll = (dad.value.tasks || []).every(t => t.done)
  const momAll = (mom.value.tasks || []).every(t => t.done)
  return dadAll && momAll
})
</script>

<style scoped>
.couple-pk {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 20px;
  box-sizing: border-box;
  gap: 14px;
}

/* 标题 */
.pk-header {
  flex-shrink: 0;
}
.pk-title {
  font-size: 20px;
  font-weight: 800;
  color: #1A1A1A;
}
.pk-subtitle {
  font-size: 13px;
  color: #8A8178;
  margin-top: 2px;
  display: block;
}

/* SplitView 容器 */
.pk-split {
  display: flex;
  flex: 1;
  min-height: 0;
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #F0E8DE;
  overflow: hidden;
  position: relative;
  user-select: none;
}

/* 各侧 */
.pk-side {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: width 0.05s linear;
}
.pk-side-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid #F0E8DE;
  flex-shrink: 0;
}
.pk-side-emoji {
  font-size: 20px;
}
.pk-side-name {
  font-size: 15px;
  font-weight: 800;
}
.pk-side-me {
  font-size: 9px;
  font-weight: 800;
  color: #FFFFFF;
  background: #FF8A65;
  border-radius: 6px;
  padding: 1px 6px;
  flex-shrink: 0;
}
.pk-side-pet {
  font-size: 11px;
  color: #8A8178;
  margin-left: auto;
}
.pk-side-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pk-side-label {
  font-size: 12px;
  font-weight: 700;
  color: #8A8178;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 任务列表 */
.pk-side-tasks {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pk-side-task {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #F8FAFC;
  border-radius: 8px;
}
.pk-side-task.done {
  background: #F0FDF4;
}
.pk-side-task-check {
  width: 20px;
  height: 20px;
  min-width: 20px;
  border-radius: 50%;
  border: 2px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #FFFFFF;
}
.pk-side-task-check.done {
  border-color: #34D399;
  background: #34D399;
}
.pk-side-task-name {
  font-size: 12px;
  font-weight: 600;
  color: #1A1A1A;
}
.pk-side-task.done .pk-side-task-name {
  color: #8A8178;
}

/* 进度 */
.pk-side-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pk-side-progress-label {
  font-size: 11px;
  color: #8A8178;
  font-weight: 600;
  width: 40px;
  flex-shrink: 0;
}
.pk-side-progress-track {
  flex: 1;
  height: 8px;
  background: #F3EDE5;
  border-radius: 4px;
  overflow: hidden;
}
.pk-side-progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}
.pk-side-progress-val {
  font-size: 13px;
  font-weight: 700;
  min-width: 36px;
  text-align: right;
}

/* 宠物成长 */
.pk-side-pet-grow {
  margin-top: auto;
}
.pk-side-pet-track {
  height: 8px;
  background: #F3EDE5;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;
}
.pk-side-pet-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}
.pk-side-pet-val {
  font-size: 11px;
  color: #8A8178;
  text-align: right;
  display: block;
  margin-top: 2px;
}

/* 分割条 */
.pk-divider {
  width: 32px;
  min-width: 32px;
  background: #F3EDE5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  transition: background 0.15s ease;
  z-index: 5;
}
.pk-divider.dragging {
  background: #FF8A65;
}
.pk-divider-handle {
  display: flex;
  align-items: center;
  justify-content: center;
}
.pk-divider-icon {
  font-size: 16px;
}

/* 话语权横幅 */
.pk-winner-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: 14px;
  flex-shrink: 0;
}
.pk-winner-icon {
  font-size: 28px;
}
.pk-winner-body {
  flex: 1;
}
.pk-winner-title {
  font-size: 12px;
  color: #8A8178;
}
.pk-winner-name {
  font-size: 18px;
  font-weight: 800;
  color: #1A1A1A;
  display: block;
}
.pk-winner-badge {
  font-size: 20px;
  font-weight: 800;
  color: #F59E0B;
}

/* 合体技 */
.pk-combo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: linear-gradient(90deg, #FCE7F3, #EDE9FE);
  border-radius: 14px;
  border: 1px solid #F0ABFC;
  flex-shrink: 0;
}
.pk-combo-icon {
  font-size: 28px;
}
.pk-combo-title {
  font-size: 16px;
  font-weight: 800;
  color: #9D174D;
}
.pk-combo-desc {
  font-size: 13px;
  color: #A88B6A;
}
</style>