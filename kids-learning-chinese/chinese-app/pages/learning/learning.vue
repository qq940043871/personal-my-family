<template>
  <view class="browse-page">
    <!-- 顶部切换标签 -->
    <view class="br-tabs">
      <view class="br-tab" :class="{ active: browseTab === 'recognition' }"
            @click="browseTab = 'recognition'">
        <text>📖 识字表</text>
        <text class="br-count">{{ recognitionCount }}</text>
      </view>
      <view class="br-tab" :class="{ active: browseTab === 'writing' }"
            @click="browseTab = 'writing'">
        <text>✏️ 写字表</text>
        <text class="br-count">{{ writingCount }}</text>
      </view>
      <view class="br-tab" :class="{ active: browseTab === 'words' }"
            @click="browseTab = 'words'">
        <text>🔤 词语表</text>
        <text class="br-count">{{ wordsCount }}</text>
      </view>
    </view>

    <!-- 课本切换 -->
    <view class="br-book-switch">
      <view class="br-book-opt" :class="{ active: browseBook === book.id }"
            v-for="book in books" :key="book.id"
            @click="browseBook = book.id">
        <text>{{ book.id === '2上' ? '📖' : '📗' }} {{ book.name }}</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="br-content" scroll-y="true" enhanced show-scrollbar="false">
      <!-- 识字表 / 写字表 -->
      <view v-if="browseTab !== 'words'">
        <view class="br-group" v-for="group in browseLessonGroups" :key="group.key">
          <view class="br-group-header">
            <text class="br-gtype">{{ group.type === '阅读' ? '📖' : group.type === '识字' ? '✏️' : '🌱' }}</text>
            <text class="br-gname">{{ group.type === '阅读' ? '课文' : group.type === '识字' ? '识字' : '语文园地' }} · 第{{ group.lesson }}课</text>
            <text class="br-gcount">{{ group.chars.length }}字</text>
          </view>
          <view class="br-char-grid">
            <view class="br-char-item" v-for="ch in group.chars" :key="ch.char">
              <text class="br-char">{{ ch.char }}</text>
              <text class="br-pinyin">{{ ch.pinyin }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 词语表 -->
      <view v-if="browseTab === 'words'">
        <view class="br-group" v-for="group in browseWordGroups" :key="group.key">
          <view class="br-group-header">
            <text class="br-gtype">{{ group.type === '阅读' ? '📖' : group.type === '识字' ? '✏️' : '🌱' }}</text>
            <text class="br-gname">{{ group.type === '阅读' ? '课文' : group.type === '识字' ? '识字' : '语文园地' }} · 第{{ group.lesson }}课</text>
            <text class="br-gcount">{{ group.words.length }}词</text>
          </view>
          <view class="br-word-grid">
            <text class="br-word-item" v-for="(w, i) in group.words" :key="i">{{ w }}</text>
          </view>
        </view>
      </view>

      <!-- 底部留白给自定义 tabBar -->
      <view style="height:100rpx;"></view>
    </scroll-view>
  </view>
</template>

<script>
import { BOOKS, allWords, recognitionChars, writingChars, getWordsByLesson } from '@/data/chinese-data.js';

export default {
  data() {
    return {
      books: BOOKS,
      browseTab: 'recognition',
      browseBook: '2上'
    };
  },
  computed: {
    recognitionCount() {
      return recognitionChars.filter(c => c.book === this.browseBook).length;
    },
    writingCount() {
      return writingChars.filter(c => c.book === this.browseBook).length;
    },
    wordsCount() {
      return allWords.length;
    },
    browseLessonGroups() {
      if (this.browseTab === 'words') return [];
      const source = this.browseTab === 'recognition' ? recognitionChars : writingChars;
      const filtered = source.filter(c => c.book === this.browseBook);
      const groups = {};
      filtered.forEach(c => {
        const key = c.type + '_' + c.lesson;
        if (!groups[key]) groups[key] = { key: key, type: c.type, lesson: c.lesson, chars: [] };
        groups[key].chars.push(c);
      });
      return Object.values(groups).sort((a, b) => {
        if (a.type !== b.type) {
          const order = { '阅读': 0, '识字': 1, '语文园地': 2 };
          return (order[a.type] || 3) - (order[b.type] || 3);
        }
        return a.lesson - b.lesson;
      });
    },
    browseWordGroups() {
      if (this.browseTab !== 'words') return [];
      const sections = getWordsByLesson(this.browseBook);
      return sections.map(s => ({
        key: s.type + '_' + s.lesson,
        type: s.type,
        lesson: s.lesson,
        words: s.words
      }));
    }
  }
};
</script>

<style scoped>
.browse-page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #E8EEF6;
}

/* 顶部切换标签 */
.br-tabs {
  display: flex;
  background: #E8EEF6;
  padding: 20rpx 28rpx;
  gap: 16rpx;
}
.br-tab {
  flex: 1; text-align: center; padding: 24rpx 16rpx; border-radius: 28rpx;
  font-size: 28rpx; font-weight: 700; color: #78909C;
  background: #F0F4FA; border: 3rpx solid rgba(255,255,255,0.6);
  box-shadow: 4rpx 4rpx 16rpx rgba(0,0,0,0.08), -3rpx -3rpx 8rpx rgba(255,255,255,0.9);
  touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.br-tab:active { transform: scale(0.95); }
.br-tab.active {
  background: linear-gradient(135deg, #5B7FFF, #92A9FF);
  color: #fff; border-color: transparent;
  box-shadow: 3rpx 3rpx 8rpx rgba(0,0,0,0.1), -2rpx -2rpx 6rpx rgba(255,255,255,0.9);
}
.br-count { font-size: 22rpx; font-weight: 500; opacity: 0.8; margin-left: 4rpx; }

/* 课本切换 */
.br-book-switch {
  display: flex; padding: 16rpx 28rpx 24rpx; gap: 20rpx; background: #E8EEF6;
}
.br-book-opt {
  flex: 1; text-align: center; padding: 20rpx; border-radius: 20rpx;
  font-size: 28rpx; font-weight: 700; color: #78909C;
  background: #F0F4FA; border: 2rpx solid rgba(255,255,255,0.6);
  box-shadow: 4rpx 4rpx 16rpx rgba(0,0,0,0.08), -3rpx -3rpx 8rpx rgba(255,255,255,0.9);
  touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.br-book-opt:active { transform: scale(0.95); }
.br-book-opt.active {
  background: linear-gradient(135deg, #5B7FFF, #92A9FF);
  color: #fff; border-color: transparent;
  box-shadow: 3rpx 3rpx 8rpx rgba(0,0,0,0.1), -2rpx -2rpx 6rpx rgba(255,255,255,0.9);
}

/* 内容区 */
.br-content {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  padding: 12rpx 28rpx 0;
}

/* 分组卡片 */
.br-group {
  background: #F0F4FA; border-radius: 28rpx; padding: 32rpx; margin-bottom: 24rpx;
  border: 3rpx solid rgba(255,255,255,0.8);
  box-shadow: 4rpx 4rpx 16rpx rgba(0,0,0,0.08), -3rpx -3rpx 8rpx rgba(255,255,255,0.9);
}
.br-group-header {
  display: flex; align-items: center; margin-bottom: 24rpx;
  padding-bottom: 20rpx; border-bottom: 2rpx dashed rgba(0,0,0,0.08);
}
.br-gtype { font-size: 40rpx; margin-right: 16rpx; }
.br-gname { font-size: 34rpx; font-weight: 700; color: #37474F; flex: 1; }
.br-gcount { font-size: 26rpx; color: #5B7FFF; font-weight: 700; }

/* 字符网格 */
.br-char-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16rpx; }
.br-char-item {
  background: #E8EEF6; border-radius: 20rpx; padding: 20rpx 8rpx; text-align: center;
  border: 2rpx solid rgba(255,255,255,0.6);
  box-shadow: 4rpx 4rpx 16rpx rgba(0,0,0,0.08), -3rpx -3rpx 8rpx rgba(255,255,255,0.9);
}
.br-char { font-size: 48rpx; font-weight: 800; color: #37474F; display: block; line-height: 1.3; }
.br-pinyin { font-size: 22rpx; color: #78909C; display: block; margin-top: 4rpx; }

/* 词语网格 */
.br-word-grid { display: flex; flex-wrap: wrap; gap: 20rpx; }
.br-word-item {
  background: #F0F4FA; border-radius: 28rpx; padding: 20rpx 32rpx;
  border: 2rpx solid rgba(255,255,255,0.6);
  box-shadow: 4rpx 4rpx 16rpx rgba(0,0,0,0.08), -3rpx -3rpx 8rpx rgba(255,255,255,0.9);
  font-size: 34rpx; font-weight: 700; color: #37474F;
}
</style>
