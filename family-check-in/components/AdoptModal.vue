<template>
  <view class="modal-overlay" v-if="visible" @click="close">
    <view class="modal-card" @click.stop>
      <!-- 头部：稀有度渐变 + 宠物展示 -->
      <view class="modal-head" :style="{ background: headBg }">
        <text class="modal-icon">🎊</text>
        <text class="modal-title">领养成功！</text>

        <view class="pet-icon-ring" :style="{ borderColor: rarityColor + '55' }">
          <view class="pet-icon-bg" :style="{ background: rarityColor + '1A' }">
            <text class="pet-big-icon">{{ pet ? pet.icon : '🐾' }}</text>
          </view>
        </view>

        <!-- 稀有度标签 -->
        <view class="rarity-tag" :style="{ background: rarityColor }">
          <text class="rarity-tag-text">{{ rarityLabel }}</text>
        </view>

        <text class="pet-name">{{ pet ? pet.name : '' }}</text>
        <text class="pet-species">{{ pet ? pet.species : '' }}</text>
      </view>

      <!-- 内容区 -->
      <view class="modal-body" v-if="pet">
        <text class="pet-desc">{{ pet.desc }}</text>

        <!-- 基础属性 -->
        <view class="pet-stats">
          <view class="stat-item">
            <text class="stat-val">{{ pet.basePower }}</text>
            <text class="stat-label">基础战力</text>
          </view>
          <view class="stat-divider" :style="{ background: rarityColor + '33' }"></view>
          <view class="stat-item">
            <text class="stat-val">+{{ rarityPowerBonus }}</text>
            <text class="stat-label">稀有加成</text>
          </view>
          <view class="stat-divider" :style="{ background: rarityColor + '33' }"></view>
          <view class="stat-item">
            <text class="stat-val accent" :style="{ color: rarityColor }">{{ pet.basePower + rarityPowerBonus }}</text>
            <text class="stat-label">初始总战力</text>
          </view>
        </view>

        <!-- 成员提示 -->
        <text class="member-tip" v-if="member">
          🧡 {{ member.emoji }} {{ member.name }}获得了新伙伴！
        </text>

        <!-- 关闭按钮 -->
        <view class="btn-ok" @click="close">
          <text class="btn-ok-text">太好了！</text>
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
  member: { type: Object, default: null },
})

const emit = defineEmits(['close'])

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

// 头部按稀有度着色的渐变背景
const headBg = computed(() => {
  return `linear-gradient(180deg, ${rarityColor.value}26, rgba(255,255,255,0) 85%)`
})

function close() {
  emit('close')
}
</script>

<style scoped>
/* 全部使用 px 单位：弹窗同时用于移动端页面与平板三栏布局（rpx 会被放大） */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-card {
  background: #FFFFFF;
  border-radius: 20px;
  width: 340px;
  max-width: 88vw;
  max-height: 85vh;
  overflow-y: auto;
  text-align: center;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.2);
  animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes popIn {
  from { transform: scale(0.75); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 头部 */
.modal-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 20px 16px;
  gap: 7px;
}
.modal-icon {
  font-size: 26px;
  animation: bounce 1.2s ease-in-out infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.modal-title {
  font-size: 19px;
  font-weight: 800;
  color: #1E293B;
}
.pet-icon-ring {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  border: 3px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}
.pet-icon-bg {
  width: 74px;
  height: 74px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pet-big-icon {
  font-size: 42px;
  line-height: 1;
}
.rarity-tag {
  padding: 3px 14px;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
.rarity-tag-text {
  font-size: 11px;
  color: #FFFFFF;
  font-weight: 700;
  letter-spacing: 1px;
}
.pet-name {
  font-size: 20px;
  font-weight: 800;
  color: #1E293B;
  margin-top: 2px;
}
.pet-species {
  font-size: 13px;
  color: #64748B;
}

/* 内容区 */
.modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px 20px;
}
.pet-desc {
  font-size: 12px;
  color: #94A3B8;
  line-height: 1.5;
}
.pet-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  background: #F8FAFC;
  border-radius: 12px;
  padding: 10px 18px;
  width: 100%;
  justify-content: center;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 64px;
}
.stat-val {
  font-size: 17px;
  font-weight: 800;
  color: #1E293B;
}
.stat-label {
  font-size: 10px;
  color: #94A3B8;
  margin-top: 2px;
}
.stat-divider {
  width: 1px;
  height: 24px;
}
.member-tip {
  display: block;
  font-size: 13px;
  color: #8A8178;
  font-weight: 600;
  margin-top: 14px;
}
.btn-ok {
  width: 100%;
  background: linear-gradient(135deg, #FF8A65, #FF6B6B);
  padding: 13px 0;
  border-radius: 14px;
  margin-top: 14px;
  box-shadow: 0 4px 12px rgba(255, 138, 101, 0.3);
  transition: transform 0.15s ease, opacity 0.15s ease;
  cursor: pointer;
}
.btn-ok:active {
  opacity: 0.85;
  transform: scale(0.97);
}
.btn-ok-text {
  font-size: 16px;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 2px;
}
</style>
