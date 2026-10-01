<template>
  <view class="family-panel">
    <!-- ===== 周期切换 ===== -->
    <view class="sp-periods">
      <view
        v-for="p in periods"
        :key="p.key"
        class="sp-period"
        :class="{ active: currentPeriod === p.key }"
        @click="currentPeriod = p.key"
      >
        <text>{{ p.label }}</text>
      </view>
    </view>

    <scroll-view class="sp-scroll" scroll-y :show-scrollbar="false">
      <!-- ===== 家庭总览（单人视角：中栏「家庭」视图的入口信息） ===== -->
      <view class="sp-family-card">
        <view class="sp-fam-head">
          <view>
            <text class="sp-fam-title">🏡 {{ familyName }}</text>
            <text class="sp-fam-sub">{{ members.length }} 位成员 · 今日完成 {{ familyStats.todayDone }}/{{ familyStats.todayTotal }} 项</text>
          </view>
          <text class="sp-fam-rate">{{ familyRate }}%</text>
        </view>
        <view
          v-for="m in memberRows"
          :key="m.id"
          class="sp-fam-row"
          :class="{ me: m.isMe }"
        >
          <text class="sp-fam-emoji">{{ m.emoji }}</text>
          <text class="sp-fam-name" :style="{ color: m.themeColor }">{{ m.name }}</text>
          <text v-if="m.isMe" class="sp-fam-me">我</text>
          <text class="sp-fam-pet">{{ m.petIcon }} {{ m.stageName }}</text>
          <view class="sp-fam-track">
            <view class="sp-fam-fill" :style="{ width: m.rate + '%', background: m.themeColor }"></view>
          </view>
          <text class="sp-fam-done">{{ m.doneCount }}/{{ m.totalCount }}</text>
        </view>
      </view>

      <!-- ===== 结算卡片 ===== -->
      <view class="sp-settle-card">
        <view class="sp-settle-header">
          <text class="sp-settle-title">{{ periodLabel }}</text>
          <text class="sp-settle-date">{{ dateLabel }}</text>
        </view>

        <view
          v-for="(item, index) in currentRank"
          :key="item.memberId"
          class="sp-rank-item"
        >
          <text class="sp-rank-medal">{{ medals[index] }}</text>
          <text class="sp-rank-emoji">{{ item.emoji }}</text>
          <view class="sp-rank-body">
            <text class="sp-rank-name">{{ item.name }}</text>
            <text class="sp-rank-rate">{{ item.rate }}% 完成率</text>
          </view>
          <view class="sp-rank-track">
            <view
              class="sp-rank-fill"
              :style="{ width: item.rate + '%' }"
            ></view>
          </view>
          <text class="sp-rank-grow" v-if="item.petGrow">+{{ item.petGrow }}</text>
        </view>
      </view>

      <!-- ===== 奖励发放（按人群差异化） ===== -->
      <view class="sp-section">
        <text class="sp-section-title">🎁 奖励发放</text>

        <!-- 大儿子：龙新皮肤、技能解锁 -->
        <view class="sp-reward-group">
          <text class="sp-reward-group-title">🐉 大儿子 · 龙之试炼</text>
          <view class="sp-reward-grid">
            <view class="sp-reward-card">
              <text class="sp-reward-icon">🐲</text>
              <text class="sp-reward-name">龙新皮肤</text>
              <text class="sp-reward-desc">烈焰龙鳞</text>
            </view>
            <view class="sp-reward-card">
              <text class="sp-reward-icon">⚡</text>
              <text class="sp-reward-name">技能解锁</text>
              <text class="sp-reward-desc">雷电之力</text>
            </view>
            <view class="sp-reward-card">
              <text class="sp-reward-icon">🔮</text>
              <text class="sp-reward-name">龙鳞×5</text>
              <text class="sp-reward-desc">进化材料</text>
            </view>
          </view>
        </view>

        <!-- 父母：特权兑换券 -->
        <view class="sp-reward-group">
          <text class="sp-reward-group-title">👨‍👩‍👧 父母 · 特权兑换</text>
          <view class="sp-reward-grid">
            <view
              v-for="v in parentVouchers"
              :key="v.name"
              class="sp-reward-card"
            >
              <text class="sp-reward-icon">{{ v.icon }}</text>
              <text class="sp-reward-name">{{ v.name }}</text>
              <text class="sp-reward-desc">{{ v.desc }}</text>
            </view>
          </view>
        </view>

        <!-- 小宝：小鸡装扮 -->
        <view class="sp-reward-group">
          <text class="sp-reward-group-title">🐣 小宝 · 小鸡装扮</text>
          <view class="sp-reward-grid">
            <view
              v-for="d in babyDressUp"
              :key="d.name"
              class="sp-reward-card"
            >
              <text class="sp-reward-icon">{{ d.icon }}</text>
              <text class="sp-reward-name">{{ d.name }}</text>
              <text class="sp-reward-desc">{{ d.desc }}</text>
            </view>
          </view>
        </view>

        <!-- 奶奶：属灵果实勋章 -->
        <view class="sp-reward-group">
          <text class="sp-reward-group-title">🕊️ 奶奶 · 属灵果实</text>
          <view class="sp-reward-grid">
            <view
              v-for="f in spiritFruits"
              :key="f.id"
              class="sp-reward-card"
            >
              <text class="sp-reward-icon">{{ f.icon }}</text>
              <text class="sp-reward-name">{{ f.name }}</text>
              <text class="sp-reward-desc">{{ f.desc }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- ===== 家庭勋章墙 ===== -->
      <view class="sp-section">
        <text class="sp-section-title">🏅 家庭勋章墙</text>
        <view class="sp-achievement-grid">
          <view
            v-for="a in allAchievements"
            :key="a.id"
            class="sp-achievement-item"
            :class="{ earned: isEarned(a.id) }"
          >
            <text class="sp-ach-icon">{{ a.icon }}</text>
            <text class="sp-ach-name">{{ a.name }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  achievements, memberAchievements, SPIRITUAL_FRUITS,
  getFamilyInfo, getFamilyStats, getCurrentMemberId, getActivePet, stageFor, doneRate,
} from '@/store/index.js'

const props = defineProps({
  members: { type: Array, default: () => [] },
  weeklyRank: { type: Array, default: () => [] },
  monthlyRank: { type: Array, default: () => [] },
})

/* ===== 家庭总览 ===== */
const familyName = computed(() => (getFamilyInfo() && getFamilyInfo().name) || '我们家')
const familyStats = computed(() => getFamilyStats())
const familyRate = computed(() =>
  familyStats.value.todayTotal === 0
    ? 0
    : Math.round((familyStats.value.todayDone / familyStats.value.todayTotal) * 100)
)
const memberRows = computed(() => {
  const cur = getCurrentMemberId()
  return props.members.map(m => {
    const active = getActivePet(m.id)
    return {
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      themeColor: m.themeColor,
      isMe: m.id === cur,
      petIcon: (active && active.icon) || (m.pet && m.pet.type) || '🐾',
      stageName: stageFor(m).stage,
      rate: doneRate(m),
      doneCount: m.tasks.filter(t => t.done).length,
      totalCount: m.tasks.length,
    }
  })
})

const currentPeriod = ref('weekly')
const medals = ['🥇', '🥈', '🥉']

const periods = [
  { key: 'weekly', label: '每周' },
  { key: 'monthly', label: '每月' },
]

const currentRank = computed(() => {
  return currentPeriod.value === 'weekly' ? props.weeklyRank : props.monthlyRank
})

const periodLabel = computed(() => {
  return currentPeriod.value === 'weekly' ? '本周结算' : '本月结算'
})
const dateLabel = computed(() => {
  const d = new Date()
  return currentPeriod.value === 'weekly'
    ? `${d.getFullYear()}年${d.getMonth()+1}月 第${Math.ceil(d.getDate()/7)}周`
    : `${d.getFullYear()}年${d.getMonth()+1}月`
})

const allAchievements = achievements
const allMemberAchievements = memberAchievements

function isEarned(aid) {
  return Object.values(allMemberAchievements).some(ids => ids.includes(aid))
}

// 父母特权券
const parentVouchers = [
  { icon: '🧹', name: '免洗碗券', desc: '×1' },
  { icon: '🎬', name: '家庭电影票', desc: '×2' },
  { icon: '🛌', name: '懒觉券', desc: '×1' },
  { icon: '🍰', name: '甜品兑换', desc: '×1' },
]

// 小宝装扮
const babyDressUp = [
  { icon: '🎩', name: '小帽子', desc: '红色小礼帽' },
  { icon: '🧣', name: '小围巾', desc: '温暖围巾' },
  { icon: '👟', name: '小鞋子', desc: '黄色小靴' },
]

// 属灵果实
const spiritFruits = SPIRITUAL_FRUITS.slice(0, 6)
</script>

<style scoped>
.family-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 20px;
  box-sizing: border-box;
}

/* ===== 家庭总览 ===== */
.sp-family-card {
  background: linear-gradient(135deg, #EEF2FF, #EDE9FE);
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 14px;
}
.sp-fam-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
}
.sp-fam-title { font-size: 17px; font-weight: 800; color: #4338CA; display: block; }
.sp-fam-sub { font-size: 12px; color: #6D28D9; display: block; margin-top: 3px; }
.sp-fam-rate { font-size: 21px; font-weight: 800; color: #4F46E5; }
.sp-fam-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 10px;
}
.sp-fam-row.me { background: rgba(255,255,255,0.7); }
.sp-fam-emoji { font-size: 15px; }
.sp-fam-name { font-size: 13px; font-weight: 700; min-width: 44px; }
.sp-fam-me {
  font-size: 9px; font-weight: 800; color: #FFFFFF;
  background: #FF8A65; border-radius: 6px; padding: 1px 5px;
}
.sp-fam-pet { font-size: 11px; color: #7C7A9C; margin-left: auto; }
.sp-fam-track {
  width: 60px; height: 6px; background: rgba(255,255,255,0.8);
  border-radius: 3px; overflow: hidden; flex-shrink: 0;
}
.sp-fam-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
.sp-fam-done { font-size: 11px; color: #6D28D9; font-weight: 700; min-width: 34px; text-align: right; }

/* 周期切换 */
.sp-periods {
  display: flex;
  gap: 8px;
  background: #F1F5F9;
  border-radius: 12px;
  padding: 4px;
  flex-shrink: 0;
  margin-bottom: 12px;
}
.sp-period {
  flex: 1;
  padding: 10px 0;
  text-align: center;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sp-period.active {
  background: #FFFFFF;
  color: #4F46E5;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

/* 滚动区 */
.sp-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.sp-scroll::-webkit-scrollbar {
  width: 4px;
}
.sp-scroll::-webkit-scrollbar-thumb {
  background: #E2D6CC;
  border-radius: 2px;
}

/* 结算卡片 */
.sp-settle-card {
  background: linear-gradient(135deg, #EEF2FF, #EDE9FE);
  border-radius: 20px;
  padding: 24px 20px;
  flex-shrink: 0;
}
.sp-settle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.sp-settle-title {
  font-size: 18px;
  font-weight: 700;
  color: #4F46E5;
}
.sp-settle-date {
  font-size: 12px;
  color: #8A8178;
}

/* 排名项 */
.sp-rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255,255,255,0.7);
  border-radius: 12px;
  margin-bottom: 8px;
}
.sp-rank-medal {
  font-size: 20px;
  flex-shrink: 0;
}
.sp-rank-emoji {
  font-size: 18px;
  flex-shrink: 0;
}
.sp-rank-body {
  flex: 1;
  min-width: 0;
}
.sp-rank-name {
  font-size: 14px;
  font-weight: 700;
  color: #1A1A1A;
}
.sp-rank-rate {
  font-size: 11px;
  color: #8A8178;
}
.sp-rank-track {
  width: 60px;
  height: 6px;
  background: rgba(255,255,255,0.6);
  border-radius: 3px;
  overflow: hidden;
}
.sp-rank-fill {
  height: 100%;
  background: #4F46E5;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.sp-rank-grow {
  font-size: 13px;
  font-weight: 700;
  color: #F59E0B;
  min-width: 40px;
  text-align: right;
}

/* 分区 */
.sp-section {
  flex-shrink: 0;
}
.sp-section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 12px;
  display: block;
}

/* 奖励分组 */
.sp-reward-group {
  margin-bottom: 16px;
}
.sp-reward-group-title {
  font-size: 13px;
  font-weight: 700;
  color: #8A8178;
  display: block;
  margin-bottom: 8px;
  padding-left: 4px;
}
.sp-reward-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.sp-reward-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: #FFFFFF;
  border-radius: 14px;
  border: 1.5px solid #F3EDE5;
  transition: all 0.15s ease;
}
.sp-reward-card:active {
  transform: scale(0.96);
}
.sp-reward-icon {
  font-size: 24px;
}
.sp-reward-name {
  font-size: 12px;
  font-weight: 700;
  color: #1A1A1A;
  text-align: center;
}
.sp-reward-desc {
  font-size: 10px;
  color: #8A8178;
  text-align: center;
}

/* 勋章墙 */
.sp-achievement-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.sp-achievement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 6px;
  background: #FFFFFF;
  border-radius: 12px;
  border: 1.5px solid #F3EDE5;
  opacity: 0.35;
  transition: all 0.3s ease;
}
.sp-achievement-item.earned {
  opacity: 1;
  border-color: #FDE68A;
  background: #FFFBEB;
}
.sp-ach-icon {
  font-size: 22px;
}
.sp-ach-name {
  font-size: 10px;
  font-weight: 600;
  color: #1A1A1A;
  margin-top: 4px;
  text-align: center;
}
</style>