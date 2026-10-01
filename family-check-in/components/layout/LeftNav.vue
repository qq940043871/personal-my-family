<template>
  <view class="left-nav-inner" :class="{ collapsed }">
    <!-- ===== 顶部：LOGO ===== -->
    <template v-if="!collapsed">
      <view class="nav-header">
        <view class="logo-area">
          <text class="logo-icon">👨‍👩‍👧‍👦</text>
          <text class="logo-text">全家签到</text>
        </view>
        <view class="family-illust">
          <text class="family-illust-emoji">🏡✨</text>
        </view>
      </view>
    </template>
    <template v-else>
      <view class="nav-header-collapsed">
        <text class="logo-icon-mini">📋</text>
      </view>
    </template>

    <!-- ===== 成员列表（全部显示，无滚动） ===== -->
    <view class="member-list">
      <view
        v-for="m in members"
        :key="m.id"
        class="member-item"
        :class="{ active: activeMemberId === m.id, collapsed }"
        :style="activeMemberId === m.id ? {
          background: m.themeColor + '18',
          borderColor: m.themeColor,
        } : {}"
        @click="$emit('select-member', m.id)"
      >
        <view
          class="member-avatar"
          :style="{
            borderColor: activeMemberId === m.id ? m.themeColor : '#E2D6CC',
            background: avatarBg(m),
          }"
        >
          <image
            v-if="m.avatarUrl"
            :src="m.avatarUrl"
            class="avatar-img"
            mode="aspectFill"
          />
          <text v-else class="avatar-emoji">{{ m.emoji }}</text>
        </view>

        <view class="member-info" v-if="!collapsed">
          <view class="member-name-row">
            <text class="member-name" :style="{ color: m.themeColor }">{{ m.name }}</text>
            <text v-if="m.id === currentMemberId" class="member-me">我</text>
            <text class="member-age">{{ m.age }}岁</text>
          </view>
          <view class="member-pet-row">
            <text class="member-pet">{{ petEmoji(m) }} {{ m.pet.name }}</text>
          </view>
          <view class="member-progress">
            <view
              class="member-progress-fill"
              :style="{ width: growPercent(m) + '%', background: m.themeColor }"
            ></view>
          </view>
        </view>
      </view>
    </view>

    <!-- ===== 底部导航按钮（横向小图标） ===== -->
    <view class="nav-footer">
      <view
        class="nav-btn"
        :class="{ active: activeView === 'pets' }"
        @click="$emit('select-view', 'pets')"
        title="宠物图鉴"
      >
        <text class="nav-btn-icon">📖</text>
      </view>
      <view
        class="nav-btn"
        :class="{ active: activeView === 'couple-pk' }"
        @click="$emit('select-view', 'couple-pk')"
        title="夫妻PK"
      >
        <text class="nav-btn-icon">⚔️</text>
      </view>
      <view
        class="nav-btn"
        :class="{ active: activeView === 'family' }"
        @click="$emit('select-view', 'family')"
        title="家庭与结算"
      >
        <text class="nav-btn-icon">🏡</text>
      </view>
      <view
        class="nav-btn"
        @click="$emit('open-settings')"
        title="成员管理"
      >
        <text class="nav-btn-icon">⚙️</text>
      </view>
      <view
        class="nav-btn collapse-btn"
        @click="$emit('toggle')"
        :title="collapsed ? '展开侧栏' : '收起侧栏'"
      >
        <text class="nav-btn-icon">{{ collapsed ? '▶' : '◀' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { getActivePet } from '@/store/index.js'

const props = defineProps({
  collapsed: { type: Boolean, default: false },
  activeMemberId: { type: String, default: null },
  activeView: { type: String, default: 'home' },
  members: { type: Array, default: () => [] },
  // 单人视角：当前登录身份（列表中打「我」标记）
  currentMemberId: { type: String, default: '' },
})

defineEmits(['select-member', 'select-view', 'toggle', 'open-settings'])

const AVATAR_BGS = {
  dad: '#DBEAFE', mom: '#FCE7F3', dabao: '#FEF3C7',
  erbao: '#D1FAE5', grandma: '#FED7AA',
}

function avatarBg(m) {
  return AVATAR_BGS[m.id] || '#F3F4F6'
}

// 图标跟随成员的出战宠物
function petEmoji(m) {
  const active = getActivePet(m.id)
  return active?.icon || m.pet?.type || '🐾'
}

function growPercent(m) {
  return Math.round((m.grow / m.totalGrow) * 100)
}
</script>

<style scoped>
.left-nav-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 0;
  box-sizing: border-box;
  user-select: none;
}

/* ===== 顶部LOGO（紧凑） ===== */
.nav-header {
  padding: 0 16px 10px;
  border-bottom: 1px solid #F0E8DE;
  margin-bottom: 8px;
  flex-shrink: 0;
}
.logo-area {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}
.logo-icon {
  font-size: 18px;
}
.logo-text {
  font-size: 15px;
  font-weight: 800;
  color: #1A1A1A;
  letter-spacing: 0.5px;
}
.family-illust {
  text-align: center;
  padding: 2px 0;
}
.family-illust-emoji {
  font-size: 20px;
}
.nav-header-collapsed {
  text-align: center;
  padding: 6px 0 10px;
  border-bottom: 1px solid #F0E8DE;
  margin-bottom: 8px;
  flex-shrink: 0;
}
.logo-icon-mini {
  font-size: 20px;
}

/* ===== 成员列表（顶部对齐） ===== */
.member-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 2px;
  padding: 6px 10px 0;
  min-height: 0;
  overflow-y: auto;
}
.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  min-height: 48px;
}
.member-item:active {
  transform: scale(0.97);
}
.member-item.collapsed {
  justify-content: center;
  padding: 6px 2px;
  min-height: 40px;
}

/* 头像 */
.member-avatar {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  border: 2.5px solid #E2D6CC;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F3F4F6;
  flex-shrink: 0;
}
.member-item.collapsed .member-avatar {
  width: 32px;
  height: 32px;
  min-width: 32px;
}
.avatar-img {
  width: 100%;
  height: 100%;
}
.avatar-emoji {
  font-size: 20px;
}

/* 成员信息 */
.member-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.member-name-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.member-name {
  font-size: 13px;
  font-weight: 700;
}
.member-age {
  font-size: 10px;
  color: #8A8178;
}
.member-me {
  font-size: 9px;
  font-weight: 800;
  color: #FFFFFF;
  background: #FF8A65;
  border-radius: 6px;
  padding: 1px 5px;
  line-height: 1.3;
}
.member-pet-row {
  display: flex;
  align-items: center;
}
.member-pet {
  font-size: 11px;
  color: #A88B6A;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.member-progress {
  height: 3px;
  background: #F3EDE5;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 1px;
}
.member-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}

/* ===== 底部导航按钮（横向排列） ===== */
.nav-footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  padding: 8px 4px 4px;
  border-top: 1px solid #F0E8DE;
  margin-top: 6px;
  gap: 2px;
}
.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  /* 40×44：5 个按钮在 220px 左栏横排不溢出（5×40=200<211 内容宽），
     高度达 44 触控最小标准；收起态 72px 竖排时 40px 也居中得体 */
  width: 40px;
  height: 44px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #8A8178;
  flex-shrink: 0;
}
.nav-btn:active {
  background: #F3EDE5;
  transform: scale(0.92);
}
.nav-btn.active {
  background: #EEF2FF;
  color: #4F46E5;
}
.nav-btn-icon {
  font-size: 18px;
  line-height: 1;
}
/* 收起态：窄栏放不下横排按钮，改为竖排 */
.left-nav-inner.collapsed .nav-footer {
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 6px 0 4px;
}
.collapse-btn {
  opacity: 0.5;
}
.collapse-btn:active {
  opacity: 1;
}
</style>