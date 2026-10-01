<template>
  <view class="page">
    <!-- 当前身份 -->
    <view class="who" v-if="me">
      <view class="who-avatar" :style="{ borderColor: me.themeColor, background: me.themeColor + '18' }">
        <image v-if="me.avatarUrl" :src="me.avatarUrl" class="who-img" mode="aspectFill" />
        <text v-else class="who-emoji">{{ me.emoji }}</text>
      </view>
      <view class="who-body">
        <text class="who-name">{{ me.name }} 的今日任务</text>
        <text class="who-sub">{{ me.age }}岁 · {{ me.role }} · 📷 签到需拍照</text>
      </view>
      <view class="who-switch" @click="switchRole">
        <text>切换</text>
      </view>
    </view>

    <!-- 进度 -->
    <view class="progress-strip" v-if="me">
      <view class="ps-track">
        <view class="ps-fill" :style="{ width: rate + '%', background: me.themeColor }"></view>
      </view>
      <text class="ps-num">{{ doneCount }}/{{ tasks.length }} 已完成</text>
    </view>

    <!-- 任务列表 -->
    <view class="card">
      <view class="task-list">
        <view
          v-for="t in tasks"
          :key="t.id"
          class="task-row"
          :class="{ done: t.done }"
          :style="{ borderColor: t.done ? ((me ? me.themeColor : '#FF8A65') + '33') : '#F3EDE5' }"
        >
          <view class="tr-icon" :style="{ background: (me ? me.themeColor : '#FF8A65') + '18' }">
            <text>{{ t.icon }}</text>
          </view>
          <view class="tr-body" @click="onTaskTap(t)">
            <text class="tr-name">{{ t.name }}</text>
            <text class="tr-meta">{{ t.category }} · +{{ t.points }}</text>
            <text class="tr-photo-hint" v-if="t.done && !t.hasPhoto">未拍照</text>
            <text class="tr-photo-hint ok" v-else-if="t.hasPhoto">📷 已拍照</text>
          </view>

          <!-- 已签到：缩略图 + 重拍/删除 -->
          <view class="tr-thumb-wrap" v-if="t.done && t.hasPhoto">
            <image :src="t.photo" class="tr-thumb" mode="aspectFill" @click="previewPhoto(t.photo)" />
            <view class="thumb-actions">
              <text class="ta-btn" @click="retakePhoto(t)">重拍</text>
              <text class="ta-btn danger" @click="removePhoto(t)">删除</text>
            </view>
          </view>

          <!-- 未签到：拍照按钮 -->
          <view v-else-if="!t.done" class="tr-camera" :style="{ background: me ? me.themeColor : '#FF8A65' }" @click="onCamera(t)">
            <text>📷</text>
          </view>

          <view v-else class="tr-done-mark">
            <text>✓</text>
          </view>
        </view>
      </view>
      <view v-if="tasks.length === 0" class="empty">
        <text class="empty-icon">🎉</text>
        <text class="empty-text">暂无任务</text>
      </view>
    </view>

    <!-- 我的照片墙 -->
    <view class="card" v-if="myPhotos.length">
      <view class="card-header">
        <text class="card-title">📷 我的签到照片</text>
        <text class="card-more" @click="previewPhoto(myPhotos[0].photo)">{{ myPhotos.length }} 张</text>
      </view>
      <scroll-view scroll-x class="photo-scroll" :show-scrollbar="false">
        <view class="photo-row">
          <view v-for="p in myPhotos" :key="p.taskId" class="photo-item" @click="previewPhoto(p.photo)">
            <image :src="p.photo" class="photo-img" mode="aspectFill" />
            <text class="photo-task">{{ p.icon }} {{ p.taskName }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <CheckinModal
      :visible="modal.show"
      :member="modal.member"
      :task="modal.task"
      :evolved="modal.evolved"
      :newStage="modal.newStage"
      :photo="modal.photo"
      :verse="modal.verse"
      :stars="modal.stars"
      @close="modal.show = false"
    />
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  members, getCurrentMember, setCurrentMember, isOnboarded,
  doCheckin, updateTaskPhoto, clearTaskPhoto, getMemberPhotos, doneRate,
} from '@/store/index.js'
import CheckinModal from '@/components/CheckinModal.vue'

const modal = reactive({ show: false, member: null, task: null, evolved: false, newStage: null, photo: '', verse: null, stars: 0 })
const meId = ref('')
const tasks = ref([])
const myPhotos = ref([])

const me = computed(() => members.find(m => m.id === meId.value) || null)
const doneCount = computed(() => tasks.value.filter(t => t.done).length)
const rate = computed(() => (me.value ? doneRate(me.value) : 0))
const videoList = computed(() => myPhotos.value.map(p => p.photo))

function refresh() {
  const m = getCurrentMember()
  if (!m) {
    uni.reLaunch({ url: '/pages/welcome/welcome' })
    return
  }
  meId.value = m.id
  const sorted = m.tasks.slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0))
  tasks.value = sorted.map(t => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    category: t.category,
    points: t.points || t.grace || 0,
    done: t.done,
    photo: t.photo || '',
    hasPhoto: !!t.photo,
  }))
  myPhotos.value = getMemberPhotos(m.id)
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
        refresh()
      }
    },
  })
}

function onTaskTap(t) {
  if (t.done) {
    if (t.photo) previewPhoto(t.photo)
    return
  }
  onCamera(t)
}

function choosePhoto(onOk) {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      const photoPath = res.tempFilePaths && res.tempFilePaths[0]
      if (photoPath) onOk(photoPath)
    },
    fail: (err) => {
      if (err && err.errMsg !== 'chooseImage:fail cancel') {
        uni.showToast({ title: '拍照失败，请重试', icon: 'none' })
      }
    },
  })
}

function onCamera(t) {
  if (!me.value || t.done) return
  choosePhoto((photoPath) => doCheckinTask(me.value.id, t.id, photoPath))
}

function retakePhoto(t) {
  if (!me.value) return
  choosePhoto((photoPath) => {
    const r = updateTaskPhoto(me.value.id, t.id, photoPath)
    if (r.success) {
      uni.showToast({ title: '照片已更新', icon: 'success' })
      refresh()
    } else {
      uni.showToast({ title: r.msg || '重拍失败', icon: 'none' })
    }
  })
}

function removePhoto(t) {
  if (!me.value) return
  uni.showModal({
    title: '删除照片',
    content: '删除后任务仍算已完成，可重新拍照补上。确定删除吗？',
    confirmText: '删除',
    confirmColor: '#EF4444',
    success: (res) => {
      if (!res.confirm) return
      const r = clearTaskPhoto(me.value.id, t.id)
      if (r.success) {
        uni.showToast({ title: '已删除', icon: 'success' })
        refresh()
      } else {
        uni.showToast({ title: r.msg || '删除失败', icon: 'none' })
      }
    },
  })
}

function previewPhoto(src) {
  const list = videoList.value
  uni.previewImage({ current: src, urls: list.length ? list : [src] })
}

function doCheckinTask(memberId, taskId, photoPath) {
  const result = doCheckin(memberId, taskId, photoPath || null)
  if (result && result.blocked) {
    uni.showToast({ title: result.msg || '请先拍照再签到', icon: 'none' })
    return
  }
  if (!result) {
    uni.showToast({ title: '该任务已完成', icon: 'none' })
    return
  }
  refresh()
  modal.show = true
  modal.member = result.member
  modal.task = result.task
  modal.evolved = result.evolved
  modal.newStage = result.newStage
  modal.photo = result.photo || ''
  modal.verse = result.verse
  modal.stars = (result.member && result.member.stars) || 0
}
</script>

<style scoped>
.page {
  padding: 24rpx;
  padding-bottom: 40rpx;
  background: #FFF6F0;
  min-height: 100vh;
  min-height: 100dvh;
  box-sizing: border-box;
}

/* 当前身份 */
.who {
  display: flex; align-items: center; gap: 18rpx;
  padding: 22rpx 24rpx; border-radius: 24rpx;
  background: #FFFFFF; border: 2rpx solid #F0E4D8;
  box-shadow: 0 2rpx 8rpx rgba(138,108,78,0.06);
  margin-bottom: 18rpx;
}
.who-avatar {
  width: 76rpx; height: 76rpx; border-radius: 50%;
  border: 3rpx solid #FF8A65; overflow: hidden;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.who-img { width: 100%; height: 100%; }
.who-emoji { font-size: 36rpx; }
.who-body { flex: 1; min-width: 0; }
.who-name { font-size: 29rpx; font-weight: 800; color: #1E293B; display: block; }
.who-sub { font-size: 22rpx; color: #A8A29E; display: block; margin-top: 4rpx; }
.who-switch {
  padding: 10rpx 22rpx; border-radius: 26rpx;
  background: #FFF6F0; border: 2rpx solid #FFD9C2;
  font-size: 24rpx; font-weight: 600; color: #FF8A65;
}
.who-switch:active { transform: scale(0.95); }

/* 进度条 */
.progress-strip { display: flex; align-items: center; gap: 16rpx; margin-bottom: 20rpx; }
.ps-track { flex: 1; height: 14rpx; background: #F3EDE5; border-radius: 7rpx; overflow: hidden; }
.ps-fill { height: 100%; border-radius: 7rpx; transition: width 0.5s ease; }
.ps-num { font-size: 22rpx; color: #A8A29E; }

/* 卡片 */
.card {
  background: #FFFFFF; border-radius: 28rpx; padding: 24rpx;
  margin-bottom: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18rpx; }
.card-title { font-size: 28rpx; font-weight: 700; color: #1E293B; }
.card-more { font-size: 23rpx; color: #94A3B8; }

/* 任务行 */
.task-list { display: flex; flex-direction: column; gap: 14rpx; }
.task-row {
  display: flex; align-items: center; gap: 16rpx;
  padding: 18rpx; border-radius: 20rpx;
  border: 2rpx solid #F3EDE5; background: #FFFDFB;
}
.task-row.done { background: #FFFFFF; }
.tr-icon {
  width: 70rpx; height: 70rpx; border-radius: 20rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; flex-shrink: 0;
}
.tr-body { flex: 1; min-width: 0; }
.tr-name { font-size: 27rpx; font-weight: 700; color: #1E293B; display: block; }
.tr-meta { font-size: 21rpx; color: #A8A29E; display: block; margin-top: 4rpx; }
.tr-photo-hint { font-size: 20rpx; color: #F59E0B; font-weight: 600; display: block; margin-top: 2rpx; }
.tr-photo-hint.ok { color: #14B8A6; }

.tr-thumb-wrap { display: flex; flex-direction: column; align-items: center; gap: 6rpx; flex-shrink: 0; }
.tr-thumb { width: 92rpx; height: 92rpx; border-radius: 16rpx; background: #F1F5F9; }
.thumb-actions { display: flex; gap: 8rpx; }
.ta-btn {
  font-size: 19rpx; padding: 4rpx 12rpx; border-radius: 10rpx;
  background: #F1F5F9; color: #64748B; font-weight: 600;
}
.ta-btn.danger { background: #FEF2F2; color: #EF4444; }

.tr-camera {
  width: 76rpx; height: 76rpx; border-radius: 50%;
  background: #FF8A65; color: #FFFFFF;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; flex-shrink: 0;
  box-shadow: 0 4rpx 12rpx rgba(255,138,101,0.3);
}
.tr-camera:active { transform: scale(0.92); }
.tr-done-mark {
  width: 60rpx; height: 60rpx; border-radius: 50%;
  background: #34D399; color: #FFFFFF;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; flex-shrink: 0;
}

.empty { text-align: center; padding: 50rpx 0; }
.empty-icon { font-size: 72rpx; }
.empty-text { display: block; font-size: 26rpx; color: #94A3B8; margin-top: 10rpx; }

/* 照片墙 */
.photo-scroll { white-space: nowrap; }
.photo-row { display: flex; gap: 14rpx; }
.photo-item { display: flex; flex-direction: column; align-items: center; gap: 6rpx; flex-shrink: 0; }
.photo-img { width: 150rpx; height: 150rpx; border-radius: 16rpx; background: #F1F5F9; }
.photo-task { font-size: 19rpx; color: #94A3B8; max-width: 150rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ===== 平板 ===== */
@media screen and (min-width: 768px) {
  .page { padding: 20px 28px 28px; }
  .who { border-radius: 15px; padding: 13px 15px; }
  .who-avatar { width: 46px; height: 46px; }
  .who-emoji { font-size: 22px; }
  .who-name { font-size: 17px; }
  .who-sub { font-size: 13px; }
  .card { border-radius: 17px; padding: 15px; }
  .card-title { font-size: 17px; }
  .task-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .tr-icon { width: 42px; height: 42px; border-radius: 12px; font-size: 19px; }
  .tr-name { font-size: 16px; }
  .tr-meta { font-size: 13px; }
  .tr-thumb { width: 56px; height: 56px; }
  .tr-camera { width: 46px; height: 46px; font-size: 19px; }
  .tr-done-mark { width: 36px; height: 36px; font-size: 17px; }
  .photo-img { width: 92px; height: 92px; }
  .photo-task { font-size: 12px; max-width: 92px; }
}
@media screen and (min-width: 1024px) {
  .task-list { grid-template-columns: repeat(3, 1fr); }
}
</style>
