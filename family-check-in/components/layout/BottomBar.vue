<template>
  <view class="bottom-bar-inner">
    <!-- 左：标题 -->
    <view class="bb-left">
      <text class="bb-title">🏆 家庭排行</text>
    </view>

    <!-- 中：排行卡片横向滚动 -->
    <scroll-view
      class="bb-scroll"
      scroll-x
      :show-scrollbar="false"
    >
      <view class="bb-row">
        <!-- 参与排名的成员（爸妈+大儿子） -->
        <view
          v-for="(item, index) in weeklyRank"
          :key="item.memberId"
          class="rank-card"
          :class="'rank-' + (index + 1)"
        >
          <text class="rank-medal">{{ medals[index] }}</text>
          <text class="rank-emoji">{{ item.emoji }}</text>
          <view class="rank-info">
            <text class="rank-name">{{ item.name }}</text>
            <text class="rank-rate">{{ item.rate }}%</text>
          </view>
          <view class="rank-track">
            <view
              class="rank-fill"
              :style="{ width: item.rate + '%' }"
            ></view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 右：奶奶/小宝安静进度 -->
    <view class="bb-right">
      <!-- 奶奶 -->
      <view class="quiet-progress" v-if="grandma">
        <text class="quiet-emoji">🐢</text>
        <text class="quiet-name">奶奶</text>
        <view class="quiet-track">
          <view
            class="quiet-fill"
            :style="{ width: grandmaQuietPct + '%', background: '#A88B6A' }"
          ></view>
        </view>
      </view>
      <!-- 小宝 -->
      <view class="quiet-progress" v-if="baby">
        <text class="quiet-emoji">🐣</text>
        <text class="quiet-name">小宝</text>
        <view class="quiet-track">
          <view
            class="quiet-fill"
            :style="{ width: babyQuietPct + '%', background: '#FBBF24' }"
          ></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  weeklyRank: { type: Array, default: () => [] },
  members: { type: Array, default: () => [] },
  grandma: { type: Object, default: null },
  baby: { type: Object, default: null },
})

const medals = ['🥇', '🥈', '🥉']

const grandmaQuietPct = computed(() => {
  if (!props.grandma) return 0
  const done = props.grandma.tasks.filter(t => t.done).length
  const total = props.grandma.tasks.length || 1
  return Math.round((done / total) * 100)
})

const babyQuietPct = computed(() => {
  if (!props.baby) return 0
  const done = props.baby.tasks.filter(t => t.done).length
  const total = props.baby.tasks.length || 1
  return Math.round((done / total) * 100)
})
</script>

<style scoped>
.bottom-bar-inner {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 12px;
  gap: 12px;
}

/* 左：标题 */
.bb-left {
  flex-shrink: 0;
}
.bb-title {
  font-size: 13px;
  font-weight: 700;
  color: #1A1A1A;
  white-space: nowrap;
}

/* 中：滚动排行 */
.bb-scroll {
  flex: 1;
  overflow: hidden;
}
.bb-row {
  display: flex;
  gap: 10px;
  padding: 4px 0;
  white-space: nowrap;
}
.rank-card {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 10px;
  background: #FFF6F0;
  border: 1px solid #F0E8DE;
  min-width: 140px;
  transition: transform 0.15s ease;
}
.rank-card:active {
  transform: scale(0.97);
}
.rank-1 {
  background: linear-gradient(90deg, #FEF3C7, #FDE68A);
  border-color: #FCD34D;
}
.rank-2 {
  background: #F1F5F9;
  border-color: #E2E8F0;
}
.rank-3 {
  background: #FEF2F2;
  border-color: #FECACA;
}
.rank-medal {
  font-size: 18px;
  flex-shrink: 0;
}
.rank-emoji {
  font-size: 16px;
  flex-shrink: 0;
}
.rank-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.rank-name {
  font-size: 12px;
  font-weight: 700;
  color: #1A1A1A;
}
.rank-rate {
  font-size: 10px;
  color: #F59E0B;
  font-weight: 600;
}
.rank-track {
  width: 50px;
  height: 5px;
  background: rgba(255,255,255,0.6);
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}
.rank-fill {
  height: 100%;
  background: #F59E0B;
  border-radius: 3px;
  transition: width 0.4s ease;
}

/* 右：安静进度 */
.bb-right {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.quiet-progress {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #FFF6F0;
  border-radius: 8px;
}
.quiet-emoji {
  font-size: 14px;
}
.quiet-name {
  font-size: 11px;
  font-weight: 600;
  color: #8A8178;
}
.quiet-track {
  width: 50px;
  height: 5px;
  background: #F3EDE5;
  border-radius: 3px;
  overflow: hidden;
}
.quiet-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}
</style>