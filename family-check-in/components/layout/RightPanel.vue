<template>
  <view class="right-panel-inner">
    <!-- ===== Tab 切换 ===== -->
    <view class="right-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="right-tab"
        :class="{ active: activeTab === tab.key }"
        @click="$emit('switch-tab', tab.key)"
      >
        <text class="right-tab-icon">{{ tab.icon }}</text>
        <text class="right-tab-text">{{ tab.label }}</text>
      </view>
    </view>

    <scroll-view
      class="right-content"
      :scroll-y="true"
      :show-scrollbar="false"
    >
      <!-- ===== Tab1: 宠物 ===== -->
      <view v-if="activeTab === 'pet'" class="tab-content pet-tab">
        <!-- 单人视角：右栏永远跟随当前身份，空态兜底 -->
        <view v-if="!member" class="rp-empty">
          <text class="rp-empty-icon">🐾</text>
          <text class="rp-empty-text">还没有选择身份</text>
        </view>

        <!-- 奶奶专属：今日经文 -->
        <view class="verse-card" v-if="member && member.age >= 55">
          <text class="verse-title">📖 今日经文</text>
          <text class="verse-text">"{{ verseText }}"</text>
          <text class="verse-ref">— {{ verseRef }}</text>
        </view>

        <view class="pet-display-card" v-if="member">
          <!-- 当前身份徽标 -->
          <view class="rp-me-row">
            <text class="rp-me-emoji">{{ member.emoji || '🙂' }}</text>
            <text class="rp-me-name" :style="{ color: member.themeColor || '#FF8A65' }">{{ member.name }}</text>
            <text class="rp-me-chip">我</text>
          </view>

          <!-- 宠物立绘 -->
          <view class="pet-artwork">
            <image
              v-if="member && member.petImage"
              :src="member.petImage"
              class="pet-art-img"
              mode="aspectFill"
            />
            <view v-else class="pet-art-emoji-wrap" :style="{ background: petCircleBg }">
              <text class="pet-art-emoji">{{ activePetIcon }}</text>
            </view>
          </view>

          <!-- 宠物名称 + 阶段 -->
          <text class="pet-name">
            {{ activePetName }}
            <text class="pet-species">· {{ activePetSpecies }}</text>
          </text>
          <text class="pet-stage" :style="{ color: member?.themeColor || '#A88B6A' }">
            {{ stage ? stage.stage + ' Lv.' + stage.level : '—' }}
          </text>

          <!-- 进化进度条 -->
          <view class="evolve-section">
            <text class="evolve-label">进化进度</text>
            <view class="evolve-track">
              <view
                class="evolve-fill"
                :style="{ width: growPct + '%', background: member?.themeColor || '#FF8A65' }"
              ></view>
            </view>
            <text class="evolve-num">{{ member ? member.grow + '/' + member.totalGrow : '—' }}</text>
          </view>

          <!-- 属性条 -->
          <view class="pet-attrs" v-if="attrs.length">
            <view v-for="a in attrs" :key="a.key" class="attr-line">
              <text class="attr-label">{{ a.label }}</text>
              <view class="attr-track">
                <view class="attr-fill" :style="{ width: a.value + '%', background: a.color }"></view>
              </view>
              <text class="attr-val">{{ a.value }}</text>
            </view>
          </view>

          <!-- 更换宠物 -->
          <view class="pet-switch" v-if="memberPets.length">
            <text class="switch-label">更换宠物</text>
            <view class="switch-row">
              <view
                v-for="p in memberPets"
                :key="p.id"
                class="switch-item"
                :class="{ active: p.active }"
                :style="p.active ? { borderColor: member?.themeColor || '#FF8A65', background: (member?.themeColor || '#FF8A65') + '15' } : {}"
                @click="$emit('switch-pet', p.id)"
              >
                <text class="switch-icon">{{ p.icon }}</text>
                <text class="switch-name">{{ p.name }}</text>
              </view>
            </view>
            <view class="adopt-link" @click="$emit('open-pets')">
              <text class="adopt-link-text">🐾 去领养中心看更多伙伴</text>
              <text class="adopt-link-arrow">›</text>
            </view>
          </view>

          <!-- 3D 预览 + 比武入口（龙专属） -->
          <view class="model3d-btn" v-if="member && member.id === 'dabao'" @click="$emit('open-model3d')">
            <text class="model3d-btn-icon">🔮</text>
            <text class="model3d-btn-text">查看3D模型</text>
          </view>
          <view class="battle-entry-btn" v-if="member && member.id === 'dabao'" @click="$emit('battle')">
            <text class="model3d-btn-icon">⚔️</text>
            <text class="model3d-btn-text">宠物比武</text>
          </view>
        </view>

        <!-- 龙鳞收集（仅小龙） -->
        <view class="scales-card" v-if="member && member.dragonScales !== undefined">
          <text class="scales-title">🐉 龙鳞收集</text>
          <view class="scales-row">
            <text
              v-for="i in 12"
              :key="i"
              class="scale-item"
              :class="{ on: i <= (member.dragonScales || 0) }"
            >◆</text>
          </view>
          <text class="scales-count">{{ member.dragonScales || 0 }}/12 片</text>
        </view>
      </view>

      <!-- ===== Tab2: 成就 ===== -->
      <view v-if="activeTab === 'achievement'" class="tab-content">
        <text class="tab-section-title">🏅 勋章墙</text>
        <view class="achievement-grid">
          <view
            v-for="a in achievements"
            :key="a.id"
            class="achievement-item"
            :class="{ earned: isEarned(a.id) }"
          >
            <text class="ach-icon">{{ a.icon }}</text>
            <text class="ach-name">{{ a.name }}</text>
          </view>
        </view>

        <!-- 皮肤/龙鳞收集（仅小龙） -->
        <view class="skin-section" v-if="member && member.skills && member.skills.length">
          <text class="tab-section-title">🐲 龙技能树</text>
          <view
            v-for="s in member.skills"
            :key="s.id"
            class="skill-node"
            :class="s.unlocked ? 'unlocked' : 'locked'"
          >
            <view class="skill-dot" :style="{ background: s.unlocked ? '#34D399' : '#E5E7EB' }"></view>
            <view class="skill-body">
              <text class="skill-name">{{ s.name }}</text>
              <text class="skill-desc">{{ s.desc }}</text>
            </view>
            <text class="skill-state">{{ s.unlocked ? '✓' : (s.cost ? '需'+s.cost+'鳞' : '🔒') }}</text>
          </view>
        </view>

        <!-- 属灵果实（仅奶奶） -->
        <view class="fruit-section" v-else-if="member && member.spiritualFruits && member.spiritualFruits.length">
          <text class="tab-section-title">🕊️ 属灵果实</text>
          <view class="fruit-grid">
            <view
              v-for="f in fruitList"
              :key="f.id"
              class="fruit-item"
            >
              <text class="fruit-icon">{{ f.icon }}</text>
              <text class="fruit-name">{{ f.name }}</text>
              <text class="fruit-desc">{{ f.desc }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- ===== Tab3: 积分仓库 ===== -->
      <view v-if="activeTab === 'score'" class="tab-content">
        <!-- 积分概览 -->
        <view class="score-overview">
          <text class="score-big">{{ scoreValue }}</text>
          <text class="score-unit">{{ scoreLabel }}</text>
        </view>

        <!-- 连签统计 -->
        <view class="stat-pills">
          <view class="stat-pill">
            <text class="stat-pill-val">{{ member?.streak || 0 }}<text class="stat-pill-unit">天</text></text>
            <text class="stat-pill-label">连签</text>
          </view>
          <view class="stat-pill">
            <text class="stat-pill-val">{{ member?.totalCheckins || 0 }}<text class="stat-pill-unit">次</text></text>
            <text class="stat-pill-label">总签到</text>
          </view>
        </view>

        <!-- 可兑换特权 -->
        <text class="tab-section-title">🎁 可兑换特权</text>
        <view class="voucher-list">
          <view
            v-for="(v, i) in vouchers"
            :key="i"
            class="voucher-item"
            :class="{ canAfford: scoreValue >= v.cost }"
          >
            <text class="voucher-icon">{{ v.icon }}</text>
            <view class="voucher-body">
              <text class="voucher-name">{{ v.name }}</text>
              <text class="voucher-desc">{{ v.desc }}</text>
            </view>
            <text class="voucher-cost" :class="{ enough: scoreValue >= v.cost }">
              {{ v.cost }}{{ scoreShortLabel }}
            </text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { achievements, memberAchievements, SPIRITUAL_FRUITS, getTodayVerse } from '@/store/index.js'

const props = defineProps({
  member: { type: Object, default: null },
  activeTab: { type: String, default: 'pet' },
  stage: { type: Object, default: () => ({}) },
  attrs: { type: Array, default: () => [] },
  memberPets: { type: Array, default: () => [] },
  achievements: { type: Array, default: () => [] },
})

defineEmits(['switch-tab', 'switch-pet', 'open-model3d', 'battle', 'open-pets'])

const tabs = [
  { key: 'pet', icon: '🐾', label: '宠物' },
  { key: 'achievement', icon: '🏅', label: '成就' },
  { key: 'score', icon: '🎁', label: '积分' },
]

// 奶奶经文
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

const PET_CIRCLE_BG = {
  dad: '#DBEAFE', mom: '#FCE7F3', dabao: '#FEF3C7',
  erbao: '#D1FAE5', grandma: '#FED7AA',
}

const petCircleBg = computed(() => PET_CIRCLE_BG[props.member?.id] || '#FFF6F0')

const activePetIcon = computed(() => {
  if (!props.member) return '🐾'
  const active = props.memberPets.find(p => p.active)
  return active?.icon || '🐾'
})
const activePetName = computed(() => {
  if (!props.member) return '—'
  const active = props.memberPets.find(p => p.active)
  return active?.name || props.member.pet?.name || '—'
})
const activePetSpecies = computed(() => {
  if (!props.member) return ''
  const active = props.memberPets.find(p => p.active)
  return active?.species || props.member.pet?.species || ''
})

const growPct = computed(() => {
  if (!props.member) return 0
  return Math.round((props.member.grow / props.member.totalGrow) * 100)
})

// 积分
const scoreValue = computed(() => {
  if (!props.member) return 0
  if (props.member.age <= 4) return props.member.stars || 0
  if (props.member.age >= 55) return props.member.grace || 0
  return props.member.points || 0
})
const scoreLabel = computed(() => {
  if (!props.member) return ''
  if (props.member.age <= 4) return '⭐ 星星'
  if (props.member.age >= 55) return '恩典值'
  return '积分'
})
const scoreShortLabel = computed(() => {
  if (!props.member) return ''
  if (props.member.age <= 4) return '⭐'
  if (props.member.age >= 55) return '恩'
  return '分'
})

// 成就
function isEarned(aid) {
  return Object.values(memberAchievements).some(ids => ids.includes(aid))
}

// 属灵果实
const fruitList = computed(() => {
  if (!props.member || !props.member.spiritualFruits) return []
  return props.member.spiritualFruits.map(id => SPIRITUAL_FRUITS.find(f => f.id === id)).filter(Boolean)
})

// 可兑换特权券
const vouchers = [
  { icon: '🧹', name: '免洗碗券', desc: '今天不用洗碗', cost: 50 },
  { icon: '🎬', name: '家庭电影票', desc: '选一部全家一起看', cost: 100 },
  { icon: '🛌', name: '懒觉券', desc: '周末多睡一小时', cost: 80 },
  { icon: '🍰', name: '甜品兑换', desc: '任选一款甜品', cost: 60 },
  { icon: '🎮', name: '游戏时间+30min', desc: '多玩半小时', cost: 40 },
  { icon: '📖', name: '故事点播', desc: '指定一个睡前故事', cost: 30 },
]
</script>

<style scoped>
.right-panel-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

/* ===== Tabs ===== */
.right-tabs {
  display: flex;
  border-bottom: 1px solid #F0E8DE;
  flex-shrink: 0;
  background: #FFFAF7;
}
.right-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 10px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}
.right-tab.active {
  border-bottom-color: #FF8A65;
  background: #FFF6F0;
}
.right-tab:active {
  background: #F3EDE5;
}
.right-tab-icon {
  font-size: 18px;
}
.right-tab-text {
  font-size: 11px;
  font-weight: 600;
  color: #8A8178;
}
.right-tab.active .right-tab-text {
  color: #FF8A65;
}

/* ===== 内容区 ===== */
.right-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  max-width: 100%;
  /* uni-app scroll-view host 默认 content-box，padding 会把元素撑出父级导致右侧被裁 */
  box-sizing: border-box;
  padding: 8px 10px;
}
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  max-width: 100%;
}
.tab-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #1A1A1A;
  margin-top: 2px;
}

/* ===== 当前身份徽标 / 空态 ===== */
.rp-me-row {
  display: flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 4px 10px;
  background: #FFF6F0;
  border-radius: 10px;
  border: 1px solid #FFEDD5;
}
.rp-me-emoji {
  font-size: 14px;
}
.rp-me-name {
  font-size: 13px;
  font-weight: 800;
}
.rp-me-chip {
  font-size: 9px;
  font-weight: 800;
  color: #FFFFFF;
  background: #FF8A65;
  border-radius: 6px;
  padding: 1px 6px;
}
.rp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 12px;
  background: #FFFFFF;
  border-radius: 14px;
  border: 1.5px dashed #F0E8DE;
}
.rp-empty-icon {
  font-size: 32px;
}
.rp-empty-text {
  font-size: 12px;
  color: #8A8178;
}

/* ===== 宠物Tab ===== */
.pet-display-card {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}

/* 奶奶专属：经文卡 */
.verse-card {
  background: #FFFBEB;
  border-radius: 14px;
  padding: 14px 16px;
  border-left: 4px solid #A88B6A;
  font-size: 1.15em;
}
.verse-title {
  font-size: 13px;
  font-weight: 700;
  color: #A88B6A;
}
.verse-text {
  font-size: 14px;
  color: #57534E;
  line-height: 1.7;
  font-style: italic;
  display: block;
  margin-top: 8px;
}
.verse-ref {
  font-size: 11px;
  color: #A88B6A;
  font-weight: 600;
  display: block;
  margin-top: 6px;
}
.pet-artwork {
  margin: 4px 0;
}
.pet-art-img {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 3px solid #FFEDD5;
  object-fit: cover;
}
.pet-art-emoji-wrap {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #FFEDD5;
}
.pet-art-emoji {
  font-size: 42px;
}
.pet-name {
  font-size: 16px;
  font-weight: 800;
  color: #1A1A1A;
  text-align: center;
}
.pet-species {
  font-size: 12px;
  font-weight: 500;
  color: #A88B6A;
}
.pet-stage {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

/* 进化进度 */
.evolve-section {
  width: 100%;
}
.evolve-label {
  font-size: 11px;
  color: #8A8178;
  display: block;
  margin-bottom: 4px;
}
.evolve-track {
  height: 8px;
  background: #F3EDE5;
  border-radius: 4px;
  overflow: hidden;
}
.evolve-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}
.evolve-num {
  font-size: 11px;
  color: #A88B6A;
  text-align: right;
  display: block;
  margin-top: 2px;
}

/* 属性 */
.pet-attrs {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.attr-line {
  display: flex;
  align-items: center;
  gap: 8px;
}
.attr-label {
  width: 32px;
  font-size: 11px;
  color: #8A8178;
  font-weight: 600;
  flex-shrink: 0;
}
.attr-track {
  flex: 1;
  height: 6px;
  background: #F3EDE5;
  border-radius: 3px;
  overflow: hidden;
}
.attr-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}
.attr-val {
  width: 28px;
  text-align: right;
  font-size: 11px;
  font-weight: 700;
  color: #1A1A1A;
}

/* 宠物切换 */
.pet-switch {
  width: 100%;
  margin-top: 4px;
}
.switch-label {
  font-size: 11px;
  color: #94A3B8;
  display: block;
  margin-bottom: 6px;
}
.switch-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.switch-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 12px;
  border: 1.5px solid #E2E8F0;
  background: #F8FAFC;
  cursor: pointer;
  transition: all 0.15s ease;
}
.switch-item:active {
  transform: scale(0.95);
}
.switch-icon {
  font-size: 16px;
}
.switch-name {
  font-size: 11px;
  font-weight: 600;
  color: #1E293B;
}
.adopt-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  margin-top: 8px;
  padding: 8px 10px;
  background: #FFF6F0;
  border: 1.5px dashed #FFB088;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.adopt-link:active {
  transform: scale(0.97);
  background: #FFEDD5;
}
.adopt-link-text {
  font-size: 11px;
  font-weight: 700;
  color: #FF8A65;
}
.adopt-link-arrow {
  font-size: 13px;
  font-weight: 800;
  color: #FF8A65;
}

/* 3D按钮 */
.model3d-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  border-radius: 12px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.model3d-btn:active {
  opacity: 0.85;
}
.model3d-btn-icon {
  font-size: 16px;
}
.model3d-btn-text {
  font-size: 13px;
  font-weight: 700;
  color: #FFFFFF;
}
/* 比武入口：与 3D 按钮同款布局，渐变换色 */
.battle-entry-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #FF8A65, #EF4444);
  border-radius: 12px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.battle-entry-btn:active {
  opacity: 0.85;
}

/* 龙鳞 */
.scales-card {
  background: #FFFBEB;
  border-radius: 14px;
  padding: 14px;
  border: 1px solid #FDE68A;
}
.scales-title {
  font-size: 13px;
  font-weight: 700;
  color: #B45309;
  display: block;
  margin-bottom: 8px;
}
.scales-row {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.scale-item {
  font-size: 18px;
  color: #E5E7EB;
}
.scale-item.on {
  color: #F59E0B;
}
.scales-count {
  font-size: 11px;
  color: #B45309;
}

/* ===== 成就Tab ===== */
.achievement-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}
.achievement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 8px 4px;
  background: #FFFFFF;
  border-radius: 10px;
  border: 1.5px solid #F3EDE5;
  opacity: 0.35;
  transition: all 0.3s ease;
}
.achievement-item.earned {
  opacity: 1;
  border-color: #FDE68A;
  background: #FFFBEB;
}
.ach-icon {
  font-size: 20px;
}
.ach-name {
  font-size: 9px;
  font-weight: 600;
  color: #1A1A1A;
  margin-top: 2px;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 技能树 */
.skill-node {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.skill-dot {
  width: 10px;
  height: 10px;
  min-width: 10px;
  border-radius: 50%;
}
.skill-body {
  flex: 1;
  min-width: 0;
}
.skill-name {
  font-size: 12px;
  font-weight: 700;
  color: #1A1A1A;
}
.skill-desc {
  font-size: 10px;
  color: #8A8178;
}
.skill-state {
  font-size: 11px;
  font-weight: 700;
  color: #34D399;
  flex-shrink: 0;
}
.skill-node.locked .skill-state {
  color: #94A3B8;
}

/* 属灵果实 */
.fruit-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.fruit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
  padding: 10px 6px;
  background: #FFFFFF;
  border-radius: 12px;
  border: 1.5px solid #F3EDE5;
}
.fruit-icon {
  font-size: 22px;
}
.fruit-name {
  font-size: 11px;
  font-weight: 700;
  color: #1A1A1A;
}
.fruit-desc {
  font-size: 9px;
  color: #A88B6A;
  text-align: center;
}

/* ===== 积分Tab ===== */
.score-overview {
  text-align: center;
  padding: 16px 0;
  background: #FFFBEB;
  border-radius: 14px;
  border: 1px solid #FDE68A;
}
.score-big {
  font-size: 36px;
  font-weight: 800;
  color: #F59E0B;
  display: block;
  line-height: 1.1;
}
.score-unit {
  font-size: 12px;
  color: #B45309;
  font-weight: 600;
}

.stat-pills {
  display: flex;
  gap: 6px;
}
.stat-pill {
  flex: 1;
  background: #FFFFFF;
  border-radius: 10px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.stat-pill-val {
  font-size: 15px;
  font-weight: 800;
  color: #1A1A1A;
}
.stat-pill-unit {
  font-size: 11px;
  font-weight: 500;
}
.stat-pill-label {
  font-size: 10px;
  color: #8A8178;
}

/* 特权券 */
.voucher-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.voucher-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #FFFFFF;
  border-radius: 10px;
  border: 1.5px solid #F3EDE5;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  opacity: 0.5;
  transition: all 0.15s ease;
}
.voucher-item.canAfford {
  opacity: 1;
  border-color: #FDE68A;
  background: #FFFBEB;
}
.voucher-icon {
  font-size: 18px;
  flex-shrink: 0;
}
.voucher-body {
  flex: 1;
  min-width: 0;
}
.voucher-name {
  font-size: 11px;
  font-weight: 700;
  color: #1A1A1A;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.voucher-desc {
  font-size: 9px;
  color: #8A8178;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.voucher-cost {
  font-size: 11px;
  font-weight: 700;
  color: #94A3B8;
  flex-shrink: 0;
}
.voucher-cost.enough {
  color: #F59E0B;
}
</style>