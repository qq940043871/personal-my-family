<template>
  <!-- 全屏半透明遮罩 -->
  <view class="battle-overlay" v-if="visible" @click="onClose">
    <!-- 居中弹窗，阻止点击穿透 -->
    <view class="battle-modal" @click.stop>
      <text class="battle-modal-title">⚔️ 宠物比武</text>

      <!-- 对战布局 -->
      <view class="battle-arena">
        <!-- 左方：大儿子宠物 -->
        <view class="battle-fighter">
          <view class="fighter-avatar" :style="{ background: '#FEF3C7' }">
            <text class="fighter-emoji">🐉</text>
          </view>
          <text class="fighter-name">小龙</text>
          <text class="fighter-power">{{ leftPower }}</text>
          <view class="fighter-bar">
            <view class="fighter-fill" :style="{ width: leftPowerPct + '%', background: '#F59E0B' }"></view>
          </view>
        </view>

        <!-- 中间战斗动画区 -->
        <view class="battle-center">
          <text class="battle-vs">VS</text>
          <view class="battle-animation" v-if="battleState === 'fighting'">
            <text class="battle-spark">💥</text>
            <text class="battle-spark s2">⚡</text>
            <text class="battle-spark s3">✨</text>
          </view>
          <view class="battle-result" v-if="battleState === 'done' && result">
            <text class="result-icon">🏆</text>
            <text class="result-text">{{ isLeftWinner ? (leftMember?.pet?.name || '我方') + ' 胜利！' : '对手 胜利！' }}</text>
          </view>
        </view>

        <!-- 右方：对手 -->
        <view class="battle-fighter">
          <view
            class="fighter-avatar"
            :style="{ background: opponentThemeColor + '18' }"
          >
            <text class="fighter-emoji">{{ opponentEmoji }}</text>
          </view>
          <text class="fighter-name">{{ opponentName }}</text>
          <text class="fighter-power">{{ rightPower }}</text>
          <view class="fighter-bar">
            <view
              class="fighter-fill"
              :style="{ width: rightPowerPct + '%', background: opponentThemeColor }"
            ></view>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="battle-actions">
        <view
          class="battle-btn battle-btn-start"
          v-if="battleState === 'idle'"
          @click="startBattle"
        >
          <text>开始战斗！</text>
        </view>
        <view
          class="battle-btn battle-btn-close"
          v-else
          @click="onClose"
        >
          <text>{{ battleState === 'done' ? '领取奖励' : '关闭' }}</text>
        </view>
      </view>

      <!-- 奖励展示 -->
      <view class="battle-rewards" v-if="battleState === 'done' && result">
        <view class="reward-item">
          <text class="reward-icon">🐉</text>
          <text class="reward-text">龙鳞 +1</text>
        </view>
        <view class="reward-item">
          <text class="reward-icon">📈</text>
          <text class="reward-text">成长值 +30</text>
        </view>
        <view class="reward-item">
          <text class="reward-icon">⭐</text>
          <text class="reward-text">积分 +20</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { doBattle, members } from '@/store/index.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  member1: { type: Object, default: null },
  member2: { type: Object, default: null },
})

const emit = defineEmits(['close'])

// 成员 id → 宠物 emoji（dad 的 pet.type 是 '🐶🐱' 双 emoji，不能直接用）
const PET_EMOJI = { dad: '🐶', mom: '🐱', dabao: '🐉', erbao: '🐣', grandma: '🐢' }

const battleState = ref('idle') // idle | fighting | done
const result = ref(null)

// 左方（我方）默认大儿子，用于胜负文案比对
const leftMember = computed(() => props.member1 || members.find(m => m.id === 'dabao') || null)

// 默认对手：爸爸或妈妈
const opponent = computed(() => {
  if (props.member2) return props.member2
  return members.find(m => m.id === 'dad' || m.id === 'mom') || members[0]
})
const opponentName = computed(() => opponent.value?.name || '对手')
const opponentEmoji = computed(() => PET_EMOJI[opponent.value?.id] || '🐾')
const opponentThemeColor = computed(() => opponent.value?.themeColor || '#2563EB')

const leftPower = computed(() => {
  if (!leftMember.value) return 0
  return Math.round((leftMember.value.grow / (leftMember.value.totalGrow || 100)) * 50 + 20)
})
const rightPower = computed(() => {
  if (!opponent.value) return 0
  return Math.round((opponent.value.grow / (opponent.value.totalGrow || 100)) * 50 + 20)
})
const leftPowerPct = computed(() => Math.min(100, leftPower.value))
const rightPowerPct = computed(() => Math.min(100, rightPower.value))

// 胜负文案：按 doBattle 返回的成员对象与左方比对
const isLeftWinner = computed(() =>
  !!result.value && !!leftMember.value && result.value.winner?.id === leftMember.value.id
)

function startBattle() {
  battleState.value = 'fighting'
  // 模拟战斗动画
  setTimeout(() => {
    const kid = leftMember.value
    const opp = opponent.value
    if (kid && opp) {
      result.value = doBattle(kid, opp)
      if (!result.value) {
        // 幼儿对手自动平局
        result.value = {
          winner: kid,
          loser: opp,
          power1: 50,
          power2: 50,
          basePower1: 30,
          basePower2: 30,
        }
      }
    }
    battleState.value = 'done'
  }, 1500)
}

watch(() => props.visible, (v) => {
  if (v) {
    battleState.value = 'idle'
    result.value = null
  }
})

function onClose() {
  emit('close')
}
</script>

<style scoped>
.battle-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.battle-modal {
  background: #FFFFFF;
  border-radius: 28px;
  padding: 36px 40px;
  width: 520px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2);
  animation: modalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes modalIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.battle-modal-title {
  font-size: 22px;
  font-weight: 800;
  color: #1A1A1A;
}

/* 对战区 */
.battle-arena {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}
.battle-fighter {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #F8FAFC;
  border-radius: 16px;
}
.fighter-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #E2E8F0;
}
.fighter-emoji {
  font-size: 40px;
}
.fighter-name {
  font-size: 16px;
  font-weight: 700;
  color: #1A1A1A;
}
.fighter-power {
  font-size: 14px;
  font-weight: 800;
  color: #F59E0B;
}
.fighter-bar {
  width: 100%;
  height: 8px;
  background: #E2E8F0;
  border-radius: 4px;
  overflow: hidden;
}
.fighter-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

/* 中间VS */
.battle-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 60px;
}
.battle-vs {
  font-size: 36px;
  font-weight: 900;
  color: #E2E8F0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.battle-animation {
  position: relative;
  width: 60px;
  height: 60px;
}
.battle-spark {
  position: absolute;
  font-size: 28px;
  animation: sparkAnim 0.6s ease infinite;
}
.battle-spark.s2 { animation-delay: 0.2s; left: 20px; }
.battle-spark.s3 { animation-delay: 0.4s; top: 20px; }
@keyframes sparkAnim {
  0%, 100% { transform: scale(0.5); opacity: 0.3; }
  50% { transform: scale(1.2); opacity: 1; }
}

.battle-result {
  text-align: center;
}
.result-icon {
  font-size: 36px;
}
.result-text {
  font-size: 14px;
  font-weight: 800;
  color: #F59E0B;
  display: block;
  margin-top: 4px;
}

/* 按钮 */
.battle-actions {
  width: 100%;
}
.battle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
}
.battle-btn:active {
  transform: scale(0.96);
}
.battle-btn-start {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #FFFFFF;
  box-shadow: 0 6px 16px rgba(79,70,229,0.3);
}
.battle-btn-close {
  background: #F59E0B;
  color: #FFFFFF;
}

/* 奖励 */
.battle-rewards {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  background: #FFFBEB;
  border-radius: 14px;
  border: 1px solid #FDE68A;
  width: 100%;
  justify-content: center;
}
.reward-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.reward-icon {
  font-size: 24px;
}
.reward-text {
  font-size: 12px;
  font-weight: 700;
  color: #B45309;
}
</style>