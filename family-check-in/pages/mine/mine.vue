<template>
  <view class="page">
    <!-- ===== 我的资料卡 ===== -->
    <view class="me-card" v-if="me">
      <view class="me-top">
        <view class="me-avatar" :style="{ borderColor: me.themeColor, background: me.themeColor + '18' }">
          <image v-if="me.avatarUrl" :src="me.avatarUrl" class="me-img" mode="aspectFill" />
          <text v-else class="me-emoji">{{ me.emoji }}</text>
        </view>
        <view class="me-body">
          <text class="me-name">{{ me.name }}</text>
          <text class="me-meta">{{ me.age }}岁 · {{ me.role }} · 🔥 {{ me.streak }}天连签</text>
          <view class="me-tags">
            <text class="me-tag" :style="{ background: me.themeColor + '14', color: me.themeColor }">
              {{ myStage.icon }} {{ myStage.stage }}
            </text>
            <text class="me-tag score">{{ scoreValueOf(me) }} {{ scoreLabelOf(me) }}</text>
          </view>
        </view>
      </view>
      <view class="me-actions">
        <view class="me-btn" @click="openMyEdit"><text>✏️ 编辑资料</text></view>
        <view class="me-btn" @click="openMyDetail"><text>📋 我的详情</text></view>
      </view>
    </view>

    <!-- ===== 我的进度 ===== -->
    <view class="card" v-if="me">
      <view class="card-header"><text class="card-title">📈 我的今日进度</text></view>
      <view class="mp-row">
        <text class="mp-label">任务完成</text>
        <view class="mp-bar">
          <view class="mp-fill" :style="{ width: myRate + '%', background: me.themeColor }"></view>
        </view>
        <text class="mp-num">{{ myDone }}/{{ myTotal }}</text>
      </view>
      <view class="mp-row">
        <text class="mp-label">宠物成长</text>
        <view class="mp-bar">
          <view class="mp-fill" :style="{ width: myGrow + '%', background: me.themeColor }"></view>
        </view>
        <text class="mp-num">{{ myGrow }}%</text>
      </view>
    </view>

    <!-- ===== 家庭管理 ===== -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">🏡 {{ familyName }}</text>
        <text class="card-more">{{ members.length }} 位成员</text>
      </view>

      <view class="family-list">
        <view v-for="m in members" :key="m.id" class="family-row" :class="{ me: m.id === (me && me.id) }">
          <view class="fr-avatar" :style="{ borderColor: m.themeColor }">
            <image v-if="m.avatarUrl" :src="m.avatarUrl" class="fr-img" mode="aspectFill" />
            <text v-else class="fr-emoji">{{ m.emoji }}</text>
          </view>
          <view class="fr-body">
            <view class="fr-name-row">
              <text class="fr-name" :style="{ color: m.themeColor }">{{ m.name }}</text>
              <text v-if="me && m.id === me.id" class="fr-me-tag">我</text>
            </view>
            <text class="fr-role">{{ m.age }}岁 · {{ m.role }}</text>
          </view>
          <view class="fr-actions">
            <text class="fr-act" @click="openEdit(m)">编辑</text>
            <text class="fr-act danger" @click="onDelete(m)">删除</text>
          </view>
        </view>
      </view>

      <view class="add-btn" @click="openAdd">
        <text class="add-icon">＋</text>
        <text class="add-text">添加家庭成员</text>
      </view>
    </view>

    <!-- ===== 家庭数据 ===== -->
    <view class="card">
      <view class="card-header"><text class="card-title">📊 家庭数据总览</text></view>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-val">{{ members.length }}</text>
          <text class="stat-label">成员</text>
        </view>
        <view class="stat-item">
          <text class="stat-val">{{ stats.totalCheckins }}</text>
          <text class="stat-label">总签到</text>
        </view>
        <view class="stat-item">
          <text class="stat-val">{{ statsTotalPoints }}</text>
          <text class="stat-label">总积分</text>
        </view>
        <view class="stat-item">
          <text class="stat-val">{{ stats.todayDone }}/{{ stats.todayTotal }}</text>
          <text class="stat-label">今日完成</text>
        </view>
      </view>
    </view>

    <!-- ===== 危险区 ===== -->
    <view class="card danger-card">
      <view class="card-header"><text class="card-title">⚠️ 数据管理</text></view>
      <view class="reset-btn" @click="onReset"><text>恢复初始演示数据</text></view>
      <text class="danger-hint">将清空全部改动，恢复到初始成员数据；当前身份若仍存在则保留。</text>
    </view>

    <MemberManageModal
      :visible="manageModal.show"
      :member="manageModal.member"
      :view="manageModal.view"
      @close="manageModal.show = false"
      @saved="onManageSaved"
    />
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  members, getCurrentMember, getFamilyInfo, getFamilyStats, stageFor,
  removeMember, resetAll, isOnboarded, doneRate, growPercent, scoreValue as scoreValueOf, scoreLabel as scoreLabelOf,
} from '@/store/index.js'
import MemberManageModal from '@/components/MemberManageModal.vue'

const meId = ref('')
const manageModal = reactive({ show: false, member: null, view: 'edit' })

const me = computed(() => members.find(m => m.id === meId.value) || null)
const myStage = computed(() => (me.value ? stageFor(me.value) : { stage: '—', level: 0, icon: '🌟' }))
const myRate = computed(() => (me.value ? doneRate(me.value) : 0))
const myGrow = computed(() => (me.value ? growPercent(me.value) : 0))
const myDone = computed(() => (me.value ? me.value.tasks.filter(t => t.done).length : 0))
const myTotal = computed(() => (me.value ? me.value.tasks.length : 0))

const familyName = computed(() => getFamilyInfo().name)
const stats = computed(() => getFamilyStats())
const statsTotalPoints = computed(() => stats.value.totalPoints.toLocaleString())

function refresh() {
  const m = getCurrentMember()
  if (!m) {
    uni.reLaunch({ url: '/pages/welcome/welcome' })
    return
  }
  meId.value = m.id
}

onShow(() => {
  if (!isOnboarded()) {
    uni.reLaunch({ url: '/pages/welcome/welcome' })
    return
  }
  refresh()
})

function openMyEdit() {
  manageModal.member = me.value
  manageModal.view = 'edit'
  manageModal.show = true
}
function openMyDetail() {
  if (!me.value) return
  uni.navigateTo({ url: '/pages/detail/detail?id=' + me.value.id })
}
function openAdd() {
  manageModal.member = null
  manageModal.view = 'edit'
  manageModal.show = true
}
function openEdit(m) {
  manageModal.member = m
  manageModal.view = 'edit'
  manageModal.show = true
}
function onManageSaved() {
  refresh()
}

function onDelete(m) {
  const isMe = me.value && m.id === me.value.id
  uni.showModal({
    title: '删除成员',
    content: isMe
      ? `「${m.name}」是当前视角身份，删除后将回到身份选择页。确定删除吗？`
      : `确定删除「${m.name}」吗？该成员的签到数据将一并清除。`,
    confirmText: '删除',
    confirmColor: '#EF4444',
    success: (res) => {
      if (!res.confirm) return
      const result = removeMember(m.id)
      if (result.success) {
        uni.showToast({ title: '已删除', icon: 'success' })
        refresh()
        if (!isOnboarded()) {
          setTimeout(() => uni.reLaunch({ url: '/pages/welcome/welcome' }), 500)
        }
      } else {
        uni.showToast({ title: result.msg || '删除失败', icon: 'none' })
      }
    },
  })
}

function onReset() {
  uni.showModal({
    title: '恢复初始数据',
    content: '将清空全部改动，恢复到 5 位家庭成员的初始演示数据。确定继续吗？',
    confirmText: '恢复',
    confirmColor: '#EF4444',
    success: (res) => {
      if (!res.confirm) return
      resetAll()
      uni.showToast({ title: '已恢复初始数据', icon: 'success' })
      refresh()
      if (!isOnboarded()) {
        setTimeout(() => uni.reLaunch({ url: '/pages/welcome/welcome' }), 500)
      }
    },
  })
}
</script>

<style scoped>
.page {
  padding: 24rpx;
  padding-bottom: 40rpx;
  background: #FFF6F0;
  min-height: 100vh;
  min-height: 100dvh;
  box-sizing: border-box;
}

/* 我的资料卡 */
.me-card {
  background: linear-gradient(135deg, #EEF2FF, #EDE9FE);
  border-radius: 32rpx; padding: 30rpx 28rpx; margin-bottom: 24rpx;
}
.me-top { display: flex; align-items: center; gap: 20rpx; margin-bottom: 24rpx; }
.me-avatar {
  width: 110rpx; height: 110rpx; border-radius: 50%;
  border: 4rpx solid #FF8A65; overflow: hidden;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.me-img { width: 100%; height: 100%; }
.me-emoji { font-size: 54rpx; }
.me-body { flex: 1; min-width: 0; }
.me-name { font-size: 36rpx; font-weight: 800; color: #1E293B; display: block; }
.me-meta { font-size: 22rpx; color: #6D28D9; display: block; margin-top: 6rpx; }
.me-tags { display: flex; gap: 12rpx; margin-top: 12rpx; flex-wrap: wrap; }
.me-tag { font-size: 21rpx; font-weight: 700; padding: 6rpx 18rpx; border-radius: 20rpx; }
.me-tag.score { background: #FFFBEB; color: #F59E0B; }
.me-actions { display: flex; gap: 16rpx; }
.me-btn {
  flex: 1; height: 76rpx; border-radius: 18rpx;
  background: rgba(255,255,255,0.85);
  display: flex; align-items: center; justify-content: center;
  font-size: 25rpx; font-weight: 700; color: #4F46E5;
}
.me-btn:active { transform: scale(0.97); }

/* 卡片 */
.card {
  background: #FFFFFF; border-radius: 28rpx; padding: 26rpx;
  margin-bottom: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.card-title { font-size: 29rpx; font-weight: 700; color: #1E293B; }
.card-more { font-size: 23rpx; color: #94A3B8; }

/* 进度 */
.mp-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.mp-row:last-child { margin-bottom: 0; }
.mp-label { font-size: 23rpx; color: #78716C; width: 130rpx; flex-shrink: 0; }
.mp-bar { flex: 1; height: 14rpx; background: #F3EDE5; border-radius: 7rpx; overflow: hidden; }
.mp-fill { height: 100%; border-radius: 7rpx; transition: width 0.6s ease; }
.mp-num { font-size: 23rpx; font-weight: 700; color: #1E293B; min-width: 90rpx; text-align: right; }

/* 家庭列表 */
.family-row {
  display: flex; align-items: center; gap: 16rpx;
  padding: 16rpx 0; border-bottom: 2rpx solid #F8F1EA;
}
.family-row:last-child { border-bottom: none; }
.family-row.me { background: #FFFBF5; border-radius: 16rpx; padding-left: 12rpx; padding-right: 12rpx; }
.fr-avatar {
  width: 68rpx; height: 68rpx; border-radius: 50%;
  border: 3rpx solid #E2D6CC; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #F8FAFC; flex-shrink: 0;
}
.fr-img { width: 100%; height: 100%; }
.fr-emoji { font-size: 32rpx; }
.fr-body { flex: 1; min-width: 0; }
.fr-name-row { display: flex; align-items: baseline; gap: 8rpx; }
.fr-name { font-size: 27rpx; font-weight: 700; }
.fr-me-tag { font-size: 18rpx; color: #FFFFFF; background: #FF8A65; padding: 2rpx 10rpx; border-radius: 10rpx; font-weight: 700; }
.fr-role { font-size: 21rpx; color: #A8A29E; }
.fr-actions { display: flex; gap: 16rpx; flex-shrink: 0; }
.fr-act { font-size: 23rpx; color: #64748B; padding: 6rpx 12rpx; }
.fr-act.danger { color: #EF4444; }

.add-btn {
  display: flex; align-items: center; justify-content: center; gap: 10rpx;
  margin-top: 20rpx; padding: 22rpx;
  border: 3rpx dashed #FFD9C2; border-radius: 20rpx; background: #FFF8F3;
}
.add-btn:active { transform: scale(0.98); background: #FFEDD5; }
.add-icon { font-size: 30rpx; color: #FF8A65; font-weight: 800; }
.add-text { font-size: 26rpx; font-weight: 700; color: #FF8A65; }

/* 统计 */
.stats-grid { display: flex; flex-wrap: wrap; }
.stat-item { width: 50%; text-align: center; padding: 18rpx 0; }
.stat-val { display: block; font-size: 40rpx; font-weight: 800; color: #4F46E5; }
.stat-label { font-size: 21rpx; color: #94A3B8; margin-top: 4rpx; }

/* 危险区 */
.danger-card { border: 2rpx solid #FECACA; }
.danger-card .card-title { color: #B91C1C; }
.reset-btn {
  height: 80rpx; border-radius: 18rpx;
  background: #FEF2F2; border: 2rpx solid #FECACA;
  display: flex; align-items: center; justify-content: center;
  font-size: 26rpx; font-weight: 700; color: #DC2626;
}
.reset-btn:active { transform: scale(0.98); }
.danger-hint { display: block; font-size: 21rpx; color: #B91C1C; margin-top: 14rpx; line-height: 1.6; }

/* 平板 */
@media screen and (min-width: 768px) {
  .page { padding: 20px 28px 28px; }
  .me-card, .card { border-radius: 20px; padding: 18px; margin-bottom: 16px; }
  .me-avatar { width: 62px; height: 62px; }
  .me-emoji { font-size: 30px; }
  .me-name { font-size: 21px; }
  .me-meta { font-size: 13px; }
  .me-btn { height: 44px; font-size: 15px; }
  .card-title { font-size: 18px; }
  .stats-grid { flex-wrap: nowrap; }
  .stat-item { width: 25%; }
  .stat-val { font-size: 24px; }
}
</style>
