<template>
  <view v-if="visible && pet" class="pdm-mask" @click.self="close">
    <view class="pdm-panel">
      <!-- 头部：稀有度渐变 + 宠物展示 -->
      <view class="pdm-head" :style="{ background: headBg }">
        <view class="pdm-close" @click="close">
          <text class="pdm-close-icon">✕</text>
        </view>
        <view class="pdm-icon-ring" :style="{ borderColor: rarityColor + '55' }">
          <view class="pdm-icon-bg" :style="{ background: rarityColor + '1A' }">
            <text class="pdm-icon" :class="{ locked: !unlocked }">{{ pet.icon }}</text>
          </view>
          <view v-if="!unlocked" class="pdm-lock-badge">
            <text class="pdm-lock-badge-icon">🔒</text>
          </view>
        </view>
        <view class="pdm-rarity-tag" :style="{ background: rarityColor }">
          <text class="pdm-rarity-text">{{ rarityLabel }}</text>
        </view>
        <text class="pdm-name">{{ pet.name }}</text>
        <text class="pdm-species">{{ pet.species }}</text>
      </view>

      <!-- 内容 -->
      <scroll-view scroll-y class="pdm-body">
        <text class="pdm-desc-title">📖 图鉴描述</text>
        <text class="pdm-desc">{{ pet.desc }}</text>

        <!-- 技能 -->
        <view v-if="pet.skills && pet.skills.length" class="pdm-skills">
          <text class="pdm-skills-title">✨ 专属技能</text>
          <view
            v-for="(sk, i) in pet.skills"
            :key="i"
            class="pdm-skill-item"
            :style="{ background: rarityColor + '0D', borderColor: rarityColor + '26' }"
          >
            <view class="pdm-skill-icon">
              <text class="pdm-skill-icon-text">{{ sk.icon }}</text>
            </view>
            <view class="pdm-skill-info">
              <text class="pdm-skill-name">{{ sk.name }}</text>
              <text class="pdm-skill-desc">{{ sk.desc }}</text>
            </view>
          </view>
        </view>

        <!-- 属性 -->
        <view class="pdm-stats">
          <view class="pdm-stat">
            <text class="pdm-stat-val">{{ pet.basePower }}</text>
            <text class="pdm-stat-label">基础战力</text>
          </view>
          <view class="pdm-stat-divider" :style="{ background: rarityColor + '33' }"></view>
          <view class="pdm-stat">
            <text class="pdm-stat-val">+{{ rarityPowerBonus }}</text>
            <text class="pdm-stat-label">稀有加成</text>
          </view>
          <view class="pdm-stat-divider" :style="{ background: rarityColor + '33' }"></view>
          <view class="pdm-stat">
            <text class="pdm-stat-val" :style="{ color: rarityColor }">{{ pet.basePower + rarityPowerBonus }}</text>
            <text class="pdm-stat-label">初始总战力</text>
          </view>
        </view>

        <!-- 领养条件 -->
        <view class="pdm-condition" :class="{ ok: unlocked }">
          <text v-if="pet.requiredPoints > 0" class="pdm-condition-text">
            {{ unlocked ? '✓ 积分已达标的' : '🔒 需要' }} {{ pet.requiredPoints }} {{ scoreLabel }}
          </text>
          <text v-else class="pdm-condition-text">🎁 免费领养</text>
          <text v-if="member && pet.requiredPoints > 0" class="pdm-condition-sub">
            当前：{{ memberScore }} {{ scoreLabel }}
          </text>
        </view>
      </scroll-view>

      <!-- 操作 -->
      <view class="pdm-footer">
        <view class="pdm-btn pdm-btn-plain" @click="close">
          <text class="pdm-btn-plain-text">再想想</text>
        </view>
        <view
          class="pdm-btn pdm-btn-primary"
          :class="{ disabled: !unlocked }"
          @click="onAdopt"
        >
          <text class="pdm-btn-primary-text">{{ unlocked ? '领养 TA' : '积分不足' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { RARITY_INFO } from '@/store/index.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  pet: { type: Object, default: null },
  // 用于展示当前积分与判断是否可领养，可为空
  member: { type: Object, default: null },
})

const emit = defineEmits(['close', 'adopt'])

const rarityColor = computed(() => {
  if (!props.pet) return '#94A3B8'
  return RARITY_INFO[props.pet.rarity]?.color || '#94A3B8'
})
const rarityLabel = computed(() => {
  if (!props.pet) return ''
  return RARITY_INFO[props.pet.rarity]?.label || ''
})
const rarityPowerBonus = computed(() => {
  if (!props.pet) return 0
  return RARITY_INFO[props.pet.rarity]?.powerBonus || 0
})

const headBg = computed(() => {
  return `linear-gradient(180deg, ${rarityColor.value}26, rgba(255,255,255,0) 85%)`
})

// 与 store 的 getMemberScore 保持同一口径
const memberScore = computed(() => {
  const m = props.member
  if (!m) return 0
  if (m.age <= 4) return m.stars || m.points || 0
  if (m.age >= 55) return m.grace || 0
  return m.points || 0
})

const scoreLabel = computed(() => {
  const m = props.member
  if (!m) return '积分'
  if (m.age <= 4) return '颗星星'
  if (m.age >= 55) return '恩典值'
  return '积分'
})

const unlocked = computed(() => {
  if (!props.pet) return false
  return props.pet.requiredPoints <= memberScore.value
})

function close() {
  emit('close')
}

function onAdopt() {
  if (!unlocked.value) return
  emit('adopt', props.pet)
}
</script>

<style scoped>
/* 全部使用 px 单位：弹窗同时用于移动端与平板三栏布局（rpx 会被放大） */
.pdm-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pdm-panel {
  width: 340px;
  max-width: 88vw;
  max-height: 86vh;
  background: #FFFFFF;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.2);
  animation: pdmPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pdmPop {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 头部 */
.pdm-head {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 20px 14px;
  gap: 6px;
  flex-shrink: 0;
}
.pdm-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}
.pdm-close-icon {
  font-size: 13px;
  color: #64748B;
}
.pdm-icon-ring {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  border: 3px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pdm-icon-bg {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pdm-icon {
  font-size: 40px;
  line-height: 1;
}
.pdm-icon.locked {
  filter: grayscale(0.8);
}
.pdm-lock-badge {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 2px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pdm-lock-badge-icon {
  font-size: 12px;
}
.pdm-rarity-tag {
  padding: 3px 14px;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
.pdm-rarity-text {
  font-size: 11px;
  color: #FFFFFF;
  font-weight: 700;
  letter-spacing: 1px;
}
.pdm-name {
  font-size: 20px;
  font-weight: 800;
  color: #1E293B;
  margin-top: 2px;
}
.pdm-species {
  font-size: 13px;
  color: #64748B;
}

/* 内容 */
.pdm-body {
  flex: 1;
  min-height: 0;
  padding: 12px 20px 4px;
  box-sizing: border-box;
}
.pdm-desc-title {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}
.pdm-desc {
  display: block;
  font-size: 13px;
  color: #64748B;
  line-height: 1.7;
  margin-top: 6px;
}
.pdm-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
  background: #F8FAFC;
  border-radius: 12px;
  padding: 10px 12px;
  width: 100%;
  box-sizing: border-box;
}
.pdm-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 64px;
}
.pdm-stat-val {
  font-size: 17px;
  font-weight: 800;
  color: #1E293B;
}
.pdm-stat-label {
  font-size: 10px;
  color: #94A3B8;
  margin-top: 2px;
}
.pdm-stat-divider {
  width: 1px;
  height: 24px;
}
.pdm-condition {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.pdm-condition.ok {
  background: #ECFDF5;
  border-color: #A7F3D0;
}
.pdm-condition-text {
  font-size: 13px;
  font-weight: 700;
  color: #EF4444;
}
.pdm-condition.ok .pdm-condition-text {
  color: #059669;
}
.pdm-condition-sub {
  font-size: 11px;
  color: #94A3B8;
}

/* 技能 */
.pdm-skills {
  margin-top: 12px;
  width: 100%;
}
.pdm-skills-title {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 7px;
}
.pdm-skill-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid;
  margin-bottom: 6px;
}
.pdm-skill-item:last-child {
  margin-bottom: 0;
}
.pdm-skill-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pdm-skill-icon-text {
  font-size: 18px;
  line-height: 1;
}
.pdm-skill-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.pdm-skill-name {
  font-size: 13px;
  font-weight: 700;
  color: #1E293B;
}
.pdm-skill-desc {
  font-size: 11px;
  color: #64748B;
  line-height: 1.4;
}

/* 操作 */
.pdm-footer {
  display: flex;
  gap: 10px;
  padding: 14px 20px 18px;
  flex-shrink: 0;
}
.pdm-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  border-radius: 14px;
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.pdm-btn:active {
  transform: scale(0.97);
}
.pdm-btn-plain {
  background: #F3F4F6;
}
.pdm-btn-plain-text {
  font-size: 15px;
  font-weight: 700;
  color: #475569;
}
.pdm-btn-primary {
  background: linear-gradient(135deg, #FF8A65, #FF6B6B);
  box-shadow: 0 4px 12px rgba(255, 138, 101, 0.3);
}
.pdm-btn-primary.disabled {
  background: #E2E8F0;
  box-shadow: none;
}
.pdm-btn-primary-text {
  font-size: 15px;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 1px;
}
.pdm-btn-primary.disabled .pdm-btn-primary-text {
  color: #94A3B8;
}
</style>
