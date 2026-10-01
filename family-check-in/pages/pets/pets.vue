<template>
  <view class="page">
    <!-- ===== 当前身份条 ===== -->
    <view class="who" v-if="me">
      <view class="who-avatar" :style="{ borderColor: me.themeColor, background: me.themeColor + '18' }">
        <image v-if="me.avatarUrl" :src="me.avatarUrl" class="who-img" mode="aspectFill" />
        <text v-else class="who-emoji">{{ me.emoji }}</text>
      </view>
      <view class="who-body">
        <text class="who-name">{{ me.name }} 的宠物</text>
        <text class="who-sub">{{ scoreValueOf(me) }} {{ scoreLabelOf(me) }} · 可领养 {{ adoptableCount }} 只</text>
      </view>
      <view class="who-switch" @click="switchRole"><text>切换</text></view>
    </view>

    <!-- ===== Tab 切换 ===== -->
    <view class="tab-row">
      <view class="tab-item" :class="{ active: tab === 'adopt' }" @click="tab = 'adopt'">
        <text class="tab-text">🐾 领养中心</text>
      </view>
      <view class="tab-item" :class="{ active: tab === 'mine' }" @click="tab = 'mine'">
        <text class="tab-text">💝 我的宠物</text>
      </view>
    </view>

    <!-- ========================================== -->
    <!-- Tab 1: 领养中心（含图鉴：未拥有的显示锁定条件） -->
    <!-- ========================================== -->
    <view v-if="tab === 'adopt'">
      <!-- 收集进度 -->
      <view class="collect-card">
        <view class="cc-head">
          <text class="cc-title">📖 图鉴收集</text>
          <text class="cc-num">{{ ownedCount }} / {{ catalog.length }}</text>
        </view>
        <view class="cc-track">
          <view class="cc-fill" :style="{ width: collectPercent + '%' }"></view>
        </view>
        <text class="cc-hint">完成度 {{ collectPercent }}% · 还差 {{ remainCount }} 只</text>
      </view>

      <!-- 稀有度分组 -->
      <template v-for="rarity in rarityOrder" :key="rarity">
        <view v-if="grouped[rarity] && grouped[rarity].length" class="rarity-section">
          <view class="rarity-head">
            <view class="rarity-pill" :style="{ background: RARITY_INFO[rarity].color + '14' }">
              <view class="rarity-dot" :style="{ background: RARITY_INFO[rarity].color }"></view>
              <text class="rarity-pill-text" :style="{ color: RARITY_INFO[rarity].color }">{{ RARITY_INFO[rarity].label }}</text>
            </view>
            <text class="rarity-count">{{ grouped[rarity].length }} 只</text>
          </view>

          <view class="pet-grid">
            <view
              v-for="pet in grouped[rarity]"
              :key="pet.id"
              class="pet-card"
              :class="{ locked: pet.locked, owned: pet.owned }"
              :style="pet.owned ? { borderColor: RARITY_INFO[rarity].borderColor } : {}"
              @click="openDetail(pet)"
            >
              <view class="pet-flag" :class="pet.owned ? 'owned' : (pet.canAdopt ? 'ready' : 'lock')">
                <text class="pet-flag-text">{{ pet.owned ? '已有' : (pet.canAdopt ? '可领养' : '🔒') }}</text>
              </view>
              <view class="pet-icon" :style="{ background: RARITY_INFO[rarity].bg }">
                <text class="pet-emoji" :class="{ gray: !pet.owned && !pet.canAdopt }">{{ pet.icon }}</text>
              </view>
              <text class="pet-name">{{ pet.owned ? pet.displayName : pet.name }}</text>
              <text class="pet-species">{{ pet.species }}</text>
              <view class="pet-meta">
                <view class="meta-chip power"><text class="meta-text">⚔ {{ pet.basePower }}</text></view>
                <view class="meta-chip req" :class="{ met: pet.owned || pet.canAdopt }">
                  <text v-if="pet.owned" class="meta-text ok">出战中{{ pet.active ? '✓' : '' }}</text>
                  <text v-else-if="pet.requiredPoints > 0" class="meta-text">{{ pet.canAdopt ? '✓' : '🔒' }} {{ pet.requiredPoints }}分</text>
                  <text v-else class="meta-text free">免费领</text>
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
      <view class="battle-entry" @click="goBattle">
        <text class="battle-icon">⚔️</text>
        <text class="battle-title">宠物比武</text>
        <text class="battle-sub">让宠物们一较高下</text>
        <text class="battle-arrow">›</text>
      </view>

      <view class="card" v-if="me">
        <!-- 出战宠物展示 -->
        <view class="detail-body" v-if="activePet">
          <view class="active-display">
            <text class="big-icon">{{ activePet.icon }}</text>
            <text class="active-name">{{ activePet.name }}</text>
            <text class="active-stage" :style="{ color: me.themeColor }">{{ stage.stage }}</text>
            <view class="model3d-entry" v-if="me.id === 'dabao'" @click="openModel3D">
              <text class="model3d-text">🔮 3D模型</text>
            </view>
          </view>
          <view class="grow-attrs">
            <view class="grow-row">
              <text class="grow-title">成长</text>
              <view class="progress-bar">
                <view class="progress-fill" :style="{ width: growPct + '%', background: me.themeColor }"></view>
              </view>
              <text class="grow-percent" :style="{ color: me.themeColor }">{{ growPct }}%</text>
            </view>
            <text class="grow-value">{{ me.grow }} / {{ me.totalGrow }}</text>
            <view class="attr-grid">
              <view v-for="a in attrList" :key="a.key" class="attr-item">
                <text class="attr-label">{{ a.label }}</text>
                <view class="attr-bar">
                  <view class="attr-fill" :style="{ width: a.value + '%', background: a.color }"></view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 宠物收藏 -->
        <view class="my-pets">
          <text class="switch-hint">👆 点击宠物可更换出战</text>
          <scroll-view scroll-x class="pets-scroll" :show-scrollbar="false">
            <view class="pets-collection">
              <view
                v-for="pet in myPets"
                :key="pet.id"
                class="collection-pet"
                :class="{ active: pet.active }"
                :style="pet.active ? { borderColor: me.themeColor, background: me.themeColor + '10' } : {}"
                @click="switchPet(pet.id)"
              >
                <text class="collection-icon">{{ pet.icon }}</text>
                <text class="collection-name">{{ pet.name }}</text>
                <view class="collection-rarity" :style="{ background: RARITY_INFO[pet.rarity] ? RARITY_INFO[pet.rarity].color : '#94A3B8' }">
                  <text class="collection-rarity-text">{{ RARITY_INFO[pet.rarity] ? RARITY_INFO[pet.rarity].label : '' }}</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>

    <!-- ===== 宠物详情弹窗 ===== -->
    <view class="modal-overlay" v-if="detailPet" @click="detailPet = null">
      <view class="modal-card" @click.stop>
        <view class="dm-icon-wrap" :style="{ background: rarityOf(detailPet).bg }">
          <text class="dm-icon">{{ detailPet.owned || detailPet.canAdopt ? detailPet.icon : '❓' }}</text>
        </view>
        <text class="dm-name">{{ detailPet.owned ? detailPet.displayName : detailPet.name }}</text>
        <text class="dm-species">{{ detailPet.species }} · {{ rarityOf(detailPet).label }} · ⚔ {{ detailPet.basePower }}</text>
        <text class="dm-power" v-if="detailPet.owned">总战力 {{ detailPet.totalPower }}（含稀有度 +{{ detailPet.rarityBonus }}）</text>
        <text class="dm-desc">{{ detailPet.desc }}</text>

        <view class="dm-skills" v-if="detailPet.skills && detailPet.skills.length">
          <view v-for="(s, i) in detailPet.skills" :key="i" class="dm-skill">
            <text class="dm-skill-icon">{{ s.icon }}</text>
            <view class="dm-skill-body">
              <text class="dm-skill-name">{{ s.name }}</text>
              <text class="dm-skill-desc">{{ s.desc }}</text>
            </view>
          </view>
        </view>

        <view class="dm-actions">
          <view v-if="detailPet.canAdopt" class="dm-btn primary" @click="adoptFromDetail">
            <text>领养（{{ detailPet.requiredPoints }} {{ scoreLabelOf(me) }}）</text>
          </view>
          <view v-else-if="detailPet.owned && detailPet.active" class="dm-btn disabled">
            <text>出战中</text>
          </view>
          <view v-else-if="detailPet.owned" class="dm-btn" @click="setActiveFromDetail">
            <text>设为出战</text>
          </view>
          <view v-else-if="detailPet.locked" class="dm-btn disabled">
            <text>还差 {{ detailPet.requiredPoints - scoreValueOf(me) }} 分</text>
          </view>
          <view v-else-if="detailPet.isDefault" class="dm-btn disabled">
            <text>初始宠物</text>
          </view>
        </view>
        <view class="dm-close" @click="detailPet = null"><text>关闭</text></view>
      </view>
    </view>

    <!-- 领养成功弹窗 -->
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
import { onShow } from '@dcloudio/uni-app'
import {
  members, getCurrentMember, setCurrentMember, isOnboarded,
  getCatalogWithOwnership, getMemberPets, getActivePet, adoptPet, switchActivePet,
  RARITY_INFO, stageFor, getPetAttrs, scoreValue as scoreValueOf, scoreLabel as scoreLabelOf,
  adoptModal,
} from '@/store/index.js'
import AdoptModal from '@/components/AdoptModal.vue'

const tab = ref('adopt')
const meId = ref('')
const catalog = ref([])
const myPets = ref([])
const detailPet = ref(null)

const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'common']

const me = computed(() => members.find(m => m.id === meId.value) || null)
const stage = computed(() => (me.value ? stageFor(me.value) : { stage: '—', level: 0, icon: '🌟' }))
const growPct = computed(() => {
  if (!me.value || !me.value.totalGrow) return 0
  return Math.round((me.value.grow / me.value.totalGrow) * 100)
})
const attrList = computed(() => {
  if (!me.value) return []
  const a = getPetAttrs(me.value)
  return [
    { key: 'strength', label: '力量', value: a.strength, color: '#FF6B6B' },
    { key: 'wisdom', label: '智慧', value: a.wisdom, color: '#6366F1' },
    { key: 'vitality', label: '活力', value: a.vitality, color: '#10B981' },
    { key: 'charm', label: '魅力', value: a.charm, color: '#F59E0B' },
  ]
})

const grouped = computed(() => {
  const g = {}
  catalog.value.forEach(p => {
    if (!g[p.rarity]) g[p.rarity] = []
    g[p.rarity].push(p)
  })
  return g
})

const ownedCount = computed(() => catalog.value.filter(p => p.owned).length)
const collectPercent = computed(() =>
  catalog.value.length === 0 ? 0 : Math.round((ownedCount.value / catalog.value.length) * 100)
)
const remainCount = computed(() => catalog.value.length - ownedCount.value)
const adoptableCount = computed(() => catalog.value.filter(p => p.canAdopt).length)
const activePet = computed(() => (me.value ? getActivePet(me.value.id) : null))

function rarityOf(pet) {
  return RARITY_INFO[pet.rarity] || { bg: '#F1F5F9', color: '#94A3B8', label: '普通' }
}

function refresh() {
  const m = getCurrentMember()
  if (!m) {
    uni.reLaunch({ url: '/pages/welcome/welcome' })
    return
  }
  meId.value = m.id
  // 保留当前详情弹窗的选中态（用最新数据刷新）
  const prevId = detailPet.value && detailPet.value.id
  catalog.value = getCatalogWithOwnership(m.id)
  myPets.value = getMemberPets(m.id)
  if (prevId) {
    detailPet.value = catalog.value.find(p => p.id === prevId) || null
  }
}

onShow(() => {
  if (!isOnboarded()) {
    uni.reLaunch({ url: '/pages/welcome/welcome' })
    return
  }
  refresh()
})

function switchRole() {
  const list = members.slice(0, 9)
  uni.showActionSheet({
    itemList: list.map(m => (m.id === meId.value ? '✓ ' + m.name + '（当前）' : m.name)),
    success: (res) => {
      const target = list[res.tapIndex]
      if (!target || target.id === meId.value) return
      if (setCurrentMember(target.id)) {
        uni.showToast({ title: '已切换为「' + target.name + '」', icon: 'none' })
        tab.value = 'adopt'
        refresh()
      }
    },
  })
}

function openDetail(pet) {
  detailPet.value = pet
}

function adoptFromDetail() {
  if (!me.value || !detailPet.value) return
  const r = adoptPet(me.value.id, detailPet.value.id)
  if (!r.success) {
    uni.showToast({ title: r.msg || '领养失败', icon: 'none' })
    return
  }
  detailPet.value = null
  refresh()
}

function setActiveFromDetail() {
  if (!me.value || !detailPet.value) return
  if (switchActivePet(me.value.id, detailPet.value.id)) {
    uni.showToast({ title: '已更换出战宠物', icon: 'success' })
    refresh()
  }
}

function switchPet(petId) {
  if (!me.value) return
  if (switchActivePet(me.value.id, petId)) refresh()
}

function goBattle() { uni.navigateTo({ url: '/pages/battle/battle' }) }
function openModel3D() { uni.navigateTo({ url: '/pages/model3d/model3d' }) }
</script>

<style scoped>
.page {
  padding: 20rpx 24rpx 40rpx;
  background: #FFF6F0;
  min-height: 100vh;
  min-height: 100dvh;
  box-sizing: border-box;
}

/* 当前身份 */
.who {
  display: flex; align-items: center; gap: 16rpx;
  padding: 20rpx 24rpx; border-radius: 24rpx;
  background: #FFFFFF; border: 2rpx solid #F0E4D8;
  box-shadow: 0 2rpx 8rpx rgba(138,108,78,0.06);
  margin-bottom: 18rpx;
}
.who-avatar {
  width: 70rpx; height: 70rpx; border-radius: 50%;
  border: 3rpx solid #FF8A65; overflow: hidden;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.who-img { width: 100%; height: 100%; }
.who-emoji { font-size: 34rpx; }
.who-body { flex: 1; min-width: 0; }
.who-name { font-size: 28rpx; font-weight: 800; color: #1E293B; display: block; }
.who-sub { font-size: 21rpx; color: #A8A29E; display: block; margin-top: 4rpx; }
.who-switch {
  padding: 10rpx 22rpx; border-radius: 26rpx;
  background: #FFF6F0; border: 2rpx solid #FFD9C2;
  font-size: 24rpx; font-weight: 600; color: #FF8A65;
}
.who-switch:active { transform: scale(0.95); }

/* Tab */
.tab-row {
  display: flex; background: #FFFFFF; border-radius: 24rpx;
  padding: 6rpx; margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.tab-item {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 16rpx 0; border-radius: 20rpx;
  transition: all 0.25s cubic-bezier(0.25,0.46,0.45,0.94);
}
.tab-item:active { transform: scale(0.96); }
.tab-item.active { background: linear-gradient(135deg, #FF8A65, #F97316); }
.tab-text { font-size: 25rpx; font-weight: 700; color: #78716C; }
.tab-item.active .tab-text { color: #FFFFFF; }

/* 收集进度 */
.collect-card {
  background: linear-gradient(135deg, #FFF1EC, #FFE8DE);
  border-radius: 22rpx; padding: 22rpx 24rpx;
  margin-bottom: 22rpx; border: 2rpx solid #FFD9C2;
}
.cc-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12rpx; }
.cc-title { font-size: 26rpx; font-weight: 800; color: #C2410C; }
.cc-num { font-size: 27rpx; font-weight: 800; color: #EA580C; }
.cc-track { height: 14rpx; background: rgba(255,255,255,0.75); border-radius: 7rpx; overflow: hidden; margin-bottom: 8rpx; }
.cc-fill { height: 100%; background: linear-gradient(90deg, #FF8A65, #F97316); border-radius: 7rpx; transition: width 0.6s ease; }
.cc-hint { font-size: 20rpx; color: #9A3412; }

/* 稀有度分组 */
.rarity-section { margin-bottom: 22rpx; }
.rarity-head { display: flex; align-items: center; gap: 14rpx; margin-bottom: 14rpx; }
.rarity-pill { display: flex; align-items: center; gap: 8rpx; padding: 6rpx 20rpx; border-radius: 30rpx; }
.rarity-dot { width: 10rpx; height: 10rpx; border-radius: 50%; }
.rarity-pill-text { font-size: 25rpx; font-weight: 800; }
.rarity-count { font-size: 20rpx; color: #A8A29E; font-weight: 600; margin-left: auto; }

/* 宠物网格 */
.pet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280rpx, 1fr));
  gap: 16rpx;
}
.pet-card {
  position: relative; background: #FFFFFF;
  border-radius: 22rpx; border: 2rpx solid #F0E8DE;
  padding: 26rpx 16rpx 18rpx;
  display: flex; flex-direction: column; align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(138,108,78,0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.pet-card:active { transform: scale(0.96); box-shadow: 0 8rpx 20rpx rgba(138,108,78,0.14); }
.pet-card.locked { background: #FBFAF8; border-color: #EFEAE2; box-shadow: none; }
.pet-flag {
  position: absolute; top: 12rpx; right: 12rpx;
  padding: 4rpx 14rpx; border-radius: 14rpx;
  font-size: 19rpx; font-weight: 700;
}
.pet-flag.owned { background: linear-gradient(135deg, #6366F1, #8B5CF6); }
.pet-flag.ready { background: linear-gradient(135deg, #34D399, #10B981); }
.pet-flag.lock { background: #F1F5F9; padding: 4rpx 12rpx; }
.pet-flag.owned .pet-flag-text, .pet-flag.ready .pet-flag-text { color: #FFFFFF; }
.pet-flag.lock .pet-flag-text { color: #94A3B8; }

.pet-icon {
  width: 92rpx; height: 92rpx; border-radius: 26rpx;
  display: flex; align-items: center; justify-content: center;
}
.pet-emoji { font-size: 50rpx; line-height: 1; }
.pet-emoji.gray { filter: grayscale(1); opacity: 0.55; }
.pet-name { margin-top: 14rpx; font-size: 27rpx; font-weight: 800; color: #1E293B; }
.pet-card.locked .pet-name { color: #94A3B8; }
.pet-species { margin-top: 2rpx; font-size: 20rpx; color: #A8A29E; }
.pet-meta { display: flex; gap: 10rpx; margin-top: 14rpx; }
.meta-chip { padding: 5rpx 14rpx; border-radius: 14rpx; background: #FFF7ED; }
.meta-text { font-size: 19rpx; font-weight: 700; color: #F59E0B; }
.meta-text.ok { color: #059669; }
.meta-chip.req { background: #F1F5F9; }
.meta-chip.req .meta-text { color: #94A3B8; }
.meta-chip.req.met { background: #ECFDF5; }
.meta-chip.req.met .meta-text { color: #059669; }
.meta-text.free { color: #F59E0B; }

/* 比武入口 */
.battle-entry {
  display: flex; align-items: center; gap: 12rpx;
  padding: 18rpx 24rpx; border-radius: 20rpx;
  background: linear-gradient(135deg, #FEF3C7, #FCE7F3);
  border: 2rpx solid #FDE68A; margin-bottom: 18rpx;
}
.battle-entry:active { transform: scale(0.98); }
.battle-icon { font-size: 34rpx; }
.battle-title { font-size: 25rpx; font-weight: 700; color: #92400E; }
.battle-sub { font-size: 20rpx; color: #B45309; }
.battle-arrow { margin-left: auto; font-size: 28rpx; color: #B45309; }

/* 我的宠物 */
.card {
  background: #FFFFFF; border-radius: 24rpx; padding: 22rpx 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.detail-body { display: flex; align-items: center; gap: 24rpx; padding-bottom: 18rpx; border-bottom: 2rpx solid #F5EEE7; }
.active-display { display: flex; flex-direction: column; align-items: center; gap: 4rpx; width: 180rpx; flex-shrink: 0; }
.big-icon { font-size: 68rpx; }
.active-name { font-size: 25rpx; font-weight: 700; color: #1E293B; }
.active-stage { font-size: 20rpx; font-weight: 600; }
.model3d-entry {
  margin-top: 10rpx; background: linear-gradient(135deg, #6366F1, #8B5CF6);
  border-radius: 16rpx; padding: 8rpx 20rpx;
}
.model3d-text { font-size: 18rpx; font-weight: 700; color: #FFFFFF; }

.grow-attrs { flex: 1; min-width: 0; }
.grow-row { display: flex; align-items: center; gap: 12rpx; }
.grow-title { font-size: 20rpx; font-weight: 600; color: #78716C; flex-shrink: 0; }
.progress-bar { flex: 1; height: 14rpx; background: #F3EDE5; border-radius: 7rpx; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 7rpx; transition: width 0.6s ease; }
.grow-percent { font-size: 22rpx; font-weight: 800; min-width: 56rpx; text-align: right; }
.grow-value { font-size: 18rpx; color: #A8A29E; text-align: right; display: block; margin-top: 4rpx; }
.attr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx 20rpx; margin-top: 14rpx; }
.attr-item { display: flex; align-items: center; gap: 12rpx; }
.attr-label { font-size: 18rpx; color: #78716C; flex-shrink: 0; width: 48rpx; }
.attr-bar { flex: 1; height: 10rpx; background: #F3EDE5; border-radius: 5rpx; overflow: hidden; }
.attr-fill { height: 100%; border-radius: 5rpx; transition: width 0.6s ease; }

.my-pets { margin-top: 18rpx; }
.switch-hint { display: block; font-size: 20rpx; color: #A88B6A; font-weight: 600; margin-bottom: 10rpx; }
.pets-scroll { white-space: nowrap; }
.pets-collection { display: flex; gap: 12rpx; }
.collection-pet {
  width: 132rpx; min-width: 132rpx;
  background: #F8FAFC; border-radius: 16rpx; border: 3rpx solid #E2E8F0;
  padding: 12rpx 10rpx;
  display: flex; flex-direction: column; align-items: center; gap: 4rpx;
}
.collection-pet:active { transform: scale(0.95); }
.collection-icon { font-size: 38rpx; }
.collection-name { font-size: 20rpx; font-weight: 700; color: #1E293B; }
.collection-rarity { padding: 2rpx 12rpx; border-radius: 10rpx; }
.collection-rarity-text { font-size: 16rpx; color: #FFFFFF; font-weight: 600; }

/* 详情弹窗 */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  z-index: 999; display: flex; align-items: center; justify-content: center;
  padding: 40rpx;
}
.modal-card {
  background: #FFFFFF; border-radius: 28rpx; padding: 36rpx 32rpx;
  width: 100%; max-width: 560rpx; max-height: 82vh; overflow-y: auto;
  text-align: center;
  animation: popIn 0.28s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes popIn { from { transform: scale(0.82); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.dm-icon-wrap {
  width: 140rpx; height: 140rpx; border-radius: 40rpx;
  margin: 0 auto 18rpx;
  display: flex; align-items: center; justify-content: center;
}
.dm-icon { font-size: 76rpx; }
.dm-name { font-size: 36rpx; font-weight: 800; color: #1E293B; display: block; }
.dm-species { font-size: 23rpx; color: #A8A29E; display: block; margin-top: 6rpx; }
.dm-power { font-size: 23rpx; color: #F59E0B; font-weight: 700; display: block; margin-top: 8rpx; }
.dm-desc { font-size: 25rpx; color: #64748B; line-height: 1.6; display: block; margin-top: 16rpx; text-align: left; }
.dm-skills { margin-top: 20rpx; display: flex; flex-direction: column; gap: 12rpx; }
.dm-skill {
  display: flex; align-items: center; gap: 14rpx; text-align: left;
  padding: 14rpx 18rpx; background: #F8FAFC; border-radius: 16rpx;
}
.dm-skill-icon { font-size: 32rpx; }
.dm-skill-body { flex: 1; min-width: 0; }
.dm-skill-name { font-size: 24rpx; font-weight: 700; color: #1E293B; display: block; }
.dm-skill-desc { font-size: 20rpx; color: #94A3B8; display: block; margin-top: 2rpx; }
.dm-actions { margin-top: 24rpx; }
.dm-btn {
  height: 84rpx; border-radius: 20rpx;
  background: #F1F5F9; color: #475569;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; font-weight: 700;
}
.dm-btn.primary { background: linear-gradient(135deg, #FF8A65, #F97316); color: #FFFFFF; }
.dm-btn.disabled { opacity: 0.5; }
.dm-btn:active { transform: scale(0.98); }
.dm-close { margin-top: 16rpx; font-size: 26rpx; color: #94A3B8; padding: 12rpx; }

/* 平板 */
@media screen and (min-width: 768px) {
  .page { padding: 18px 28px 28px; }
  .who { border-radius: 15px; padding: 12px 15px; }
  .who-avatar { width: 42px; height: 42px; }
  .who-name { font-size: 17px; }
  .who-sub { font-size: 13px; }
  .tab-text { font-size: 15px; }
  .pet-grid { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
  .pet-card { border-radius: 14px; padding: 16px 10px 12px; }
  .pet-icon { width: 56px; height: 56px; border-radius: 16px; }
  .pet-emoji { font-size: 30px; }
  .pet-name { font-size: 16px; margin-top: 9px; }
  .pet-species { font-size: 12px; }
  .cc-title { font-size: 16px; }
  .cc-num { font-size: 17px; }
  .dm-name { font-size: 22px; }
  .dm-desc { font-size: 15px; }
  .dm-btn { height: 50px; font-size: 17px; }
}
</style>
