<template>
  <view class="pad-land" :class="{ 'left-collapsed': leftCollapsed }" :style="landStyle">
    <!-- ===== 三栏主体 ===== -->
    <view class="pad-land-body">
      <!-- 左栏：常驻导航 -->
      <view
        class="left-nav"
        :style="{ width: leftWidth + 'px', minWidth: leftWidth + 'px' }"
      >
        <LeftNav
          :collapsed="leftCollapsed"
          :activeMemberId="viewMemberId"
          :activeView="middleView"
          :members="members"
          :currentMemberId="currentId"
          @select-member="onSelectMember"
          @select-view="onSelectView"
          @toggle="toggleLeft"
          @open-settings="openManage"
        />
      </view>

      <!-- 中栏：核心内容区 -->
      <view
        class="middle-col"
        :class="'member-theme-' + (currentId || 'all')"
        :key="middleView + '-' + (currentId || 'all')"
      >
        <!-- 长辈专属模式（年龄 >= 55） -->
        <GrandmaContent
          v-if="activeMember && activeMember.age >= 55 && middleView === 'home'"
          :member="activeMember"
          @checkin="onCheckin"
        />
        <!-- 幼儿专属模式（年龄 <= 4） -->
        <BabyContent
          v-else-if="activeMember && activeMember.age <= 4 && middleView === 'home'"
          :member="activeMember"
          :key="'baby-' + currentId"
          @checkin="onCheckin"
        />
        <!-- 首页：单人视角，始终渲染「当前身份」 -->
        <HomeContent
          v-else-if="middleView === 'home'"
          :member="activeMember"
          :allMembers="members"
          :activeMemberId="currentId"
          :key="'home-' + (currentId || 'all')"
          @checkin="onCheckin"
          @select-member="onSelectMember"
        />
        <!-- 夫妻PK -->
        <CouplePK
          v-else-if="middleView === 'couple-pk'"
          :members="members"
        />
        <!-- 家庭与结算（原结算中心 + 成员总览） -->
        <FamilyPanel
          v-else-if="middleView === 'family'"
          :members="members"
          :weeklyRank="weeklyRank"
          :monthlyRank="monthlyRank"
        />
        <!-- 宠物图鉴 -->
        <PetEncyclopedia
          v-else-if="middleView === 'pets'"
          :initialMemberId="currentId || ''"
        />
      </view>

      <!-- 右栏：详情面板 -->
      <view
        class="right-panel"
        :style="{ width: rightWidth + 'px', minWidth: rightWidth + 'px' }"
        v-if="!rightCollapsed"
      >
        <RightPanel
          :member="activeMember"
          :activeTab="rightTab"
          :stage="currentStage"
          :attrs="currentAttrs"
          :memberPets="memberPetsList"
          :achievements="memberAchievementsList"
          @switch-tab="rightTab = $event"
          @switch-pet="onSwitchPet"
          @open-model3d="openModel3D"
          @open-pets="onOpenPets"
          @battle="onBattle"
        />
      </view>
    </view>

    <!-- ===== 底部通栏：家庭周排行 ===== -->
    <view class="bottom-bar">
      <BottomBar
        :weeklyRank="weeklyRank"
        :members="members"
        :grandma="grandmaMember"
        :baby="babyMember"
      />
    </view>

    <!-- ===== 比武弹窗（Frame层叠） ===== -->
    <BattleOverlay
      :visible="battleVisible"
      :member1="battleMember1"
      :member2="battleMember2"
      @close="battleVisible = false"
    />

    <!-- ===== 签到弹窗 ===== -->
    <CheckinModal
      :visible="checkinModal.show"
      :member="checkinModal.member"
      :task="checkinModal.task"
      :evolved="checkinModal.evolved"
      :newStage="checkinModal.newStage"
      :photo="checkinModal.photo"
      :verse="checkinModal.verse"
      :stars="checkinModal.stars"
      @close="checkinModal.show = false"
    />

    <!-- ===== 成员管理弹窗 ===== -->
    <MemberManageModal
      :visible="manageModal.show"
      :member="manageModal.member"
      @close="manageModal.show = false"
    />
  </view>
</template>

<script module="fixviewport" lang="renderjs">
export default {
  mounted() {
    try {
      // 基座运行时会给 body/#app 挂 max-width:960 的样式（优先级高于普通 CSS 覆盖），
      // 逻辑层无 document，只能在视图层用内联样式解除，三栏布局才能铺满视口
      const targets = [
        document.body,
        document.getElementById('app'),
        document.querySelector('uni-page-body'),
      ]
      targets.forEach((el) => {
        if (!el) return
        el.style.setProperty('max-width', '100%', 'important')
        el.style.setProperty('width', '100%', 'important')
      })
    } catch (e) {}
  }
}
</script>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import {
  members, checkinModal, doCheckin,
  stageFor, getPetAttrs, getMemberPets,
  switchActivePet, memberAchievements, achievements,
  weeklyRank, monthlyRank,
  getCurrentMemberId, setCurrentMember, isOnboarded,
} from '@/store/index.js'
import { useLayoutState } from '@/utils/pad-layout-helper'

// 逻辑层窗口尺寸：给根容器内联定尺寸。基座 webview 的布局视口可能被 body 级
// max-width 压小，100vw 不可靠；windowWidth 来自系统屏幕换算，配合 renderjs
// （fixviewport 模块）解除 body 限制后即为真实可用宽
const win = ref({ w: 0, h: 0 })
function updateWin() {
  try {
    const i = uni.getWindowInfo()
    win.value = { w: i.windowWidth, h: i.windowHeight }
  } catch {}
}
onMounted(() => { updateWin(); uni.onWindowResize && uni.onWindowResize(updateWin) })
onUnmounted(() => { try { uni.offWindowResize && uni.offWindowResize(updateWin) } catch {} })

const landStyle = computed(() => {
  if (!win.value.w || !win.value.h) return {}
  return { width: win.value.w + 'px', height: win.value.h + 'px' }
})

import CheckinModal from '@/components/CheckinModal.vue'
import MemberManageModal from '@/components/MemberManageModal.vue'

import LeftNav from './LeftNav.vue'
import RightPanel from './RightPanel.vue'
import BottomBar from './BottomBar.vue'
import HomeContent from '@/components/screens/HomeContent.vue'
import GrandmaContent from '@/components/screens/GrandmaContent.vue'
import BabyContent from '@/components/screens/BabyContent.vue'
import CouplePK from '@/components/screens/CouplePK.vue'
import FamilyPanel from '@/components/screens/FamilyPanel.vue'
import PetEncyclopedia from '@/components/screens/PetEncyclopedia.vue'
import BattleOverlay from '@/components/screens/BattleOverlay.vue'

// ===== 布局状态 =====
const {
  leftCollapsed, rightCollapsed,
  middleView, rightTab,
  leftWidth, rightWidth,
  toggleLeft, toggleRight,
  setMiddleView, setRightTab,
} = useLayoutState()

// ===== 成员状态（单人视角：中栏恒为「当前身份」） =====
// 左栏点选成员 = 切换当前身份（写回 store，与 tabBar 页面保持一致）
const currentId = ref(getCurrentMemberId())

const activeMember = computed(() => {
  if (!currentId.value) return null
  return members.find(m => m.id === currentId.value) || null
})

// 左栏高亮：家庭视图下不高亮具体成员
const viewMemberId = computed(() => (middleView.value === 'family' ? '' : currentId.value))

// ===== 成员管理弹窗 =====
const manageModal = reactive({ show: false, member: null })
function openManage() {
  manageModal.member = null
  manageModal.show = true
}

const grandmaMember = computed(() => members.find(m => m.id === 'grandma'))
const babyMember = computed(() => members.find(m => m.id === 'erbao'))

const currentStage = computed(() => {
  if (!activeMember.value) return { stage: '—', level: 0, icon: '🌟' }
  return stageFor(activeMember.value)
})

const currentAttrs = computed(() => {
  if (!activeMember.value) return []
  const a = getPetAttrs(activeMember.value)
  return [
    { key: 'strength', label: '力量', value: a.strength, color: '#FF6B6B' },
    { key: 'wisdom', label: '智慧', value: a.wisdom, color: '#6366F1' },
    { key: 'vitality', label: '活力', value: a.vitality, color: '#10B981' },
    { key: 'charm', label: '魅力', value: a.charm, color: '#F59E0B' },
  ]
})

const memberPetsList = computed(() => {
  if (!activeMember.value) return []
  return getMemberPets(activeMember.value.id)
})

const memberAchievementsList = computed(() => {
  if (!activeMember.value) return []
  const ids = memberAchievements[activeMember.value.id] || []
  return ids.map(id => achievements.find(a => a.id === id)).filter(Boolean)
})

// ===== 比武弹窗 =====
const battleVisible = ref(false)
const battleMember1 = ref(null)
const battleMember2 = ref(null)

// ===== 方法 =====
function onSelectMember(memberId) {
  // 单人视角：左栏选人 = 切当前身份
  if (setCurrentMember(memberId)) {
    currentId.value = memberId
  }
  setMiddleView('home')
  // 右栏自动切到宠物Tab
  setRightTab('pet')
}

function onSelectView(view) {
  setMiddleView(view)
}

onMounted(() => {
  // 未完成「我是谁」引导 → 回到引导页
  if (!isOnboarded()) {
    uni.reLaunch({ url: '/pages/welcome/welcome' })
    return
  }
  // 与 tabBar 页面保持一致：进入三栏时同步当前身份
  currentId.value = getCurrentMemberId()
})

function onCheckin(memberId, taskId, photoPath = null) {
  const result = doCheckin(memberId, taskId, photoPath)
  // 拍照必填：被拦截时给出提示（三栏布局下 checkinModal 不会自动弹）
  if (result && result.blocked) {
    uni.showToast({ title: result.msg || '请先拍照再签到', icon: 'none' })
    return
  }
  if (!result) {
    uni.showToast({ title: '该任务已完成', icon: 'none' })
  }
}

function onSwitchPet(petId) {
  if (!activeMember.value) return
  switchActivePet(activeMember.value.id, petId)
}

// 右栏跳转领养中心
function onOpenPets() {
  setMiddleView('pets')
}

function openModel3D() {
  uni.navigateTo({ url: '/pages/model3d/model3d' })
}

// 右栏比武入口：当前成员（大儿子）对战默认对手
function onBattle() {
  if (!activeMember.value) return
  openBattle(activeMember.value, null)
}

// 对外暴露比武弹窗
function openBattle(m1, m2) {
  battleMember1.value = m1
  battleMember2.value = m2
  battleVisible.value = true
}

defineExpose({ openBattle })
</script>

<style scoped>
/* ===== 三栏主容器 ===== */
.pad-land {
  display: flex;
  flex-direction: column;
  width: var(--window-width, 100%);
  height: var(--window-height, 100vh);
  background: #FFF6F0;
  overflow: hidden;
  position: relative;
}

.pad-land-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 0;
}

/* ===== 左栏 ===== */
.left-nav {
  flex-shrink: 0;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid #F0E8DE;
  background: #FFFAF7;
  transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 10;
}

/* ===== 中栏 ===== */
.middle-col {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background: #FFF6F0;
  position: relative;
  animation: middleSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
@keyframes middleSlideIn {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}

/* ===== 右栏 ===== */
.right-panel {
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: visible;
  border-left: 1px solid #F0E8DE;
  background: #FFFAF7;
  transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-sizing: border-box;
}

/* ===== 底部通栏 ===== */
.bottom-bar {
  flex-shrink: 0;
  height: 70px;
  border-top: 1px solid #F0E8DE;
  background: #FFFFFF;
  overflow: hidden;
}

/* ===== 左栏收起态 ===== */
.pad-land.left-collapsed .left-nav {
  border-right-color: #F0E8DE;
}

/* ===== 滚动条美化 ===== */
.middle-col::-webkit-scrollbar,
.right-panel::-webkit-scrollbar {
  width: 4px;
}
.middle-col::-webkit-scrollbar-thumb,
.right-panel::-webkit-scrollbar-thumb {
  background: #E2D6CC;
  border-radius: 2px;
}
.middle-col::-webkit-scrollbar-track,
.right-panel::-webkit-scrollbar-track {
  background: transparent;
}

/* ===== 成员主题差异化 ===== */
/* 奶奶：暖金色调背景 */
.member-theme-grandma {
  background: #FFFBF5 !important;
}
.member-theme-grandma .middle-col {
  background: #FFFBF5 !important;
}

/* 小宝：高饱和马卡龙背景 */
.member-theme-erbao {
  background: linear-gradient(180deg, #FFF6F0 0%, #FFF0E6 100%) !important;
}

/* 大儿子：竞技感渐变 */
.member-theme-dabao {
  background: linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 50%, #FFF6F0 100%) !important;
}

/* 父母：简洁商务 */
.member-theme-dad,
.member-theme-mom {
  background: #FFF6F0 !important;
}

/* 汇总视图 */
.member-theme-all {
  background: #FFF6F0 !important;
}

/* ===== 触摸热区确保 ≥ 60dp ===== */
.pad-land :deep(.touch-target) {
  min-width: 60px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 所有按钮/可点击元素确保热区 */
.pad-land :deep(.clickable) {
  min-height: 44px;
  cursor: pointer;
}

/* ===== 响应式竖屏/窄窗降级 ===== */
@media screen and (max-width: 680px) {
  .pad-land-body {
    flex-direction: column;
  }
  .left-nav {
    width: 100% !important;
    min-width: 100% !important;
    height: auto !important;
    border-right: none !important;
    border-bottom: 1px solid #F0E8DE;
  }
  .right-panel {
    display: none !important;
  }
  .bottom-bar {
    display: none !important;
  }
}

/* ===== 打印样式 ===== */
@media print {
  .pad-land {
    height: auto;
  }
  .left-nav, .right-panel, .bottom-bar {
    display: none;
  }
  .middle-col {
    width: 100% !important;
  }
}
</style>