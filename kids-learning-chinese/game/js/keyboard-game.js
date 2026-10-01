// ============================================================
// 键盘小特工 - 游戏逻辑模块 V2.1
// Bug fixes: cssText overflow, duplicate timers, duplicate listeners
// ============================================================
const KeyboardGame = (function() {
  // ===== 游戏状态 =====
  const gameState = {
    score: 0, level: 1, time: 60,
    isPlaying: false, fruitsCollected: 0, targetFruits: 10,
    px: 50, py: 200, isJumping: false
  };

  const keys = { up: false, down: false, left: false, right: false, space: false };

  const config = {
    playerSpeed: 6,
    obstacleSpeed: [1.5, 2, 2.5, 3, 3.5, 4],
    fruitCount: [8, 10, 12, 10, 8, 10],
    timeLimit: [60, 60, 60, 30, 45, 60],
    maxLevel: 6
  };

  // ===== DOM =====
  let container, player;
  let fruits = [], obstacles = [];
  let gameTimer = null, loopTimer = null;
  let bgCreated = false;
  let listenersBound = false;
  let cv = 0, ch = 0;

  // ===== 背景装饰 =====
  function createForestBg() {
    const pl = document.getElementById('fg-particles');
    if (!pl) return;

    for (let i = 0; i < 15; i++) {
      const l = document.createElement('div');
      l.className = 'fg-leaf';
      const colors = ['#4CAF50','#8BC34A','#66BB6A','#81C784'];
      l.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-duration:${8 + Math.random() * 12}s;animation-delay:${Math.random() * 8}s;width:${8 + Math.random() * 10}px;height:${12 + Math.random() * 12}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random() > 0.5 ? '50% 0 50% 0' : '0 50% 0 50%'};opacity:${0.5 + Math.random() * 0.3}`;
      pl.appendChild(l);
    }

    for (let i = 0; i < 15; i++) {
      const d = document.createElement('div');
      d.className = 'fg-dot';
      const glow = ['#FFEB3B','#FFD54F','#CDDC39','#FFC107'];
      d.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-duration:${2 + Math.random() * 3}s;animation-delay:${Math.random() * 3}s;width:${3 + Math.random() * 5}px;height:${3 + Math.random() * 5}px;background:${glow[Math.floor(Math.random()*glow.length)]};box-shadow:0 0 ${6 + Math.random() * 8}px currentColor`;
      pl.appendChild(d);
    }
  }

  function createBgDecor() {
    if (bgCreated) return;
    bgCreated = true;
    // Trees (CSS triangles)
    const treeColors = ['#2E7D32','#388E3C','#43A047'];
    for (let i = 0; i < 10; i++) {
      const t = document.createElement('div');
      t.className = 'bg-deco tree';
      const s = 20 + Math.random() * 25;
      const col = treeColors[Math.floor(Math.random() * treeColors.length)];
      t.innerHTML = `<div class="tree-top" style="border-left:${s/2}px solid transparent;border-right:${s/2}px solid transparent;border-bottom:${s*1.2}px solid ${col}"></div><div class="tree-trunk" style="background:${col === '#2E7D32' ? '#5D4037' : '#795548'}"></div>`;
      t.style.cssText = `left:${40 + Math.random() * (cv - 120)}px;top:${40 + Math.random() * (ch - 220)}px;width:${s}px`;
      container.appendChild(t);
    }
    // Bushes (CSS circles)
    const bushColors = ['#388E3C','#4CAF50','#66BB6A','#2E7D32'];
    for (let i = 0; i < 8; i++) {
      const b = document.createElement('div');
      b.className = 'bg-deco bush';
      const col = bushColors[Math.floor(Math.random() * bushColors.length)];
      b.innerHTML = `<div class="bush-circle" style="background:${col}"></div><div class="bush-circle bush-dot" style="background:${col === '#388E3C' ? '#81C784' : '#A5D6A7'}"></div>`;
      b.style.cssText = `left:${40 + Math.random() * (cv - 120)}px;top:${ch - 100 - Math.random() * 50}px`;
      container.appendChild(b);
    }
  }

  // ===== 游戏初始化 =====
  function init() {
    container = document.getElementById('game-container');
    player = document.getElementById('player');
    cv = container.clientWidth;
    ch = container.clientHeight;
    createForestBg();
    createPlayerSVG();
    updateUI();
  }

  function createPlayerSVG() {
    player.style.width = '50px';
    player.style.height = '60px';
    player.innerHTML = `<svg viewBox="0 0 50 60">
      <defs>
        <radialGradient id="kGrad" cx="40%" cy="30%"><stop offset="0%" stop-color="#64B5F6"/><stop offset="100%" stop-color="#1565C0"/></radialGradient>
        <filter id="kGlow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx="25" cy="20" r="14" fill="url(#kGrad)" filter="url(#kGlow)"/>
      <circle cx="20" cy="17" r="2.5" fill="white"/><circle cx="30" cy="17" r="2.5" fill="white"/>
      <circle cx="20" cy="17" r="1.2" fill="#111"/><circle cx="30" cy="17" r="1.2" fill="#111"/>
      <path d="M19 26 Q25 31 31 26" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="12" y="38" width="26" height="14" rx="7" fill="#1565C0"/>
      <rect x="8" y="46" width="8" height="10" rx="4" fill="#0D47A1"/>
      <rect x="34" y="46" width="8" height="10" rx="4" fill="#0D47A1"/>
    </svg>`;
  }

  function initGame() {
    cv = Math.max(400, container.clientWidth);
    ch = Math.max(300, container.clientHeight);
    gameState.px = 50;
    gameState.py = ch / 2;

    createBgDecor();
    createFruits();
    createObstacles();

    // Bind keyboard listeners only once
    if (!listenersBound) {
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup', onKeyUp);
      listenersBound = true;
    }
    updatePlayerPos();

    // Clear any existing timers before creating new ones
    clearTimers();

    const levelIdx = Math.min(gameState.level - 1, config.timeLimit.length - 1);
    gameState.time = config.timeLimit[levelIdx];

    gameTimer = setInterval(() => {
      if (!gameState.isPlaying) return;
      gameState.time--;
      document.getElementById('time').textContent = gameState.time;
      if (gameState.time <= 10) {
        const cd = document.getElementById('countdown');
        cd.style.display = 'block';
        cd.textContent = gameState.time;
        cd.style.color = gameState.time <= 5 ? '#EF5350' : '#FFD54F';
      }
      if (gameState.time <= 0) gameOver();
    }, 1000);

    loopTimer = setInterval(gameUpdate, 40);
    updateUI();
  }

  function clearTimers() {
    if (gameTimer) { clearInterval(gameTimer); gameTimer = null; }
    if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
  }

  // ===== 水果 =====
  function createFruits() {
    fruits.forEach(f => f.el.remove());
    fruits = [];
    const fruitStyles = [
      { cls: 'fruit-red',    inner: '<div class="fruit-core"></div><div class="fruit-stem"></div>' },
      { cls: 'fruit-yellow', inner: '<div class="fruit-core"></div><div class="fruit-stem"></div>' },
      { cls: 'fruit-orange', inner: '<div class="fruit-core"></div><div class="fruit-stem"></div>' },
      { cls: 'fruit-green',  inner: '<div class="fruit-core"></div><div class="fruit-stem"></div>' },
      { cls: 'fruit-purple', inner: '<div class="fruit-core"></div><div class="fruit-stem"></div>' },
      { cls: 'fruit-star',   inner: '<div class="fruit-core star-shape"></div>' },
      { cls: 'fruit-pink',   inner: '<div class="fruit-core"></div><div class="fruit-stem"></div>' },
      { cls: 'fruit-lime',   inner: '<div class="fruit-core"></div><div class="fruit-stem"></div>' },
      { cls: 'fruit-cherry', inner: '<div class="fruit-core"></div><div class="fruit-stem"></div>' },
      { cls: 'fruit-blue',   inner: '<div class="fruit-core"></div><div class="fruit-stem"></div>' }
    ];
    const levelIdx = Math.min(gameState.level - 1, config.fruitCount.length - 1);
    const cnt = config.fruitCount[levelIdx];
    const margin = 120;
    const maxX = Math.max(cv - margin * 2, 200);
    const maxY = Math.max(ch - 160, 200);
    for (let i = 0; i < cnt; i++) {
      const el = document.createElement('div');
      el.className = 'fruit';
      const style = fruitStyles[Math.floor(Math.random() * fruitStyles.length)];
      el.classList.add(style.cls);
      el.innerHTML = style.inner;
      const f = {
        el, x: margin + Math.random() * maxX,
        y: 60 + Math.random() * maxY, active: true
      };
      el.style.cssText = `left:${f.x}px;top:${f.y}px;animation-delay:${Math.random() * 2}s`;
      container.appendChild(el);
      fruits.push(f);
    }
  }

  // ===== 障碍物 =====
  function createObstacles() {
    obstacles.forEach(o => o.el.remove());
    obstacles = [];
    if (gameState.level >= 3) {
      const cnt = 4 + gameState.level;
      const margin = 200;
      const maxX = Math.max(cv - margin * 2, 200);
      const maxY = Math.max(ch - 160, 200);
      for (let i = 0; i < cnt; i++) {
        const el = document.createElement('div');
        el.className = 'obstacle';
        el.innerHTML = '<svg viewBox="0 0 40 40"><polygon points="20,4 36,32 4,32" fill="#FF5252"/><polygon points="20,4 20,28 6,28" fill="rgba(255,255,255,0.15)"/><text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="sans-serif">!</text></svg>';
        const o = {
          el, x: margin + Math.random() * maxX,
          y: 60 + Math.random() * maxY,
          speed: config.obstacleSpeed[Math.min(gameState.level - 1, config.obstacleSpeed.length - 1)],
          direction: Math.random() > 0.5 ? 1 : -1
        };
        el.style.cssText = `left:${o.x}px;top:${o.y}px;width:44px;height:44px`;
        container.appendChild(el);
        obstacles.push(o);
      }
    }
  }

  // ===== 键盘控制 =====
  function onKeyDown(e) {
    if (!gameState.isPlaying) return;
    const k = e.key;
    const map = {
      'ArrowUp':'up','w':'up','W':'up',
      'ArrowDown':'down','s':'down','S':'down',
      'ArrowLeft':'left','a':'left','A':'left',
      'ArrowRight':'right','d':'right','D':'right'
    };
    if (map[k] !== undefined) {
      keys[map[k]] = true;
      const el = document.getElementById('kh-' + map[k]);
      if (el) el.classList.add('active');
    }
    if (k === ' ') {
      keys.space = true;
      const spaceEl = document.getElementById('kh-space');
      if (spaceEl) spaceEl.classList.add('active');
      jump();
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)) {
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    const k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.up = false;
    if (k === 'ArrowDown' || k === 's' || k === 'S') keys.down = false;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
    if (k === ' ') keys.space = false;
    // Reset all hint key visual states
    ['kh-up','kh-down','kh-left','kh-right','kh-space'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
  }

  function jump() {
    if (gameState.isJumping) return;
    gameState.isJumping = true;
    const origTransition = player.style.transition;
    player.style.transition = 'transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)';
    player.style.transform = 'translateY(-60px)';
    setTimeout(() => {
      player.style.transform = 'translateY(0)';
      setTimeout(() => {
        gameState.isJumping = false;
        player.style.transition = origTransition;
        player.style.transform = '';
      }, 300);
    }, 300);
  }

  // ===== 游戏流程 =====
  function startGame() {
    GameAudio.playWin();
    document.getElementById('start-screen').classList.add('hidden');
    gameState.isPlaying = true;
    initGame();
  }

  function restartGame() {
    gameState.fruitsCollected = 0;
    gameState.score = 0;
    document.getElementById('game-over').classList.add('hidden');
    initGame();
    gameState.isPlaying = true;
    updateUI();
  }

  function nextLevel() {
    if (gameState.level >= config.maxLevel) {
      document.getElementById('level-complete').classList.add('hidden');
      document.getElementById('complete-screen').classList.remove('hidden');
      return;
    }
    gameState.level++;
    gameState.fruitsCollected = 0;
    document.getElementById('level-complete').classList.add('hidden');
    initGame();
    gameState.isPlaying = true;
    updateUI();
  }

  // ===== 游戏更新 =====
  function gameUpdate() {
    if (!gameState.isPlaying) return;
    const limitUp = 40, limitDown = ch - 80, limitLeft = 20, limitRight = cv - 70;
    if (keys.up && gameState.py > limitUp) gameState.py -= config.playerSpeed;
    if (keys.down && gameState.py < limitDown) gameState.py += config.playerSpeed;
    if (keys.left && gameState.px > limitLeft) gameState.px -= config.playerSpeed;
    if (keys.right && gameState.px < limitRight) gameState.px += config.playerSpeed;
    updatePlayerPos();
    checkFruit();
    if (gameState.level >= 3) {
      checkObstacle();
      updateObstacles();
    }
    checkFinish();
  }

  function updatePlayerPos() {
    player.style.left = gameState.px + 'px';
    player.style.top = gameState.py + 'px';
  }

  function checkFruit() {
    const px = gameState.px + 25, py = gameState.py + 30;
    fruits.forEach(f => {
      if (!f.active) return;
      if (Math.hypot(px - (f.x + 16), py - (f.y + 16)) < 40) {
        f.active = false;
        f.el.classList.add('collected');
        setTimeout(() => f.el.remove(), 500);
        gameState.fruitsCollected++;
        gameState.score += 10;
        gameState.time = Math.min(gameState.time + 1, config.timeLimit[Math.min(gameState.level - 1, config.timeLimit.length - 1)]);
        GameAudio.playCollect();
        updateUI();
        if (gameState.fruitsCollected >= gameState.targetFruits) levelComplete();
      }
    });
  }

  function checkObstacle() {
    const px = gameState.px + 25, py = gameState.py + 30;
    obstacles.forEach(o => {
      if (Math.hypot(px - (o.x + 24), py - (o.y + 24)) < 38) {
        GameAudio.playHit();
        gameState.px = 50;
        gameState.py = ch / 2;
        gameState.time = Math.max(0, gameState.time - 5);
        showMsg('碰到障碍物了！');
      }
    });
  }

  function updateObstacles() {
    obstacles.forEach(o => {
      o.x += o.speed * o.direction;
      const margin = 100;
      if (o.x <= margin || o.x >= cv - margin) o.direction *= -1;
      o.el.style.left = o.x + 'px';
    });
  }

  function checkFinish() {
    const finishX = cv - 60;
    if (gameState.px > finishX && gameState.fruitsCollected >= gameState.targetFruits) {
      levelComplete();
    } else if (gameState.px > finishX) {
      showMsg('还需要收集更多水果！');
    }
  }

  // ===== 消息 =====
  function showMsg(txt) {
    const existing = container.querySelector('.game-msg');
    if (existing) existing.remove();
    const m = document.createElement('div');
    m.className = 'game-msg';
    m.textContent = txt;
    container.appendChild(m);
    setTimeout(() => m.remove(), 1500);
  }

  // ===== 关卡 =====
  function levelComplete() {
    gameState.isPlaying = false;
    clearTimers();
    GameAudio.playWin();
    document.getElementById('complete-level').textContent = gameState.level;
    document.getElementById('level-complete').classList.remove('hidden');
  }

  function gameOver() {
    gameState.isPlaying = false;
    clearTimers();
    document.getElementById('game-over').classList.remove('hidden');
  }

  // ===== UI =====
  function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('time').textContent = gameState.time;
    document.getElementById('collected').textContent = gameState.fruitsCollected;
    document.getElementById('tip-bar').textContent = [
      '方向键移动 · 收集10个水果到达终点',
      '空格键跳跃 · 避开障碍物',
      '时间有限，加油！'
    ][Math.min(gameState.level - 1, 2)];
  }

  return {
    init, startGame, restartGame, nextLevel
  };
})();
