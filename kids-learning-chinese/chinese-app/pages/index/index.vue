<template>
  <view class="home-page">
    <!-- 顶部渐变背景 -->
    <view class="header-bg">
      <view class="header-content">
        <view class="user-row">
          <view class="avatar">🐼</view>
          <view>
            <text class="welcome-text">你好，小冒险家！</text>
            <text class="welcome-sub">今天也要认真学汉字哦~</text>
          </view>
        </view>
        <view class="header-stats">
          <view class="hstat">
            <text class="hstat-val">{{ totalStars }}</text>
            <text class="hstat-label">⭐ 星星</text>
          </view>
          <view class="hstat">
            <text class="hstat-val">{{ completedLessons }}</text>
            <text class="hstat-label">✅ 完成</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 可滚动内容区 — 使用原生滚动替代 scroll-view，解决小米手机滚动不流畅问题 -->
    <view class="content-area">
      <!-- 课本选择 -->
      <view class="section">
        <view class="section-title">📚 选择课本</view>
        <view class="book-row">
          <view class="book-card" v-for="book in books" :key="book.id"
                :class="{ active: currentBook === book.id }"
                @click="selectBook(book.id)">
            <text class="book-emoji">{{ book.id === '2上' ? '📖' : '📗' }}</text>
            <text class="book-name">{{ book.name }}</text>
            <text class="book-count">{{ book.charCount }} 生字</text>
            <view class="bp-bar">
              <view class="bp-fill" :style="{ width: getBookProgress(book.id) + '%' }"></view>
            </view>
            <text class="bp-pct">{{ getBookProgress(book.id) }}%</text>
          </view>
        </view>
      </view>

      <!-- 快速开始 -->
      <view class="section">
        <view class="section-title">🎯 快速开始</view>
        <view class="quick-grid">
          <view class="quick-card" v-for="(qc, i) in quickCards" :key="i"
                @click="startTablePractice(qc.table)">
            <view class="qc-bar" :class="qc.color"></view>
            <text class="qc-icon">{{ qc.icon }}</text>
            <text class="qc-label">{{ qc.label }}</text>
            <text class="qc-desc">{{ qc.desc }}</text>
          </view>
        </view>
      </view>

      <!-- 课程列表 -->
      <view class="section" v-if="recentLessons.length > 0">
        <view class="section-title">🕒 课程列表</view>
        <view class="lesson-list">
          <view class="lesson-item" v-for="l in recentLessons" :key="l.key"
                @click="startLesson(l)">
            <view class="li-left">
              <text class="li-emoji">{{ l.type === '阅读' ? '📖' : l.type === '识字' ? '✏️' : '🌱' }}</text>
              <view class="li-info">
                <text class="li-name">{{ l.type === '阅读' ? '课文' : l.type === '识字' ? '识字' : '语文园地' }} · 第{{ l.lesson }}课</text>
                <text class="li-detail">{{ l.charCount }} 生字{{ l.wordCount ? ' · ' + l.wordCount + ' 词语' : '' }}</text>
              </view>
            </view>
            <text class="li-stars">{{ '⭐'.repeat(getStars(l)) }}{{ '☆'.repeat(5 - getStars(l)) }}</text>
          </view>
        </view>
      </view>

      <!-- 底部留白给自定义 tabBar -->
      <view style="height:100rpx;"></view>
    </view>

  </view>
</template>

<script>
import { BOOKS, allCharacters, allWords, recognitionChars, writingChars, shuffle, getLessonWords, getWordsByLesson } from '@/data/chinese-data.js';
import { getLessonList, generateMixed } from '@/utils/question.js';

const radicalMap = {
  '\u6c35':'三点水','\u624c':'提手旁','\u4ebb':'单人旁','\u53e3':'口字旁',
  '\u6728':'木字旁','\u706b':'火字旁','\u65e5':'日字旁','\u6708':'月字旁',
  '\u8279':'草字头','\u5973':'女字旁','\u738b':'王字旁','\u77f3':'石字旁',
  '\u571f':'提土旁','\u866b':'虫字旁','\u9e1f':'鸟字旁','\u9a6c':'马字旁',
  '\u8ba0':'言字旁','\u5e7f':'广字头','\u8fb6':'走之底',
};

function pickWrongAnswers(chars, correctChar, count) {
  const others = chars.filter(c => c.char !== correctChar).map(c => c.char);
  return shuffle([...new Set(others)]).slice(0, count);
}

function generateQuestions(chars, count) {
  const results = [];
  const selected = shuffle(chars).slice(0, Math.min(count, chars.length));

  selected.forEach(c => {
    const wp = pickWrongAnswers(chars, c.char, 3).map(wc => {
      const f = chars.find(ch => ch.char === wc);
      return f ? f.pinyin : '';
    }).filter(p => p && p !== c.pinyin);
    if (wp.length >= 2) {
      results.push({ type:'readPinyin', prompt:'这个字读什么？', char:c.char, correct:c.pinyin, wrong:wp.slice(0,3), meta:`第${c.lesson}课` });
    }
  });

  selected.forEach(c => {
    const wc = pickWrongAnswers(chars, c.char, 3);
    if (wc.length >= 2) {
      results.push({ type:'pickChar', prompt:'这个拼音对应的字是？', pinyin:c.pinyin, correct:c.char, wrong:wc.slice(0,3), meta:`第${c.lesson}课` });
    }
  });

  const radChars = chars.filter(c => Object.keys(radicalMap).some(r => c.char.includes(r)));
  shuffle(radChars).slice(0, 3).forEach(c => {
    const rad = Object.keys(radicalMap).find(r => c.char.includes(r));
    if (!rad) return;
    const wr = shuffle(Object.keys(radicalMap).filter(r => r !== rad)).slice(0, 3);
    if (wr.length >= 2) {
      results.push({ type:'radical', prompt:`"${c.char}"的偏旁部首是？`, char:c.char, correct:rad, wrong:wr, radicalName:radicalMap[rad] });
    }
  });

  const allW = allWords;
  shuffle(allW).slice(0, 3).forEach(w => {
    const pos = Math.floor(Math.random() * w.length);
    const bc = w[pos];
    const wc2 = pickWrongAnswers(chars, bc, 3);
    if (wc2.length >= 2) {
      results.push({ type:'wordFill', prompt:'填入正确的字', blanked:w.slice(0,pos)+'_'+w.slice(pos+1), correct:bc, wrong:wc2.slice(0,3), fullWord:w });
    }
  });

  return shuffle(results).slice(0, count);
}

export default {
  data() {
    return {
      books: BOOKS,
      currentBook: '2上',
      totalStars: 0,
      completedLessons: 0,
      recentLessons: [],
      bookProgresses: {},

      quickCards: [
        { icon:'📖', label:'识字认读', desc:'随机一课', table:'recognition', color:'purple' },
        { icon:'✏️', label:'写字练习', desc:'随机一课', table:'writing', color:'green' },
        { icon:'🔤', label:'词语训练', desc:'随机一课', table:'words', color:'orange' },
      ],

      _lastNav: 0
    };
  },
  onShow() {
    this.loadProgress();
    this.loadRecentLessons();
  },
  methods: {
    guardNav() {
      const now = Date.now();
      if (now - this._lastNav < 300) return false;
      this._lastNav = now;
      return true;
    },

    loadProgress() {
      try {
        const data = uni.getStorageSync('chinese_progress');
        if (data) {
          this.totalStars = data.totalStars || 0;
          this.completedLessons = data.completedLessons || 0;
          this.bookProgresses = data.bookProgresses || {};
        }
      } catch(e) {
        this.totalStars = 0;
        this.completedLessons = 0;
        this.bookProgresses = {};
      }
    },

    loadRecentLessons() {
      const lessons = getLessonList(this.currentBook);
      this.recentLessons = lessons;
    },

    getBookProgress(bookId) {
      try {
        const data = uni.getStorageSync('chinese_progress');
        if (data && data.bookProgresses && data.bookProgresses[bookId] !== undefined) {
          return data.bookProgresses[bookId];
        }
      } catch(e) {}
      return 0;
    },

    getStars(lesson) {
      try {
        const data = uni.getStorageSync('chinese_progress');
        const key = `${this.currentBook}_${lesson.type}_${lesson.lesson}`;
        if (data && data.lessonStars && data.lessonStars[key]) {
          return data.lessonStars[key];
        }
      } catch(e) {}
      return 0;
    },

    selectBook(bid) {
      if (!this.guardNav()) return;
      this.currentBook = bid;
      this.loadRecentLessons();
    },

    startTablePractice(tableType) {
      if (!this.guardNav()) return;
      try {
        const lessons = getLessonList(this.currentBook);
        if (!lessons.length) {
          uni.showToast({ title: '暂无课程数据', icon: 'none' });
          return;
        }

        var chars, lesson;
        if (tableType === 'recognition') {
          var withChars = lessons.filter(function(l) {
            var rc = recognitionChars.filter(function(c) { return c.book === this.currentBook && c.lesson === l.lesson; }.bind(this));
            return rc.length > 0;
          }.bind(this));
          if (!withChars.length) {
            uni.showToast({ title: '该课本暂无识字数据', icon: 'none' });
            return;
          }
          lesson = withChars[Math.floor(Math.random() * withChars.length)];
          chars = recognitionChars.filter(function(c) { return c.book === this.currentBook && c.lesson === lesson.lesson; }.bind(this));
        } else if (tableType === 'writing') {
          var withChars = lessons.filter(function(l) {
            var wc = writingChars.filter(function(c) { return c.book === this.currentBook && c.lesson === l.lesson; }.bind(this));
            return wc.length > 0;
          }.bind(this));
          if (!withChars.length) {
            uni.showToast({ title: '该课本暂无写字数据', icon: 'none' });
            return;
          }
          lesson = withChars[Math.floor(Math.random() * withChars.length)];
          chars = writingChars.filter(function(c) { return c.book === this.currentBook && c.lesson === lesson.lesson; }.bind(this));
        } else {
          lesson = lessons[Math.floor(Math.random() * lessons.length)];
          chars = allCharacters.filter(function(c) { return c.book === this.currentBook && c.lesson === lesson.lesson; }.bind(this));
        }

        if (!chars || !chars.length) {
          uni.showToast({ title: '该课暂无题目', icon: 'none' });
          return;
        }

        var tableLabelMap = { recognition:'📖 识字认读', writing:'✏️ 写字练习', words:'🔤 词语训练' };
        var tableLabel = tableLabelMap[tableType] || tableType;

        uni.navigateTo({
          url: `/pages/exercise/exercise?book=${this.currentBook}&lesson=${lesson.lesson}&type=${lesson.type}&mode=mixed&tableType=${tableType}&tableLabel=${encodeURIComponent(tableLabel)}`
        });
      } catch(e) {
        console.error('startTablePractice error:', e);
        uni.showToast({ title: '加载失败，请重试', icon: 'none' });
      }
    },

    startLesson(l) {
      if (!this.guardNav()) return;
      uni.navigateTo({
        url: `/pages/exercise/exercise?book=${this.currentBook}&lesson=${l.lesson}&type=${l.type}&mode=mixed`
      });
    }
  }
};
</script>

<style scoped>
.home-page {
  min-height: 100dvh;
  background: #E8EEF6;
  overflow-x: hidden;
}

/* ===== CLAY HEADER ===== */
.header-bg {
  background: linear-gradient(180deg, #6C63FF 0%, #8B85FF 40%, #B8B5FF 80%, #E8EEF6 100%);
  padding: 48rpx 32rpx 64rpx;
}
.header-content { position: relative; z-index: 2; }
.user-row { display: flex; align-items: center; margin-bottom: 28rpx; }
.avatar {
  width: 96rpx; height: 96rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  border: 3rpx solid rgba(255,255,255,0.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 48rpx;
  box-shadow: 3rpx 3rpx 8rpx rgba(0,0,0,0.1), -2rpx -2rpx 6rpx rgba(255,255,255,0.9);
  margin-right: 24rpx;
}
.welcome-text { color: #fff; font-size: 40rpx; font-weight: 700; text-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1); }
.welcome-sub { color: rgba(255,255,255,0.85); font-size: 24rpx; margin-top: 4rpx; }
.header-stats { display: flex; gap: 48rpx; }
.hstat { display: flex; flex-direction: column; align-items: center; }
.hstat-val { font-size: 52rpx; font-weight: 800; color: #FFD54F; text-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1); }
.hstat-label { color: rgba(255,255,255,0.8); font-size: 24rpx; }

.content-area { /* 原生页面滚动 */ }
.section { margin: 0 28rpx; padding-top: 0; margin-bottom: 36rpx; }
.section:first-child { margin-top: 24rpx; }
.section-title { font-size: 34rpx; font-weight: 700; color: #37474F; margin-bottom: 20rpx; padding-left: 8rpx; }

/* ===== CLAY BOOK CARDS ===== */
.book-row { display: flex; gap: 20rpx; }
.book-card {
  flex: 1; min-width: 0;
  background: #F0F4FA;
  border-radius: 28rpx;
  padding: 28rpx 16rpx;
  text-align: center;
  border: 3rpx solid rgba(255,255,255,0.8);
  box-shadow: 4rpx 4rpx 16rpx rgba(0,0,0,0.08), -3rpx -3rpx 8rpx rgba(255,255,255,0.9);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.book-card:active { transform: scale(0.95); }
.book-card.active { border-color: #5B7FFF; box-shadow: inset 2rpx 2rpx 6rpx rgba(0,0,0,0.08), inset -3rpx -3rpx 8rpx rgba(255,255,255,0.9), 0 0 0 6rpx rgba(91,127,255,0.15); }
.book-emoji { font-size: 60rpx; display: block; margin-bottom: 8rpx; }
.book-name { font-size: 30rpx; font-weight: 700; color: #37474F; display: block; line-height: 1.2; }
.book-count { font-size: 24rpx; color: #78909C; margin: 6rpx 0 10rpx; display: block; }
.bp-bar { height: 12rpx; background: rgba(0,0,0,0.06); border-radius: 6rpx; overflow: hidden; box-shadow: inset 2rpx 2rpx 6rpx rgba(0,0,0,0.08), inset -3rpx -3rpx 8rpx rgba(255,255,255,0.9); margin-bottom: 6rpx; }
.bp-fill { height: 100%; background: linear-gradient(90deg, #5B7FFF, #92A9FF); border-radius: 6rpx; transition: width 0.5s ease; }
.bp-pct { font-size: 22rpx; color: #5B7FFF; font-weight: 700; }

/* ===== CLAY QUICK CARDS ===== */
.quick-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20rpx; }
.quick-card {
  background: #F0F4FA;
  border-radius: 28rpx;
  padding: 36rpx 16rpx;
  text-align: center;
  border: 3rpx solid rgba(255,255,255,0.8);
  box-shadow: 4rpx 4rpx 16rpx rgba(0,0,0,0.08), -3rpx -3rpx 8rpx rgba(255,255,255,0.9);
  position: relative; overflow: hidden;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.quick-card:active { transform: scale(0.94); }
.qc-bar { position: absolute; top: 0; left: 0; right: 0; height: 8rpx; border-radius: 0 0 12rpx 12rpx; }
.qc-bar.purple { background: linear-gradient(90deg, #5B7FFF, #92A9FF); }
.qc-bar.green { background: linear-gradient(90deg, #66BB6A, #81C784); }
.qc-bar.orange { background: linear-gradient(90deg, #FFB74D, #FFCC80); }
.qc-icon { font-size: 56rpx; display: block; margin: 8rpx 0 4rpx; }
.qc-label { font-size: 28rpx; font-weight: 700; color: #37474F; display: block; }
.qc-desc { font-size: 22rpx; color: #78909C; margin-top: 4rpx; display: block; }

/* ===== CLAY LESSON LIST ===== */
.lesson-list {
  background: #F0F4FA;
  border-radius: 28rpx;
  overflow: hidden;
  border: 3rpx solid rgba(255,255,255,0.8);
  box-shadow: 4rpx 4rpx 16rpx rgba(0,0,0,0.08), -3rpx -3rpx 8rpx rgba(255,255,255,0.9);
}
.lesson-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid rgba(0,0,0,0.05);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s ease;
  min-height: 96rpx;
}
.lesson-item:last-child { border-bottom: none; }
.lesson-item:active { background: rgba(91,127,255,0.06); }
.li-left { display: flex; align-items: center; flex: 1; min-width: 0; }
.li-emoji { font-size: 44rpx; margin-right: 16rpx; flex-shrink: 0; }
.li-info { flex: 1; min-width: 0; }
.li-name { font-size: 30rpx; font-weight: 700; color: #37474F; display: block; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.li-detail { font-size: 24rpx; color: #78909C; }
.li-stars { font-size: 26rpx; flex-shrink: 0; white-space: nowrap; }
</style>
