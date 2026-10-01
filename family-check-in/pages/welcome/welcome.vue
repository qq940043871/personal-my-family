<template>
  <view class="page">
    <view class="hero">
      <text class="hero-emoji">🏡</text>
      <text class="hero-title">欢迎回家</text>
      <text class="hero-sub">先告诉大家，你是谁呀？</text>
    </view>

    <!-- 家庭名 -->
    <view class="card">
      <text class="card-label">我们的家叫什么</text>
      <input
        class="input"
        v-model="familyName"
        placeholder="我们家"
        maxlength="12"
        placeholder-class="ph"
      />
    </view>

    <!-- 身份选择 -->
    <view class="card">
      <view class="card-head">
        <text class="card-label">我是谁</text>
        <text class="card-hint" v-if="!creating">点一下选中自己</text>
      </view>

      <view class="identity-grid" v-if="!creating">
        <view
          v-for="m in members"
          :key="m.id"
          class="identity"
          :class="{ active: selectedId === m.id }"
          :style="selectedId === m.id ? { borderColor: m.themeColor, background: m.themeColor + '14' } : {}"
          @click="selectMember(m.id)"
        >
          <view class="identity-avatar" :style="{ borderColor: selectedId === m.id ? m.themeColor : '#E2D6CC' }">
            <image v-if="m.avatarUrl" :src="m.avatarUrl" class="avatar-img" mode="aspectFill" />
            <text v-else class="avatar-emoji">{{ m.emoji }}</text>
          </view>
          <text class="identity-name" :style="selectedId === m.id ? { color: m.themeColor } : {}">{{ m.name }}</text>
          <text class="identity-role">{{ m.age }}岁 · {{ m.role }}</text>
          <text v-if="selectedId === m.id" class="identity-check">✓</text>
        </view>
      </view>

      <!-- 新建身份 -->
      <view class="create-form" v-else>
        <view class="form-row">
          <text class="form-label">名字</text>
          <input class="input flex1" v-model="newName" placeholder="怎么称呼你" maxlength="10" placeholder-class="ph" />
        </view>
        <view class="form-row">
          <text class="form-label">年龄</text>
          <input class="input flex1" v-model="newAge" type="number" placeholder="1 - 120" placeholder-class="ph" />
        </view>
        <text class="form-tip" v-if="roleHint">将创建为「{{ roleHint }}」，成长体系自动匹配</text>
        <view class="form-actions">
          <view class="btn-ghost" @click="cancelCreate"><text>取消</text></view>
          <view class="btn-text" @click="confirm"><text>就这么定</text></view>
        </view>
      </view>

      <view class="add-identity" v-if="!creating" @click="startCreate">
        <text class="add-icon">＋</text>
        <text class="add-text">我不是上面任何一个，新建身份</text>
      </view>
    </view>

    <!-- 确认 -->
    <view class="confirm-wrap">
      <view class="confirm-btn" :class="{ disabled: !canConfirm }" @click="confirm">
        <text>{{ creating ? '创建并进入' : '就是我了，进入' }}</text>
      </view>
      <text class="confirm-tip" v-if="selectedMember">当前选择：{{ selectedMember.emoji }} {{ selectedMember.name }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { members, addMember, setFamilyInfo, getFamilyInfo, setCurrentMember, isOnboarded, roleForAge } from '@/store/index.js'

const selectedId = ref('')
const creating = ref(false)
const newName = ref('')
const newAge = ref('')
const familyName = ref('我们家')

const selectedMember = computed(() => members.find(m => m.id === selectedId.value) || null)

const roleHint = computed(() => {
  const age = parseInt(newAge.value, 10)
  if (!age || age < 1 || age > 120) return ''
  return roleForAge(age)
})

const canConfirm = computed(() => creating.value ? true : !!selectedId.value)

function emojiForAge(age) {
  if (age <= 4) return '👶'
  if (age <= 17) return '🧒'
  if (age >= 55) return '👴'
  return '🧑'
}

function refresh() {
  familyName.value = getFamilyInfo().name
}

onMounted(() => {
  // 已完成引导 → 直接进首页，避免闪屏
  if (isOnboarded()) {
    uni.switchTab({ url: '/pages/index/index' })
    return
  }
  refresh()
})

onShow(() => {
  if (isOnboarded() && !creating.value && !selectedId.value) {
    uni.switchTab({ url: '/pages/index/index' })
  }
})

function selectMember(id) {
  selectedId.value = selectedId.value === id ? '' : id
  creating.value = false
}

function startCreate() {
  creating.value = true
  selectedId.value = ''
}

function cancelCreate() {
  creating.value = false
  newName.value = ''
  newAge.value = ''
}

function confirm() {
  let id = selectedId.value

  if (creating.value) {
    const name = (newName.value || '').trim()
    if (!name) {
      uni.showToast({ title: '先给自己起个名字吧', icon: 'none' })
      return
    }
    const age = parseInt(newAge.value, 10)
    if (!age || age < 1 || age > 120) {
      uni.showToast({ title: '请填写 1-120 的年龄', icon: 'none' })
      return
    }
    const member = addMember({ name, age, emoji: emojiForAge(age) })
    id = member.id
  }

  if (!id) {
    uni.showToast({ title: '选择「我是谁」', icon: 'none' })
    return
  }

  const name = (familyName.value || '').trim()
  if (name) setFamilyInfo({ name })
  setCurrentMember(id)

  uni.showToast({ title: '欢迎回家', icon: 'success' })
  setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 500)
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(180deg, #FFF6F0 0%, #FFEFE4 100%);
  padding: 60rpx 40rpx 48rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.hero { text-align: center; margin-bottom: 8rpx; }
.hero-emoji { font-size: 96rpx; display: block; }
.hero-title { font-size: 48rpx; font-weight: 800; color: #1E293B; display: block; margin-top: 12rpx; }
.hero-sub { font-size: 28rpx; color: #94A3B8; display: block; margin-top: 8rpx; }

.card {
  background: #FFFFFF;
  border-radius: 28rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(138, 108, 78, 0.06);
}
.card-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20rpx; }
.card-label { font-size: 28rpx; font-weight: 700; color: #1E293B; display: block; margin-bottom: 16rpx; }
.card-head .card-label { margin-bottom: 0; }
.card-hint { font-size: 22rpx; color: #A8A29E; }

.input {
  height: 80rpx;
  background: #F8FAFC;
  border: 2rpx solid #E2E8F0;
  border-radius: 18rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #1E293B;
  box-sizing: border-box;
}
.ph { color: #CBD5E1; }

.identity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200rpx, 1fr));
  gap: 16rpx;
}
.identity {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: 22rpx 12rpx;
  border-radius: 22rpx;
  border: 3rpx solid #F0E4D8;
  background: #FFFDFB;
  transition: all 0.2s ease;
}
.identity:active { transform: scale(0.96); }
.identity-avatar {
  width: 84rpx; height: 84rpx;
  border-radius: 50%;
  border: 3rpx solid #E2D6CC;
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #F8FAFC;
}
.avatar-img { width: 100%; height: 100%; }
.avatar-emoji { font-size: 42rpx; }
.identity-name { font-size: 27rpx; font-weight: 700; color: #1E293B; }
.identity-role { font-size: 21rpx; color: #A8A29E; }
.identity-check {
  position: absolute; top: 10rpx; right: 14rpx;
  font-size: 24rpx; color: #10B981; font-weight: 800;
}

.create-form { display: flex; flex-direction: column; gap: 18rpx; }
.form-row { display: flex; align-items: center; gap: 18rpx; }
.form-label { font-size: 26rpx; color: #64748B; width: 88rpx; flex-shrink: 0; }
.flex1 { flex: 1; }
.form-tip { font-size: 24rpx; color: #FF8A65; font-weight: 600; }
.form-actions { display: flex; gap: 16rpx; margin-top: 8rpx; }
.btn-ghost {
  flex: 1; height: 80rpx; border-radius: 18rpx;
  border: 2rpx solid #E2E8F0; background: #FFFFFF;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; color: #64748B;
}
.btn-text {
  flex: 1.6; height: 80rpx; border-radius: 18rpx;
  background: linear-gradient(135deg, #FF8A65, #F97316);
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; font-weight: 700; color: #FFFFFF;
}
.btn-ghost:active, .btn-text:active { transform: scale(0.97); }

.add-identity {
  display: flex; align-items: center; justify-content: center; gap: 10rpx;
  margin-top: 20rpx; padding: 22rpx;
  border: 3rpx dashed #FFD9C2; border-radius: 20rpx;
  background: #FFF8F3;
}
.add-identity:active { transform: scale(0.98); background: #FFEDD5; }
.add-icon { font-size: 32rpx; color: #FF8A65; font-weight: 800; }
.add-text { font-size: 26rpx; font-weight: 600; color: #FF8A65; }

.confirm-wrap { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 14rpx; }
.confirm-btn {
  width: 100%; height: 96rpx; border-radius: 24rpx;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; font-weight: 800; color: #FFFFFF;
  box-shadow: 0 8rpx 24rpx rgba(79, 70, 229, 0.28);
  transition: all 0.2s ease;
}
.confirm-btn:active { transform: scale(0.98); }
.confirm-btn.disabled { opacity: 0.35; box-shadow: none; }
.confirm-tip { font-size: 24rpx; color: #A8A29E; }

/* 平板横屏：内容收窄居中，避免被拉满 */
@media screen and (min-width: 768px) {
  .page {
    padding: 40px 28px 32px;
    max-width: 760px;
    margin: 0 auto;
  }
  .hero-emoji { font-size: 64px; }
  .hero-title { font-size: 34px; margin-top: 8px; }
  .hero-sub { font-size: 17px; }
  .card { border-radius: 18px; padding: 18px; }
  .card-label { font-size: 17px; margin-bottom: 10px; }
  .input { height: 46px; border-radius: 11px; font-size: 16px; padding: 0 14px; }
  .identity-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
  .identity { border-radius: 14px; padding: 14px 8px; border-width: 2px; }
  .identity-avatar { width: 52px; height: 52px; }
  .avatar-emoji { font-size: 26px; }
  .identity-name { font-size: 16px; }
  .identity-role { font-size: 13px; }
  .add-text { font-size: 16px; }
  .confirm-btn { height: 56px; border-radius: 14px; font-size: 19px; }
}
</style>
