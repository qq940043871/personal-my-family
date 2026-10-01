<template>
  <view class="report-page">
    <scroll-view class="report-scroll" scroll-y="true" enhanced show-scrollbar="false">
      <text class="page-title">📊 学习报告</text>

      <view class="rp-card">
        <view class="rp-stat-row">
          <view class="rp-stat">
            <text class="rp-stat-val">{{ totalStars }}</text>
            <text class="rp-stat-label">总星星</text>
          </view>
          <view class="rp-stat">
            <text class="rp-stat-val">{{ completedLessons }}</text>
            <text class="rp-stat-label">完成课时</text>
          </view>
          <view class="rp-stat">
            <text class="rp-stat-val">{{ totalExercises }}</text>
            <text class="rp-stat-label">练习次数</text>
          </view>
        </view>

        <view v-for="book in books" :key="book.id" style="margin-bottom:24rpx;">
          <view style="display:flex;justify-content:space-between;margin-bottom:8rpx;">
            <text style="font-weight:600;font-size:28rpx;color:#37474F;">{{ book.id === '2上' ? '📖' : '📗' }} {{ book.name }}</text>
            <text style="color:#5B7FFF;font-weight:700;font-size:28rpx;">{{ getBookProgress(book.id) }}%</text>
          </view>
          <view class="bp-bar">
            <view class="bp-fill" :style="{ width: getBookProgress(book.id) + '%' }"></view>
          </view>
        </view>
      </view>

      <view class="rp-card" v-if="completedList.length > 0">
        <text style="font-size:32rpx;font-weight:700;color:#37474F;margin-bottom:20rpx;">✅ 已完成课程</text>
        <view class="rp-item" v-for="item in completedList" :key="item.key">
          <text class="rp-item-name">{{ item.icon }} {{ item.name }} · 第{{ item.lesson }}课</text>
          <text class="rp-item-stars">{{ '⭐'.repeat(item.stars) }}</text>
        </view>
      </view>

      <view class="rp-card" v-if="completedList.length === 0" style="text-align:center;color:#78909C;padding:48rpx;">
        <text>🎯 还没有完成任何课程，快去首页开始练习吧！</text>
      </view>

      <view class="tip-card">
        <text class="tip-text">{{ studyTip }}</text>
      </view>

      <view style="height:100rpx;"></view>
    </scroll-view>
  </view>
</template>

<script>
import { BOOKS } from '@/data/chinese-data.js';

export default {
  data() {
    return {
      books: BOOKS,
      totalStars: 0,
      completedLessons: 0,
      totalExercises: 0,
      completedList: [],
      studyTip: '每天坚持学习一小课，积少成多，你一定能成为汉字小达人！'
    };
  },
  onShow() {
    this.loadReport();
  },
  methods: {
    loadReport() {
      try {
        const data = uni.getStorageSync('chinese_progress');
        if (data) {
          this.totalStars = data.totalStars || 0;
          this.totalExercises = data.totalExercises || 0;
          this.completedLessons = data.completedLessons || 0;
        }

        const stars = (data && data.lessonStars) || {};
        const list = [];
        const typeNames = { '阅读': '课文', '识字': '识字', '语文园地': '语文园地' };
        const typeIcons = { '阅读': '📖', '识字': '✏️', '语文园地': '🌱' };

        Object.entries(stars).forEach(([key, starCount]) => {
          const parts = key.split('_');
          const type = parts[1];
          const lesson = parts[2];
          if (starCount > 0) {
            list.push({
              key,
              type,
              lesson: parseInt(lesson),
              stars: starCount,
              name: typeNames[type] || type,
              icon: typeIcons[type] || '📝'
            });
          }
        });

        this.completedList = list
          .sort((a, b) => b.lesson - a.lesson || a.name.localeCompare(b.name))
          .slice(0, 20);

        if (this.completedLessons === 0) {
          this.studyTip = '🎯 赶快开始你的第一节汉字课吧！从课本首页选择一课试试。';
        } else if (this.completedLessons < 5) {
          this.studyTip = '🌱 你已经迈出了第一步！每天多学一课，进步会越来越快。';
        } else if (this.completedLessons < 15) {
          this.studyTip = '📈 你正在稳步前进！尝试不同的练习模式巩固所学。';
        } else if (this.completedLessons < 30) {
          this.studyTip = '⭐ 非常棒！已经完成了不少课时，继续加油冲刺全通关！';
        } else {
          this.studyTip = '🏆 你是汉字学习达人！试试另一本课本挑战更高难度吧！';
        }
      } catch(e) {
        this.totalStars = 0;
        this.completedLessons = 0;
        this.totalExercises = 0;
        this.completedList = [];
      }
    },

    getBookProgress(bookId) {
      try {
        const data = uni.getStorageSync('chinese_progress');
        if (data && data.bookProgresses && data.bookProgresses[bookId] !== undefined) {
          return data.bookProgresses[bookId];
        }
      } catch(e) {}
      return 0;
    }
  }
};
</script>

<style scoped>
.report-page {
  height: 100vh;
  height: 100dvh;
  background: #E8EEF6;
}
.report-scroll {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  padding: 40rpx 32rpx 0;
}

.page-title {
  font-size: 48rpx; font-weight: 800; color: #37474F; margin-bottom: 36rpx; display: block;
}

.rp-card {
  background: #F0F4FA; border-radius: 44rpx; padding: 44rpx; margin-bottom: 36rpx;
  border: 3rpx solid rgba(255,255,255,0.8);
  box-shadow: 4rpx 4rpx 16rpx rgba(0,0,0,0.08), -3rpx -3rpx 8rpx rgba(255,255,255,0.9);
}
.rp-stat-row { display: flex; justify-content: space-around; margin-bottom: 36rpx; }
.rp-stat { text-align: center; }
.rp-stat-val { font-size: 72rpx; font-weight: 800; color: #5B7FFF; display: block; }
.rp-stat-label { font-size: 28rpx; color: #78909C; display: block; margin-top: 4rpx; }

.bp-bar {
  height: 16rpx; background: rgba(0,0,0,0.06); border-radius: 8rpx; overflow: hidden;
  box-shadow: inset 2rpx 2rpx 6rpx rgba(0,0,0,0.08), inset -3rpx -3rpx 8rpx rgba(255,255,255,0.9);
}
.bp-fill {
  height: 100%; background: linear-gradient(90deg, #5B7FFF, #92A9FF); border-radius: 8rpx;
  transition: width 0.5s ease;
}

.rp-item { display: flex; justify-content: space-between; padding: 24rpx 0; border-bottom: 2rpx dashed rgba(0,0,0,0.06); }
.rp-item:last-child { border-bottom: none; }
.rp-item-name { font-size: 30rpx; font-weight: 700; color: #37474F; }
.rp-item-stars { font-size: 28rpx; }

.tip-card {
  background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
  border-radius: 36rpx; padding: 48rpx 40rpx;
  border-left: 12rpx solid #FF9800;
  margin-bottom: 40rpx;
}
.tip-text { font-size: 30rpx; color: #E65100; line-height: 1.6; }
</style>
