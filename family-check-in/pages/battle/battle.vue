<template>
  <view class="page">
    <!-- 选择选手 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">⚔️ 宠物比武</text>
        <text class="card-subtitle">选择两位选手开始对战</text>
      </view>
    </view>

    <!-- 第一位选手选择 -->
    <view class="card player-card" :class="{ selected: player1Id }">
      <view class="card-header">
        <text class="card-title">🔴 红方</text>
        <text v-if="player1Id" class="card-subtitle">已选择</text>
      </view>
      <scroll-view scroll-x class="select-scroll">
        <view class="select-row">
          <view
            v-for="m in availableMembers(player1Id)"
            :key="m.id"
            class="select-item"
            :class="{ active: player1Id === m.id }"
            @click="player1Id = m.id; player2Id = null; battlePhase = 'idle'"
          >
            <text class="select-icon">{{ petDisplayIcon(m) }}</text>
            <text class="select-name">{{ petDisplayName(m) }}</text>
            <text class="select-owner">{{ m.emoji }} {{ m.name }}</text>
            <text class="select-power">战力 {{ getTotalPower(m) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="vs-divider">
      <text class="vs-big">VS</text>
    </view>

    <!-- 第二位选手选择 -->
    <view class="card player-card blue" :class="{ selected: player2Id }">
      <view class="card-header">
        <text class="card-title">🔵 蓝方</text>
        <text v-if="player2Id" class="card-subtitle">已选择</text>
      </view>
      <scroll-view scroll-x class="select-scroll">
        <view class="select-row">
          <view
            v-for="m in availableMembers(player2Id)"
            :key="m.id"
            class="select-item"
            :class="{ active: player2Id === m.id }"
            @click="player2Id = m.id; battlePhase = 'idle'"
          >
            <text class="select-icon">{{ petDisplayIcon(m) }}</text>
            <text class="select-name">{{ petDisplayName(m) }}</text>
            <text class="select-owner">{{ m.emoji }} {{ m.name }}</text>
            <text class="select-power">战力 {{ getTotalPower(m) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 对战区域 -->
    <BattleArena
      v-if="player1Id && player2Id"
      :member1="player1"
      :member2="player2"
      :phase="battlePhase"
      @update:phase="battlePhase = $event"
      @close="resetBattle"
      @rematch="rematch"
    />

    <!-- 开始按钮 -->
    <view v-if="player1Id && player2Id && battlePhase === 'idle'" class="start-btn" @click="battlePhase = 'ready'">
      <text>准备战斗!</text>
    </view>

    <!-- 战力对比 -->
    <view v-if="player1 && player2 && battlePhase === 'idle'" class="card">
      <view class="card-header">
        <text class="card-title">战力对比</text>
      </view>
      <view class="compare-row">
        <view class="compare-side">
          <text class="compare-name">{{ petDisplayName(player1) }}</text>
          <view v-for="attr in petAttrs" :key="attr.key" class="attr-compare">
            <text class="attr-label">{{ attr.icon }} {{ attr.label }}</text>
            <view class="mini-bar">
              <view class="mini-fill" :style="{ width: getAttrVal(player1, attr.key) + '%' }"></view>
            </view>
            <text class="attr-val">{{ getAttrVal(player1, attr.key) }}</text>
          </view>
        </view>
        <view class="compare-divider"></view>
        <view class="compare-side">
          <text class="compare-name">{{ petDisplayName(player2) }}</text>
          <view v-for="attr in petAttrs" :key="attr.key" class="attr-compare">
            <text class="attr-label">{{ attr.icon }} {{ attr.label }}</text>
            <view class="mini-bar">
              <view class="mini-fill right" :style="{ width: getAttrVal(player2, attr.key) + '%' }"></view>
            </view>
            <text class="attr-val">{{ getAttrVal(player2, attr.key) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { members, stageFor, getPetAttrs, getPetTotalPower, PET_ATTRS, getActivePet } from '@/store/index.js'
import BattleArena from '@/components/BattleArena.vue'

const player1Id = ref(null)
const player2Id = ref(null)
const battlePhase = ref('idle')
const petAttrs = PET_ATTRS

const player1 = computed(() => members.find(m => m.id === player1Id.value) || null)
const player2 = computed(() => members.find(m => m.id === player2Id.value) || null)

function availableMembers(excludeId) {
  return members.filter(m => m.id !== excludeId && m.age >= 5)
}

function getTotalPower(member) {
  return getPetTotalPower(member)
}

function petDisplayIcon(member) {
  const pet = getActivePet(member.id)
  return pet ? pet.icon : stageFor(member).icon
}
function petDisplayName(member) {
  const pet = getActivePet(member.id)
  return pet ? pet.name : member.pet.name
}

function getAttrVal(member, key) {
  const attrs = getPetAttrs(member)
  return attrs[key] || 0
}

function resetBattle() {
  battlePhase.value = 'idle'
}

function rematch() {
  player1Id.value = null
  player2Id.value = null
  battlePhase.value = 'idle'
}
</script>

<style scoped>
.page {
  padding: 24rpx;
  padding-bottom: 32rpx;
}
.card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1E293B;
}
.card-subtitle {
  font-size: 24rpx;
  color: #64748B;
}
.player-card.selected {
  border: 3rpx solid #4F46E5;
}
.player-card.blue.selected {
  border-color: #2563EB;
}
.select-scroll { white-space: nowrap; }
.select-row { display: flex; gap: 12rpx; }
.select-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #F8FAFC;
  border-radius: 20rpx;
  border: 3rpx solid transparent;
  min-width: 140rpx;
  transition: all 0.2s;
}
.select-item.active {
  border-color: #4F46E5;
  background: #EEF2FF;
}
.select-icon { font-size: 48rpx; }
.select-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #1E293B;
  margin-top: 6rpx;
}
.select-owner {
  font-size: 22rpx;
  color: #94A3B8;
}
.select-power {
  font-size: 20rpx;
  color: #F59E0B;
  font-weight: 600;
  margin-top: 4rpx;
}
.vs-divider {
  text-align: center;
  margin: 8rpx 0 16rpx;
}
.vs-big {
  font-size: 48rpx;
  font-weight: 900;
  color: #E2E8F0;
}
.start-btn {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #FFFFFF;
  text-align: center;
  padding: 28rpx 0;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 24rpx;
}
.compare-row {
  display: flex;
  gap: 16rpx;
}
.compare-side {
  flex: 1;
}
.compare-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #1E293B;
  text-align: center;
  display: block;
  margin-bottom: 12rpx;
}
.compare-divider {
  width: 2rpx;
  background: #E2E8F0;
  align-self: stretch;
}
.attr-compare {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 10rpx;
}
.attr-label {
  font-size: 22rpx;
  color: #64748B;
  width: 90rpx;
}
.mini-bar {
  flex: 1;
  height: 10rpx;
  background: #E2E8F0;
  border-radius: 5rpx;
  overflow: hidden;
}
.mini-fill {
  height: 100%;
  background: #4F46E5;
  border-radius: 5rpx;
}
.mini-fill.right {
  background: #2563EB;
}
.attr-val {
  font-size: 22rpx;
  font-weight: 600;
  color: #1E293B;
  width: 50rpx;
  text-align: right;
}

/* 交互与动画 */
.select-item {
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.2s ease, background 0.2s ease;
  cursor: pointer;
}
.select-item:active {
  transform: scale(0.94);
}
.start-btn {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: pulse 2.5s ease-in-out infinite;
  cursor: pointer;
}
.start-btn:active {
  transform: scale(0.96);
}
.vs-big {
  animation: breathe 3s ease-in-out infinite;
}
.mini-fill {
  transition: width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@media screen and (min-width: 600px) {
  .select-row {
    flex-wrap: wrap;
  }
  .select-item {
    min-width: 160rpx;
    padding: 20rpx 28rpx;
  }
}
</style>
