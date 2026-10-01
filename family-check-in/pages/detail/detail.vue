<template>
  <view class="page" v-if="member">
    <!-- ===== 头部 ===== -->
    <view class="detail-header">
      <view class="back-btn" @click="goBack">
        <text class="back-arrow">‹</text>
      </view>
      <view class="dh-avatar" :style="{ borderColor: member.themeColor }">
        <image v-if="member.avatarUrl" :src="member.avatarUrl" class="dh-avatar-img" mode="aspectFill" />
        <text v-else class="dh-avatar-emoji">{{ member.emoji }}</text>
      </view>
      <view class="dh-info">
        <view class="dh-name-row">
          <text class="dh-name">{{ member.name }}</text>
          <text class="dh-age">{{ member.age }}岁</text>
        </view>
        <text class="dh-pet">{{ activePetIcon }} {{ activePetName }} · {{ activePetSpecies }}</text>
      </view>
      <view class="dh-stage-badge" :style="{ background: member.themeColor }">
        <text class="dh-stage-text">{{ stage.stage }}</text>
      </view>
    </view>

    <!-- ===== 三栏 ===== -->
    <view class="columns">
      <!-- 左：今日签到任务 / 龙之试炼 -->
      <view class="col col-left">
        <view class="col-title-wrap">
          <text class="col-title">今日签到任务</text>
          <text class="col-title-sub">龙之试炼</text>
        </view>
        <view class="trial-grid">
          <view
            v-for="t in member.tasks"
            :key="t.id"
            class="trial-card"
            :class="{ done: t.done }"
            :style="{ borderColor: t.done ? member.themeColor + '55' : '#F3EDE5' }"
            @click="checkTask(t)"
          >
            <view class="trial-icon" :style="{ background: trialIconBg(t) }">
              <text>{{ t.icon }}</text>
            </view>
            <text class="trial-name">{{ t.name }}</text>
            <view class="trial-foot">
              <text class="trial-points">+{{ t.points || t.grace || 0 }}</text>
              <view class="trial-check" :class="{ done: t.done }">
                <text v-if="t.done">✓</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 中：宠物属性 -->
      <view class="col col-mid">
        <text class="col-title">宠物属性</text>
        <view class="pet-card">
          <view class="pet-img-wrap">
            <image v-if="member.petImage" :src="member.petImage" class="pet-img" mode="aspectFill" />
            <view v-else class="pet-emoji-circle" :style="{ background: petCircleBg }">
              <text class="pet-emoji">{{ activePetIcon }}</text>
            </view>
          </view>
          <text class="pet-stage-label">当前阶段 · {{ stage.stage }}</text>

          <!-- 3D预览按钮（龙宠物专属） -->
          <view class="model3d-btn" v-if="member.id === 'dabao'" @click="openModel3D">
            <text class="model3d-icon">🔮</text>
            <text class="model3d-text">查看3D模型</text>
          </view>

          <!-- 更换宠物 -->
          <view class="pet-switcher" v-if="memberPets.length">
            <text class="switcher-label">更换宠物</text>
            <view class="switcher-row">
              <view
                v-for="p in memberPets"
                :key="p.id"
                class="switcher-pet"
                :class="{ active: p.active }"
                :style="p.active ? { borderColor: member.themeColor, background: member.themeColor + '12' } : {}"
                @click="switchPet(p.id)"
              >
                <text class="switcher-icon">{{ p.icon }}</text>
                <text class="switcher-name">{{ p.name }}</text>
              </view>
            </view>
            <view class="adopt-link" @click="goPets">
              <text class="adopt-link-text">🐾 去领养中心看更多伙伴</text>
              <text class="adopt-link-arrow">›</text>
            </view>
          </view>

          <view class="pet-grow-row">
            <text class="pet-grow-label">成长值</text>
            <text class="pet-grow-num">{{ member.grow }}/{{ member.totalGrow }}</text>
          </view>
          <view class="pet-track">
            <view class="pet-fill" :style="{ width: growPercent + '%', background: member.themeColor }"></view>
          </view>

          <!-- 四条属性 -->
          <view class="attrs">
            <view v-for="a in attrList" :key="a.key" class="attr-row">
              <text class="attr-label">{{ a.label }}</text>
              <view class="attr-track">
                <view class="attr-fill" :style="{ width: a.value + '%', background: a.color }"></view>
              </view>
              <text class="attr-val">{{ a.value }}</text>
            </view>
          </view>

          <!-- 龙鳞余量（仅 9 岁孩子） -->
          <view class="scales" v-if="member.dragonScales !== undefined">
            <text class="scales-label">🐉 龙鳞余量</text>
            <view class="scales-row">
              <text v-for="i in 12" :key="i" class="scale" :class="{ on: i <= (member.dragonScales || 0) }">◆</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 右：连签统计 + 技能树 + 里程碑 -->
      <view class="col col-right">
        <text class="col-title">连签统计</text>
        <view class="stat-pills">
          <view class="pill">
            <text class="pill-val">{{ member.streak }}<text class="pill-unit">天</text></text>
            <text class="pill-label">连签</text>
          </view>
          <view class="pill">
            <text class="pill-val">{{ member.totalCheckins }}<text class="pill-unit">次</text></text>
            <text class="pill-label">总签到</text>
          </view>
          <view class="pill" v-if="member.dragonScales !== undefined">
            <text class="pill-val">{{ member.dragonScales }}<text class="pill-unit">片</text></text>
            <text class="pill-label">龙鳞</text>
          </view>
          <view class="pill" v-else>
            <text class="pill-val">{{ scoreValue }}<text class="pill-unit" v-if="scoreUnit">{{ scoreUnit }}</text></text>
            <text class="pill-label">{{ scoreLabel }}</text>
          </view>
        </view>

        <!-- 龙技能树（仅小龙） -->
        <view class="skill-tree" v-if="member.skills && member.skills.length">
          <text class="col-subtitle">🐲 龙技能树</text>
          <view
            v-for="s in member.skills"
            :key="s.id"
            class="skill-node"
            :class="s.unlocked ? 'unlocked' : (s.cost ? 'lockable' : 'locked')"
          >
            <view class="skill-dot"></view>
            <view class="skill-body">
              <text class="skill-name">{{ s.name }}</text>
              <text class="skill-desc">{{ s.desc }}</text>
            </view>
            <text class="skill-state">{{ s.unlocked ? '已解锁' : (s.cost ? '需'+s.cost+'鳞' : '未解锁') }}</text>
          </view>
        </view>

        <!-- 属灵果实（仅奶奶） -->
        <view class="fruit-tree" v-else-if="member.spiritualFruits && member.spiritualFruits.length">
          <text class="col-subtitle">🕊️ 属灵果实</text>
          <view class="fruit-grid">
            <view v-for="f in fruitList" :key="f.id" class="fruit-item">
              <text class="fruit-item-icon">{{ f.icon }}</text>
              <text class="fruit-item-name">{{ f.name }}</text>
            </view>
          </view>
        </view>

        <!-- 成长里程碑 -->
        <view class="milestones">
          <text class="col-subtitle">🌟 成长里程碑</text>
          <view
            v-for="(m, i) in milestoneList"
            :key="i"
            class="mile-node"
            :class="{ reached: m.reached }"
          >
            <view class="mile-dot"></view>
            <view class="mile-body">
              <text class="mile-label">{{ m.label }}</text>
              <text class="mile-sub" v-if="m.sub">{{ m.sub }}</text>
              <text class="mile-reward" v-if="m.reward">{{ m.reward }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 签到弹窗 -->
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
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  members, doCheckin, checkinModal,
  getPetAttrs, stageFor, SPIRITUAL_FRUITS,
  getMemberPets, switchActivePet, getActivePet,
  getCurrentMemberId, setCurrentMember,
} from '@/store/index.js'
import CheckinModal from '@/components/CheckinModal.vue'

const modal = checkinModal
const memberId = ref('')
const member = ref(null)

const PET_EMOJI = { dad: '🐶', mom: '🐱', dabao: '🐉', erbao: '🐣', grandma: '🐢' }
const PET_CIRCLE_BG = {
  dad: '#DBEAFE', mom: '#FCE7F3', dabao: '#FEF3C7', erbao: '#D1FAE5', grandma: '#FED7AA'
}
const petEmoji = computed(() => PET_EMOJI[member.value?.id] || '🐾')
const petCircleBg = computed(() => PET_CIRCLE_BG[member.value?.id] || '#FFF6F0')

const activePet = computed(() => member.value ? getActivePet(member.value.id) : null)
const activePetIcon = computed(() => activePet.value?.icon || petEmoji.value)
const activePetName = computed(() => activePet.value?.name || member.value?.pet?.name || '')
const activePetSpecies = computed(() => activePet.value?.species || member.value?.pet?.species || '')

const memberPets = computed(() => member.value ? getMemberPets(member.value.id) : [])

function switchPet(petId) {
  if (!member.value) return
  switchActivePet(member.value.id, petId)
}

function goPets() {
  // 单人视角：宠物页始终展示「当前身份」。若在别人的详情页点宠物，
  // 先把视角切到该成员再跳转，保证看到的是 TA 的宠物。
  if (member.value && getCurrentMemberId() !== member.value.id) {
    setCurrentMember(member.value.id)
  }
  uni.switchTab({ url: '/pages/pets/pets' })
}

function openModel3D() {
  uni.navigateTo({ url: '/pages/model3d/model3d' })
}

function handleLoad(options) {
  const id = options?.id || 'dabao'
  memberId.value = id
  const m = members.find(x => x.id === id)
  member.value = m || members[0]
}

onLoad(handleLoad)

const stage = computed(() => member.value ? stageFor(member.value) : { stage: '' })

const growPercent = computed(() => {
  if (!member.value) return 0
  return Math.round((member.value.grow / member.value.totalGrow) * 100)
})

const attrList = computed(() => {
  if (!member.value) return []
  const a = getPetAttrs(member.value)
  return [
    { key: 'strength', label: '力量', value: a.strength, color: '#FF6B6B' },
    { key: 'wisdom', label: '智慧', value: a.wisdom, color: '#6366F1' },
    { key: 'vitality', label: '活力', value: a.vitality, color: '#10B981' },
    { key: 'charm', label: '魅力', value: a.charm, color: '#F59E0B' }
  ]
})

const scoreLabel = computed(() => {
  const m = member.value
  if (!m) return ''
  if (m.age <= 4) return '星星'
  if (m.age >= 55) return '恩典'
  return '积分'
})
const scoreUnit = computed(() => (member.value && member.value.age <= 4) ? '⭐' : '')
const scoreValue = computed(() => {
  const m = member.value
  if (!m) return 0
  if (m.age <= 4) return m.stars || 0
  if (m.age >= 55) return m.grace || 0
  return m.points
})

const fruitList = computed(() => {
  const m = member.value
  if (!m || !m.spiritualFruits) return []
  return m.spiritualFruits.map(id => SPIRITUAL_FRUITS.find(f => f.id === id)).filter(Boolean)
})

const milestoneList = computed(() => {
  const m = member.value
  if (m && m.milestones && m.milestones.length) return m.milestones
  return [
    { label: '第一次签到', reached: m ? m.totalCheckins > 0 : false },
    { label: '坚持一周', sub: '连签 7 天', reached: m ? m.streak >= 7 : false },
    { label: '宠物进化', sub: '成长值过半', reached: m ? growPercent.value >= 50 : false }
  ]
})

function trialIconBg(t) {
  const m = member.value
  if (!m) return '#FFF6F0'
  return m.themeColor + '1A'
}

function checkTask(t) {
  if (t.done) return
  if (!member.value) return
  // 单人视角 + 拍照必填：与签到页/首页一致，先拍照再签到。
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      const path = (res.tempFilePaths && res.tempFilePaths[0]) || ''
      if (!path) return
      const r = doCheckin(member.value.id, t.id, path)
      if (r && r.blocked) {
        uni.showToast({ title: r.msg || '请先拍照再签到哦 📷', icon: 'none' })
      }
    }
  })
}
function goBack() {
  uni.navigateBack({ delta: 1 })
}
</script>

<style scoped>
.page {
  padding: 28rpx 32rpx 40rpx;
  background: #FFF6F0;
  min-height: 100vh;
  min-height: 100dvh;
  box-sizing: border-box;
}

/* ===== 头部 ===== */
.detail-header {
  display: flex; align-items: center; gap: 20rpx;
  margin-bottom: 28rpx;
}
.back-btn {
  width: 64rpx; height: 64rpx; border-radius: 50%;
  background: #FFFFFF; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
}
.back-arrow { font-size: 44rpx; font-weight: 700; color: #1A1A1A; line-height: 1; }
.dh-avatar {
  width: 96rpx; height: 96rpx; border-radius: 50%;
  border: 4rpx solid #FF8A65; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.dh-avatar-img { width: 100%; height: 100%; }
.dh-avatar-emoji { font-size: 52rpx; }
.dh-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.dh-name-row { display: flex; align-items: baseline; gap: 12rpx; }
.dh-name { font-size: 40rpx; font-weight: 800; color: #1A1A1A; }
.dh-age { font-size: 22rpx; color: #8A8178; }
.dh-pet { font-size: 24rpx; color: #A88B6A; font-weight: 600; }
.dh-stage-badge {
  padding: 12rpx 28rpx; border-radius: 40rpx;
}
.dh-stage-text { font-size: 24rpx; font-weight: 800; color: #FFFFFF; }

/* ===== 三栏 ===== */
.columns {
  display: flex; gap: 24rpx; align-items: flex-start;
}
.col { display: flex; flex-direction: column; gap: 16rpx; }
.col-left { flex: 1.1; }
.col-mid { flex: 1; }
.col-right { flex: 1; }
.col-title { font-size: 32rpx; font-weight: 800; color: #1A1A1A; }
.col-title-sub {
  font-size: 22rpx; font-weight: 700; color: #FF8A65;
  background: #FFEDD5; border-radius: 20rpx; padding: 6rpx 18rpx; margin-left: 12rpx;
}
.col-title-wrap { display: flex; align-items: center; }
.col-subtitle { font-size: 26rpx; font-weight: 800; color: #1A1A1A; margin-top: 8rpx; }

/* 左：试炼网格 */
.trial-grid {
  display: flex; flex-wrap: wrap; gap: 16rpx;
}
.trial-card {
  width: calc(50% - 8rpx);
  background: #FFFFFF; border-radius: 22rpx; padding: 20rpx;
  border: 3rpx solid #F3EDE5;
  display: flex; flex-direction: column; gap: 10rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.04);
}
.trial-card.done { opacity: 0.78; }
.trial-card:active { transform: scale(0.98); }
.trial-icon {
  width: 64rpx; height: 64rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 34rpx;
}
.trial-name { font-size: 22rpx; font-weight: 600; color: #1A1A1A; line-height: 1.4; }
.trial-foot { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
.trial-points { font-size: 22rpx; font-weight: 800; color: #F59E0B; }
.trial-check {
  width: 40rpx; height: 40rpx; border-radius: 50%;
  border: 3rpx solid #F3EDE5; background: #FFFFFF;
  display: flex; align-items: center; justify-content: center;
  font-size: 22rpx; color: #FFFFFF;
}
.trial-check.done { background: #34D399; border-color: #34D399; }

/* 中：宠物属性 */
.pet-card {
  background: #FFFFFF; border-radius: 24rpx; padding: 24rpx;
  display: flex; flex-direction: column; gap: 16rpx; align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.04);
}
.pet-img-wrap { margin-top: 4rpx; }
.pet-img {
  width: 200rpx; height: 200rpx; border-radius: 50%;
  border: 4rpx solid #FFEDD5;
}
.pet-emoji-circle {
  width: 200rpx; height: 200rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 4rpx solid #FFEDD5;
}
.pet-emoji { font-size: 100rpx; }
.pet-stage-label { font-size: 24rpx; font-weight: 700; color: #A88B6A; }

/* 3D预览按钮 */
.model3d-btn {
  display: flex; align-items: center; justify-content: center; gap: 8rpx;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  border-radius: 20rpx; padding: 14rpx 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(99,102,241,0.3);
}
.model3d-btn:active { opacity: 0.85; }
.model3d-icon { font-size: 28rpx; }
.model3d-text { font-size: 24rpx; font-weight: 700; color: #FFFFFF; }

/* 宠物切换栏 */
.pet-switcher {
  width: 100%; margin-top: 8rpx; margin-bottom: 4rpx;
}
.switcher-label { font-size: 20rpx; color: #94A3B8; display: block; margin-bottom: 8rpx; }
.switcher-row { display: flex; gap: 10rpx; flex-wrap: wrap; }
.switcher-pet {
  display: flex; align-items: center; gap: 6rpx;
  padding: 8rpx 16rpx; border-radius: 20rpx;
  border: 2rpx solid #E2E8F0; background: #F8FAFC;
  transition: all 0.2s;
}
.switcher-pet.active { border-width: 2rpx; }
.switcher-icon { font-size: 28rpx; }
.switcher-name { font-size: 20rpx; font-weight: 600; color: #1E293B; }
.adopt-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  width: 100%;
  margin-top: 12rpx;
  padding: 14rpx 16rpx;
  background: #FFF6F0;
  border: 2rpx dashed #FFB088;
  border-radius: 18rpx;
  transition: transform 0.15s ease;
}
.adopt-link:active {
  transform: scale(0.97);
  background: #FFEDD5;
}
.adopt-link-text {
  font-size: 22rpx;
  font-weight: 700;
  color: #FF8A65;
}
.adopt-link-arrow {
  font-size: 26rpx;
  font-weight: 800;
  color: #FF8A65;
}
.pet-grow-row { width: 100%; display: flex; justify-content: space-between; align-items: center; }
.pet-grow-label { font-size: 22rpx; color: #8A8178; }
.pet-grow-num { font-size: 24rpx; font-weight: 800; color: #1A1A1A; }
.pet-track { width: 100%; height: 14rpx; background: #F3EDE5; border-radius: 7rpx; overflow: hidden; }
.pet-fill { height: 100%; border-radius: 7rpx; }
.attrs { width: 100%; display: flex; flex-direction: column; gap: 14rpx; }
.attr-row { display: flex; align-items: center; gap: 12rpx; }
.attr-label { width: 56rpx; font-size: 22rpx; color: #8A8178; font-weight: 600; }
.attr-track { flex: 1; height: 14rpx; background: #F3EDE5; border-radius: 7rpx; overflow: hidden; }
.attr-fill { height: 100%; border-radius: 7rpx; }
.attr-val { width: 48rpx; text-align: right; font-size: 22rpx; font-weight: 800; color: #1A1A1A; }
.scales { width: 100%; display: flex; flex-direction: column; gap: 8rpx; }
.scales-label { font-size: 22rpx; font-weight: 700; color: #F59E0B; }
.scales-row { display: flex; flex-wrap: wrap; gap: 6rpx; }
.scale { font-size: 24rpx; color: #E5E7EB; }
.scale.on { color: #F59E0B; }

/* 右：统计 pills + 技能树 + 里程碑 */
.stat-pills { display: flex; gap: 14rpx; }
.pill {
  flex: 1; background: #FFFFFF; border-radius: 20rpx; padding: 16rpx 10rpx;
  display: flex; flex-direction: column; align-items: center; gap: 4rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.04);
}
.pill-val { font-size: 30rpx; font-weight: 800; color: #1A1A1A; }
.pill-unit { font-size: 18rpx; font-weight: 500; }
.pill-label { font-size: 19rpx; color: #8A8178; }

.skill-tree { display: flex; flex-direction: column; gap: 12rpx; }
.skill-node {
  display: flex; align-items: center; gap: 14rpx;
  background: #FFFFFF; border-radius: 18rpx; padding: 16rpx 18rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.04);
}
.skill-dot {
  width: 18rpx; height: 18rpx; border-radius: 50%;
  background: #E5E7EB;
}
.skill-node.unlocked .skill-dot { background: #34D399; }
.skill-node.lockable .skill-dot { background: #F59E0B; }
.skill-body { flex: 1; display: flex; flex-direction: column; }
.skill-name { font-size: 24rpx; font-weight: 700; color: #1A1A1A; }
.skill-desc { font-size: 19rpx; color: #8A8178; }
.skill-state { font-size: 19rpx; font-weight: 700; color: #8A8178; }
.skill-node.unlocked .skill-state { color: #34D399; }
.skill-node.lockable .skill-state { color: #F59E0B; }

.fruit-tree { display: flex; flex-direction: column; gap: 12rpx; }
.fruit-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.fruit-item {
  display: flex; align-items: center; gap: 6rpx;
  background: #FFFFFF; border-radius: 20rpx; padding: 12rpx 18rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.04);
}
.fruit-item-icon { font-size: 26rpx; }
.fruit-item-name { font-size: 22rpx; font-weight: 600; color: #1A1A1A; }

.milestones { display: flex; flex-direction: column; gap: 0; }
.mile-node { display: flex; gap: 14rpx; padding-bottom: 18rpx; position: relative; }
.mile-node::before {
  content: ''; position: absolute; left: 8rpx; top: 18rpx; bottom: 0;
  width: 2rpx; background: #F3EDE5;
}
.mile-node:last-child::before { display: none; }
.mile-dot {
  width: 18rpx; height: 18rpx; border-radius: 50%; margin-top: 6rpx;
  background: #E5E7EB; z-index: 1;
}
.mile-node.reached .mile-dot { background: #34D399; }
.mile-body { flex: 1; display: flex; flex-direction: column; }
.mile-label { font-size: 23rpx; font-weight: 700; color: #1A1A1A; }
.mile-node.reached .mile-label { color: #10B981; }
.mile-sub { font-size: 19rpx; color: #8A8178; margin-top: 2rpx; }
.mile-reward { font-size: 19rpx; color: #F59E0B; font-weight: 600; margin-top: 2rpx; }

/* 交互增强 */
.trial-card {
  transition: transform 0.15s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}
.trial-card:active {
  transform: scale(0.96);
}
.trial-check.done {
  animation: checkPop 0.3s ease;
}
.pet-fill, .attr-fill {
  transition: width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.pill {
  transition: transform 0.15s ease;
}
.pill:active {
  transform: scale(0.95);
}
.skill-node {
  transition: transform 0.15s ease, background 0.2s ease;
}
.skill-node:active {
  transform: scale(0.98);
}
.back-btn {
  transition: transform 0.15s ease, background 0.15s ease;
  cursor: pointer;
}
.back-btn:active {
  transform: scale(0.9);
  background: #F1F5F9;
}

@media screen and (min-width: 600px) {
  .columns {
    gap: 24rpx;
  }
  .trial-grid {
    grid-template-columns: repeat(2, 1fr);
    display: grid;
    gap: 14rpx;
  }
  .trial-card {
    width: 100%;
    box-sizing: border-box;
  }
  .pet-emoji-circle {
    width: 220rpx;
    height: 220rpx;
  }
  .pet-emoji {
    font-size: 110rpx;
  }
}

@media screen and (min-width: 850px) {
  .trial-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
