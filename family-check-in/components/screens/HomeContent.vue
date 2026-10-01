<template>
  <view class="home-content">
    <!-- ===== 顶部日期/标题 ===== -->
    <view class="hc-header">
      <view class="hc-header-left">
        <text class="hc-title">{{ member ? member.name + '的签到' : '📅 今日签到' }}</text>
        <text class="hc-date">{{ dateText }}</text>
      </view>
      <view class="hc-header-right">
        <text class="hc-done">{{ doneCount }}/{{ totalCount }} 完成</text>
      </view>
    </view>

    <!-- ===== 家庭速览（点一下切人，实为切换当前身份） ===== -->
    <scroll-view
      class="hc-member-tags"
      scroll-x
      :show-scrollbar="false"
    >
      <view class="hc-tag-row">
        <view
          v-for="m in allMembers"
          :key="m.id"
          class="hc-tag"
          :class="{ active: activeMemberId === m.id }"
          :style="activeMemberId === m.id ? {
            background: m.themeColor + '20',
            borderColor: m.themeColor,
            color: m.themeColor,
          } : {}"
          @click="onMemberClick(m)"
        >
          <text class="hc-tag-emoji">{{ m.emoji }}</text>
          <text class="hc-tag-text">{{ m.name }}</text>
          <text v-if="m.id === activeMemberId" class="hc-tag-me">我</text>
          <text v-else-if="pendingCount(m) > 0" class="hc-tag-badge" :style="{ background: m.themeColor }">{{ pendingCount(m) }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- ===== 任务卡片网格 ===== -->
    <scroll-view
      class="hc-tasks-scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <view class="hc-tasks">
        <template v-if="member">
          <view class="hc-member-section">
            <view class="hc-member-head">
              <view class="hc-member-head-left">
                <text class="hc-member-emoji">{{ member.emoji }}</text>
                <text class="hc-member-name" :style="{ color: member.themeColor }">{{ member.name }}</text>
                <text class="hc-member-role">{{ member.age }}岁 · {{ member.role }}</text>
              </view>
              <text class="hc-me-chip">我</text>
              <text class="hc-member-status">{{ memberDoneCount(member) }}/{{ member.tasks.length }}</text>
            </view>

            <view class="hc-task-grid">
              <view
                v-for="t in member.tasks"
                :key="t.id"
                class="hc-task-card"
                :class="{ done: t.done }"
                :style="{ borderColor: t.done ? member.themeColor + '44' : '#F3EDE5' }"
                @click="onCheckinTask(member.id, t)"
              >
                <view class="hc-task-icon" :style="{ background: member.themeColor + '18' }">
                  <text>{{ t.icon }}</text>
                </view>
                <view class="hc-task-body">
                  <text class="hc-task-name">{{ t.name }}</text>
                  <text class="hc-task-points">+{{ t.points || t.grace || 0 }}</text>
                  <text class="hc-task-photo" v-if="t.photo">📷 已拍照</text>
                </view>
                <view
                  v-if="!t.done"
                  class="hc-camera-btn"
                  @click.stop="onCameraTask(member.id, t)"
                >
                  <text>📷</text>
                </view>
                <view class="hc-task-check" :class="{ done: t.done }" :style="t.done ? { background: member.themeColor } : {}">
                  <text v-if="t.done">✓</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 宠物小形象 -->
          <view class="hc-pet-mini">
            <text class="hc-pet-emoji">{{ petEmoji }}</text>
            <view class="hc-pet-info">
              <text class="hc-pet-name">{{ member.pet.name }}</text>
              <text class="hc-pet-stage">{{ currentStage.stage }}</text>
            </view>
            <view class="hc-pet-track">
              <view
                class="hc-pet-fill"
                :style="{ width: growPct + '%', background: member.themeColor }"
              ></view>
            </view>
            <text class="hc-pet-pct">{{ growPct }}%</text>
          </view>
        </template>

      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { stageFor, getActivePet } from '@/store/index.js'

const props = defineProps({
  member: { type: Object, default: null },
  allMembers: { type: Array, default: () => [] },
  activeMemberId: { type: String, default: null },
})

const emit = defineEmits(['checkin', 'select-member'])

const dateText = computed(() => {
  const d = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
})

// 统计数据（单人视角：只统计当前身份）
const totalCount = computed(() => (props.member ? props.member.tasks.length : 0))
const doneCount = computed(() => (props.member ? props.member.tasks.filter(t => t.done).length : 0))

const currentStage = computed(() => {
  if (!props.member) return { stage: '' }
  return stageFor(props.member)
})

const growPct = computed(() => {
  if (!props.member) return 0
  return Math.round((props.member.grow / props.member.totalGrow) * 100)
})

// 图标跟随成员的出战宠物
const petEmoji = computed(() => {
  if (!props.member) return '🐾'
  const active = getActivePet(props.member.id)
  return active?.icon || props.member.pet?.type || '🐾'
})

function pendingCount(m) {
  return m.tasks.filter(t => !t.done).length
}
function memberDoneCount(m) {
  return m.tasks.filter(t => t.done).length
}

function onMemberClick(m) {
  emit('select-member', m.id)
}

function onCheckinTask(memberId, task) {
  if (task.done) return
  emit('checkin', memberId, task.id)
}

// 相机拍照签到 —— 单人视角 + 拍照必填：所有身份（含小宝/奶奶）都必须先拍照
function onCameraTask(memberId, task) {
  if (task.done) return
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      const photoPath = res.tempFilePaths[0]
      emit('checkin', memberId, task.id, photoPath)
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
.home-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 20px;
  box-sizing: border-box;
}

/* ===== 头部 ===== */
.hc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.hc-header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.hc-title {
  font-size: 20px;
  font-weight: 800;
  color: #1A1A1A;
}
.hc-date {
  font-size: 13px;
  color: #8A8178;
  font-weight: 500;
}
.hc-done {
  font-size: 14px;
  font-weight: 700;
  color: #F59E0B;
  background: #FFFBEB;
  padding: 6px 14px;
  border-radius: 20px;
}

/* ===== 成员标签 ===== */
.hc-member-tags {
  flex-shrink: 0;
  margin-bottom: 12px;
}
.hc-tag-row {
  display: flex;
  gap: 8px;
  padding: 2px 0;
}
.hc-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 20px;
  background: #FFFFFF;
  border: 1.5px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.hc-tag:active {
  transform: scale(0.95);
}
.hc-tag.active {
  background: #4F46E5 !important;
  border-color: #4F46E5 !important;
  color: #FFFFFF !important;
}
.hc-tag-emoji {
  font-size: 14px;
}
.hc-tag-text {
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
  white-space: nowrap;
}
.hc-tag.active .hc-tag-text {
  color: #FFFFFF;
}
.hc-tag-badge {
  font-size: 10px;
  color: #FFFFFF;
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 700;
}
.hc-tag-me {
  font-size: 9px;
  font-weight: 800;
  color: #FFFFFF;
  background: #FF8A65;
  border-radius: 6px;
  padding: 1px 6px;
}

/* ===== 任务滚动区 ===== */
.hc-tasks-scroll {
  flex: 1;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 0 4px;
}
.hc-tasks-scroll::-webkit-scrollbar {
  width: 4px;
}
.hc-tasks-scroll::-webkit-scrollbar-thumb {
  background: #E2D6CC;
  border-radius: 2px;
}

/* ===== 成员分区 ===== */
.hc-member-section {
  margin-bottom: 16px;
}
.hc-member-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  cursor: pointer;
  padding: 4px 0;
}
.hc-member-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hc-member-emoji {
  font-size: 18px;
}
.hc-member-name {
  font-size: 16px;
  font-weight: 700;
}
.hc-member-role {
  font-size: 11px;
  color: #8A8178;
}
.hc-member-status {
  font-size: 12px;
  font-weight: 700;
  color: #A88B6A;
}
.hc-me-chip {
  font-size: 10px;
  font-weight: 800;
  color: #FFFFFF;
  background: #FF8A65;
  border-radius: 6px;
  padding: 1px 7px;
  margin-left: 4px;
  flex-shrink: 0;
}

/* ===== 任务卡片网格 ===== */
.hc-task-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.hc-task-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #FFFFFF;
  border-radius: 14px;
  border: 2px solid #F3EDE5;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 52px;
}
.hc-task-card:active {
  transform: scale(0.97);
}
.hc-task-card.done {
  opacity: 0.75;
}
.hc-task-icon {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.hc-task-body {
  flex: 1;
  min-width: 0;
}
.hc-task-name {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A1A;
  display: block;
  line-height: 1.3;
}
.hc-task-card.done .hc-task-name {
  color: #8A8178;
}
.hc-task-points {
  font-size: 11px;
  color: #F59E0B;
  font-weight: 600;
}
.hc-task-photo {
  font-size: 10px;
  color: #14B8A6;
  font-weight: 600;
  margin-top: 1px;
}
.hc-camera-btn {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  background: #FFF6F0;
  border: 1.5px solid #FFEDD5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.hc-camera-btn:active {
  transform: scale(0.9);
  background: #FFEDD5;
}
.hc-task-check {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 50%;
  border: 2px solid #F3EDE5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #FFFFFF;
  transition: all 0.2s ease;
}
.hc-task-check.done {
  border-color: #34D399;
  background: #34D399;
}

/* ===== 宠物小形象 ===== */
.hc-pet-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #F0E8DE;
  margin-top: 4px;
}
.hc-pet-emoji {
  font-size: 24px;
}
.hc-pet-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.hc-pet-name {
  font-size: 12px;
  font-weight: 700;
  color: #1A1A1A;
}
.hc-pet-stage {
  font-size: 10px;
  color: #A88B6A;
}
.hc-pet-track {
  flex: 1;
  height: 6px;
  background: #F3EDE5;
  border-radius: 3px;
  overflow: hidden;
  min-width: 60px;
}
.hc-pet-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.hc-pet-pct {
  font-size: 12px;
  font-weight: 700;
  color: #A88B6A;
  min-width: 36px;
  text-align: right;
}
</style>