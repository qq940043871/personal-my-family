// ============================================================
// 大鱼吃小鱼 - 游戏逻辑模块 V2.1
// Bug fixes: cssText overflow, duplicate RAF, missing player SVG
// ============================================================
const FishGame = (function() {
  // ===== 游戏状态 =====
  const gameState = {
    score: 0, level: 1, lives: 3, playerSize: 1,
    isPlaying: false, fishEaten: 0, targetFish: 5
  };

  // ===== 配置 =====
  const config = {
    playerSpeed: 0.1,
    fishSpeed: [1, 1.5, 2, 2.5, 3, 3.5],
    sharkSpeed: [1.5, 2, 2.5, 3, 3.5, 4],
    growRate: 0.1,
    shrinkRate: 0.2,
    maxSize: 2,
    maxLevel: 6,
    fishColors: ['#00E5FF', '#FFEA00', '#69F0AE', '#E040FB', '#FF6E40'],
    fishSizes: [22, 28, 34]
  };

  // ===== DOM 元素 =====
  let container, player;
  let playerX = 450, playerY = 270, mouseX = 450, mouseY = 270;
  let fishes = [], sharks = [], decor = [];
  let cv = 0, ch = 0;
  let rafId = null;
  let mousemoveBound = false;

  // ===== 粒子背景 =====
  function createParticles() {
    const pl = document.getElementById('particles');
    if (!pl) return;
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 3 + Math.random() * 8;
      p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;background:radial-gradient(circle, rgba(255,255,255,${0.3 + Math.random() * 0.5}), transparent);animation-duration:${8 + Math.random() * 12}s;animation-delay:${Math.random() * 10}s;box-shadow:0 0 ${size * 2}px rgba(129, 212, 250, ${0.2 + Math.random() * 0.3})`;
      pl.appendChild(p);
    }
  }

  // ===== 创建玩家 =====
  function createPlayerSVG() {
    player.innerHTML = `<svg viewBox="0 0 60 48">
      <defs>
        <linearGradient id="fishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFAB91"/>
          <stop offset="100%" stop-color="#FF7043"/>
        </linearGradient>
        <filter id="fishGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="30" cy="24" rx="28" ry="20" fill="url(#fishGrad)" filter="url(#fishGlow)"/>
      <circle cx="48" cy="16" r="6" fill="white"/><circle cx="49" cy="16" r="3" fill="#333"/>
      <path d="M2 24 Q-10 10 2 0 Q14 10 2 24" fill="#FF7043"/>
      <path d="M18 14 Q26 0 34 14" fill="#FFCCBC"/>
      <circle cx="30" cy="4" r="6" fill="#FFAB91" opacity="0.6"/>
      <ellipse cx="40" cy="22" rx="5" ry="3" fill="white" opacity="0.6"/>
    </svg>`;
  }

  // ===== 游戏初始化 =====
  function init() {
    container = document.getElementById('game-container');
    player = document.getElementById('player');
    cv = container.clientWidth;
    ch = container.clientHeight;
    createParticles();
    createPlayerSVG();
    updateUI();
  }

  function initGame() {
    cv = container.clientWidth;
    ch = container.clientHeight;

    // Reset player position
    playerX = cv / 2;
    playerY = ch / 2;
    mouseX = playerX;
    mouseY = playerY;

    // Clear old entities
    clearDecor();
    createDecor();
    createFishes();
    createShark();

    // Bind mousemove only once
    if (!mousemoveBound) {
      container.addEventListener('mousemove', onMouseMove);
      mousemoveBound = true;
    }
  }

  function onMouseMove(e) {
    if (!gameState.isPlaying) return;
    const r = container.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  }

  // ===== 装饰物 =====
  function clearDecor() {
    decor.forEach(d => d.remove());
    decor = [];
  }

  function createDecor() {
    const bottom = ch - 80;
    const count = Math.max(4, Math.floor(cv / 120));
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'deco';
      const x = 40 + (i / count) * (cv - 80);
      const y = bottom - Math.random() * 30;
      el.style.cssText = `left:${x}px;top:${y}px;animation-delay:${Math.random() * 3}s`;

      if (i % 3 === 0) {
        // Coral - CSS branching shape
        el.classList.add('coral');
        const clr = ['#FF7043','#FF8A65','#E91E63'];
        const c = clr[Math.floor(Math.random()*clr.length)];
        el.innerHTML = `<div class="coral-stem" style="background:${c}"></div>
          <div class="coral-branch" style="background:${c};left:60%"></div>
          <div class="coral-branch" style="background:${c};left:30%;height:60%"></div>`;
      } else if (i % 3 === 1) {
        // Seaweed - CSS wavy shape
        el.classList.add('seaweed');
        el.innerHTML = '<div class="seaweed-stem"></div>';
      } else {
        // Shell/rock
        el.classList.add('shell');
        el.innerHTML = '<div class="shell-body"></div><div class="shell-detail"></div>';
      }
      container.appendChild(el);
      decor.push(el);
    }
  }

  // ===== 鱼群 =====
  function createFishes() {
    fishes.forEach(f => f.el.remove());
    fishes = [];
    const count = 5 + gameState.level * 2;
    for (let i = 0; i < count; i++) createOneFish();
  }

  function createOneFish() {
    const el = document.createElement('div');
    el.className = 'fish';
    const ci = Math.floor(Math.random() * 5);
    const sz = config.fishSizes[Math.floor(Math.random() * 3)];
    const col = config.fishColors[ci];
    const dir = Math.random() > 0.5 ? 1 : -1;

    el.style.width = (sz * 1.6) + 'px';
    el.style.height = sz + 'px';
    el.innerHTML = `<svg viewBox="0 0 40 20"><ellipse cx="20" cy="10" rx="18" ry="13" fill="${col}"/><circle cx="31" cy="6" r="3.5" fill="white"/><circle cx="32" cy="6" r="1.8" fill="#111"/><path d="M3 10 Q-7 1 3 0 Q14 2 3 10" fill="${col}" opacity="0.6"/><ellipse cx="24" cy="4" rx="5" ry="3" fill="${col}" opacity="0.4"/></svg><div class="glint"></div>`;

    const levelIdx = Math.min(gameState.level - 1, config.fishSpeed.length - 1);
    const f = {
      el, x: Math.random() * (cv - 80), y: 40 + Math.random() * (ch - 120),
      color: col, size: sz,
      speed: config.fishSpeed[levelIdx] * (0.8 + Math.random() * 0.4),
      direction: dir
    };
    updateFishPos(f);
    container.appendChild(el);
    fishes.push(f);
  }

  function updateFishPos(f) {
    f.el.style.left = f.x + 'px';
    f.el.style.top = f.y + 'px';
    f.el.style.transform = 'scaleX(' + f.direction + ')';
  }

  // ===== 鲨鱼 =====
  function createShark() {
    sharks.forEach(s => s.el.remove());
    sharks = [];
    if (gameState.level >= 3) {
      const el = document.createElement('div');
      el.id = 'shark';
      el.style.width = '160px';
      el.style.height = '80px';
      el.innerHTML = `<svg viewBox="0 0 160 80"><path d="M12 40 Q40 15 110 34 Q145 28 160 40 Q145 52 110 46 Q40 65 12 40" fill="#455A64"/><circle cx="118" cy="32" r="7" fill="white"/><circle cx="119" cy="32" r="3.5" fill="#EF5350"/><path d="M2 38 L-10 26 L14 40 L-10 54 Z" fill="#37474F"/><path d="M55 28 Q65 8 75 28" fill="#263238"/><path d="M130 20 Q140 10 150 20" fill="rgba(255,255,255,0.15)"/></svg>`;

      const levelIdx = Math.min(gameState.level - 1, config.sharkSpeed.length - 1);
      const s = {
        el, x: cv - 180, y: 80 + Math.random() * (ch - 200),
        speed: config.sharkSpeed[levelIdx], direction: -1
      };
      el.style.left = s.x + 'px';
      el.style.top = s.y + 'px';
      container.appendChild(el);
      sharks.push(s);
    }
  }

  // ===== 游戏流程 =====
  function startGame() {
    GameAudio.playWin();
    document.getElementById('start-screen').classList.add('hidden');
    gameState.isPlaying = true;
    updateUI();
    initGame();
    startLoop();
  }

  function restartGame() {
    gameState.lives = 3;
    gameState.playerSize = 1;
    gameState.fishEaten = 0;
    document.getElementById('game-over').classList.add('hidden');
    initGame();
    gameState.isPlaying = true;
    updateUI();
    startLoop();
  }

  function nextLevel() {
    gameState.level++;
    gameState.fishEaten = 0;
    gameState.playerSize = 1;
    document.getElementById('level-complete').classList.add('hidden');
    initGame();
    gameState.isPlaying = true;
    updateUI();
    startLoop();
  }

  // ===== 游戏循环 (防止重复) =====
  function startLoop() {
    // Cancel any existing RAF to prevent duplicate loops
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    gameLoop();
  }

  function gameLoop() {
    if (gameState.isPlaying) {
      updatePlayer();
      updateFishes();
      updateSharks();
      checkCollisions();
    }
    rafId = requestAnimationFrame(gameLoop);
  }

  function updatePlayer() {
    const dx = mouseX - playerX, dy = mouseY - playerY;
    playerX += dx * config.playerSpeed;
    playerY += dy * config.playerSpeed;
    const sz = 60 * gameState.playerSize;
    playerX = Math.max(0, Math.min(cv - sz, playerX));
    playerY = Math.max(0, Math.min(ch - sz * 0.8, playerY));
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
    player.style.width = sz + 'px';
    player.style.height = (sz * 0.8) + 'px';
  }

  function updateFishes() {
    fishes.forEach(f => {
      f.x += f.speed * f.direction;
      if (f.x <= 0 || f.x >= cv - 60) f.direction *= -1;
      if (Math.random() < 0.008) f.direction *= -1;
      const dist = Math.hypot(f.x - playerX, f.y - playerY);
      if (dist < 140) {
        const a = Math.atan2(f.y - playerY, f.x - playerX);
        f.x += Math.cos(a) * 4;
        f.y += Math.sin(a) * 4;
      }
      updateFishPos(f);
    });
  }

  function updateSharks() {
    sharks.forEach(s => {
      s.y += s.speed * s.direction;
      if (s.y <= 0 || s.y >= ch - 80) s.direction *= -1;
      if (gameState.level >= 5) {
        playerY < s.y ? s.y -= 0.6 : s.y += 0.6;
      }
      s.el.style.left = s.x + 'px';
      s.el.style.top = s.y + 'px';
    });
  }

  // ===== 碰撞检测 =====
  function checkCollisions() {
    const pcX = playerX + 30 * gameState.playerSize;
    const pcY = playerY + 24 * gameState.playerSize;
    const pr = 28 * gameState.playerSize;

    for (let i = fishes.length - 1; i >= 0; i--) {
      const f = fishes[i];
      const dist = Math.hypot(pcX - (f.x + 20), pcY - (f.y + 10));
      if (dist < pr + 18) { eatFish(f, i); }
    }

    if (gameState.level >= 3) {
      sharks.forEach(s => {
        if (Math.hypot(pcX - (s.x + 70), pcY - (s.y + 37)) < pr + 50) {
          playerHurt();
        }
      });
    }
  }

  function eatFish(f, idx) {
    f.el.classList.add('eaten');
    setTimeout(() => f.el.remove(), 500);
    fishes.splice(idx, 1);
    gameState.score += 10;
    gameState.fishEaten++;
    gameState.playerSize = Math.min(config.maxSize, gameState.playerSize + config.growRate);
    GameAudio.playEat();
    createStarBurst(f.x, f.y);
    if (gameState.fishEaten >= gameState.targetFish) levelComplete();
    setTimeout(() => { if (fishes.length < 12) createOneFish(); }, 1200);
    updateUI();
  }

  function playerHurt() {
    gameState.lives--;
    gameState.playerSize = Math.max(0.8, gameState.playerSize - config.shrinkRate);
    container.classList.add('flash-hurt');
    setTimeout(() => container.classList.remove('flash-hurt'), 600);
    GameAudio.playHurt();
    playerX = cv / 2;
    playerY = ch / 2;
    mouseX = playerX;
    mouseY = playerY;
    updateUI();
    if (gameState.lives <= 0) gameOver();
  }

  // ===== 特效 =====
  function createStarBurst(x, y) {
    const colors = ['#FFD54F','#FFB300','#FFE082','#FFF9C4','#FF8F00','#FFCA28'];
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('div');
      s.className = 'star-particle';
      const col = colors[i % colors.length];
      const size = 8 + Math.random() * 10;
      s.style.cssText = `left:${x - 14 + Math.random() * 28}px;top:${y - 14 + Math.random() * 28}px;animation-delay:${Math.random() * 0.4}s;width:${size}px;height:${size}px;background:${col};box-shadow:0 0 ${size*2}px ${col}`;
      container.appendChild(s);
      setTimeout(() => s.remove(), 1200);
    }
  }

  // ===== 关卡/结束 =====
  function levelComplete() {
    gameState.isPlaying = false;
    GameAudio.playWin();
    document.getElementById('complete-level').textContent = gameState.level;
    document.getElementById('level-complete').classList.remove('hidden');
    createStarBurst(cv / 2, ch / 2);
  }

  function gameOver() {
    gameState.isPlaying = false;
    document.getElementById('game-over').classList.remove('hidden');
  }

  // ===== UI 更新 =====
  function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('hearts').innerHTML = '<span class="heart"></span>'.repeat(gameState.lives);
    document.getElementById('tip-bar').textContent = [
      '移动鼠标控制小鱼游动，吃掉更小的鱼！',
      '吃掉5条小鱼可过关，点击追捕小鱼！',
      '当心大鲨鱼！被咬到会受伤！'
    ][Math.min(gameState.level - 1, 2)];
  }

  return {
    init, startGame, restartGame, nextLevel
  };
})();
