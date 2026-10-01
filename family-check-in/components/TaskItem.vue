<template>
  <view class="task-item" :class="{ done: task.done }">
    <view class="task-icon">
      <text>{{ task.icon }}</text>
    </view>
    <view class="task-info">
      <text class="task-name">{{ task.name }}</text>
      <text class="task-meta">{{ task.memberEmoji }} {{ task.memberName || memberName }} · {{ task.category }}</text>
      <view v-if="task.photo" class="photo-tag">
        <text class="photo-tag-icon">📷</text>
        <text>已拍照</text>
      </view>
    </view>
    <text class="task-points">+{{ task.points }}</text>
    <view class="task-actions">
      <view v-if="!task.done" class="camera-btn" @click.stop="$emit('camera', task.memberId, task.id)">
        <text>📷</text>
      </view>
      <view
        class="check-btn"
        :class="{ done: task.done }"
        @click.stop="onCheck"
      >
        <text v-if="task.done">✓</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  task: { type: Object, required: true },
  memberName: { type: String, default: '' }
})

const emit = defineEmits(['check', 'camera'])

function onCheck() {
  if (props.task.done) return
  emit('check', props.task.memberId, props.task.id)
}
</script>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
  border: 2rpx solid #FFF6F0;
  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
}
.task-item:active {
  transform: scale(0.98);
}
.task-item.done {
  background: #FFEDD5;
  opacity: 0.8;
  border-color: #FFEDD5;
}
.task-icon {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFF6F0;
  border-radius: 16rpx;
  font-size: 40rpx;
}
.task-info { flex: 1; }
.task-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
}
.task-meta {
  font-size: 22rpx;
  color: #8A8178;
  margin-top: 4rpx;
}
.photo-tag {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #14B8A6;
}
.photo-tag-icon { font-size: 22rpx; }
.task-points {
  font-size: 24rpx;
  color: #F59E0B;
  font-weight: 700;
}
.task-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.camera-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #FFF6F0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  border: 2rpx solid #FFEDD5;
  transition: transform 0.15s ease, background 0.15s ease;
  cursor: pointer;
}
.camera-btn:active {
  transform: scale(0.9);
  background: #FFEDD5;
}
.check-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  border: 3rpx solid #F3EDE5;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #FFFFFF;
  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
}
.check-btn:active {
  transform: scale(0.9);
}
.check-btn.done {
  background: #34D399;
  border-color: #34D399;
  animation: checkPop 0.3s ease;
}

/* ===== 平板横屏适配（px 单位，覆盖 rpx 过度缩放）===== */
@media screen and (min-width: 768px) {
  .task-item {
    gap: 12px !important;
    padding: 14px 16px !important;
    border-radius: 14px !important;
  }
  .task-icon {
    width: 44px !important;
    height: 44px !important;
    border-radius: 10px !important;
    font-size: 24px !important;
  }
  .task-name {
    font-size: 17px !important;
  }
  .task-meta {
    font-size: 13px !important;
    margin-top: 3px !important;
  }
  .photo-tag {
    gap: 4px !important;
    margin-top: 4px !important;
    font-size: 12px !important;
  }
  .photo-tag-icon {
    font-size: 13px !important;
  }
  .task-points {
    font-size: 15px !important;
  }
  .task-actions {
    gap: 8px !important;
  }
  .camera-btn {
    width: 36px !important;
    height: 36px !important;
    font-size: 18px !important;
  }
  .check-btn {
    width: 36px !important;
    height: 36px !important;
    font-size: 18px !important;
  }
}
</style>
