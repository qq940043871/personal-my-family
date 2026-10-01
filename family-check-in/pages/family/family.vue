<template>
  <view class="page">
    <!-- ===== 家庭总览 ===== -->
    <view class="fam-card">
      <view class="fam-head">
        <view class="fam-title-wrap">
          <text class="fam-title">🏡 {{ familyName }}</text>
          <text class="fam-sub">{{ memberCount }} 位成员 · 今天完成 {{ stats.todayDone }}/{{ stats.todayTotal }} 项</text>
        </view>
        <text class="fam-rate">{{ todayRate }}%</text>
      </view>
      <view class="fam-stat-row">
        <view class="fam-stat">
          <text class="fs-val">{{ stats.totalStreak }}</text>
          <text class="fs-label">总连签</text>
        </view>
        <view class="fam-stat">
          <text class="fs-val">{{ stats.totalCheckins }}</text>
          <text class="fs-label">总签到</text>
        </view>
        <view class="fam-stat">
          <text class="fs-val">{{ totalScore }}</text>
          <text class="fs-label">总积分</text>
        </view>
        <view class="fam-stat">
          <text class="fs-val">{{ photoTotal }}</text>
          <text class="fs-label">今日照片</text>
        </view>
      </view>
    </view>

    <!-- ===== 家庭挑战 ===== -->
    <view class="challenge-card" :class="{ done: challengeDone }">
      <view class="challenge-head">
        <text class="challenge-title">🎯 {{ challenge.title }}</text>
        <text class="challenge-pct">{{ challengePercent }}%</text>
      </view>
      <text class="challenge-goal">{{ challenge.goal }}</text>
      <view class="challenge-track">
        <view class="challenge-fill" :style="{ width: challengePercent + '%' }"></view>
      </view>
      <text class="challenge-foot">
        {{ challenge.current }} / {{ challenge.target }} {{ challenge.unit }}
        <text v-if="challengeDone"> · 已达成 🎉</text>
      </text>
    </view>

    <!-- ===== 成员一览 ===== -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">👨‍👩‍👧‍👦 全家成员</text>
        <text class="card-more" @click="goMine">管理 ›</text>
      </view>
      <view
        v-for="m in memberCards"
        :key="m.id"
        class="member-row"
        :class="{ me: m.isMe }"
        @click="openDetail(m.id)"
      >
        <view class="mr-avatar" :style="{ borderColor: m.themeColor }">
          <image v-if="m.avatarUrl" :src="m.avatarUrl" class="avatar-img" mode="aspectFill" />
          <text v-else class="avatar-emoji">{{ m.emoji }}</text>
        </view>
        <view class="mr-body">
          <view class="mr-name-row">
            <text class="mr-name" :style="{ color: m.themeColor }">{{ m.name }}</text>
            <text v-if="m.isMe" class="mr-me-tag">我</text>
            <text class="mr-role">{{ m.age }}岁 · {{ m.role }}</text>
          </view>
          <view class="mr-bar-row">
            <view class="mr-bar">
              <view class="mr-bar-fill" :style="{ width: m.rate + '%', background: m.themeColor }"></view>
            </view>
            <text class="mr-rate">{{ m.doneCount }}/{{ m.totalCount }}</text>
          </view>
        </view>
        <view class="mr-right">
          <text class="mr-pet">{{ m.petIcon }} {{ m.stageName }}</text>
          <text class="mr-score">{{ m.scoreValue }} {{ m.scoreLabel }}</text>
        </view>
      </view>
    </view>

    <!-- ===== 结算（原结算页并入） ===== -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">🏆 结算中心</text>
      </view>
      <view class="period-tabs">
        <view
          v-for="p in periods"
          :key="p.key"
          class="period-tab"
          :class="{ active: currentPeriod === p.key }"
          @click="currentPeriod = p.key"
        >
          <text>{{ p.label }}</text>
        </view>
      </view>

      <view class="settle-head">
        <text class="settle-title">{{ periodLabel }}</text>
        <text class="settle-date">{{ dateLabel }}</text>
      </view>

      <view
        v-for="(item, index) in rankList"
        :key="item.memberId"
        class="rank-row"
        :class="[item.rankClass, { highlight: item.highlight }]"
      >
        <text class="rank-medal">{{ item.medal }}</text>
        <text class="rank-emoji">{{ item.emoji }}</text>
        <view class="rank-body">
          <text class="rank-name">{{ item.name }}</text>
          <text class="rank-extra">{{ item.extra }}</text>
        </view>
        <text class="rank-rate">{{ item.rate }}%</text>
      </view>

      <view class="reward-box">
        <text class="reward-title">奖励发放</text>
        <text v-for="(r, i) in rewards" :key="i" class="reward-item">{{ r }}</text>
      </view>
    </view>

    <!-- ===== 勋章墙 ===== -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">🏅 家庭勋章墙</text>
      </view>
      <view class="achievement-grid">
        <view
          v-for="a in achievements"
          :key="a.id"
          class="achievement-badge"
          :class="{ earned: a.earned }"
        >
          <text class="achievement-icon">{{ a.icon }}</text>
          <text class="achievement-name">{{ a.name }}</text>
        </view>
      </view>
    </view>

    <!-- ===== 照片墙 ===== -->
    <view class="card" v-if="photoWall.length">
      <view class="card-header">
        <text class="card-title">📷 今日照片墙</text>
        <text class="card-more">{{ photoTotal }} 张</text>
      </view>
      <view v-for="g in photoWall" :key="g.memberId" class="photo-group">
        <view class="pg-head">
          <text class="pg-emoji">{{ g.emoji }}</text>
          <text class="pg-name">{{ g.name }}</text>
          <text class="pg-count">{{ g.count }} 张</text>
        </view>
        <scroll-view scroll-x class="pg-scroll" :show-scrollbar="false">
          <view class="pg-row">
            <image
              v-for="p in g.photos"
              :key="p.taskId"
              :src="p.photo"
              class="pg-photo"
              mode="aspectFill"
              @click="previewPhoto(p.photo)"
            />
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  members, getFamilyInfo, getFamilyStats, stageFor, doneRate, scoreValue, scoreLabel,
  weeklyRank, monthlyRank, yearlyRank, achievements as ACHIEVEMENTS, memberAchievements,
  familyChallenge, getActivePet, getFamilyPhotos, isOnboarded, getCurrentMemberId,
} from '@/store/index.js'

const PERIODS = [
  { key: 'weekly', label: '每周' },
  { key: 'monthly', label: '每月' },
  { key: 'yearly', label: '每年' },
]

const REWARDS = {
  weekly: ['🥇 第1名：周冠军勋章 + 50 积分', '🎁 全员全勤：家庭宝箱（双倍积分）', '📊 周报已生成，周日家庭会议见'],
  monthly: ['🥇 第1名：决定周末家庭活动', '🎁 月度全勤：月金牌勋章 + 200 积分', '⏸ 免家务券：由其他成员代劳一次', '🐣 满级宠物：解锁稀有品种'],
  yearly: ['🏆 年度MVP：颁发年度大奖', '📖 年度成长年鉴已生成', '🎊 全家累计签到数据回顾'],
}

const currentPeriod = ref('weekly')
const photoWall = ref([])
const currentMemberIdRef = ref(getCurrentMemberId())

onMounted(() => {
  if (!isOnboarded()) uni.reLaunch({ url: '/pages/welcome/welcome' })
})

onShow(() => {
  if (!isOnboarded()) {
    uni.reLaunch({ url: '/pages/welcome/welcome' })
    return
  }
  currentMemberIdRef.value = getCurrentMemberId()
  photoWall.value = getFamilyPhotos()
})

const familyName = computed(() => getFamilyInfo().name)
const memberCount = computed(() => members.length)
const stats = computed(() => getFamilyStats())
const todayRate = computed(() =>
  stats.value.todayTotal === 0 ? 0 : Math.round((stats.value.todayDone / stats.value.todayTotal) * 100)
)
const totalScore = computed(() =>
  members.reduce((s, m) => s + (m.points || 0) + (m.grace || 0) + (m.stars || 0), 0).toLocaleString()
)

const memberCards = computed(() =>
  members.map(m => {
    const stage = stageFor(m)
    return {
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      role: m.role,
      age: m.age,
      themeColor: m.themeColor,
      avatarUrl: m.avatarUrl || '',
      isMe: m.id === currentMemberIdRef.value,
      petIcon: (getActivePet(m.id) || {}).icon || (m.pet && m.pet.type) || '🐾',
      stageName: stage.stage,
      doneCount: m.tasks.filter(t => t.done).length,
      totalCount: m.tasks.length,
      rate: doneRate(m),
      scoreValue: scoreValue(m),
      scoreLabel: scoreLabel(m),
    }
  })
)

const challenge = computed(() => familyChallenge)
const challengePercent = computed(() =>
  familyChallenge.target ? Math.min(100, Math.round((familyChallenge.current / familyChallenge.target) * 100)) : 0
)
const challengeDone = computed(() => familyChallenge.current >= familyChallenge.target)

const rankList = computed(() => {
  let list = weeklyRank
  if (currentPeriod.value === 'monthly') list = monthlyRank
  else if (currentPeriod.value === 'yearly') list = yearlyRank
  return list.map((item, index) => {
    const medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : String(index + 1)))
    return {
      ...item,
      medal,
      rankClass: index === 0 ? 'gold' : (index === 1 ? 'silver' : (index === 2 ? 'bronze' : '')),
      highlight: index === 0,
      extra: item.petGrow ? ('🐾 +' + item.petGrow) : (item.totalPoints ? (item.totalPoints.toLocaleString() + '分') : ''),
    }
  })
})

const periodLabel = computed(() => {
  if (currentPeriod.value === 'weekly') return '本周结算'
  if (currentPeriod.value === 'monthly') return '本月结算'
  return '年度结算'
})

const dateLabel = computed(() => {
  const d = new Date()
  if (currentPeriod.value === 'weekly') return `第 ${d.getFullYear()} 年 ${d.getMonth() + 1} 月 第 2 周`
  if (currentPeriod.value === 'monthly') return `${d.getFullYear()}年${d.getMonth() + 1}月`
  return `${d.getFullYear()}年度`
})

const rewards = computed(() => REWARDS[currentPeriod.value] || [])

const achievements = computed(() => {
  const earnedIds = []
  Object.keys(memberAchievements).forEach(k => {
    memberAchievements[k].forEach(id => {
      if (earnedIds.indexOf(id) === -1) earnedIds.push(id)
    })
  })
  return ACHIEVEMENTS.map(a => ({ ...a, earned: earnedIds.indexOf(a.id) !== -1 }))
})

const photoTotal = computed(() => photoWall.value.reduce((s, g) => s + g.count, 0))
const allPhotos = computed(() => photoWall.value.reduce((arr, g) => arr.concat(g.photos.map(p => p.photo)), []))

function previewPhoto(src) {
  const list = allPhotos.value
  uni.previewImage({ current: src, urls: list.length ? list : [src] })
}

function openDetail(id) {
  uni.navigateTo({ url: '/pages/detail/detail?id=' + id })
}

function goMine() {
  uni.switchTab({ url: '/pages/mine/mine' })
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

/* ===== 家庭总览 ===== */
.fam-card {
  background: linear-gradient(135deg, #EEF2FF, #EDE9FE);
  border-radius: 32rpx;
  padding: 32rpx 28rpx 24rpx;
  margin-bottom: 24rpx;
}
.fam-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24rpx; }
.fam-title { font-size: 38rpx; font-weight: 800; color: #4338CA; display: block; }
.fam-sub { font-size: 23rpx; color: #6D28D9; display: block; margin-top: 8rpx; }
.fam-rate { font-size: 44rpx; font-weight: 800; color: #4F46E5; }
.fam-stat-row { display: flex; }
.fam-stat { flex: 1; text-align: center; }
.fs-val { font-size: 34rpx; font-weight: 800; color: #4F46E5; display: block; }
.fs-label { font-size: 21rpx; color: #7C7A9C; display: block; margin-top: 4rpx; }

/* ===== 挑战 ===== */
.challenge-card {
  background: #FFFFFF;
  border-radius: 28rpx;
  padding: 26rpx 28rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid #FDE68A;
  background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.challenge-card.done { border-color: #6EE7B7; background: linear-gradient(135deg, #ECFDF5, #D1FAE5); }
.challenge-head { display: flex; justify-content: space-between; align-items: center; }
.challenge-title { font-size: 28rpx; font-weight: 700; color: #92400E; }
.challenge-card.done .challenge-title { color: #065F46; }
.challenge-pct { font-size: 28rpx; font-weight: 800; color: #F59E0B; }
.challenge-goal { display: block; font-size: 24rpx; color: #B45309; margin: 10rpx 0 14rpx; }
.challenge-card.done .challenge-goal { color: #047857; }
.challenge-track { height: 16rpx; background: rgba(255,255,255,0.75); border-radius: 8rpx; overflow: hidden; }
.challenge-fill { height: 100%; background: linear-gradient(90deg, #F59E0B, #F97316); border-radius: 8rpx; transition: width 0.6s ease; }
.challenge-card.done .challenge-fill { background: linear-gradient(90deg, #10B981, #34D399); }
.challenge-foot { display: block; font-size: 21rpx; color: #B45309; margin-top: 10rpx; }
.challenge-card.done .challenge-foot { color: #047857; }

/* ===== 通用卡片 ===== */
.card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.card-title { font-size: 30rpx; font-weight: 700; color: #1E293B; }
.card-more { font-size: 24rpx; color: #94A3B8; }

/* ===== 成员行 ===== */
.member-row {
  display: flex; align-items: center; gap: 18rpx;
  padding: 16rpx 0;
  border-bottom: 2rpx solid #F8F1EA;
}
.member-row:last-child { border-bottom: none; }
.member-row.me { background: #FFFBF5; border-radius: 18rpx; padding-left: 12rpx; padding-right: 12rpx; }
.mr-avatar {
  width: 76rpx; height: 76rpx; border-radius: 50%;
  border: 3rpx solid #E2D6CC; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #F8FAFC; flex-shrink: 0;
}
.avatar-img { width: 100%; height: 100%; }
.avatar-emoji { font-size: 36rpx; }
.mr-body { flex: 1; min-width: 0; }
.mr-name-row { display: flex; align-items: baseline; gap: 8rpx; }
.mr-name { font-size: 28rpx; font-weight: 700; }
.mr-me-tag {
  font-size: 18rpx; color: #FFFFFF; background: #FF8A65;
  padding: 2rpx 10rpx; border-radius: 10rpx; font-weight: 700;
}
.mr-role { font-size: 21rpx; color: #A8A29E; }
.mr-bar-row { display: flex; align-items: center; gap: 12rpx; margin-top: 8rpx; }
.mr-bar { flex: 1; height: 12rpx; background: #F1F5F9; border-radius: 6rpx; overflow: hidden; }
.mr-bar-fill { height: 100%; border-radius: 6rpx; transition: width 0.5s ease; }
.mr-rate { font-size: 21rpx; color: #94A3B8; min-width: 72rpx; text-align: right; }
.mr-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4rpx; flex-shrink: 0; }
.mr-pet { font-size: 21rpx; color: #A88B6A; }
.mr-score { font-size: 21rpx; color: #F59E0B; font-weight: 700; }

/* ===== 结算 ===== */
.period-tabs {
  display: flex; background: #F1F5F9; border-radius: 20rpx;
  padding: 6rpx; margin-bottom: 20rpx;
}
.period-tab {
  flex: 1; padding: 16rpx; text-align: center;
  border-radius: 16rpx; font-size: 26rpx; font-weight: 600; color: #64748B;
  transition: all 0.2s ease;
}
.period-tab.active { background: #FFFFFF; color: #4F46E5; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.settle-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14rpx; }
.settle-title { font-size: 28rpx; font-weight: 800; color: #4F46E5; }
.settle-date { font-size: 22rpx; color: #94A3B8; }

.rank-row {
  display: flex; align-items: center; gap: 14rpx;
  padding: 16rpx 18rpx; border-radius: 18rpx;
  background: #F8FAFC; margin-bottom: 12rpx;
}
.rank-row.gold { background: linear-gradient(135deg, #FFFBEB, #FEF3C7); border: 2rpx solid #FDE68A; }
.rank-row.silver { background: #F8FAFC; border: 2rpx solid #E2E8F0; }
.rank-row.bronze { background: #FFF7ED; border: 2rpx solid #FED7AA; }
.rank-medal { font-size: 30rpx; width: 44rpx; text-align: center; flex-shrink: 0; }
.rank-emoji { font-size: 32rpx; flex-shrink: 0; }
.rank-body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.rank-name { font-size: 26rpx; font-weight: 700; color: #1E293B; }
.rank-extra { font-size: 21rpx; color: #94A3B8; }
.rank-rate { font-size: 28rpx; font-weight: 800; color: #4F46E5; }

.reward-box {
  margin-top: 16rpx; padding: 20rpx; background: #FFFBF5;
  border-radius: 18rpx; border: 2rpx dashed #FFD9C2;
}
.reward-title { display: block; font-size: 24rpx; font-weight: 700; color: #92400E; margin-bottom: 10rpx; }
.reward-item { display: block; font-size: 23rpx; color: #78716C; line-height: 1.7; }

/* ===== 勋章墙 ===== */
.achievement-grid { display: flex; flex-wrap: wrap; }
.achievement-badge {
  width: 33.33%; text-align: center; padding: 18rpx 6rpx;
  opacity: 0.28; transition: opacity 0.4s ease;
}
.achievement-badge.earned { opacity: 1; }
.achievement-icon { font-size: 50rpx; display: block; }
.achievement-name { font-size: 21rpx; font-weight: 600; color: #1E293B; margin-top: 6rpx; display: block; }

/* ===== 照片墙 ===== */
.photo-group { margin-bottom: 20rpx; }
.photo-group:last-child { margin-bottom: 0; }
.pg-head { display: flex; align-items: center; gap: 10rpx; margin-bottom: 10rpx; }
.pg-emoji { font-size: 26rpx; }
.pg-name { font-size: 25rpx; font-weight: 700; color: #1E293B; }
.pg-count { font-size: 21rpx; color: #94A3B8; margin-left: auto; }
.pg-scroll { white-space: nowrap; }
.pg-row { display: flex; gap: 12rpx; }
.pg-photo {
  width: 150rpx; height: 150rpx; border-radius: 16rpx;
  background: #F1F5F9; flex-shrink: 0;
}

/* ===== 平板横屏 ===== */
@media screen and (min-width: 768px) {
  .page {
    padding: 20px 28px 28px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }
  .fam-card, .challenge-card { grid-column: 1 / -1; }
  .fam-card, .challenge-card, .card { margin-bottom: 0; border-radius: 20px; padding: 20px; }
  .fam-title { font-size: 24px; }
  .fam-sub { font-size: 14px; }
  .fam-rate { font-size: 28px; }
  .fs-val { font-size: 22px; }
  .fs-label { font-size: 13px; }
  .card-title { font-size: 19px; }
  .mr-avatar { width: 48px; height: 48px; }
  .avatar-emoji { font-size: 23px; }
  .mr-name { font-size: 17px; }
  .pg-photo { width: 96px; height: 96px; border-radius: 10px; }
  .achievement-icon { font-size: 32px; }
  .achievement-name { font-size: 13px; }
}
@media screen and (min-width: 1100px) {
  .page { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>
