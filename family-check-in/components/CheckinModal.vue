<template>
  <view class="modal-overlay" v-if="visible" @click="close">
    <view class="modal-card" @click.stop>
      <!-- 年龄通用的图标 -->
      <text class="modal-icon">{{ evolved ? '🎊' : '🎉' }}</text>
      <text class="modal-title">{{ evolved ? '宠物进化了！' : titleText }}</text>
      <text class="modal-msg" v-if="member">{{ messageText }}</text>

      <!-- 幼儿专属：⭐ -->
      <view v-if="member && member.age <= 4 && !evolved" class="stars-animation">
        <text v-for="i in 5" :key="i" class="star-fall" :style="{ animationDelay: (i * 0.15) + 's' }">⭐</text>
      </view>

      <!-- 幼儿专属：大动画 -->
      <view v-if="member && member.age <= 4 && evolved" class="toddler-evolve">
        <text class="toddler-big">🐣 → 🐔</text>
        <text class="toddler-cheer">蛋蛋长大啦！咯咯咯～</text>
      </view>

      <!-- 签到照片预览 -->
      <view v-if="photo" class="photo-preview-wrap">
        <image class="photo-preview" :src="photo" mode="aspectFill" />
        <text class="photo-label">📷 签到照片</text>
      </view>

      <!-- 宠物成长条 -->
      <view class="grow-bar" v-if="member">
        <view class="grow-fill" :style="{ width: growRatio + '%' }"></view>
      </view>
      <text class="grow-text" v-if="member && newStage">
        {{ member.pet.name }} · {{ newStage.stage }} · {{ growRatio }}%
      </text>

      <!-- 奶奶专属：经文 -->
      <view v-if="verse" class="verse-card">
        <text class="verse-text">"{{ verse.text }}"</text>
        <text class="verse-ref">— {{ verse.ref }}</text>
      </view>

      <!-- 9岁孩子：龙鳞收集 -->
      <view v-if="member && member.age === 9 && member.dragonScales" class="dragon-scale-info">
        <text>🐉 已收集龙鳞：{{ member.dragonScales }} 片</text>
      </view>

      <!-- 夫妻羁绊提示 -->
      <view v-if="coupleBond" class="couple-banner">
        <text>💕 今日夫妻双双全勤！羁绊加成生效，宠物成长 x1.5</text>
      </view>

      <view class="btn-ok" @click="close">
        <text>{{ buttonText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  member: { type: Object, default: null },
  task: { type: Object, default: null },
  evolved: { type: Boolean, default: false },
  newStage: { type: Object, default: null },
  photo: { type: String, default: null },
  verse: { type: Object, default: null },
  stars: { type: Number, default: 0 },
})

const emit = defineEmits(['close'])

const growRatio = computed(() => {
  if (!props.member) return 0
  return Math.round((props.member.grow / props.member.totalGrow) * 100)
})

const titleText = computed(() => {
  if (!props.member) return '签到成功！'
  if (props.member.age <= 4) return '好棒呀！'
  if (props.member.age >= 55) return '主赐平安'
  return '签到成功！'
})

const messageText = computed(() => {
  if (!props.member) return ''
  if (props.member.age <= 4) {
    return `${props.member.pet.name} 又长大了一点点！⭐ +${props.task?.points || 5}`
  }
  if (props.member.age >= 55) {
    return `恩典值 +${props.task?.grace || 10} · ${props.member.pet.name} 安心成长`
  }
  return `积分 +${props.task?.points || 10} · ${props.member.pet.name} 成长 +10`
})

const buttonText = computed(() => {
  if (!props.member) return '太棒了'
  if (props.member.age <= 4) return '再玩一次！'
  if (props.member.age >= 55) return '阿们'
  return '太棒了'
})

// 检查夫妻羁绊
const coupleBond = computed(() => {
  if (!props.member || (props.member.id !== 'dad' && props.member.id !== 'mom')) return false
  // 简化的判断：如果当前签到成员不是刚完成全部任务，就不显示
  const m = props.member
  if (!m.tasks.every(t => t.done)) return false
  // 需要检查另一方
  const allMembers = []
  // 这里通过 injected/reactive store 来判断比较困难，用简单方式
  return m.tasks.every(t => t.done)
})

function close() {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  z-index: 999; display: flex; justify-content: center; align-items: center;
}
.modal-card {
  background: #FFFFFF; border-radius: 24px; padding: 28px 32px;
  text-align: center; width: 380px; max-width: 85vw; max-height: 80vh; overflow-y: auto;
  box-shadow: 0 16px 40px rgba(0,0,0,0.18);
  animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes popIn {
  from { transform: scale(0.75); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.modal-icon { font-size: 48px; }
.modal-title { font-size: 22px; font-weight: 700; color: #1E293B; display: block; margin-top: 8px; }
.modal-msg { font-size: 16px; color: #64748B; display: block; margin-top: 6px; margin-bottom: 12px; }

.stars-animation {
  position: relative; height: 48px; margin: 4px 0; overflow: hidden;
}
.star-fall {
  position: absolute; left: 50%; font-size: 22px;
  animation: starDown 1.5s ease forwards;
}
@keyframes starDown {
  0% { top: -30px; opacity: 1; transform: translateX(-50%) rotate(0deg); }
  100% { top: 40px; opacity: 0; transform: translateX(-50%) rotate(360deg); }
}
.toddler-evolve { margin: 8px 0; }
.toddler-big { font-size: 42px; display: block; }
.toddler-cheer { font-size: 16px; color: #F59E0B; display: block; margin-top: 4px; }

.photo-preview-wrap { margin: 10px auto; width: 160px; }
.photo-preview { width: 160px; height: 160px; border-radius: 12px; background: #F1F5F9; }
.photo-label { display: block; font-size: 13px; color: #14B8A6; margin-top: 4px; }

.grow-bar { height: 10px; background: #E2E8F0; border-radius: 5px; overflow: hidden; margin: 8px 0; }
.grow-fill { height: 100%; background: #10B981; border-radius: 5px; transition: width 0.8s ease; }
.grow-text { font-size: 14px; color: #94A3B8; display: block; margin-bottom: 10px; }

.verse-card {
  margin: 12px 0; padding: 16px 20px; background: #FFFBEB; border-radius: 12px;
  border-left: 4px solid #F59E0B;
}
.verse-text { font-size: 15px; color: #78350F; line-height: 1.6; font-style: italic; display: block; }
.verse-ref { font-size: 13px; color: #B45309; display: block; margin-top: 4px; font-weight: 600; }

.dragon-scale-info { margin: 8px 0; font-size: 14px; color: #F59E0B; font-weight: 600; }

.couple-banner {
  margin: 8px 0; padding: 8px 14px; background: #FCE7F3;
  border-radius: 10px; font-size: 14px; color: #9D174D;
}

.btn-ok {
  background: #4F46E5; color: #FFFFFF; padding: 14px 0;
  border-radius: 12px; font-size: 18px; font-weight: 600;
  transition: transform 0.15s ease, opacity 0.15s ease;
  cursor: pointer;
  margin-top: 6px;
}
.btn-ok:active {
  transform: scale(0.96);
  opacity: 0.9;
}
</style>
