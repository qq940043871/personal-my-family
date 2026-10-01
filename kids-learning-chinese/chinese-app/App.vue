<script>
export default {
  onLaunch: function() {
    console.log('汉字冒险岛 App 启动');
  },
  onShow: function() {
    console.log('App 显示');
  },
  onHide: function() {
    console.log('App 隐藏');
  }
};
</script>

<style lang="scss">
/* =========================================
   Claymorphism Design System
   儿童友好的软3D风格 — 参考 index.html
   ========================================= */

/* 全局样式 */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial,
    sans-serif;
  font-size: 28rpx;
  color: #37474F;
  background-color: #E8EEF6;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* 安全区域适配 */
view, text, button, input {
  box-sizing: border-box;
}

/* ===== CLAY DESIGN TOKENS ===== */
.c-card {
  background: #F0F4FA;
  border-radius: 28rpx;
  padding: 32rpx;
  border: 3rpx solid rgba(255,255,255,0.8);
  box-shadow: 4rpx 4rpx 16rpx rgba(0,0,0,0.08), -3rpx -3rpx 8rpx rgba(255,255,255,0.9);
  margin-bottom: 24rpx;
}

.c-btn {
  padding: 20rpx 44rpx;
  border-radius: 48rpx;
  border: 3rpx solid rgba(255,255,255,0.6);
  font-size: 32rpx;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.c-btn:active {
  transform: scale(0.94);
}

/* 通用按钮样式 */
.btn-primary {
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  background: linear-gradient(135deg, #5B7FFF 0%, #92A9FF 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
  border: none;
  padding: 0 48rpx;
  box-shadow: 3rpx 3rpx 8rpx rgba(0,0,0,0.1), -2rpx -2rpx 6rpx rgba(255,255,255,0.9);
}

.btn-secondary {
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  background: #F0F4FA;
  color: #5B7FFF;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
  border: 2rpx solid #5B7FFF;
  padding: 0 40rpx;
}

/* 通用动画 */
@keyframes popIn {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes bounceIn {
  0% { transform: scale(0); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes cardIn {
  0% { opacity: 0; transform: scale(0.85) translateY(20rpx); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes shake {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-8rpx); }
  75% { transform: translateX(8rpx); }
}

/* 安全区底部 padding */
.safe-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
