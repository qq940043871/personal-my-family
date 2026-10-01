<template>
  <view v-if="visible" class="mmm-mask" @click.self="closeAll">
    <view class="mmm-panel">
      <view class="mmm-header">
        <text class="mmm-title">{{ title }}</text>
        <view class="mmm-close" @click="closeAll">
          <text class="mmm-close-icon">✕</text>
        </view>
      </view>

      <!-- ===== 列表模式：管理全部成员（含默认成员） ===== -->
      <template v-if="mode === 'list'">
        <view class="mmm-body">
          <view v-for="m in members" :key="m.id" class="mmm-row">
            <view class="mmm-row-avatar" :style="{ borderColor: m.themeColor }">
              <text class="mmm-row-emoji">{{ m.emoji }}</text>
            </view>
            <view class="mmm-row-info">
              <text class="mmm-row-name">{{ m.name }}</text>
              <text class="mmm-row-sub">{{ m.age }}岁 · {{ m.role }}</text>
            </view>
            <view class="mmm-row-btn" @click="openPets(m, 'list')">
              <text class="mmm-row-btn-icon">🐾</text>
            </view>
            <view class="mmm-row-btn" @click="openEdit(m)">
              <text class="mmm-row-btn-icon">✏️</text>
            </view>
            <view class="mmm-row-btn mmm-row-btn-danger" @click="onDelete(m)">
              <text class="mmm-row-btn-icon">🗑️</text>
            </view>
          </view>
        </view>
        <view class="mmm-footer">
          <view class="mmm-btn mmm-btn-primary mmm-btn-block" @click="openAdd">
            <text class="mmm-btn-primary-text">➕ 添加成员</text>
          </view>
        </view>
      </template>

      <!-- ===== 表单模式：新增 / 编辑 ===== -->
      <template v-else-if="mode === 'form'">
        <view class="mmm-body">
          <!-- 头像 emoji -->
          <text class="mmm-label">头像</text>
          <view class="mmm-emoji-row">
            <view
              v-for="e in EMOJI_PRESETS"
              :key="e"
              class="mmm-emoji-chip"
              :class="{ active: form.emoji === e }"
              @click="form.emoji = e"
            >
              <text class="mmm-emoji">{{ e }}</text>
            </view>
          </view>

          <!-- 姓名 -->
          <text class="mmm-label">姓名</text>
          <input
            v-model="form.name"
            class="mmm-input"
            placeholder="请输入姓名"
            placeholder-class="mmm-placeholder"
            maxlength="12"
          />

          <!-- 年龄 -->
          <text class="mmm-label">年龄</text>
          <input
            v-model="form.age"
            class="mmm-input"
            type="number"
            placeholder="请输入年龄"
            placeholder-class="mmm-placeholder"
            maxlength="3"
          />
          <text class="mmm-role-hint">角色将按年龄自动设置为：{{ roleHint }}</text>

          <!-- 主题色 -->
          <text class="mmm-label">主题色</text>
          <view class="mmm-color-row">
            <view
              v-for="c in COLOR_PRESETS"
              :key="c"
              class="mmm-color-chip"
              :class="{ active: form.themeColor === c }"
              :style="{ background: c }"
              @click="form.themeColor = c"
            >
              <text v-if="form.themeColor === c" class="mmm-color-check">✓</text>
            </view>
          </view>

          <!-- 宠物名 -->
          <text class="mmm-label">宠物名字</text>
          <input
            v-model="form.petName"
            class="mmm-input"
            placeholder="给小伙伴起个名字"
            placeholder-class="mmm-placeholder"
            maxlength="10"
          />

          <!-- 宠物管理入口（仅编辑已有成员时） -->
          <view v-if="isEdit" class="mmm-pet-entry" @click="openPets(editingMember, 'form')">
            <text class="mmm-pet-entry-text">🐾 宠物管理</text>
            <text class="mmm-pet-entry-sub">领养 / 出战 / 改名</text>
            <text class="mmm-pet-entry-arrow">›</text>
          </view>
        </view>

        <view class="mmm-footer">
          <view v-if="isEdit && !fromList" class="mmm-btn mmm-btn-danger" @click="onDelete(editingMember)">
            <text class="mmm-btn-danger-text">删除</text>
          </view>
          <view class="mmm-spacer"></view>
          <view class="mmm-btn mmm-btn-plain" @click="onCancel">
            <text class="mmm-btn-plain-text">取消</text>
          </view>
          <view class="mmm-btn mmm-btn-primary" @click="onSave">
            <text class="mmm-btn-primary-text">保存</text>
          </view>
        </view>
      </template>

      <!-- ===== 宠物管理模式：查看 / 出战 / 领养 / 改名 / 放归 ===== -->
      <template v-else-if="mode === 'pets'">
        <view class="mmm-body">
          <!-- 成员 + 积分概览 -->
          <view v-if="editingMember" class="mmp-member">
            <view class="mmp-member-avatar" :style="{ borderColor: editingMember.themeColor }">
              <text class="mmp-member-emoji">{{ editingMember.emoji }}</text>
            </view>
            <view class="mmp-member-info">
              <text class="mmp-member-name">{{ editingMember.name }} 的宠物</text>
              <text class="mmp-member-sub">已拥有 {{ ownedPets.length }} 只 · 可领养 {{ adoptablePets.length }} 只</text>
            </view>
            <view class="mmp-score" :style="{ background: editingMember.themeColor + '14' }">
              <text class="mmp-score-val" :style="{ color: editingMember.themeColor }">{{ memberScore }}</text>
              <text class="mmp-score-label">{{ scoreLabel }}</text>
            </view>
          </view>

          <!-- 我的宠物 -->
          <text class="mmm-label">🐾 我的宠物</text>
          <view v-if="ownedPets.length" class="mmp-owned-grid">
            <view
              v-for="pet in ownedPets"
              :key="pet.id"
              class="mmp-owned-card"
              :class="{ active: pet.active }"
              :style="pet.active ? { borderColor: editingMember.themeColor, background: editingMember.themeColor + '0F' } : {}"
              @click="onToggleActive(pet)"
            >
              <view v-if="pet.active" class="mmp-active-flag" :style="{ background: editingMember.themeColor }">
                <text class="mmp-active-flag-text">出战</text>
              </view>
              <text class="mmp-owned-icon">{{ pet.icon }}</text>
              <text class="mmp-owned-name">{{ pet.name }}</text>
              <view class="mmp-rarity" :style="{ background: RARITY_INFO[pet.rarity]?.color || '#94A3B8' }">
                <text class="mmp-rarity-text">{{ RARITY_INFO[pet.rarity]?.label || '' }}</text>
              </view>
              <view class="mmp-owned-actions">
                <view class="mmp-act" @click.stop="onRename(pet)">
                  <text class="mmp-act-icon">✏️</text>
                </view>
                <view class="mmp-act mmp-act-danger" @click.stop="onRelease(pet)">
                  <text class="mmp-act-icon">🗑️</text>
                </view>
              </view>
            </view>
          </view>
          <view v-else class="mmp-empty">
            <text class="mmp-empty-text">还没有宠物，从下面领养一只吧 🐣</text>
          </view>
          <text v-if="ownedPets.length > 1" class="mmp-hint">👆 点击宠物卡片切换出战</text>

          <!-- 可领养 -->
          <text class="mmm-label">🎁 可领养的宠物</text>
          <view class="mmp-adopt-grid">
            <view
              v-for="pet in adoptablePets"
              :key="pet.id"
              class="mmp-adopt-card"
              :class="{ locked: !pet.unlocked }"
              @click="detailPet = pet"
            >
              <text class="mmp-adopt-icon" :class="{ gray: !pet.unlocked }">{{ pet.icon }}</text>
              <text class="mmp-adopt-name">{{ pet.name }}</text>
              <view class="mmp-adopt-req" :class="{ met: pet.unlocked }">
                <text class="mmp-adopt-req-text">
                  {{ pet.requiredPoints > 0 ? (pet.unlocked ? '✓ 可领养' : '🔒 ' + pet.requiredPoints + '分') : '免费领' }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <view class="mmm-footer">
          <view class="mmm-btn mmm-btn-plain mmm-btn-block" @click="backFromPets">
            <text class="mmm-btn-plain-text">返回</text>
          </view>
        </view>
      </template>
    </view>

    <!-- 宠物详情（领养前确认） -->
    <PetDetailModal
      :visible="!!detailPet"
      :pet="detailPet"
      :member="editingMember"
      @close="detailPet = null"
      @adopt="onAdoptFromDetail"
    />

    <!-- 领养成功庆祝 -->
    <AdoptModal
      :visible="adoptModal.show"
      :pet="adoptModal.pet"
      :member="adoptModal.member"
      @close="adoptModal.show = false"
    />
  </view>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  members, adoptModal,
  addMember, updateMember, removeMember, roleForAge,
  getMemberPets, getAllCatalogPets, switchActivePet, adoptPet, renamePet, releasePet,
  RARITY_INFO,
} from '@/store/index.js'
import AdoptModal from '@/components/AdoptModal.vue'
import PetDetailModal from '@/components/PetDetailModal.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  // null = 列表管理模式；传成员对象 = 直接进入编辑/宠物管理模式
  member: { type: Object, default: null },
  // 传 member 时打开的初始视图：edit = 编辑资料（默认），pets = 宠物管理
  view: { type: String, default: 'edit' },
})

const emit = defineEmits(['close', 'saved'])

const EMOJI_PRESETS = ['👨', '👩', '👦', '👧', '👶', '👵', '👴', '🧑']
const COLOR_PRESETS = ['#2563EB', '#EC4899', '#F59E0B', '#FBBF24', '#A88B6A', '#10B981', '#8B5CF6', '#EF4444']

const mode = ref('list') // list | form | pets
const editingMember = ref(null)
// 从列表/表单进入表单或宠物页时，取消/保存/返回后回到来源页面而非关闭弹窗
const fromList = ref(false)
const petsFrom = ref('list') // pets 页返回目标：list | form
const detailPet = ref(null)

const form = reactive({
  name: '',
  age: '',
  emoji: '🧑',
  themeColor: COLOR_PRESETS[5],
  petName: '',
})

const isEdit = computed(() => !!editingMember.value)

const title = computed(() => {
  if (mode.value === 'list') return '成员管理'
  if (mode.value === 'pets') return '宠物管理'
  return isEdit.value ? '编辑成员' : '添加成员'
})

const roleHint = computed(() => {
  const age = Number(form.age)
  if (!age && age !== 0) return '—'
  return roleForAge(age)
})

// 打开时初始化模式与表单数据
watch(() => props.visible, (val) => {
  if (!val) return
  if (props.member) {
    if (props.view === 'pets') {
      openPets(props.member, 'list')
    } else {
      fromList.value = false
      fillForm(props.member)
    }
  } else {
    fromList.value = true
    mode.value = 'list'
    editingMember.value = null
  }
})

function fillForm(member) {
  editingMember.value = member
  mode.value = 'form'
  form.name = member.name
  form.age = String(member.age)
  form.emoji = member.emoji || EMOJI_PRESETS[7]
  form.themeColor = member.themeColor || COLOR_PRESETS[5]
  form.petName = member.pet?.name || ''
}

function openAdd() {
  fromList.value = true
  editingMember.value = null
  form.name = ''
  form.age = ''
  form.emoji = EMOJI_PRESETS[7]
  form.themeColor = COLOR_PRESETS[5]
  form.petName = ''
  mode.value = 'form'
}

function openEdit(member) {
  fromList.value = true
  fillForm(member)
}

// ===== 宠物管理模式 =====

const ownedPets = computed(() =>
  editingMember.value ? getMemberPets(editingMember.value.id) : []
)

const adoptablePets = computed(() =>
  editingMember.value ? getAllCatalogPets(editingMember.value.id) : []
)

const memberScore = computed(() => {
  const m = editingMember.value
  if (!m) return 0
  if (m.age <= 4) return m.stars || 0
  if (m.age >= 55) return m.grace || 0
  return m.points || 0
})

const scoreLabel = computed(() => {
  const m = editingMember.value
  if (!m) return '积分'
  if (m.age <= 4) return '星星'
  if (m.age >= 55) return '恩典值'
  return '积分'
})

function openPets(member, from = 'list') {
  if (!member) return
  editingMember.value = member
  petsFrom.value = from
  detailPet.value = null
  mode.value = 'pets'
}

function backFromPets() {
  detailPet.value = null
  if (petsFrom.value === 'form' && editingMember.value) {
    mode.value = 'form'
  } else {
    mode.value = 'list'
  }
}

// 点击已拥有宠物：切换出战
function onToggleActive(pet) {
  const m = editingMember.value
  if (!m || pet.active) return
  if (switchActivePet(m.id, pet.id)) {
    uni.showToast({ title: `出战：${pet.name}`, icon: 'none' })
  }
}

// 改名（空名恢复图鉴默认名）
function onRename(pet) {
  const m = editingMember.value
  if (!m) return
  uni.showModal({
    title: `给「${pet.name}」改名`,
    editable: true,
    content: pet.name,
    placeholderText: '输入新名字（留空恢复默认）',
    success: (res) => {
      if (!res.confirm) return
      const result = renamePet(m.id, pet.id, res.content)
      if (result.success) {
        uni.showToast({ title: '已改名', icon: 'success' })
      } else {
        uni.showToast({ title: result.msg || '改名失败', icon: 'none' })
      }
    },
  })
}

// 放归（可重新领养）
function onRelease(pet) {
  const m = editingMember.value
  if (!m) return
  uni.showModal({
    title: '放归宠物',
    content: `确定将「${pet.name}」放归吗？放归后可以重新领养。`,
    confirmText: '放归',
    confirmColor: '#EF4444',
    success: (res) => {
      if (!res.confirm) return
      const result = releasePet(m.id, pet.id)
      if (result.success) {
        uni.showToast({ title: '已放归', icon: 'success' })
      } else {
        uni.showToast({ title: result.msg || '放归失败', icon: 'none' })
      }
    },
  })
}

// 宠物详情弹窗里确认领养
function onAdoptFromDetail(pet) {
  const m = editingMember.value
  detailPet.value = null
  if (!m || !pet) return
  const result = adoptPet(m.id, pet.id)
  if (!result.success) {
    uni.showToast({ title: result.msg || '领养失败', icon: 'none' })
  }
}

function closeAll() {
  emit('close')
}

function onCancel() {
  if (fromList.value) {
    mode.value = 'list'
    editingMember.value = null
  } else {
    closeAll()
  }
}

function onSave() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入姓名', icon: 'none' })
    return
  }
  const age = Number(form.age)
  if (Number.isNaN(age) || form.age === '' || age < 0 || age > 120) {
    uni.showToast({ title: '请输入正确的年龄（0-120）', icon: 'none' })
    return
  }
  const data = {
    name: form.name,
    age,
    emoji: form.emoji,
    themeColor: form.themeColor,
    petName: form.petName,
  }
  if (isEdit.value) {
    updateMember(editingMember.value.id, data)
    uni.showToast({ title: '已保存', icon: 'success' })
  } else {
    addMember(data)
    uni.showToast({ title: '已添加', icon: 'success' })
  }
  emit('saved')
  onCancel()
}

function onDelete(member) {
  if (!member) return
  uni.showModal({
    title: '删除成员',
    content: `确定删除「${member.name}」吗？该成员的签到数据将一并清除。`,
    confirmText: '删除',
    confirmColor: '#EF4444',
    success: (res) => {
      if (!res.confirm) return
      const result = removeMember(member.id)
      if (!result.success) {
        uni.showToast({ title: result.msg || '删除失败', icon: 'none' })
        return
      }
      uni.showToast({ title: '已删除', icon: 'success' })
      emit('saved')
      if (mode.value === 'form') {
        closeAll()
      }
    },
  })
}
</script>

<style scoped>
/* 全部使用 px 单位：该弹窗同时用于移动端页面与平板三栏布局（rpx 会被放大） */
.mmm-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.mmm-panel {
  width: 480px;
  max-width: 92vw;
  max-height: 86vh;
  background: #FFFFFF;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
}
.mmm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 8px;
  flex-shrink: 0;
}
.mmm-title {
  font-size: 20px;
  font-weight: 800;
  color: #1A1A1A;
}
.mmm-close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mmm-close-icon {
  font-size: 15px;
  color: #64748B;
}
.mmm-body {
  flex: 1;
  min-height: 0;
  padding: 4px 20px;
  box-sizing: border-box;
  overflow-y: auto;
}
.mmm-body::-webkit-scrollbar {
  width: 4px;
}
.mmm-body::-webkit-scrollbar-thumb {
  background: #E2D6CC;
  border-radius: 2px;
}

/* ===== 列表模式 ===== */
.mmm-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #F8FAFC;
}
.mmm-row:last-child {
  border-bottom: none;
}
.mmm-row-avatar {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  border: 2px solid #E2D6CC;
  background: #F8FAFC;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mmm-row-emoji {
  font-size: 22px;
}
.mmm-row-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mmm-row-name {
  font-size: 16px;
  font-weight: 700;
  color: #1A1A1A;
}
.mmm-row-sub {
  font-size: 12px;
  color: #8A8178;
}
.mmm-row-btn {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 10px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.mmm-row-btn:active {
  transform: scale(0.92);
  background: #FFF6F0;
}
.mmm-row-btn-danger {
  background: #FEF2F2;
  border-color: #FECACA;
}
.mmm-row-btn-danger:active {
  background: #FEE2E2;
}
.mmm-row-btn-icon {
  font-size: 16px;
}

.mmm-label {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #475569;
  margin: 12px 0 8px;
}
.mmm-emoji-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.mmm-emoji-chip {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #F8FAFC;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.mmm-emoji-chip.active {
  border-color: #FF8A65;
  background: #FFF6F0;
}
.mmm-emoji {
  font-size: 24px;
}
.mmm-input {
  width: 100%;
  height: 48px;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  padding: 0 14px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}
.mmm-input :deep(input) {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #1A1A1A;
}
.mmm-placeholder {
  color: #94A3B8;
}
.mmm-role-hint {
  display: block;
  font-size: 13px;
  color: #8A8178;
  margin-top: 6px;
}
.mmm-color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.mmm-color-chip {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 3px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}
.mmm-color-chip.active {
  border-color: #1A1A1A;
  transform: scale(1.1);
}
.mmm-color-check {
  font-size: 16px;
  color: #FFFFFF;
  font-weight: 800;
}
.mmm-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px 18px;
  flex-shrink: 0;
}
.mmm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  padding: 10px 22px;
  transition: transform 0.15s ease;
}
.mmm-btn:active {
  transform: scale(0.95);
}
.mmm-btn-block {
  flex: 1;
}
.mmm-btn-danger {
  background: #FEF2F2;
  border: 1.5px solid #FECACA;
}
.mmm-btn-danger-text {
  font-size: 16px;
  font-weight: 700;
  color: #EF4444;
}
.mmm-spacer {
  flex: 1;
}
.mmm-btn-plain {
  background: #F3F4F6;
}
.mmm-btn-plain-text {
  font-size: 16px;
  font-weight: 700;
  color: #475569;
}
.mmm-btn-primary {
  background: linear-gradient(135deg, #FF8A65, #FF6B6B);
}
.mmm-btn-primary-text {
  font-size: 16px;
  font-weight: 800;
  color: #FFFFFF;
}

/* ===== 表单模式：宠物管理入口 ===== */
.mmm-pet-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0 6px;
  padding: 12px 14px;
  background: #FFF6F0;
  border: 1.5px dashed #FFB088;
  border-radius: 12px;
  transition: transform 0.15s ease, background 0.15s ease;
}
.mmm-pet-entry:active {
  transform: scale(0.98);
  background: #FFEDD5;
}
.mmm-pet-entry-text {
  font-size: 15px;
  font-weight: 700;
  color: #FF8A65;
}
.mmm-pet-entry-sub {
  font-size: 12px;
  color: #C4A88E;
}
.mmm-pet-entry-arrow {
  margin-left: auto;
  font-size: 20px;
  font-weight: 800;
  color: #FF8A65;
}

/* ===== 宠物管理模式 ===== */
.mmp-member {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0 4px;
}
.mmp-member-avatar {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  border: 2px solid #E2D6CC;
  background: #F8FAFC;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mmp-member-emoji {
  font-size: 24px;
}
.mmp-member-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mmp-member-name {
  font-size: 16px;
  font-weight: 800;
  color: #1A1A1A;
}
.mmp-member-sub {
  font-size: 12px;
  color: #8A8178;
}
.mmp-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 6px 14px;
  border-radius: 12px;
  flex-shrink: 0;
}
.mmp-score-val {
  font-size: 16px;
  font-weight: 800;
}
.mmp-score-label {
  font-size: 10px;
  color: #8A8178;
}

.mmp-owned-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.mmp-owned-card {
  position: relative;
  background: #F8FAFC;
  border: 2px solid #E2E8F0;
  border-radius: 14px;
  padding: 14px 6px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: transform 0.15s ease;
}
.mmp-owned-card:active {
  transform: scale(0.95);
}
.mmp-active-flag {
  position: absolute;
  top: -2px;
  right: -2px;
  padding: 2px 8px;
  border-radius: 10px 12px 0 10px;
}
.mmp-active-flag-text {
  font-size: 10px;
  color: #FFFFFF;
  font-weight: 700;
}
.mmp-owned-icon {
  font-size: 30px;
  line-height: 1.2;
}
.mmp-owned-name {
  font-size: 13px;
  font-weight: 700;
  color: #1E293B;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mmp-rarity {
  padding: 1px 8px;
  border-radius: 8px;
}
.mmp-rarity-text {
  font-size: 10px;
  color: #FFFFFF;
  font-weight: 600;
}
.mmp-owned-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.mmp-act {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mmp-act:active {
  transform: scale(0.9);
  background: #FFF6F0;
}
.mmp-act-danger {
  border-color: #FECACA;
  background: #FEF2F2;
}
.mmp-act-danger:active {
  background: #FEE2E2;
}
.mmp-act-icon {
  font-size: 12px;
}
.mmp-empty {
  padding: 18px 0;
  text-align: center;
  background: #F8FAFC;
  border-radius: 12px;
}
.mmp-empty-text {
  font-size: 13px;
  color: #94A3B8;
}
.mmp-hint {
  display: block;
  font-size: 12px;
  color: #A88B6A;
  margin-top: 8px;
}

.mmp-adopt-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding-bottom: 8px;
}
.mmp-adopt-card {
  background: #FFFFFF;
  border: 1.5px solid #F0E8DE;
  border-radius: 12px;
  padding: 10px 4px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  transition: transform 0.15s ease;
}
.mmp-adopt-card:active {
  transform: scale(0.94);
}
.mmp-adopt-card.locked {
  background: #FBFAF8;
}
.mmp-adopt-icon {
  font-size: 26px;
  line-height: 1.2;
}
.mmp-adopt-icon.gray {
  filter: grayscale(1);
  opacity: 0.5;
}
.mmp-adopt-name {
  font-size: 11px;
  font-weight: 700;
  color: #1E293B;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mmp-adopt-card.locked .mmp-adopt-name {
  color: #94A3B8;
}
.mmp-adopt-req {
  padding: 1px 7px;
  border-radius: 8px;
  background: #F1F5F9;
}
.mmp-adopt-req.met {
  background: #ECFDF5;
}
.mmp-adopt-req-text {
  font-size: 9px;
  font-weight: 700;
  color: #94A3B8;
  white-space: nowrap;
}
.mmp-adopt-req.met .mmp-adopt-req-text {
  color: #059669;
}
</style>
