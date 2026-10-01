<template>
  <view class="pet-encyclopedia">
    <!-- ===== 三Tab切换 ===== -->
    <view class="pe-tabs">
      <view class="pe-tab" :class="{ active: tab === 'adopt' }" @click="tab = 'adopt'">
        <text class="pe-tab-icon">🏠</text>
        <text class="pe-tab-text">领养中心</text>
      </view>
      <view class="pe-tab" :class="{ active: tab === 'mine' }" @click="tab = 'mine'">
        <text class="pe-tab-icon">💝</text>
        <text class="pe-tab-text">我的宠物</text>
      </view>
      <view class="pe-tab" :class="{ active: tab === 'book' }" @click="tab = 'book'">
        <text class="pe-tab-icon">📖</text>
        <text class="pe-tab-text">宠物图鉴</text>
      </view>
    </view>

    <scroll-view class="pe-scroll" scroll-y :show-scrollbar="false">
      <!-- ========================================== -->
      <!-- Tab 1: 领养中心 -->
      <!-- ========================================== -->
      <view v-if="tab === 'adopt'">
        <!-- 成员选择 + 积分概览：同一行工具条 -->
        <view class="pe-toolbar">
          <scroll-view scroll-x class="pe-member-scroll" :show-scrollbar="false">
            <view class="pe-member-row">
              <view
                v-for="m in members"
                :key="m.id"
                class="pe-member-tag"
                :class="{ active: adoptMember && adoptMember.id === m.id }"
                :style="adoptMember && adoptMember.id === m.id ? { background: m.themeColor, borderColor: m.themeColor } : {}"
                @click="adoptMemberId = m.id"
              >
                <view class="pe-member-avatar" :style="adoptMember && adoptMember.id === m.id ? {} : { background: m.themeColor + '1F' }">
                  <text class="pe-member-avatar-emoji">{{ m.emoji }}</text>
                </view>
                <text class="pe-member-name">{{ m.name }}</text>
                <text v-if="m.id === currentMemberId" class="pe-member-me">我</text>
                <text class="pe-member-score">{{ scoreValue(m) }}</text>
              </view>
            </view>
          </scroll-view>
          <view
            v-if="adoptMember"
            class="pe-score-chip"
            :style="{ background: adoptMember.themeColor + '15', borderColor: adoptMember.themeColor + '33' }"
          >
            <text class="pe-score-val" :style="{ color: adoptMember.themeColor }">{{ scoreValue(adoptMember) }}</text>
            <text class="pe-score-label">{{ scoreLabel(adoptMember) }}</text>
            <view class="pe-score-divider"></view>
            <text class="pe-score-hint">可领养 {{ adoptableCount }} 只</text>
          </view>
        </view>

        <!-- 按稀有度分组展示（空分组不渲染，保持紧凑） -->
        <template v-for="rarity in rarityOrder" :key="rarity">
        <view v-if="groupedCatalog[rarity]?.length" class="pe-rarity-section">
          <view class="pe-rarity-header">
            <view class="pe-rarity-pill" :style="{ background: RARITY_INFO[rarity].color + '14' }">
              <view class="pe-rarity-dot" :style="{ background: RARITY_INFO[rarity].color }"></view>
              <text class="pe-rarity-pill-text" :style="{ color: RARITY_INFO[rarity].color }">{{ RARITY_INFO[rarity].label }}</text>
            </view>
            <view class="pe-rarity-line" :style="{ background: 'linear-gradient(90deg,' + RARITY_INFO[rarity].color + '45, rgba(0,0,0,0))' }"></view>
            <text class="pe-rarity-count">{{ groupedCatalog[rarity]?.length || 0 }} 只</text>
          </view>

          <view class="pe-pet-grid">
            <view
              v-for="pet in groupedCatalog[rarity]"
              :key="pet.id"
              class="pe-pet-card"
              :class="{ locked: !pet.unlocked }"
              @click="detailPet = pet"
            >
              <!-- 顶部稀有度渐变氛围 -->
              <view class="pe-pet-card-glow" :style="{ background: 'linear-gradient(180deg,' + RARITY_INFO[rarity].color + '24, rgba(255,255,255,0) 90%)' }"></view>
              <view class="pe-pet-corner" :style="{ background: RARITY_INFO[rarity].color }"></view>

              <!-- 可领养 / 锁定角标 -->
              <view class="pe-pet-flag" :class="pet.unlocked ? 'ready' : 'lock'">
                <text class="pe-pet-flag-text">{{ pet.unlocked ? '可领养' : '🔒' }}</text>
              </view>

              <!-- 宠物图标（视觉主角） -->
              <view class="pe-pet-icon" :style="{ background: RARITY_INFO[rarity].bg, borderColor: RARITY_INFO[rarity].borderColor }">
                <text class="pe-pet-emoji" :class="{ gray: !pet.unlocked }">{{ pet.icon }}</text>
              </view>

              <text class="pe-pet-name">{{ pet.name }}</text>
              <text class="pe-pet-species">{{ pet.species }}</text>

              <!-- 战力 + 领养条件 -->
              <view class="pe-pet-meta">
                <view class="pe-meta-chip power">
                  <text class="pe-meta-text">⚔ {{ pet.basePower }}</text>
                </view>
                <view class="pe-meta-chip req" :class="{ met: pet.unlocked }">
                  <text v-if="pet.requiredPoints > 0" class="pe-meta-text">{{ pet.unlocked ? '✓' : '🔒' }} {{ pet.requiredPoints }}分</text>
                  <text v-else class="pe-meta-text free">免费领</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        </template>
      </view>

      <!-- ========================================== -->
      <!-- Tab 2: 我的宠物 -->
      <!-- ========================================== -->
      <view v-if="tab === 'mine'">
        <!-- 宠物比武入口 -->
        <view class="pe-battle-entry" @click="goBattle">
          <text class="pe-battle-icon">⚔️</text>
          <text class="pe-battle-title">宠物比武</text>
          <text class="pe-battle-sub">让宠物们一较高下</text>
          <text class="pe-battle-arrow">›</text>
        </view>

        <view v-for="m in members" :key="m.id" class="pe-pet-detail-card">
          <view class="pe-member-head">
            <text class="pe-member-head-icon">{{ m.emoji }}</text>
            <text class="pe-member-head-name">{{ m.name }}</text>
            <text class="pe-member-head-stats">{{ scoreValue(m) }} {{ scoreLabel(m) }} · {{ m.totalCheckins }} 签到</text>
          </view>

          <!-- 宠物收藏列表 -->
          <view class="pe-my-pets-scroll">
            <text class="pe-switch-hint">👆 点击宠物可更换出战</text>
            <scroll-view scroll-x class="pe-pets-scroll-inner" :show-scrollbar="false">
              <view class="pe-pets-collection">
                <view
                  v-for="pet in memberPetMap[m.id]"
                  :key="pet.id"
                  class="pe-collection-pet"
                  :class="{ active: pet.active }"
                  :style="pet.active ? { borderColor: m.themeColor, background: m.themeColor + '10' } : {}"
                  @click="switchPet(m.id, pet.id)"
                >
                  <text class="pe-collection-icon">{{ pet.icon }}</text>
                  <text class="pe-collection-name">{{ pet.name }}</text>
                  <view class="pe-collection-rarity" :style="{ background: RARITY_INFO[pet.rarity]?.color || '#94A3B8' }">
                    <text class="pe-collection-rarity-text">{{ RARITY_INFO[pet.rarity]?.label || '' }}</text>
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>

          <!-- 出战宠物 + 成长/属性：左右两栏 -->
          <view class="pe-detail-body" v-if="activePets[m.id]">
            <view class="pe-active-pet-display">
              <text class="pe-pet-big-icon">{{ activePets[m.id].icon }}</text>
              <text class="pe-pet-detail-name">{{ activePets[m.id].name }}</text>
              <text class="pe-pet-detail-stage" :style="{ color: m.themeColor }">{{ stageInfo(m).stage }}</text>
              <view class="pe-model3d-entry" v-if="m.id === 'dabao'" @click="openModel3D">
                <text class="pe-model3d-entry-text">🔮 3D模型</text>
              </view>
            </view>

            <view class="pe-grow-attrs">
              <view class="pe-grow-row">
                <text class="pe-grow-title">成长</text>
                <view class="pe-progress-bar">
                  <view class="pe-progress-fill" :style="{ width: growRatio(m) + '%' }"></view>
                </view>
                <text class="pe-grow-percent">{{ growRatio(m) }}%</text>
              </view>
              <text class="pe-grow-value">{{ m.grow }} / {{ m.totalGrow }}</text>

              <view class="pe-attr-grid">
                <view v-for="attr in petAttrs" :key="attr.key" class="pe-attr-item">
                  <text class="pe-attr-label">{{ attr.label }}</text>
                  <view class="pe-attr-bar">
                    <view class="pe-attr-fill" :style="{ width: attrValue(m, attr.key) + '%' }"></view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- ========================================== -->
      <!-- Tab 3: 宠物图鉴 -->
      <!-- ========================================== -->
      <view v-if="tab === 'book'">
        <!-- 收集进度 -->
        <view class="pe-book-progress">
          <view class="pe-book-progress-header">
            <text class="pe-book-progress-title">📖 家族图鉴</text>
            <text class="pe-book-progress-num">{{ totalCollected }} / {{ PET_CATALOG.length }}</text>
          </view>
          <view class="pe-book-progress-track">
            <view class="pe-book-progress-fill" :style="{ width: collectPercent + '%' }"></view>
          </view>
          <text class="pe-book-progress-hint">完成度 {{ collectPercent }}%</text>
        </view>

        <view
          v-for="rarity in rarityOrder"
          :key="rarity"
          class="pe-rarity-section"
        >
          <view class="pe-rarity-header">
            <view class="pe-rarity-pill" :style="{ background: RARITY_INFO[rarity].color + '14' }">
              <view class="pe-rarity-dot" :style="{ background: RARITY_INFO[rarity].color }"></view>
              <text class="pe-rarity-pill-text" :style="{ color: RARITY_INFO[rarity].color }">{{ RARITY_INFO[rarity].label }}</text>
            </view>
            <view class="pe-rarity-line" :style="{ background: 'linear-gradient(90deg,' + RARITY_INFO[rarity].color + '45, rgba(0,0,0,0))' }"></view>
            <text class="pe-rarity-count">{{ bookGrouped[rarity]?.length || 0 }} 种</text>
          </view>

          <view class="pe-book-grid" v-if="bookGrouped[rarity]?.length">
            <view
              v-for="pet in bookGrouped[rarity]"
              :key="pet.id"
              class="pe-book-card"
              :class="{ collected: pet.collectedBy.length > 0 }"
              :style="pet.collectedBy.length > 0 ? { borderColor: RARITY_INFO[rarity].borderColor } : {}"
            >
              <view class="pe-book-top">
                <view class="pe-book-icon-wrap" :style="{ background: pet.collectedBy.length > 0 ? RARITY_INFO[rarity].bg : '#F1F5F9' }">
                  <text class="pe-book-icon">{{ pet.collectedBy.length > 0 ? pet.icon : '❓' }}</text>
                  <text v-if="pet.collectedBy.length > 0" class="pe-book-check">✓</text>
                </view>
                <view class="pe-book-head">
                  <text class="pe-book-name" :class="{ dim: pet.collectedBy.length === 0 }">{{ pet.collectedBy.length > 0 ? pet.name : '？？？' }}</text>
                  <text class="pe-book-species">{{ pet.species }}</text>
                  <view class="pe-book-rarity-tag" :style="{ color: RARITY_INFO[rarity].color }">
                    <text class="pe-book-rarity-text">{{ RARITY_INFO[rarity].label }} · ⚔ {{ pet.basePower }}</text>
                  </view>
                </view>
              </view>
              <text class="pe-book-desc" v-if="pet.collectedBy.length > 0">{{ pet.desc }}</text>
              <view class="pe-book-owners" v-if="pet.collectedBy.length > 0">
                <text
                  v-for="by in pet.collectedBy"
                  :key="by.id"
                  class="pe-book-owner-tag"
                  :style="{ background: by.themeColor + '20', color: by.themeColor }"
                >{{ by.emoji }} {{ by.name }}</text>
              </view>
              <text class="pe-book-condition" v-else>
                {{ pet.requiredPoints > 0 ? '🔸 需 ' + pet.requiredPoints + ' 积分' : (pet.defaultFor ? '🎖 初始宠物' : '🎁 免费领取') }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 宠物详情弹窗（先看描述再决定领养） -->
    <PetDetailModal
      :visible="!!detailPet"
      :pet="detailPet"
      :member="adoptMember"
      @close="detailPet = null"
      @adopt="onAdoptFromDetail"
    />

    <!-- 领养弹窗 -->
    <AdoptModal
      :visible="adoptModal.show"
      :pet="adoptModal.pet"
      :member="adoptModal.member"
      @close="adoptModal.show = false"
    />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  members, adoptModal,
  getAllCatalogPets, getAdoptablePets, getMemberPets, getActivePet,
  adoptPet, switchActivePet,
  RARITY_INFO, stageFor, PET_CATALOG, getPetAttrs,
  getCurrentMemberId,
} from '@/store/index.js'
import AdoptModal from '@/components/AdoptModal.vue'
import PetDetailModal from '@/components/PetDetailModal.vue'

const props = defineProps({
  // 从右栏进入时带上当前选中的成员
  initialMemberId: { type: String, default: '' },
})

// 单人视角：宠物中心仍可切换查看其他成员，但标出「我」是谁
const currentMemberId = ref(getCurrentMemberId())

const tab = ref('adopt')
// 默认选中传入成员或第一位成员；成员被删除时回退到列表第一位
const adoptMemberId = ref(props.initialMemberId || members[0]?.id || '')

const adoptMember = computed(() =>
  members.find(m => m.id === adoptMemberId.value) || members[0] || null
)

const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'common']

const catalogPets = computed(() => {
  if (!adoptMember.value) return []
  return getAllCatalogPets(adoptMember.value.id)
})

const groupedCatalog = computed(() => {
  const groups = {}
  catalogPets.value.forEach(p => {
    if (!groups[p.rarity]) groups[p.rarity] = []
    groups[p.rarity].push(p)
  })
  return groups
})

const adoptableCount = computed(() => {
  if (!adoptMember.value) return 0
  return getAdoptablePets(adoptMember.value.id).length
})

// 我的宠物
const memberPetMap = computed(() => {
  const map = {}
  members.forEach(m => {
    map[m.id] = getMemberPets(m.id)
  })
  return map
})

const activePets = computed(() => {
  const map = {}
  members.forEach(m => {
    map[m.id] = getActivePet(m.id)
  })
  return map
})

// 宠物图鉴
const bookGrouped = computed(() => {
  const groups = {}
  PET_CATALOG.forEach(pet => {
    const collectors = members.filter(m => (m.adoptedPets || []).includes(pet.id))
    const enriched = {
      ...pet,
      collectedBy: collectors.map(m => ({ id: m.id, name: m.name, emoji: m.emoji, themeColor: m.themeColor })),
    }
    if (!groups[pet.rarity]) groups[pet.rarity] = []
    groups[pet.rarity].push(enriched)
  })
  return groups
})

const totalCollected = computed(() => {
  let count = 0
  PET_CATALOG.forEach(pet => {
    if (members.some(m => (m.adoptedPets || []).includes(pet.id))) count++
  })
  return count
})

const collectPercent = computed(() => {
  if (PET_CATALOG.length === 0) return 0
  return Math.round((totalCollected.value / PET_CATALOG.length) * 100)
})

function scoreValue(m) {
  if (m.age <= 4) return m.stars || 0
  if (m.age >= 55) return m.grace || 0
  return m.points
}
function scoreLabel(m) {
  if (m.age <= 4) return '星星'
  if (m.age >= 55) return '恩典值'
  return '积分'
}

function confirmAdopt(pet) {
  if (!adoptMember.value) return
  adoptPet(adoptMember.value.id, pet.id)
}

// ===== 宠物详情弹窗 =====
const detailPet = ref(null)

function onAdoptFromDetail(pet) {
  detailPet.value = null
  confirmAdopt(pet)
}

function switchPet(memberId, petId) {
  switchActivePet(memberId, petId)
}

// 宠物属性
const petAttrs = [
  { key: 'strength', label: '力量' },
  { key: 'wisdom', label: '智慧' },
  { key: 'vitality', label: '活力' },
  { key: 'charm', label: '魅力' },
]

function stageInfo(member) {
  return stageFor(member)
}
function growRatio(member) {
  return Math.round((member.grow / member.totalGrow) * 100)
}
function attrValue(member, key) {
  const base = growRatio(member)
  const seeds = { strength: 17, wisdom: 31, vitality: 53, charm: 79 }
  const seed = seeds[key] || 0
  return Math.min(100, Math.round(base * 0.7 + (seed % 30)))
}
function goBattle() {
  uni.navigateTo({ url: '/pages/battle/battle' })
}
function openModel3D() {
  uni.navigateTo({ url: '/pages/model3d/model3d' })
}
</script>

<style scoped>
.pet-encyclopedia {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #FFF6F0;
}

/* ===== Tabs ===== */
.pe-tabs {
  display: flex;
  background: #FFFFFF;
  border-radius: 14px;
  padding: 5px;
  margin: 12px 16px 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.pe-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 0;
  border-radius: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 40px;
}
.pe-tab.active {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
}
.pe-tab:active {
  transform: scale(0.96);
}
.pe-tab-icon { font-size: 16px; }
.pe-tab-text { font-size: 14px; font-weight: 600; color: #64748B; }
.pe-tab.active .pe-tab-text { color: #FFFFFF; }

/* ===== 滚动区 ===== */
.pe-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  max-width: 100%;
  box-sizing: border-box;
  padding: 0 16px 16px;
}
.pe-scroll::-webkit-scrollbar { width: 6px; }
.pe-scroll::-webkit-scrollbar-thumb { background: #E2D6CC; border-radius: 3px; }

/* ===== 领养中心 - 工具条（成员选择 + 积分） ===== */
.pe-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.pe-member-scroll {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}
.pe-member-row { display: flex; gap: 8px; padding: 2px 0; }
.pe-member-tag {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 12px 5px 5px;
  background: #FFFFFF;
  border-radius: 22px;
  border: 1.5px solid #F0E4D8;
  font-size: 13px;
  color: #64748B;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  min-height: 36px;
  box-shadow: 0 1px 3px rgba(138, 108, 78, 0.06);
}
.pe-member-tag:active { transform: scale(0.95); }
.pe-member-tag.active {
  color: #FFFFFF;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
}
.pe-member-avatar {
  width: 26px; height: 26px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #F1F5F9;
  flex-shrink: 0;
}
.pe-member-tag.active .pe-member-avatar {
  background: rgba(255, 255, 255, 0.28);
}
.pe-member-avatar-emoji { font-size: 14px; line-height: 1; }
.pe-member-name { font-weight: 600; }
.pe-member-tag text { white-space: nowrap; }
.pe-member-score { font-size: 12px; opacity: 0.75; font-weight: 600; }
.pe-member-me {
  font-size: 9px;
  font-weight: 800;
  color: #FFFFFF;
  background: #FF8A65;
  border-radius: 6px;
  padding: 0 6px;
  line-height: 15px;
  flex-shrink: 0;
}
.pe-member-tag.active .pe-member-score { opacity: 1; }
.pe-score-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  border-radius: 20px;
  border: 2px solid;
  flex-shrink: 0;
  white-space: nowrap;
}
.pe-score-val { font-size: 16px; font-weight: 800; }
.pe-score-label { font-size: 12px; color: #8A8178; }
.pe-score-divider { width: 1px; height: 14px; background: #E2D6CC; }
.pe-score-hint { font-size: 12px; color: #8A8178; font-weight: 600; }

/* ===== 稀有度分组 ===== */
.pe-rarity-section { margin-bottom: 18px; }
.pe-rarity-header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 10px;
}
.pe-rarity-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  flex-shrink: 0;
}
.pe-rarity-dot { width: 7px; height: 7px; border-radius: 50%; }
.pe-rarity-pill-text { font-size: 14px; font-weight: 800; letter-spacing: 1px; }
.pe-rarity-line { flex: 1; height: 1.5px; border-radius: 1px; }
.pe-rarity-count { font-size: 12px; color: #A8A29E; font-weight: 600; flex-shrink: 0; }

/* ===== 领养网格（自适应列数，竖版宠物卡） ===== */
.pe-pet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 10px;
}
.pe-pet-card {
  position: relative;
  background: #FFFFFF;
  border-radius: 14px;
  border: 1.5px solid #F0E8DE;
  padding: 18px 10px 11px;
  display: flex; flex-direction: column; align-items: center;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(138, 108, 78, 0.06);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.pe-pet-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(138, 108, 78, 0.14);
}
.pe-pet-card:active {
  transform: scale(0.96);
}
/* 顶部稀有度渐变氛围 + 色条 */
.pe-pet-card-glow {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 66px;
  pointer-events: none;
}
.pe-pet-corner {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 3px;
  opacity: 0.9;
}
/* 可领养 / 锁定角标 */
.pe-pet-flag {
  position: absolute;
  top: 8px; right: 8px;
  z-index: 1;
  padding: 3px 9px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px;
  line-height: 1.2;
}
.pe-pet-flag.ready {
  background: linear-gradient(135deg, #34D399, #10B981);
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.35);
  animation: peFlagBreathe 2.2s ease-in-out infinite;
}
.pe-pet-flag.ready .pe-pet-flag-text {
  font-size: 10px; color: #FFFFFF; font-weight: 700; letter-spacing: 0.5px;
}
.pe-pet-flag.lock {
  padding: 0;
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: #F1F5F9;
}
.pe-pet-flag.lock .pe-pet-flag-text { font-size: 10px; }
@keyframes peFlagBreathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.07); }
}
/* 宠物图标 */
.pe-pet-icon {
  width: 52px; height: 52px;
  border-radius: 16px;
  border: 1.5px solid;
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.pe-pet-emoji { font-size: 28px; line-height: 1; }
.pe-pet-emoji.gray { filter: grayscale(1); opacity: 0.55; }
/* 名字 + 种类 */
.pe-pet-name {
  margin-top: 8px;
  font-size: 14px; font-weight: 800; color: #1E293B;
  max-width: 100%;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pe-pet-species {
  margin-top: 1px;
  font-size: 11px; color: #94A3B8;
  max-width: 100%;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
/* 战力 + 条件 chips */
.pe-pet-meta {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-top: auto;
  padding-top: 9px;
  width: 100%;
}
.pe-meta-chip {
  padding: 3px 9px;
  border-radius: 9px;
  background: #FFF7ED;
}
.pe-meta-text { font-size: 11px; font-weight: 700; color: #F59E0B; white-space: nowrap; }
.pe-meta-chip.req { background: #F1F5F9; }
.pe-meta-chip.req .pe-meta-text { color: #94A3B8; }
.pe-meta-chip.req.met { background: #ECFDF5; }
.pe-meta-chip.req.met .pe-meta-text { color: #059669; }
.pe-meta-text.free { color: #F59E0B; }

/* 锁定态：仅弱化图标与文字，卡片保持干净 */
.pe-pet-card.locked {
  background: #FBFAF8;
  border-color: #EFEAE2;
  box-shadow: none;
}
.pe-pet-card.locked:hover { transform: none; box-shadow: none; }
.pe-pet-card.locked .pe-pet-name { color: #94A3B8; }
.pe-pet-card.locked .pe-pet-species { color: #C8C2BA; }

/* ===== 我的宠物 - 比武入口 ===== */
.pe-battle-entry {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #FEF3C7, #FCE7F3);
  border-radius: 12px; border: 2px solid #FDE68A;
  cursor: pointer; transition: transform 0.15s ease;
  margin-bottom: 12px;
}
.pe-battle-entry:active { transform: scale(0.98); }
.pe-battle-icon { font-size: 22px; }
.pe-battle-title { font-size: 14px; font-weight: 700; color: #92400E; }
.pe-battle-sub { font-size: 12px; color: #B45309; }
.pe-battle-arrow { margin-left: auto; font-size: 18px; color: #B45309; }

/* ===== 宠物详情卡 ===== */
.pe-pet-detail-card {
  background: #FFFFFF; border-radius: 14px; padding: 14px 16px; margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.pe-member-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.pe-member-head-icon { font-size: 20px; }
.pe-member-head-name { font-size: 15px; font-weight: 700; color: #1E293B; }
.pe-member-head-stats { margin-left: auto; font-size: 12px; color: #94A3B8; }

/* ===== 宠物收藏（横向滚动小卡） ===== */
.pe-my-pets-scroll { margin-bottom: 12px; }
.pe-switch-hint {
  display: block;
  font-size: 11px;
  color: #A88B6A;
  font-weight: 600;
  margin-bottom: 5px;
}
.pe-pets-scroll-inner { white-space: nowrap; }
.pe-pets-collection { display: flex; gap: 8px; }
.pe-collection-pet {
  width: 92px; min-width: 92px;
  background: #F8FAFC; border-radius: 12px;
  border: 2px solid #E2E8F0;
  padding: 8px 6px;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  cursor: pointer; transition: all 0.15s ease;
}
.pe-collection-pet:active { transform: scale(0.95); }
.pe-collection-icon { font-size: 26px; }
.pe-collection-name { font-size: 12px; font-weight: 700; color: #1E293B; }
.pe-collection-rarity { padding: 1px 8px; border-radius: 8px; }
.pe-collection-rarity-text { font-size: 10px; color: #FFFFFF; font-weight: 600; }

/* ===== 出战宠物 + 成长/属性 两栏 ===== */
.pe-detail-body {
  display: flex; align-items: center; gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #F0E4D8;
}
.pe-active-pet-display {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  width: 110px; flex-shrink: 0;
}
.pe-pet-big-icon { font-size: 44px; line-height: 1.2; }
.pe-pet-detail-name { font-size: 15px; font-weight: 700; color: #1E293B; }
.pe-pet-detail-stage { font-size: 12px; font-weight: 600; }
.pe-model3d-entry {
  margin-top: 6px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  border-radius: 12px; padding: 5px 14px;
  cursor: pointer; transition: opacity 0.15s ease;
}
.pe-model3d-entry:active { opacity: 0.85; }
.pe-model3d-entry-text { font-size: 11px; font-weight: 700; color: #FFFFFF; }

.pe-grow-attrs { flex: 1; min-width: 0; }
.pe-grow-row { display: flex; align-items: center; gap: 8px; }
.pe-grow-title { font-size: 12px; font-weight: 600; color: #64748B; flex-shrink: 0; }
.pe-progress-bar { flex: 1; height: 10px; background: #E2E8F0; border-radius: 5px; overflow: hidden; }
.pe-progress-fill { height: 100%; background: #4F46E5; border-radius: 5px; transition: width 0.4s ease; }
.pe-grow-percent { font-size: 13px; font-weight: 700; color: #4F46E5; min-width: 38px; text-align: right; }
.pe-grow-value { font-size: 11px; color: #94A3B8; text-align: right; display: block; margin-top: 2px; }

.pe-attr-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px 14px;
  margin-top: 10px;
}
.pe-attr-item { display: flex; align-items: center; gap: 8px; }
.pe-attr-label { font-size: 11px; color: #64748B; flex-shrink: 0; width: 26px; }
.pe-attr-bar { flex: 1; height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden; }
.pe-attr-fill { height: 100%; background: #14B8A6; border-radius: 3px; transition: width 0.4s ease; }

/* ===== 宠物图鉴 - 收集进度 ===== */
.pe-book-progress {
  background: linear-gradient(135deg, #EEF2FF, #F5F3FF);
  border-radius: 14px; padding: 12px 16px; margin-bottom: 14px;
  border: 2px solid #C7D2FE;
}
.pe-book-progress-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px;
}
.pe-book-progress-title { font-size: 14px; font-weight: 700; color: #3730A3; }
.pe-book-progress-num { font-size: 15px; font-weight: 800; color: #4F46E5; }
.pe-book-progress-track {
  height: 8px; background: rgba(255,255,255,0.7);
  border-radius: 4px; overflow: hidden; margin-bottom: 5px;
}
.pe-book-progress-fill {
  height: 100%; background: linear-gradient(90deg, #4F46E5, #7C3AED);
  border-radius: 4px; transition: width 0.4s ease;
}
.pe-book-progress-hint { font-size: 11px; color: #6D28D9; font-weight: 500; }

/* ===== 图鉴网格（4列紧凑卡：图标+信息横排） ===== */
.pe-book-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.pe-book-card {
  background: #FFFFFF;
  border-radius: 14px;
  border: 2px solid #E2E8F0;
  padding: 10px 12px;
  display: flex; flex-direction: column; gap: 6px;
  transition: all 0.15s ease;
}
.pe-book-card.collected { border-width: 2px; }
.pe-book-top { display: flex; align-items: center; gap: 10px; }
.pe-book-icon-wrap {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  flex-shrink: 0;
}
.pe-book-icon { font-size: 24px; }
.pe-book-check {
  position: absolute; bottom: -3px; right: -3px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #10B981; color: #FFFFFF;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.pe-book-head { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.pe-book-name { font-size: 14px; font-weight: 700; color: #1E293B; }
.pe-book-name.dim { color: #CBD5E1; }
.pe-book-species { font-size: 11px; color: #94A3B8; }
.pe-book-rarity-tag { margin-top: 2px; }
.pe-book-rarity-text { font-size: 10px; font-weight: 700; }
.pe-book-desc {
  font-size: 11px; color: #64748B; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;
  overflow: hidden;
}
.pe-book-owners { display: flex; flex-wrap: wrap; gap: 4px; }
.pe-book-owner-tag { font-size: 10px; padding: 1px 8px; border-radius: 8px; font-weight: 600; }
.pe-book-condition { font-size: 11px; color: #94A3B8; font-weight: 500; }

/* ===== 窄屏降级：降列数保持可读 ===== */
@media screen and (max-width: 900px) {
  .pe-book-grid { grid-template-columns: repeat(3, 1fr); }
}
@media screen and (max-width: 680px) {
  .pe-pet-grid { grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 8px; }
  .pe-book-grid { grid-template-columns: repeat(2, 1fr); }
  .pe-toolbar { flex-wrap: wrap; }
  .pe-score-chip { order: -1; width: 100%; justify-content: center; }
  .pe-detail-body { flex-direction: column; align-items: stretch; }
  .pe-active-pet-display { width: 100%; }
}

</style>
