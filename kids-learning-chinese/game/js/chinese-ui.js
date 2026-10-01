// ============================================================
// UI 管理模块 - 界面渲染、用户交互
// ============================================================
const CHINESE_UI = (function() {
  const C = CHINESE_CORE;
  const A = CHINESE_AUDIO;

  // DOM references (set in init)
  let dom = {};

  // ==================== INIT ====================
  function init() {
    dom = {
      score: document.getElementById('score'),
      zoneName: document.getElementById('zone-name'),
      progress: document.getElementById('progress'),
      gameContainer: document.getElementById('game-container'),
      bookSelect: document.getElementById('book-select'),
      levelSelect: document.getElementById('level-select'),
      scene: document.getElementById('scene'),
      questionOverlay: document.getElementById('question-overlay'),
      questionBox: document.getElementById('question-box'),
      levelComplete: document.getElementById('level-complete'),
      tipBar: document.getElementById('tip-bar')
    };
  }

  // ==================== BOOK SELECT ====================
  function showBookSelect() {
    C.state.currentView = 'bookSelect';
    hideAll();

    dom.bookSelect.innerHTML = `
      <h2>📚 选择课本</h2>
      <p class="subtitle">选择要学习的教材</p>
      <div class="book-grid">
        ${C.D.BOOKS.map((book, i) => {
          const progress = C.getProgressForBook(book.id);
          const pct = progress.total > 0 ? Math.round(progress.completed / progress.total * 100) : 0;
          return `
            <div class="book-card" onclick="CHINESE_UI.showLevelSelect('${book.id}')">
              <span class="book-icon">${['📖','📗'][i]}</span>
              <div class="book-name">${book.name}</div>
              <div class="book-stats">${book.charCount} 生字 · ${book.wordCount} 词语</div>
              <div class="book-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${pct}%"></div>
                </div>
                <span>${progress.completed}/${progress.total} ⭐${progress.totalStars}</span>
              </div>
            </div>`;
        }).join('')}
      </div>
      <button class="btn btn-home" onclick="window.location.href='index.html'">🏠 返回主菜单</button>
    `;

    dom.bookSelect.classList.remove('hidden');
    dom.tipBar.textContent = '📚 选择一本教材开始学习吧！';
    updateScoreBar();
  }

  // ==================== LEVEL SELECT ====================
  function showLevelSelect(book) {
    C.state.currentBook = book;
    C.state.currentView = 'levelSelect';
    hideAll();

    const progress = C.getProgressForBook(book);
    const bookInfo = C.D.BOOKS.find(b => b.id === book);
    const bookName = bookInfo ? bookInfo.name : book;

    // Group by type
    const byType = {};
    progress.lessons.forEach(l => {
      if (!byType[l.type]) byType[l.type] = [];
      byType[l.type].push(l);
    });

    let html = `<h2>${bookName}</h2>`;
    html += '<p class="subtitle">选择一课开始学习</p>';

    const typeNames = { '阅读': '📖 课文', '识字': '✏️ 识字', '语文园地': '🌱 语文园地' };
    const typeIcons = { '阅读': '📖', '识字': '✏️', '语文园地': '🌱' };

    for (const [type, lessons] of Object.entries(byType)) {
      html += `<div class="lesson-group">`;
      html += `<h3>${typeNames[type] || type}</h3>`;
      html += `<div class="lesson-grid">`;

      // Sort by lesson number
      const sorted = [...lessons].sort((a, b) => a.lesson - b.lesson);
      sorted.forEach(l => {
        const stars = l.stars || 0;
        const completed = l.completed;
        html += `
          <div class="lesson-card ${completed ? 'completed' : ''}"
               onclick="CHINESE_UI.handleLevelClick('${book}', ${l.lesson}, '${l.type}')">
            <span class="lesson-icon">${typeIcons[type] || '📝'}</span>
            <div class="lesson-num">第${l.lesson}课</div>
            <div class="lesson-stars">${completed ? '⭐'.repeat(stars) : '○ ○ ○ ○ ○'.split(' ').map((s,i) => i<stars?'⭐':s).join('')}</div>
          </div>`;
      });

      html += `</div></div>`;
    }

    html += `<button class="btn btn-sec" onclick="CHINESE_UI.showBookSelect()">🔙 返回选课本</button>`;

    dom.levelSelect.innerHTML = html;
    dom.levelSelect.classList.remove('hidden');
    dom.tipBar.textContent = '📝 点击一课卡片开始答题挑战！';
    updateScoreBar();
  }

  function handleLevelClick(book, lesson, type) {
    const started = C.startLevel(book, lesson, type, 6);
    if (started) {
      showPlaying();
    }
  }

  // ==================== PLAYING SCREEN ====================
  function showPlaying() {
    hideAll();
    dom.scene.classList.add('active');

    // Scene background
    const themes = ['forest', 'beach', 'winter', 'space'];
    const themeIdx = (C.state.currentBook === '2上' ? 0 : 2) + (C.state.currentLesson % 2);
    const theme = themes[themeIdx % 4];

    dom.scene.innerHTML = `
      <div class="scene-bg ${theme}"></div>
      <div class="question-area">
        <div class="level-title">
          ${C.state.currentBook === '2上' ? '📖 二年级上册' : '📗 二年级下册'}
          第${C.state.currentLesson}课
        </div>
        <div class="question-count">
          题目 ${C.state.currentQIndex + 1} / ${C.state.questions.length}
          | 答对 ${C.state.answeredCorrectly} 题
        </div>
        <div id="question-display"></div>
      </div>
    `;

    showQuestion();
    updateScoreBar();
    dom.tipBar.textContent = '💡 选择正确答案吧！加油！';
  }

  function showQuestion() {
    const q = C.getCurrentQuestion();
    if (!q) return;

    const display = document.getElementById('question-display');
    if (!display) return;

    let options = [];
    let html = '';

    switch (q.type) {
    case 'readPinyin':
      // Show char, pick pinyin
      options = C.D.shuffle([q.correct, ...q.wrong]);
      html = `
        <div class="q-item">
          <div class="q-label">📖 这个字读什么？</div>
          <div class="q-char">${q.char}</div>
          <div class="q-hint">${q.meta || ''}</div>
          <div class="options-grid options-4">
            ${options.map(o => `<button class="option-btn" onclick="CHINESE_UI.handleAnswer('${o}', '${q.correct}', this)">${o}</button>`).join('')}
          </div>
          <div class="feedback-area" id="feedback"></div>
        </div>`;
      break;

    case 'pickChar':
      // Show pinyin, pick char
      options = C.D.shuffle([q.correct, ...q.wrong]);
      html = `
        <div class="q-item">
          <div class="q-label">✏️ 这个拼音对应的字是？</div>
          <div class="q-pinyin">${q.pinyin}</div>
          <div class="q-hint">${q.meta || ''}</div>
          <div class="options-grid options-4">
            ${options.map(o => `<button class="option-btn char-btn" onclick="CHINESE_UI.handleAnswer('${o}', '${q.correct}', this)">${o}</button>`).join('')}
          </div>
          <div class="feedback-area" id="feedback"></div>
        </div>`;
      break;

    case 'listenChar':
      // Similar to pickChar but with listen button
      options = C.D.shuffle([q.correct, ...q.wrong]);
      html = `
        <div class="q-item">
          <div class="q-label">🔊 听一听，选汉字</div>
          <button class="listen-btn" onclick="CHINESE_UI.speakChar('${q.correct}')">
            🔊 点击听发音
          </button>
          <div class="q-hint">选择正确的汉字</div>
          <div class="options-grid options-4">
            ${options.map(o => `<button class="option-btn char-btn" onclick="CHINESE_UI.handleAnswer('${o}', '${q.correct}', this)">${o}</button>`).join('')}
          </div>
          <div class="feedback-area" id="feedback"></div>
        </div>`;
      break;

    case 'radical':
      options = C.D.shuffle([q.correct, ...q.wrong]);
      html = `
        <div class="q-item">
          <div class="q-label">🧩 找偏旁部首</div>
          <div class="q-char">${q.char}</div>
          <div class="q-hint">${q.question}</div>
          <div class="options-grid options-4">
            ${options.map(o => `<button class="option-btn radical-btn" onclick="CHINESE_UI.handleAnswer('${o}', '${q.correct}', this)">${o}</button>`).join('')}
          </div>
          <div class="feedback-area" id="feedback"></div>
        </div>`;
      break;

    case 'wordFill':
      options = C.D.shuffle([q.correct, ...q.wrong]);
      html = `
        <div class="q-item">
          <div class="q-label">📝 词语填空</div>
          <div class="q-word-blank">${q.blanked}</div>
          <div class="q-hint">填入正确的字</div>
          <div class="options-grid options-4">
            ${options.map(o => `<button class="option-btn char-btn" onclick="CHINESE_UI.handleAnswer('${o}', '${q.correct}', this)">${o}</button>`).join('')}
          </div>
          <div class="feedback-area" id="feedback"></div>
        </div>`;
      break;

    case 'makeWord':
      options = C.D.shuffle([q.correct, ...q.wrong]);
      html = `
        <div class="q-item">
          <div class="q-label">🔗 组词</div>
          <div class="q-char">${q.char}</div>
          <div class="q-hint">${q.question}</div>
          <div class="options-grid options-4">
            ${options.map(o => `<button class="option-btn word-btn" onclick="CHINESE_UI.handleAnswer('${o}', '${q.correct}', this)">${o}</button>`).join('')}
          </div>
          <div class="feedback-area" id="feedback"></div>
        </div>`;
      break;
    }

    display.innerHTML = html;
    C.state.isShowingQuestion = true;
  }

  // ==================== ANSWER HANDLING ====================
  function handleAnswer(selected, correct, btnEl) {
    if (!C.state.isShowingQuestion) return;

    // Disable all buttons
    const allBtns = btnEl.parentElement.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);

    // Highlight correct answer
    allBtns.forEach(b => {
      if (b.textContent === correct) b.classList.add('correct-answer');
    });

    const isCorrect = selected === correct;
    const feedbackEl = document.getElementById('feedback');

    if (isCorrect) {
      btnEl.classList.add('correct-answer');
      A.playCorrect();
      feedbackEl.innerHTML = `
        <div class="correct-msg">✅ 答对啦！太棒了！</div>
        <button class="continue-btn" onclick="CHINESE_UI.nextQuestion()">继续 ⭐</button>
      `;
      spawnStar(btnEl);
    } else {
      btnEl.classList.add('wrong-answer');
      A.playWrong();
      const msgs = ['没关系，再想想就能答对！💪', '差一点点，下次一定能选对！😊',
                    '别灰心，学习就是不断进步的过程~', '已经很接近了，继续加油哦！🌟'];
      feedbackEl.innerHTML = `
        <div class="wrong-msg">${msgs[Math.floor(Math.random()*msgs.length)]}</div>
        <button class="continue-btn" onclick="CHINESE_UI.nextQuestion()">知道了 👍</button>
      `;
    }

    // Report answer to core
    const result = C.answerQuestion(isCorrect);
    if (result.finished) {
      setTimeout(() => showLevelComplete(result), 1500);
    }

    C.state.isShowingQuestion = false;
    updateScoreBar();
  }

  function nextQuestion() {
    if (C.state.currentView === 'complete') return;
    showQuestion();
  }

  // ==================== LEVEL COMPLETE ====================
  function showLevelComplete(result) {
    hideAll();
    C.state.currentView = 'complete';

    dom.levelComplete.innerHTML = `
      <div class="complete-box">
        <span class="big-icon">${result.stars >= 4 ? '🎉' : result.stars >= 2 ? '👏' : '💪'}</span>
        <h2>${result.stars >= 4 ? '太厉害了！' : result.stars >= 2 ? '做得好！' : '继续加油！'}</h2>
        <p>第${C.state.currentLesson}课完成</p>
        <p class="result-text">答对 ${result.correct} / ${result.total} 题</p>
        <div class="stars-earned">${'⭐'.repeat(result.stars)}</div>
        <button class="btn" onclick="CHINESE_UI.retryLevel()">🔄 再练一次</button>
        <button class="btn btn-sec" onclick="CHINESE_UI.showLevelSelect('${C.state.currentBook}')">📝 选其他课</button>
        <button class="btn btn-home" onclick="CHINESE_UI.showBookSelect()">📚 换课本</button>
      </div>
    `;

    dom.levelComplete.classList.add('show');
    dom.tipBar.textContent = result.stars >= 4 ? '🌟 太棒了！继续加油！' : '💪 多多练习会更好的！';
    A.playComplete();

    if (result.stars >= 4) {
      setTimeout(() => A.playVictory(), 500);
    }
  }

  function retryLevel() {
    const started = C.startLevel(C.state.currentBook, C.state.currentLesson, C.state.currentLevelType, 6);
    if (started) showPlaying();
  }

  // ==================== HELPERS ====================
  function hideAll() {
    [dom.bookSelect, dom.levelSelect, dom.levelComplete].forEach(el => {
      if (el) el.classList.add('hidden');
    });
    if (dom.scene) dom.scene.classList.remove('active');
    if (dom.levelComplete) dom.levelComplete.classList.remove('show');
  }

  function updateScoreBar() {
    if (dom.score) dom.score.textContent = C.state.score;
    if (dom.zoneName) {
      dom.zoneName.textContent =
        C.state.currentView === 'playing'
          ? `第${C.state.currentLesson}课`
          : C.state.currentBook === '2上' ? '二年级上册' : C.state.currentBook === '2下' ? '二年级下册' : '首页';
    }
    if (dom.progress) {
      dom.progress.textContent =
        C.state.currentView === 'playing'
          ? `${C.state.currentQIndex + 1}/${C.state.questions.length}`
          : '-';
    }
  }

  function spawnStar(btnEl) {
    const container = dom.gameContainer;
    const rect = btnEl.getBoundingClientRect();
    const star = document.createElement('span');
    star.className = 'star-particle';
    star.style.left = (rect.left - container.getBoundingClientRect().left + rect.width/2 - 12) + 'px';
    star.style.top = (rect.top - container.getBoundingClientRect().top) + 'px';
    container.appendChild(star);
    setTimeout(() => star.remove(), 1200);
  }

  function speakChar(char) {
    // Use browser TTS if available
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(char);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
    A.playClick();
  }

  return {
    init,
    showBookSelect,
    showLevelSelect,
    handleLevelClick,
    handleAnswer,
    nextQuestion,
    retryLevel,
    speakChar
  };
})();
