<template>
  <view class="page" :style="themeStyle">
    <!-- ===== 顶部：我的标题 + 切换身份 ===== -->
    <view class="header">
      <view class="header-left">
        <text class="header-title">{{ me ? me.name + '的签到' : '全家签到' }}</text>
        <text class="header-date">今天 {{ dateText }}</text>
      </view>
      <view class="switch-btn" @click="switchRole">
        <text class="switch-icon">🔄</text>
        <text class="switch-text">切换身份</text>
      </view>
    </view>

    <!-- ===== 我的宠物主卡 ===== -->
    <view class="hero-card" v-if="me">
      <view class="hc-top">
        <view class="hc-avatar" :style="{ borderColor: me.themeColor, background: me.themeColor + '18' }">
          <image v-if="me.avatarUrl" :src="me.avatarUrl" class="hc-avatar-img" mode="aspectFill" />
          <text v-else class="hc-avatar-emoji">{{ me.emoji }}</text>
        </view>
        <view class="hc-me">
          <text class="hc-name">{{ me.name }}</text>
          <text class="hc-meta">{{ me.age }}岁 · {{ me.role }} · 🔥 {{ me.streak }}天连签</text>
        </view>
        <view class="hc-pet-badge" :style="{ background: me.themeColor + '14', borderColor: me.themeColor + '33' }">
          <text class="hc-pet-icon">{{ petIcon }}</text>
          <text class="hc-pet-stage" :style="{ color: me.themeColor }">{{ stage.stage }}</text>
        </view>
      </view>

      <view class="hc-stats">
        <view class="hc-stat">
          <text class="hc-stat-val">{{ scoreValue }}</text>
          <text class="hc-stat-label">{{ scoreLabel }}</text>
        </view>
        <view class="hc-stat">
          <text class="hc-stat-val">{{ doneCount }}/{{ myTasks.length }}</text>
          <text class="hc-stat-label">今日任务</text>
        </view>
        <view class="hc-stat">
          <text class="hc-stat-val">{{ photoCount }}</text>
          <text class="hc-stat-label">今日照片</text>
        </view>
      </view>

      <view class="hc-bottom">
        <view class="hc-grow-row">
          <text class="hc-grow-label">{{ petName }} · 成长</text>
          <text class="hc-grow-pct" :style="{ color: me.themeColor }">{{ growPercent }}%</text>
        </view>
        <view class="hc-grow-track">
          <view class="hc-grow-fill" :style="{ width: growPercent + '%', background: me.themeColor }"></view>
        </view>
      </view>
    </view>

    <!-- ===== 我的任务 ===== -->
    <view class="tasks-head">
      <text class="tasks-title">✍️ 我的任务</text>
      <text class="tasks-hint">签到需拍照 · 未完成优先</text>
    </view>
    <view class="tasks-grid">
      <view
        v-for="t in myTasks"
        :key="t.id"
        class="task-card"
        :class="{ done: t.done }"
        :style="{ borderColor: t.done ? (me.themeColor + '44') : '#F3EDE5' }"
        @click="checkTask(t)"
      >
        <view class="task-icon" :style="{ background: (me.themeColor || '#FF8A65') + '18' }">
          <text>{{ t.icon }}</text>
        </view>
        <view class="task-body">
          <text class="task-name">{{ t.name }}</text>
          <text class="task-meta">{{ t.category }} · +{{ t.points }}</text>
          <text class="task-photo" v-if="t.done && t.hasPhoto">📷 已拍照（点看）</text>
        </view>
        <view class="task-check" :class="{ done: t.done }" :style="t.done ? { background: me.themeColor } : {}">
          <text v-if="t.done">✓</text>
          <text v-else class="task-camera">📷</text>
        </view>
      </view>
    </view>

    <!-- ===== 领养提醒 ===== -->
    <view class="adopt-tip" v-if="newAdoptCount > 0" @click="goPets">
      <text class="adopt-icon">🐾</text>
      <text class="adopt-text">你有 {{ newAdoptCount }} 只新伙伴可以领养啦</text>
      <text class="adopt-arrow">›</text>
    </view>

    <!-- ===== 家庭速览条 ===== -->
    <view class="fam-strip" @click="goFamily">
      <view class="fs-avatars">
        <view
          v-for="m in familyStrip"
          :key="m.id"
          class="fs-avatar"
          :class="{ me: m.isMe }"
          :style="{ borderColor: m.themeColor, zIndex: 10 - familyStrip.indexOf(m) }"
        >
          <image v-if="m.avatarUrl" :src="m.avatarUrl" class="fs-img" mode="aspectFill" />
          <text v-else class="fs-emoji">{{ m.emoji }}</text>
        </view>
      </view>
      <view class="fs-body">
        <text class="fs-title">{{ memberCount }} 位成员</text>
        <text class="fs-sub">点看全家与结算 ›</text>
      </view>
      <text class="fs-rate">{{ familyRate }}%</text>
    </view>

    <!-- ===== 底部：挑战 + 签到 FAB ===== -->
    <view class="bottom-row">
      <view class="challenge-mini" :class="{ done: challengeDone }">
        <text class="cm-title">🎯 {{ challenge.goal }}</text>
        <view class="cm-track">
          <view class="cm-fill" :style="{ width: challengePercent + '%' }"></view>
        </view>
        <text class="cm-num">{{ challenge.current }}/{{ challenge.target }}{{ challenge.unit }}</text>
      </view>
      <view class="fab" :style="{ background: me ? me.themeColor : '#FF8A65' }" @click="goCheckin">
        <text class="fab-icon">📷</text>
        <text class="fab-text">签到</text>
      </view>
    </view>

    <!-- ===== 签到弹窗 ===== -->
    <CheckinModal
      :visible="modal.show"
      :member="modal.member"
      :task="modal.task"
      :evolved="modal.evolved"
      :newStage="modal.newStage"
      :photo="modal.photo"
      :verse="modal.verse"
      :stars="modal.stars"
      @close="modal.show = false"
    />
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  members, getCurrentMember, getCurrentMemberId, setCurrentMember, isOnboarded,
  stageFor, getActivePet, growPercent as growPercentOf, doneRate,
  scoreValue as scoreValueOf, scoreLabel as scoreLabelOf,
  getNewAdoptableCount, familyChallenge, getFamilyStats, doCheckin as doCheckinFromStore,
} from '@/store/index.js'
import CheckinModal from '@/components/CheckinModal.vue'
import { BREAKPOINTS } from '@/utils/pad-layout-helper'

const modal = reactive({ show: false, member: null, task: null, evolved: false, newStage: null, photo: '', verse: null, stars: 0 })

const meId = ref('')
const myTasks = ref([])
const familyStrip = ref([])

// ===== 我的数据 =====
const me = computed(() => members.find(m => m.id === meId.value) || null)
const stage = computed(() => (me.value ? stageFor(me.value) : { stage: '—', level: 0, icon: '🌟' }))
const petIcon = computed(() => {
  if (!me.value) return '🐾'
  const active = getActivePet(me.value.id)
  return (active && active.icon) || (me.value.pet && me.value.pet.type) || '🐾'
})
const petName = computed(() => (me.value && me.value.pet && me.value.pet.name) || '宠物')
const growPercent = computed(() => (me.value ? growPercentOf(me.value) : 0))
const scoreValue = computed(() => (me.value ? scoreValueOf(me.value) : 0))
const scoreLabel = computed(() => (me.value ? scoreLabelOf(me.value) : '积分'))
const doneCount = computed(() => myTasks.value.filter(t => t.done).length)
const photoCount = computed(() => myTasks.value.filter(t => t.hasPhoto).length)
const photoList = computed(() => myTasks.value.filter(t => t.hasPhoto).map(t => t.photo))

const dateText = computed(() => {
  const d = new Date()
  const w = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${w[d.getDay()]}`
})

const themeStyle = computed(() => ({}))
const memberCount = computed(() => members.length)
const newAdoptCount = computed(() => getNewAdoptableCount())

const challenge = computed(() => familyChallenge)
const challengePercent = computed(() =>
  familyChallenge.target ? Math.min(100, Math.round((familyChallenge.current / familyChallenge.target) * 100)) : 0
)
const challengeDone = computed(() => familyChallenge.current >= familyChallenge.target)

const familyRate = computed(() => {
  const s = getFamilyStats()
  return s.todayTotal === 0 ? 0 : Math.round((s.todayDone / s.todayTotal) * 100)
})

function refresh() {
  const m = getCurrentMember()
  if (!m) {
    uni.reLaunch({ url: '/pages/welcome/welcome' })
    return
  }
  meId.value = m.id
  // 未完成在前
  const sorted = m.tasks.slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0))
  myTasks.value = sorted.map(t => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    category: t.category,
    points: t.points || t.grace || 0,
    done: t.done,
    photo: t.photo || '',
    hasPhoto: !!t.photo,
  }))
  familyStrip.value = members.map(mm => ({
    id: mm.id,
    name: mm.name,
    emoji: mm.emoji,
    avatarUrl: mm.avatarUrl || '',
    themeColor: mm.themeColor,
    isMe: mm.id === m.id,
    rate: doneRate(mm),
  }))
}

// ===== 平板横屏自动跳三栏（首跳唯一入口） =====
function tryRedirectToLandscape() {
  try {
    const info = uni.getWindowInfo()
    if (info.windowWidth >= BREAKPOINTS.TABLET_PORT && info.windowWidth > info.windowHeight) {
      uni.reLaunch({ url: '/pages/landscape/landscape' })
    }
  } catch { /* 静默 */ }
}

onMounted(() => {
  if (!isOnboarded()) {
    uni.reLaunch({ url: '/pages/welcome/welcome' })
    return
  }
  tryRedirectToLandscape()
})

onShow(() => {
  if (!isOnboarded()) {
    uni.reLaunch({ url: '/pages/welcome/welcome' })
    return
  }
  refresh()
})

// ===== 切换身份 =====
function switchRole() {
  const list = members.slice(0, 9)
  uni.showActionSheet({
    itemList: list.map(m => (m.id === meId.value ? '✓ ' + m.name + '（当前）' : m.name)),
    success: (res) => {
      const target = list[res.tapIndex]
      if (!target || target.id === meId.value) return
      if (setCurrentMember(target.id)) {
        uni.showToast({ title: '已切换为「' + target.name + '」', icon: 'none' })
        refresh()
      }
    },
  })
}

// ===== 打卡（拍照必填） =====
function checkTask(t) {
  if (!me.value) return
  // 已完成：点一下看照片
  if (t.done) {
    if (t.photo) {
      const list = photoList.value
      uni.previewImage({ current: t.photo, urls: list.length ? list : [t.photo] })
    }
    return
  }
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      const photoPath = res.tempFilePaths && res.tempFilePaths[0]
      if (!photoPath) return
      doCheckin(me.value.id, t.id, photoPath)
    },
    fail: (err) => {
      if (err && err.errMsg !== 'chooseImage:fail cancel') {
        uni.showToast({ title: '拍照失败，请重试', icon: 'none' })
      }
    },
  })
}

function doCheckin(memberId, taskId, photoPath) {
  const result = doCheckinFromStore(memberId, taskId, photoPath)
  if (result && result.blocked) {
    uni.showToast({ title: result.msg || '请先拍照再签到', icon: 'none' })
    return
  }
  if (!result) {
    uni.showToast({ title: '该任务已完成', icon: 'none' })
    return
  }
  refresh()
  modal.show = true
  modal.member = result.member
  modal.task = result.task
  modal.evolved = result.evolved
  modal.newStage = result.newStage
  modal.photo = result.photo || ''
  modal.verse = result.verse
  modal.stars = (result.member && result.member.stars) || 0
}

// ===== 跳转 =====
function goFamily() { uni.switchTab({ url: '/pages/family/family' }) }
function goCheckin() { uni.switchTab({ url: '/pages/checkin/checkin' }) }
function goPets() { uni.switchTab({ url: '/pages/pets/pets' }) }
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

/* ===== Header ===== */
.header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20rpx;
}
.header-title { font-size: 40rpx; font-weight: 800; color: #1E293B; display: block; }
.header-date { font-size: 24rpx; color: #A8A29E; display: block; margin-top: 4rpx; }
.switch-btn {
  display: flex; align-items: center; gap: 8rpx;
  padding: 12rpx 24rpx; border-radius: 30rpx;
  background: #FFFFFF; border: 2rpx solid #F0E4D8;
  box-shadow: 0 2rpx 6rpx rgba(138,108,78,0.06);
}
.switch-btn:active { transform: scale(0.95); }
.switch-icon { font-size: 24rpx; }
.switch-text { font-size: 25rpx; font-weight: 600; color: #FF8A65; }

/* ===== 我的宠物主卡 ===== */
.hero-card {
  background: #FFFFFF; border-radius: 32rpx;
  padding: 28rpx; margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(138,108,78,0.08);
}
.hc-top { display: flex; align-items: center; gap: 20rpx; margin-bottom: 24rpx; }
.hc-avatar {
  width: 96rpx; height: 96rpx; border-radius: 50%;
  border: 3rpx solid #FF8A65; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hc-avatar-img { width: 100%; height: 100%; }
.hc-avatar-emoji { font-size: 48rpx; }
.hc-me { flex: 1; min-width: 0; }
.hc-name { font-size: 34rpx; font-weight: 800; color: #1E293B; display: block; }
.hc-meta { font-size: 23rpx; color: #A8A29E; display: block; margin-top: 6rpx; }
.hc-pet-badge {
  display: flex; flex-direction: column; align-items: center; gap: 2rpx;
  padding: 12rpx 20rpx; border-radius: 20rpx; border: 2rpx solid;
}
.hc-pet-icon { font-size: 40rpx; }
.hc-pet-stage { font-size: 19rpx; font-weight: 700; }

.hc-stats { display: flex; margin-bottom: 20rpx; }
.hc-stat { flex: 1; text-align: center; }
.hc-stat-val { font-size: 34rpx; font-weight: 800; color: #1E293B; display: block; }
.hc-stat-label { font-size: 21rpx; color: #A8A29E; display: block; margin-top: 4rpx; }

.hc-grow-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8rpx; }
.hc-grow-label { font-size: 24rpx; color: #78716C; font-weight: 600; }
.hc-grow-pct { font-size: 26rpx; font-weight: 800; }
.hc-grow-track { height: 16rpx; background: #F3EDE5; border-radius: 8rpx; overflow: hidden; }
.hc-grow-fill { height: 100%; border-radius: 8rpx; transition: width 0.6s ease; }

/* ===== 任务 ===== */
.tasks-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16rpx; }
.tasks-title { font-size: 30rpx; font-weight: 800; color: #1E293B; }
.tasks-hint { font-size: 21rpx; color: #A8A29E; }
.tasks-grid { display: grid; grid-template-columns: 1fr; gap: 14rpx; margin-bottom: 24rpx; }
.task-card {
  display: flex; align-items: center; gap: 18rpx;
  padding: 20rpx; background: #FFFFFF; border-radius: 24rpx;
  border: 2rpx solid #F3EDE5; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03);
  transition: all 0.15s ease;
}
.task-card:active { transform: scale(0.98); }
.task-card.done { opacity: 0.72; }
.task-icon {
  width: 76rpx; height: 76rpx; border-radius: 22rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx; flex-shrink: 0;
}
.task-body { flex: 1; min-width: 0; }
.task-name { font-size: 28rpx; font-weight: 700; color: #1E293B; display: block; }
.task-meta { font-size: 22rpx; color: #A8A29E; display: block; margin-top: 4rpx; }
.task-photo { font-size: 20rpx; color: #14B8A6; font-weight: 600; display: block; margin-top: 2rpx; }
.task-check {
  width: 56rpx; height: 56rpx; border-radius: 50%;
  border: 3rpx solid #F3EDE5;
  display: flex; align-items: center; justify-content: center;
  font-size: 26rpx; color: #FFFFFF; flex-shrink: 0;
}
.task-camera { font-size: 26rpx; }

/* ===== 领养提醒 ===== */
.adopt-tip {
  display: flex; align-items: center; gap: 12rpx;
  padding: 20rpx 24rpx; border-radius: 20rpx;
  background: linear-gradient(135deg, #FFF1F2, #FFE4E6);
  border: 2rpx solid #FECDD3; margin-bottom: 24rpx;
}
.adopt-tip:active { transform: scale(0.98); }
.adopt-icon { font-size: 32rpx; }
.adopt-text { flex: 1; font-size: 25rpx; font-weight: 600; color: #BE123C; }
.adopt-arrow { font-size: 30rpx; color: #FB7185; }

/* ===== 家庭速览条 ===== */
.fam-strip {
  display: flex; align-items: center; gap: 18rpx;
  padding: 22rpx 24rpx; border-radius: 24rpx;
  background: #FFFFFF; border: 2rpx solid #F0E4D8;
  box-shadow: 0 2rpx 8rpx rgba(138,108,78,0.06);
  margin-bottom: 24rpx;
}
.fam-strip:active { transform: scale(0.99); background: #FFFBF5; }
.fs-avatars { display: flex; align-items: center; }
.fs-avatar {
  width: 62rpx; height: 62rpx; border-radius: 50%;
  border: 3rpx solid #E2D6CC; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #F8FAFC; margin-left: -18rpx;
  position: relative;
}
.fs-avatar:first-child { margin-left: 0; }
.fs-avatar.me { box-shadow: 0 0 0 4rpx #FFF6F0; }
.fs-img { width: 100%; height: 100%; }
.fs-emoji { font-size: 30rpx; }
.fs-body { flex: 1; min-width: 0; }
.fs-title { font-size: 27rpx; font-weight: 700; color: #1E293B; display: block; }
.fs-sub { font-size: 21rpx; color: #A8A29E; display: block; margin-top: 2rpx; }
.fs-rate { font-size: 32rpx; font-weight: 800; color: #4F46E5; }

/* ===== 底部行 ===== */
.bottom-row { display: flex; align-items: stretch; gap: 16rpx; }
.challenge-mini {
  flex: 1; padding: 20rpx; border-radius: 22rpx;
  background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
  border: 2rpx solid #FDE68A;
}
.challenge-mini.done { background: linear-gradient(135deg, #ECFDF5, #D1FAE5); border-color: #6EE7B7; }
.cm-title { font-size: 23rpx; font-weight: 700; color: #92400E; display: block; }
.challenge-mini.done .cm-title { color: #065F46; }
.cm-track { height: 12rpx; background: rgba(255,255,255,0.75); border-radius: 6rpx; overflow: hidden; margin: 12rpx 0 8rpx; }
.cm-fill { height: 100%; background: linear-gradient(90deg, #F59E0B, #F97316); border-radius: 6rpx; transition: width 0.6s ease; }
.challenge-mini.done .cm-fill { background: linear-gradient(90deg, #10B981, #34D399); }
.cm-num { font-size: 20rpx; color: #B45309; }
.challenge-mini.done .cm-num { color: #047857; }

.fab {
  width: 160rpx; border-radius: 22rpx;
  background: #FF8A65; color: #FFFFFF;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4rpx;
  box-shadow: 0 8rpx 20rpx rgba(255,138,101,0.35);
}
.fab:active { transform: scale(0.97); }
.fab-icon { font-size: 36rpx; }
.fab-text { font-size: 24rpx; font-weight: 700; }

/* ===== 平板横屏（普通页兜底，通常已跳三栏） ===== */
@media screen and (min-width: 600px) {
  .tasks-grid { grid-template-columns: repeat(2, 1fr); }
}
@media screen and (min-width: 768px) {
  .page { padding: 20px 28px 28px; }
  .header-title { font-size: 24px; }
  .header-date { font-size: 14px; }
  .switch-btn { padding: 8px 16px; border-radius: 18px; }
  .switch-text { font-size: 15px; }
  .hero-card { border-radius: 20px; padding: 20px; }
  .hc-avatar { width: 56px; height: 56px; }
  .hc-avatar-emoji { font-size: 28px; }
  .hc-name { font-size: 21px; }
  .hc-meta { font-size: 14px; }
  .hc-pet-icon { font-size: 24px; }
  .hc-stat-val { font-size: 21px; }
  .hc-stat-label { font-size: 13px; }
  .task-card { border-radius: 15px; padding: 13px; }
  .task-icon { width: 44px; height: 44px; border-radius: 13px; font-size: 21px; }
  .task-name { font-size: 16px; }
  .task-meta { font-size: 13px; }
  .tasks-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .fs-title { font-size: 16px; }
  .fs-avatar { width: 36px; height: 36px; margin-left: -10px; }
  .fs-emoji { font-size: 18px; }
  .fs-rate { font-size: 19px; }
  .adopt-text { font-size: 15px; }
  .cm-title { font-size: 14px; }
  .fab { width: 96px; }
  .fab-icon { font-size: 21px; }
  .fab-text { font-size: 14px; }
}
</style>
