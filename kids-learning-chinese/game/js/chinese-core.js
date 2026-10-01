// ============================================================
// 游戏核心模块 - 状态管理、关卡推进
// ============================================================
const CHINESE_CORE = (function() {
  const D = CHINESE_DATA;
  const Q = CHINESE_QUESTIONS;

  // ==================== GAME STATE ====================
  const state = {
    score: 0,
    currentBook: '2上',       // '2上' or '2下'
    currentView: 'bookSelect', // 'bookSelect' | 'levelSelect' | 'playing' | 'complete'
    currentLesson: -1,
    currentLevelType: '',
    questions: [],
    currentQIndex: 0,
    answeredCorrectly: 0,
    isShowingQuestion: false,

    // Progress tracking (persisted to localStorage)
    progress: loadProgress()
  };

  // ==================== PERSISTENCE ====================
  function loadProgress() {
    try {
      const saved = localStorage.getItem('chinese_adventure_progress');
      if (saved) {
        const p = JSON.parse(saved);
        // Ensure structure
        p['2上'] = p['2上'] || { completed: {}, stars: {} };
        p['2下'] = p['2下'] || { completed: {}, stars: {} };
        return p;
      }
    } catch(e) {}
    return {
      '2上': { completed: {}, stars: {} },
      '2下': { completed: {}, stars: {} }
    };
  }

  function saveProgress() {
    try {
      localStorage.setItem('chinese_adventure_progress', JSON.stringify(state.progress));
    } catch(e) {}
  }

  function isLevelCompleted(book, lesson, type) {
    const key = `${type}_${lesson}`;
    return state.progress[book].completed[key] || false;
  }

  function markLevelCompleted(book, lesson, type, stars) {
    const key = `${type}_${lesson}`;
    state.progress[book].completed[key] = true;
    state.progress[book].stars[key] = Math.max(
      state.progress[book].stars[key] || 0, stars
    );
    saveProgress();
  }

  function getLevelStars(book, lesson, type) {
    const key = `${type}_${lesson}`;
    return state.progress[book].stars[key] || 0;
  }

  // ==================== GAME FLOW ====================
  function startLevel(book, lesson, type, questionCount) {
    state.currentBook = book;
    state.currentLesson = lesson;
    state.currentLevelType = type;

    const chars = D.getCharactersByLesson(book, lesson);
    if (chars.length === 0) return false;

    const count = questionCount || Math.min(8, Math.max(4, Math.floor(chars.length / 2)));
    state.questions = Q.generateMixed(chars, count);
    state.currentQIndex = 0;
    state.answeredCorrectly = 0;
    state.isShowingQuestion = false;
    state.currentView = 'playing';

    return true;
  }

  function getCurrentQuestion() {
    if (state.currentQIndex >= state.questions.length) return null;
    return state.questions[state.currentQIndex];
  }

  function answerQuestion(isCorrect) {
    if (isCorrect) {
      state.answeredCorrectly++;
      state.score++;
    }
    state.currentQIndex++;

    if (state.currentQIndex >= state.questions.length) {
      // Level complete
      const totalQuestions = state.questions.length;
      const stars = Math.ceil((state.answeredCorrectly / totalQuestions) * 5);
      markLevelCompleted(state.currentBook, state.currentLesson, state.currentLevelType, stars);
      state.currentView = 'complete';
      return { finished: true, stars, correct: state.answeredCorrectly, total: totalQuestions };
    }
    return { finished: false };
  }

  function getProgressForBook(book) {
    const chars = D.getCharactersByBook(book);
    const lessons = {};
    chars.forEach(c => {
      const key = `${c.type}_${c.lesson}`;
      lessons[key] = {
        type: c.type,
        lesson: c.lesson,
        completed: isLevelCompleted(book, c.lesson, c.type),
        stars: getLevelStars(book, c.lesson, c.type)
      };
    });

    // Count progress
    const lessonList = Object.values(lessons);
    const completed = lessonList.filter(l => l.completed).length;
    const totalStars = lessonList.reduce((s, l) => s + l.stars, 0);

    return {
      lessons: lessonList,
      completed,
      total: lessonList.length,
      totalStars,
      // Unique lessons
      uniqueLessons: [...new Set(lessonList.map(l => `${l.type}_${l.lesson}`))]
    };
  }

  function resetProgress(book) {
    if (book) {
      state.progress[book] = { completed: {}, stars: {} };
    } else {
      state.progress = { '2上': { completed: {}, stars: {} }, '2下': { completed: {}, stars: {} } };
    }
    state.score = 0;
    saveProgress();
  }

  return {
    state,
    D,           // Data module reference
    Q,           // Questions module reference
    startLevel,
    getCurrentQuestion,
    answerQuestion,
    getProgressForBook,
    isLevelCompleted,
    markLevelCompleted,
    getLevelStars,
    resetProgress,
    saveProgress
  };
})();
