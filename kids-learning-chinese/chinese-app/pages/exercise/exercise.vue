<template>
  <view class="exercise-page">
    <!-- ===== 顶部导航栏 ===== -->
    <view class="nav-header">
      <view class="nav-top-row">
        <view class="nav-left" @click="goBack">
          <text class="nav-back-arrow">←</text>
        </view>
        <text class="nav-title">{{ navTitle }}</text>
        <view class="nav-right">
          <view class="nav-avatar">👧</view>
          <view class="nav-home-btn" @click="goHome">
            <text class="nav-home-icon">🏠</text>
          </view>
        </view>
      </view>
      <!-- 计分条 -->
      <view class="nav-score-bar" v-if="!isFinished && currentQuestion">
        <text class="nav-score-text">⭐ {{ score }} 分</text>
        <text class="nav-progress-text">第 {{ currentIndex + 1 }} / {{ totalQuestions }} 题</text>
      </view>
    </view>

    <!-- ===== 练习区 ===== -->
    <view class="ex-body" v-if="!isFinished && currentQuestion">
      <!-- 背景装饰纹样 -->
      <view class="bg-pattern">
        <text class="deco-item deco-1">📖</text>
        <text class="deco-item deco-2">⭐</text>
        <text class="deco-item deco-3">✏️</text>
        <text class="deco-item deco-4">📚</text>
        <text class="deco-item deco-5">✂️</text>
        <text class="deco-item deco-6">🌟</text>
        <text class="deco-item deco-7">🖍️</text>
        <text class="deco-item deco-8">📐</text>
      </view>

      <!-- 答题卡片 -->
      <view class="q-card" :key="currentIndex">
        <!-- 顶部题型标签 -->
        <view class="q-tag-row">
          <text class="q-tag">{{ cardTypeTag }}</text>
        </view>

        <!-- 看字选拼音 -->
        <template v-if="currentQuestion.type === 'readPinyin'">
          <text class="q-char-lg">{{ currentQuestion.char }}</text>
          <text class="q-hint">这个字读什么？</text>
        </template>

        <!-- 看拼音选字 -->
        <template v-if="currentQuestion.type === 'pickChar'">
          <text class="q-pinyin-lg">{{ currentQuestion.pinyin }}</text>
          <text class="q-hint">选出对应的汉字</text>
        </template>

        <!-- 偏旁部首 -->
        <template v-if="currentQuestion.type === 'radical'">
          <text class="q-char-lg">{{ currentQuestion.char }}</text>
          <text class="q-hint">选择它的偏旁部首</text>
        </template>

        <!-- 词语填空 -->
        <template v-if="currentQuestion.type === 'wordFill'">
          <text class="q-blank-lg">{{ currentQuestion.blanked }}</text>
          <text class="q-hint">填入正确的字</text>
        </template>

        <!-- 选项按钮 2×2 -->
        <view class="opt-grid">
          <view class="opt-btn" v-for="opt in shuffledOptions" :key="opt"
                :class="getOptClass(opt)"
                @click="selectAnswer(opt)">
            <text class="opt-btn-text">{{ opt }}</text>
          </view>
        </view>

        <!-- 反馈 -->
        <view class="feedback-wrap" v-if="showFeedback">
          <view v-if="lastCorrect" class="fb-correct">
            <text class="fb-icon">🎉</text>
            <text class="fb-text">太棒了！</text>
          </view>
          <view v-else class="fb-wrong">
            <text class="fb-label">正确答案</text>
            <text class="fb-answer">{{ currentQuestion.correct }}</text>
            <text class="fb-extra" v-if="currentQuestion.radicalName">（{{ currentQuestion.radicalName }}）</text>
          </view>
        </view>

        <!-- 继续按钮 -->
        <view class="next-wrap" v-if="showFeedback">
          <view class="next-btn" @click="nextQuestion">
            <text class="next-btn-text">{{ nextBtnLabel }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载 -->
    <view class="loading-wrap" v-if="!currentQuestion && !isFinished">
      <text class="load-icon">📝</text>
      <text class="load-text">正在准备题目...</text>
    </view>

    <!-- 完成页 -->
    <view class="complete-wrap" v-if="isFinished">
      <view class="cp-card">
        <view class="cp-rainbow-bar"></view>
        <text class="cp-emoji">{{ completeEmoji }}</text>
        <text class="cp-title">{{ completeTitle }}</text>
        <text class="cp-stat">答对 <text class="cp-num">{{ finalCorrect }}</text> / {{ totalQuestions }} 题</text>
        <view class="cp-stars-row">
          <text v-for="s in 5" :key="s" class="cp-star-item" :class="{ on: s <= finalStars }">
            {{ s <= finalStars ? '⭐' : '☆' }}
          </text>
        </view>
        <text class="cp-earned">获得 <text class="cp-earned-num">{{ finalStars }}</text> 颗星星</text>
        <view class="cp-btns">
          <view class="cp-btn replay" @click="replayLesson"><text>🔄 再练一次</text></view>
          <view class="cp-btn home" @click="goHome"><text>🏠 返回首页</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getCharactersByLesson, allCharacters, allWords, shuffle, recognitionChars, writingChars, getLessonWords } from '@/data/chinese-data.js';
import { getLessonList } from '@/utils/question.js';

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
      results.push({ type:'readPinyin', char:c.char, correct:c.pinyin, wrong:wp.slice(0,3) });
    }
  });

  selected.forEach(c => {
    const wc = pickWrongAnswers(chars, c.char, 3);
    if (wc.length >= 2) {
      results.push({ type:'pickChar', pinyin:c.pinyin, correct:c.char, wrong:wc.slice(0,3) });
    }
  });

  const radChars = chars.filter(c => Object.keys(radicalMap).some(r => c.char.includes(r)));
  shuffle(radChars).slice(0, 3).forEach(c => {
    const rad = Object.keys(radicalMap).find(r => c.char.includes(r));
    if (!rad) return;
    const wr = shuffle(Object.keys(radicalMap).filter(r => r !== rad)).slice(0, 3);
    if (wr.length >= 2) {
      results.push({ type:'radical', char:c.char, correct:rad, wrong:wr, radicalName:radicalMap[rad] });
    }
  });

  const allW = allWords;
  shuffle(allW).slice(0, 3).forEach(w => {
    const pos = Math.floor(Math.random() * w.length);
    const bc = w[pos];
    const wc2 = pickWrongAnswers(chars, bc, 3);
    if (wc2.length >= 2) {
      results.push({ type:'wordFill', blanked:w.slice(0,pos)+'_'+w.slice(pos+1), correct:bc, wrong:wc2.slice(0,3), fullWord:w });
    }
  });

  return shuffle(results).slice(0, count);
}

export default {
  data() {
    return {
      book: '', lesson: 0, type: '', mode: '',
      tableType: '', tableLabel: '',
      questions: [], shuffledOptions: [],
      currentIndex: 0, totalQuestions: 0,
      score: 0, answeredCorrectly: 0,
      showFeedback: false, lastCorrect: false,
      selectedAnswer: '', isFinished: false,
      finalStars: 0, finalCorrect: 0
    };
  },
  computed: {
    currentQuestion() {
      return this.currentIndex < this.questions.length ? this.questions[this.currentIndex] : null;
    },
    navTitle() {
      if (this.tableType) return this.tableLabel;
      const typeNames = { '阅读': '课文', '识字': '识字', '语文园地': '语文园地' };
      return (typeNames[this.type] || '') + ' · 第' + this.lesson + '课';
    },
    cardTypeTag() {
      if (!this.currentQuestion) return '练习';
      const map = {
        readPinyin: '看字选拼音',
        pickChar: '看拼音选字',
        radical: '偏旁部首',
        wordFill: '词语填空',
        makeWord: '组词练习'
      };
      return map[this.currentQuestion.type] || '练习';
    },
    nextBtnLabel() {
      return this.currentIndex < this.totalQuestions - 1 ? '继续 →' : '查看结果 ✨';
    },
    completeEmoji() {
      if (this.finalStars >= 4) return '🏆';
      if (this.finalStars >= 2) return '🎉';
      return '💪';
    },
    completeTitle() {
      if (this.finalStars >= 4) return '太厉害了！';
      if (this.finalStars >= 2) return '做得好！';
      return '继续加油！';
    }
  },
  onLoad(options) {
    this.book = options.book || '2上';
    this.lesson = parseInt(options.lesson) || 1;
    this.type = options.type || '阅读';
    this.mode = options.mode || 'mixed';
    this.tableType = options.tableType || '';
    this.tableLabel = options.tableLabel ? decodeURIComponent(options.tableLabel) : '';
    this.generateQuestions();
  },
  methods: {
    generateQuestions() {
      let chars;
      if (this.tableType === 'recognition') {
        chars = recognitionChars.filter(c => c.book === this.book && c.lesson === this.lesson);
      } else if (this.tableType === 'writing') {
        chars = writingChars.filter(c => c.book === this.book && c.lesson === this.lesson);
      } else {
        chars = allCharacters.filter(c => c.book === this.book && c.lesson === this.lesson);
      }
      if (!chars || chars.length === 0) {
        uni.showToast({ title: '暂无数据', icon: 'none' });
        return;
      }

      let questions;
      if (this.tableType === 'words') {
        questions = this.generateLessonWords(chars, chars.length);
      } else {
        questions = generateQuestions(chars, chars.length);
      }

      if (!this.tableType) {
        const lessonWords = getLessonWords(this.book, this.lesson);
        if (lessonWords.length > 0) {
          const wordQs = [];
          shuffle(lessonWords).forEach(w => {
            const pos = Math.floor(Math.random() * w.length);
            const bc = w[pos];
            const wc2 = pickWrongAnswers(chars, bc, 3);
            if (wc2.length >= 2) {
              wordQs.push({ type:'wordFill', blanked:w.slice(0,pos)+'_'+w.slice(pos+1), correct:bc, wrong:wc2.slice(0,3), fullWord:w });
            }
          });
          questions = shuffle([...questions, ...wordQs]);
        }
      }

      this.questions = questions;
      this.totalQuestions = questions.length;
      this.currentIndex = 0;
      this.score = 0;
      this.answeredCorrectly = 0;
      this.prepareOptions();
    },

    generateLessonWords(chars, count) {
      const lessonWords = getLessonWords(this.book, this.lesson);
      const wordPool = lessonWords.length > 0 ? lessonWords : allWords;
      const results = [];
      shuffle(wordPool).slice(0, Math.min(count, wordPool.length)).forEach(w => {
        const pos = Math.floor(Math.random() * w.length);
        const bc = w[pos];
        const wc2 = pickWrongAnswers(chars, bc, 3);
        if (wc2.length >= 2) {
          results.push({ type:'wordFill', blanked:w.slice(0,pos)+'_'+w.slice(pos+1), correct:bc, wrong:wc2.slice(0,3), fullWord:w });
        }
      });
      return shuffle(results).slice(0, count);
    },

    prepareOptions() {
      const q = this.currentQuestion;
      if (!q) return;
      this.shuffledOptions = shuffle([q.correct, ...(q.wrong || [])]);
      this.showFeedback = false;
      this.selectedAnswer = '';
    },

    selectAnswer(opt) {
      if (this.showFeedback) return;
      this.selectedAnswer = opt;
      this.showFeedback = true;
      this.lastCorrect = opt === this.currentQuestion.correct;
      if (this.lastCorrect) {
        this.answeredCorrectly++;
        this.score++;
        uni.vibrateShort({ type: 'light' });
      }
    },

    nextQuestion() {
      if (this.currentIndex >= this.totalQuestions - 1) {
        this.finishExercise();
        return;
      }
      this.showFeedback = false;
      this.currentIndex++;
      this.prepareOptions();
    },

    getOptClass(opt) {
      if (!this.showFeedback) return '';
      if (opt === this.currentQuestion.correct) return 'opt-correct';
      if (opt === this.selectedAnswer && !this.lastCorrect) return 'opt-wrong';
      if (this.showFeedback) return 'opt-dim';
      return '';
    },

    finishExercise() {
      this.isFinished = true;
      this.finalCorrect = this.answeredCorrectly;
      this.finalStars = Math.ceil((this.answeredCorrectly / this.totalQuestions) * 5);
      this.saveProgress();
    },

    saveProgress() {
      try {
        const key = `${this.book}_${this.type}_${this.lesson}`;
        let data = uni.getStorageSync('chinese_progress') || {};
        data.lessonStars = data.lessonStars || {};
        data.completedLessons = data.completedLessons || 0;
        data.totalStars = data.totalStars || 0;
        data.totalExercises = (data.totalExercises || 0) + 1;

        const prevStars = data.lessonStars[key] || 0;
        if (this.finalStars > prevStars) {
          data.totalStars += this.finalStars - prevStars;
          data.lessonStars[key] = this.finalStars;
        }
        if (!data.completedKeys) data.completedKeys = {};
        if (!data.completedKeys[key]) {
          data.completedKeys[key] = true;
          data.completedLessons++;
        }

        data.bookProgresses = data.bookProgresses || {};
        const totalKeys = Object.keys(data.lessonStars).filter(k => k.startsWith(this.book)).length;
        const totalPossibleLessons = { '2上':30, '2下':30 }[this.book] || 30;
        data.bookProgresses[this.book] = Math.round(totalKeys / totalPossibleLessons * 100);

        uni.setStorageSync('chinese_progress', data);
      } catch(e) { console.error('保存进度失败', e); }
    },

    replayLesson() {
      this.isFinished = false;
      this.currentIndex = 0;
      this.answeredCorrectly = 0;
      this.score = 0;
      this.generateQuestions();
    },

    goBack() {
      uni.navigateBack({ delta: 1 });
    },

    goHome() {
      uni.switchTab({ url: '/pages/index/index' });
    }
  }
};
</script>

<style scoped>
/* ========================================
   色彩系统 (低饱和马卡龙)
   ======================================== */
.exercise-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #F7F4FC;
}

/* ===== 顶部导航栏 ===== */
.nav-header {
  background: linear-gradient(180deg, #C4B5FD 0%, #DDD6FE 60%, #EDE9FE 100%);
  padding: 60rpx 28rpx 24rpx;
}
.nav-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-left {
  padding: 8rpx 16rpx;
  border-radius: 50%;
}
.nav-back-arrow {
  font-size: 40rpx;
  color: #fff;
  font-weight: 300;
}
.nav-left:active { background: rgba(255,255,255,0.2); }

.nav-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 2rpx;
  text-shadow: 0 2rpx 8rpx rgba(139, 92, 246, 0.3);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.nav-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.35);
  border: 3rpx solid rgba(255,255,255,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}
.nav-home-btn {
  padding: 8rpx 12rpx;
  border-radius: 20rpx;
}
.nav-home-btn:active { background: rgba(255,255,255,0.2); }
.nav-home-icon { font-size: 36rpx; }

.nav-score-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32rpx;
  margin-top: 16rpx;
}
.nav-score-text {
  color: #A78BFA;
  font-size: 26rpx;
  font-weight: 700;
  background: rgba(255,255,255,0.6);
  padding: 6rpx 24rpx;
  border-radius: 28rpx;
}
.nav-progress-text {
  color: rgba(255,255,255,0.9);
  font-size: 26rpx;
  font-weight: 600;
}

/* ===== 练习区 ===== */
.ex-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 28rpx 56rpx;
  position: relative;
  overflow: hidden;
}

/* 背景装饰纹样 */
.bg-pattern {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  overflow: hidden;
}
.deco-item {
  position: absolute;
  font-size: 64rpx;
  opacity: 0.06;
}
.deco-1 { top: 8%; left: 6%; transform: rotate(-15deg); font-size: 72rpx; }
.deco-2 { top: 15%; right: 8%; transform: rotate(10deg); font-size: 48rpx; }
.deco-3 { top: 35%; left: 4%; transform: rotate(-8deg); font-size: 56rpx; }
.deco-4 { bottom: 30%; right: 6%; transform: rotate(5deg); font-size: 80rpx; }
.deco-5 { bottom: 12%; left: 10%; transform: rotate(20deg); font-size: 44rpx; }
.deco-6 { top: 55%; right: 4%; transform: rotate(-12deg); font-size: 52rpx; }
.deco-7 { top: 5%; left: 45%; transform: rotate(15deg); font-size: 40rpx; }
.deco-8 { bottom: 20%; right: 30%; transform: rotate(-20deg); font-size: 48rpx; }

/* ===== 答题卡片 ===== */
.q-card {
  position: relative;
  z-index: 1;
  width: 100%;
  background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
  border-radius: 36rpx;
  box-shadow:
    0 4rpx 24rpx rgba(139, 92, 246, 0.08),
    0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  overflow: hidden;
  animation: cardIn 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
@keyframes cardIn {
  0% { opacity: 0; transform: translateY(68rpx) scale(0.93); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

/* 题型标签 */
.q-tag-row {
  text-align: center;
  padding: 24rpx 0 8rpx;
}
.q-tag {
  display: inline-block;
  background: #E8EFFF;
  color: #6D8AEF;
  font-size: 24rpx;
  font-weight: 700;
  padding: 8rpx 36rpx;
  border-radius: 28rpx;
}

/* 题目大字 */
.q-char-lg {
  display: block;
  text-align: center;
  font-size: 180rpx;
  font-weight: 800;
  color: #4A4A6A;
  padding: 28rpx 0 8rpx;
  line-height: 1.15;
}
.q-pinyin-lg {
  display: block;
  text-align: center;
  font-size: 100rpx;
  font-weight: 700;
  color: #6D8AEF;
  padding: 40rpx 0 16rpx;
  letter-spacing: 8rpx;
}
.q-blank-lg {
  display: block;
  text-align: center;
  font-size: 80rpx;
  font-weight: 700;
  color: #FF7B7B;
  padding: 40rpx 0 16rpx;
  letter-spacing: 12rpx;
}
.q-hint {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: #A0A0B8;
  padding-bottom: 28rpx;
}

/* ===== 选项按钮 2×2 ===== */
.opt-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  padding: 0 32rpx 28rpx;
}
.opt-btn {
  position: relative;
  padding: 34rpx 20rpx;
  background: #FFF;
  border: 2rpx solid #E8ECF4;
  border-radius: 24rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease, border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
/* 悬浮微动效暗示 */
.opt-btn:not(.opt-correct):not(.opt-wrong):not(.opt-dim) {
  animation: floatHint 2.5s ease-in-out infinite;
}
@keyframes floatHint {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4rpx); }
}
.opt-btn:active:not(.opt-correct):not(.opt-wrong):not(.opt-dim) {
  transform: scale(0.95) !important;
  border-color: #C4B5FD;
  background: #FAF8FF;
  box-shadow: 0 2rpx 12rpx rgba(139, 92, 246, 0.15);
  animation: none;
}
.opt-btn-text {
  font-size: 42rpx;
  font-weight: 700;
  color: #4A4A6A;
}

/* 正确 */
.opt-correct {
  background: #EDFBF0 !important;
  border-color: #86D896 !important;
  box-shadow: 0 2rpx 12rpx rgba(102, 187, 106, 0.2) !important;
  animation: bouncePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}
.opt-correct .opt-btn-text { color: #2E7D32 !important; }

/* 错误 */
.opt-wrong {
  background: #FFF0F0 !important;
  border-color: #F5A0A0 !important;
  box-shadow: 0 2rpx 12rpx rgba(244, 67, 54, 0.15) !important;
  animation: shake 0.5s ease !important;
}
.opt-wrong .opt-btn-text { color: #C62828 !important; }

/* 未选中的变暗 */
.opt-dim { opacity: 0.35; pointer-events: none; }

@keyframes bouncePop {
  0% { transform: scale(0.9); }
  50% { transform: scale(1.07); }
  100% { transform: scale(1); }
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-12rpx); }
  75% { transform: translateX(12rpx); }
}

/* ===== 反馈区 ===== */
.feedback-wrap {
  text-align: center;
  padding: 0 32rpx 8rpx;
}
.fb-correct {
  padding: 12rpx 0;
}
.fb-icon { font-size: 44rpx; display: block; }
.fb-text { font-size: 32rpx; font-weight: 700; color: #66BB6A; display: block; margin-top: 4rpx; }

.fb-wrong {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx 0;
}
.fb-label { font-size: 24rpx; color: #A0A0B8; margin-bottom: 6rpx; }
.fb-answer { font-size: 56rpx; font-weight: 800; color: #EF5350; }
.fb-extra { font-size: 26rpx; color: #EF5350; opacity: 0.7; margin-top: 4rpx; }

/* ===== 继续按钮 ===== */
.next-wrap {
  text-align: center;
  padding: 20rpx 0 36rpx;
}
.next-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 80rpx;
  background: linear-gradient(135deg, #A78BFA, #8B5CF6);
  border-radius: 48rpx;
  box-shadow: 0 4rpx 16rpx rgba(139, 92, 246, 0.25);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease, box-shadow 0.2s;
}
.next-btn:active { transform: scale(0.95); box-shadow: 0 2rpx 8rpx rgba(139, 92, 246, 0.15); }
.next-btn-text {
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
}

/* ===== 加载 ===== */
.loading-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #F7F4FC;
}
.load-icon { font-size: 72rpx; margin-bottom: 16rpx; }
.load-text { font-size: 28rpx; color: #B0A8D0; }

/* ===== 完成页 ===== */
.complete-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  background: #F7F4FC;
}
.cp-card {
  width: 92%;
  max-width: 680rpx;
  background: #FFF;
  border-radius: 44rpx;
  overflow: hidden;
  text-align: center;
  box-shadow: 0 8rpx 32rpx rgba(139, 92, 246, 0.1);
  animation: cardIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.cp-rainbow-bar {
  height: 8rpx;
  background: linear-gradient(90deg, #A78BFA, #60A5FA, #34D399, #FBBF24, #F472B6);
}

.cp-emoji { font-size: 96rpx; display: block; padding-top: 44rpx; }
.cp-title { font-size: 44rpx; font-weight: 800; color: #4A4A6A; display: block; padding-top: 10rpx; }
.cp-stat { font-size: 28rpx; color: #A0A0B8; padding-top: 6rpx; }
.cp-num { color: #8B5CF6; font-weight: 700; }

.cp-stars-row {
  display: flex;
  justify-content: center;
  gap: 10rpx;
  padding: 28rpx 0 8rpx;
}
.cp-star-item {
  font-size: 56rpx;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.cp-star-item:not(.on) {
  opacity: 0.22;
  transform: scale(0.78);
  filter: grayscale(1);
}

.cp-earned {
  font-size: 28rpx;
  color: #A0A0B8;
  padding-bottom: 36rpx;
  display: block;
}
.cp-earned-num { color: #A78BFA; font-weight: 700; font-size: 32rpx; }

.cp-btns { padding: 0 52rpx 48rpx; }

.cp-btn {
  width: 100%;
  padding: 28rpx;
  border-radius: 48rpx;
  font-size: 30rpx;
  font-weight: 700;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease, box-shadow 0.2s;
}
.cp-btn:active { transform: scale(0.95); }

.cp-btn.replay {
  background: linear-gradient(135deg, #A78BFA, #8B5CF6);
  color: #fff;
  box-shadow: 0 4rpx 16rpx rgba(139, 92, 246, 0.25);
  margin-bottom: 20rpx;
}

.cp-btn.home {
  background: #F8F6FF;
  color: #8B5CF6;
  border: 2rpx solid #E8E0FF;
}
</style>
