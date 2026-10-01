<template>
  <view class="arena" v-if="phase !== 'idle'">
    <!-- 对战画面 -->
    <view class="battle-scene">
      <!-- 左侧宠物 -->
      <view class="fighter left" :class="{ attack: phase === 'attack1', hit: phase === 'hit2' }">
        <text class="fighter-icon">{{ member1 ? stageInfo(member1).icon : '🥚' }}</text>
        <text class="fighter-name">{{ member1?.pet?.name || '' }}</text>
        <text class="fighter-owner">{{ member1?.emoji || '' }} {{ member1?.name || '' }}</text>
        <view class="hp-bar-wrap">
          <view class="hp-bar" :style="{ width: hp1 + '%' }"></view>
        </view>
        <text class="hp-text">{{ Math.max(0, Math.round(hp1)) }}%</text>
      </view>

      <!-- VS -->
      <view class="vs-zone">
        <text class="vs-text">VS</text>
        <text class="battle-round-text" v-if="phase === 'ready'">准备</text>
        <text class="battle-round-text" v-else-if="phase === 'fighting'">战斗中</text>
        <text class="battle-round-text finish-text" v-else-if="phase === 'finish'">决出胜负!</text>
      </view>

      <!-- 右侧宠物 -->
      <view class="fighter right" :class="{ attack: phase === 'attack2', hit: phase === 'hit1' }">
        <text class="fighter-icon">{{ member2 ? stageInfo(member2).icon : '🥚' }}</text>
        <text class="fighter-name">{{ member2?.pet?.name || '' }}</text>
        <text class="fighter-owner">{{ member2?.emoji || '' }} {{ member2?.name || '' }}</text>
        <view class="hp-bar-wrap">
          <view class="hp-bar" :style="{ width: hp2 + '%' }"></view>
        </view>
        <text class="hp-text">{{ Math.max(0, Math.round(hp2)) }}%</text>
      </view>
    </view>

    <!-- 日志 -->
    <view class="battle-log">
      <text v-for="(line, i) in logLines" :key="i" class="log-line">{{ line }}</text>
    </view>

    <!-- 按钮 -->
    <view class="battle-actions">
      <view v-if="phase === 'ready'" class="btn-fight" @click="startFight">
        <text>⚔️ 开始比武</text>
      </view>
      <view v-else-if="phase === 'finish'" class="btn-row">
        <view class="btn-again" @click="$emit('rematch')">
          <text>🔄 再来一局</text>
        </view>
        <view class="btn-leave" @click="$emit('close')">
          <text>返回</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { doBattle, stageFor, getPetAttrs } from '@/store/index.js'

const props = defineProps({
  member1: { type: Object, default: null },
  member2: { type: Object, default: null },
  phase: { type: String, default: 'idle' }
})

const emit = defineEmits(['update:phase', 'close', 'rematch'])

const hp1 = ref(100)
const hp2 = ref(100)
const logLines = ref([])

function stageInfo(member) {
  if (!member) return { icon: '🥚', stage: '?' }
  return stageFor(member)
}

function addLog(text) {
  logLines.value.push(text)
  if (logLines.value.length > 6) logLines.value.shift()
}

function startFight() {
  if (!props.member1 || !props.member2) return

  const result = doBattle(props.member1, props.member2)
  const attrs1 = getPetAttrs(props.member1)
  const attrs2 = getPetAttrs(props.member2)
  const total1 = attrs1.strength + attrs1.wisdom + attrs1.vitality + attrs1.charm
  const total2 = attrs2.strength + attrs2.wisdom + attrs2.vitality + attrs2.charm

  logLines.value = []
  hp1.value = 100
  hp2.value = 100
  addLog(`⚡ ${props.member1.pet.name} 战力 ${total1} vs ${props.member2.pet.name} 战力 ${total2}`)

  emit('update:phase', 'fighting')

  // 多回合战斗动画
  const rounds = [
    { delay: 600, atk: 1, dmg: 15 + Math.floor(Math.random() * 15) },
    { delay: 1200, atk: 2, dmg: 15 + Math.floor(Math.random() * 15) },
    { delay: 1800, atk: 1, dmg: 12 + Math.floor(Math.random() * 18) },
    { delay: 2400, atk: 2, dmg: 12 + Math.floor(Math.random() * 18) },
    { delay: 3000, atk: 1, dmg: 20 + Math.floor(Math.random() * 10) },
  ]

  rounds.forEach(r => {
    setTimeout(() => {
      emit('update:phase', r.atk === 1 ? 'attack1' : 'attack2')
      const attacker = r.atk === 1 ? props.member1 : props.member2
      const defender = r.atk === 1 ? props.member2 : props.member1
      addLog(`💥 ${attacker.pet.name} 攻击！造成 ${r.dmg} 点伤害`)

      setTimeout(() => {
        emit('update:phase', r.atk === 1 ? 'hit2' : 'hit1')
        if (r.atk === 1) {
          hp2.value = Math.max(0, hp2.value - r.dmg)
        } else {
          hp1.value = Math.max(0, hp1.value - r.dmg)
        }
      }, 200)

      setTimeout(() => {
        emit('update:phase', 'fighting')
      }, 400)
    }, r.delay)
  })

  // 最终结果
  setTimeout(() => {
    const finalWinner = result.winner.id === props.member1.id ? 1 : 2
    if (finalWinner === 1) {
      hp2.value = 0
    } else {
      hp1.value = 0
    }
    addLog(`🏆 ${result.winner.pet.name} 获胜！${result.winner.emoji} ${result.winner.name} 的宠物更强！`)
    addLog(`🎉 胜者获得 30 积分奖励`)
    result.winner.points += 30
    emit('update:phase', 'finish')
  }, 3600)
}

defineExpose({ startFight })
</script>

<style scoped>
.arena {
  background: linear-gradient(180deg, #1E1B4B, #312E81);
  border-radius: 32rpx;
  padding: 32rpx;
}
.battle-scene {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}
.fighter {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 200rpx;
  transition: transform 0.2s;
}
.fighter.attack { transform: translateX(30rpx); }
.fighter.hit { transform: translateX(-15rpx); }
.fighter.left.attack { transform: translateX(30rpx); }
.fighter.left.hit { transform: translateX(-15rpx); }
.fighter.right { align-items: center; flex-direction: column; }
.fighter.right.attack { transform: translateX(-30rpx); }
.fighter.right.hit { transform: translateX(15rpx); }
.fighter-icon {
  font-size: 80rpx;
  line-height: 1.2;
}
.fighter-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #FFFFFF;
  margin-top: 4rpx;
}
.fighter-owner {
  font-size: 22rpx;
  color: #A5B4FC;
}
.hp-bar-wrap {
  width: 160rpx;
  height: 16rpx;
  background: rgba(255,255,255,0.2);
  border-radius: 8rpx;
  overflow: hidden;
  margin-top: 8rpx;
}
.hp-bar {
  height: 100%;
  background: linear-gradient(90deg, #EF4444, #10B981);
  border-radius: 8rpx;
  transition: width 0.3s ease;
}
.hp-text {
  font-size: 20rpx;
  color: #C7D2FE;
  margin-top: 2rpx;
}
.vs-zone {
  text-align: center;
  width: 120rpx;
}
.vs-text {
  font-size: 48rpx;
  font-weight: 900;
  color: #F59E0B;
  display: block;
}
.battle-round-text {
  font-size: 22rpx;
  color: #A5B4FC;
  margin-top: 4rpx;
}
.finish-text { color: #FBBF24; font-weight: 600; }
.battle-log {
  background: rgba(0,0,0,0.3);
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 20rpx;
  min-height: 160rpx;
}
.log-line {
  display: block;
  font-size: 24rpx;
  color: #C7D2FE;
  line-height: 1.8;
}
.battle-actions { text-align: center; }
.btn-fight {
  background: linear-gradient(135deg, #F59E0B, #EF4444);
  color: #FFFFFF;
  padding: 24rpx 0;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: 700;
  transition: transform 0.15s ease, opacity 0.15s ease;
  cursor: pointer;
}
.btn-fight:active {
  transform: scale(0.96);
  opacity: 0.9;
}
.btn-row {
  display: flex;
  gap: 16rpx;
}
.btn-again, .btn-leave {
  flex: 1;
  padding: 24rpx 0;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
  transition: transform 0.15s ease, opacity 0.15s ease;
  cursor: pointer;
}
.btn-again:active, .btn-leave:active {
  transform: scale(0.96);
  opacity: 0.9;
}
.btn-again {
  background: #F59E0B;
  color: #FFFFFF;
}
.btn-leave {
  background: rgba(255,255,255,0.15);
  color: #FFFFFF;
}
</style>
