// ============================================================
// 黄金矿工 - 游戏逻辑模块 V1.0
// 鼠标瞄准、点击投放钩子、抓取矿物
// ============================================================
const GoldMiner = (function() {

  // ===== 游戏状态 =====
  const gameState = {
    score: 0,
    level: 1,
    time: 60,
    targetMoney: 100,
    isPlaying: false,

    // 钩子状态机: 'aiming' | 'extending' | 'retracting'
    hookState: 'aiming',
    hookAngle: 0,
    hookX: 0,
    hookY: 0,
    ropeLength: 0,

    // 当前抓取的矿物
    grabbedMineral: null,

    // 所有矿物
    minerals: []
  };

  // ===== 配置 =====
  const config = {
    // 矿工位置 (动态计算)
    minerX: 0,
    minerY: 0,
    // 矿工显示尺寸
    minerW: 70,
    minerH: 70,

    // 钩子
    hookBaseSpeed: 8,
    hookMaxRope: 0,
    previewLength: 40,

    // 瞄准
    maxAimAngle: Math.PI / 3.5,

    // 关卡配置 (索引 0-5)
    timeLimit:    [60, 60, 60, 60, 50, 50],
    targetMoney:  [100, 200, 300, 400, 500, 600],
    mineralCount: [10, 12, 14, 14, 16, 16],
    totalGold:    [300, 300, 300, 200, 200, 200],

    maxLevel: 6,

    // 矿物分布比例 (goldBig, goldSmall, diamond, stone, mystery)
    distribution: [
      { goldBig: 3, goldSmall: 5, diamond: 0, stone: 2, mystery: 0 },
      { goldBig: 2, goldSmall: 4, diamond: 0, stone: 5, mystery: 1 },
      { goldBig: 2, goldSmall: 3, diamond: 1, stone: 5, mystery: 1 },
      { goldBig: 1, goldSmall: 3, diamond: 2, stone: 6, mystery: 2 },
      { goldBig: 1, goldSmall: 2, diamond: 3, stone: 7, mystery: 2 },
      { goldBig: 1, goldSmall: 2, diamond: 2, stone: 8, mystery: 3 }
    ],

    // 矿物类型定义
    types: {
      goldBig:   { name: '大金块', value: 100, size: 50, weight: 3.0, color: '#FFD700', cls: 'gold-big' },
      goldSmall: { name: '小金块', value: 50,  size: 35, weight: 1.5, color: '#FFC107', cls: 'gold-small' },
      diamond:   { name: '钻石',   value: 200, size: 28, weight: 0.5, color: '#00E5FF', cls: 'diamond' },
      stone:     { name: '石头',   value: 10,  size: 40, weight: 1.0, color: '#9E9E9E', cls: 'stone' },
      mystery:   { name: '宝箱',   value: 'random', size: 38, weight: 1.8, color: '#AB47BC', cls: 'mystery' }
    }
  };

  // ===== DOM 引用 =====
  let container, miner, hook, ropeCanvas, ropeCtx;
  let gameTimer = null;
  let rafId = null;
  let cv = 0, ch = 0;
  let listenersBound = false;

  // ===== 矿工图片 =====
  function createMinerImg() {
    miner.style.width = config.minerW + 'px';
    miner.style.height = config.minerH + 'px';
    miner.style.background = 'url("images/miner-char.png") center/contain no-repeat';
  }

  // ===== 钩子 SVG =====
  function createHookSVG() {
    hook.style.width = '24px';
    hook.style.height = '32px';
    hook.innerHTML = `<svg viewBox="0 0 24 32">
      <defs>
        <linearGradient id="hkGrad"><stop offset="0%" stop-color="#CFD8DC"/><stop offset="100%" stop-color="#90A4AE"/></linearGradient>
      </defs>
      <rect x="9" y="0" width="6" height="16" rx="2" fill="url(#hkGrad)"/>
      <path d="M12 16 L12 28 Q12 32 6 32 L0 32" fill="none" stroke="#78909C" stroke-width="3" stroke-linecap="round"/>
      <polygon points="12,8 22,14 14,14" fill="url(#hkGrad)"/>
      <polygon points="12,8 2,14 10,14" fill="url(#hkGrad)"/>
    </svg>`;
  }

  // ===== 初始化 =====
  function init() {
    container = document.getElementById('game-container');
    miner = document.getElementById('miner');
    hook = document.getElementById('hook');
    ropeCanvas = document.getElementById('rope-canvas');
    ropeCtx = ropeCanvas.getContext('2d');

    createMinerImg();
    createHookSVG();
    updateUI();
  }

  function resizeCanvas() {
    ropeCanvas.width = container.clientWidth;
    ropeCanvas.height = container.clientHeight;
  }

  // ===== 游戏初始化 =====
  function initGame() {
    cv = container.clientWidth;
    ch = container.clientHeight;

    // 矿工位置
    config.minerX = cv / 2;
    config.minerY = 24;
    config.hookMaxRope = ch - config.minerY - config.minerH - 30;

    // 设置关卡
    const lv = gameState.level - 1;
    gameState.time = config.timeLimit[lv];
    gameState.targetMoney = config.targetMoney[lv];
    gameState.score = 0;

    // 重置钩子
    gameState.hookAngle = 0;
    gameState.hookState = 'aiming';
    gameState.ropeLength = config.previewLength;
    gameState.grabbedMineral = null;
    updateHookPos();

    // 放置矿工
    miner.style.left = (config.minerX - config.minerW / 2) + 'px';
    miner.style.top = config.minerY + 'px';

    // 创建矿物
    createMinerals();

    // 事件绑定 (仅一次)
    if (!listenersBound) {
      container.addEventListener('mousemove', onAimMove);
      container.addEventListener('click', onDropClick);
      listenersBound = true;
    }

    // 计时器
    clearTimers();
    gameTimer = setInterval(function() {
      if (!gameState.isPlaying) return;
      gameState.time--;
      document.getElementById('time').textContent = gameState.time;

      if (gameState.time <= 10) {
        var cd = document.getElementById('countdown');
        cd.style.display = 'block';
        cd.textContent = gameState.time;
        cd.style.color = gameState.time <= 5 ? '#EF5350' : '#FFD54F';
      }
      if (gameState.time <= 0) gameOver();
    }, 1000);

    resizeCanvas();
    updateUI();
  }

  function clearTimers() {
    if (gameTimer) { clearInterval(gameTimer); gameTimer = null; }
  }

  // ===== 矿物生成 =====
  function createMinerals() {
    // 清除旧矿物
    gameState.minerals.forEach(function(m) { m.el.remove(); });
    gameState.minerals = [];

    var lv = gameState.level - 1;
    var dist = config.distribution[lv];
    var types = [];

    // 根据分布生成类型列表
    for (var key in dist) {
      if (dist.hasOwnProperty(key)) {
        for (var i = 0; i < dist[key]; i++) {
          types.push(key);
        }
      }
    }
    // 洗牌
    for (var i = types.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = types[i]; types[i] = types[j]; types[j] = tmp;
    }

    // 生成矿物位置（避免重叠）
    var groundTop = config.minerY + config.minerH + 40;
    var groundBot = ch - 40;
    var placed = [];

    types.forEach(function(type) {
      var t = config.types[type];
      var pos = findClearPosition(placed, t.size, groundTop, groundBot);
      if (pos) {
        var mineral = createMineral(type, pos.x, pos.y);
        gameState.minerals.push(mineral);
        placed.push(mineral);
      }
    });
  }

  function findClearPosition(existing, size, top, bot) {
    var margin = 60;
    var maxW = cv - margin * 2;
    var attempts = 0;
    var maxAttempts = 50;

    while (attempts < maxAttempts) {
      var x = margin + Math.random() * (maxW - size);
      var y = top + Math.random() * (bot - top - size);
      var ok = true;

      for (var i = 0; i < existing.length; i++) {
        var dx = x - existing[i].x;
        var dy = y - existing[i].y;
        if (Math.hypot(dx, dy) < existing[i].size + size / 2 + 20) {
          ok = false;
          break;
        }
      }
      if (ok) return { x: x, y: y };
      attempts++;
    }
    // 降级：允许重叠
    return {
      x: margin + Math.random() * (maxW - size),
      y: top + Math.random() * (bot - top - size)
    };
  }

  function createMineral(type, x, y) {
    var t = config.types[type];
    var el = document.createElement('div');
    el.className = 'mineral ' + t.cls;

    // 矿物 SVG
    var svg = '';
    if (type === 'goldBig') {
      svg = '<svg viewBox="0 0 50 40"><ellipse cx="25" cy="20" rx="24" ry="16" fill="#FFD700"/><ellipse cx="20" cy="14" rx="8" ry="4" fill="rgba(255,255,255,0.3)"/><ellipse cx="25" cy="18" rx="18" ry="10" fill="#FFC107"/></svg>';
    } else if (type === 'goldSmall') {
      svg = '<svg viewBox="0 0 35 28"><ellipse cx="18" cy="14" rx="17" ry="12" fill="#FFC107"/><ellipse cx="14" cy="10" rx="5" ry="2.5" fill="rgba(255,255,255,0.3)"/></svg>';
    } else if (type === 'diamond') {
      svg = '<svg viewBox="0 0 28 28"><polygon points="14,2 26,14 14,26 2,14" fill="#00E5FF"/><polygon points="14,2 14,26 2,14" fill="rgba(255,255,255,0.2)"/><polygon points="14,6 20,14 14,12 8,14" fill="rgba(255,255,255,0.3)"/></svg>';
    } else if (type === 'mystery') {
      svg = '<svg viewBox="0 0 38 38"><rect x="4" y="6" width="30" height="26" rx="4" fill="#AB47BC"/><rect x="4" y="6" width="30" height="8" rx="4" fill="#8E24AA"/><circle cx="19" cy="22" r="6" fill="rgba(255,255,255,0.2)"/><text x="19" y="26" text-anchor="middle" fill="white" font-size="12" font-weight="bold">?</text></svg>';
    } else {
      svg = '<svg viewBox="0 0 40 32"><ellipse cx="20" cy="16" rx="19" ry="13" fill="#9E9E9E"/><ellipse cx="17" cy="12" rx="7" ry="4" fill="rgba(255,255,255,0.15)"/></svg>';
    }

    el.innerHTML = svg;
    el.style.width = t.size + 'px';
    el.style.height = (t.size * 0.8) + 'px';

    // 价值标签
    var badge = document.createElement('span');
    badge.className = 'value-badge';
    badge.textContent = t.value === 'random' ? '?' : '+' + t.value;
    el.appendChild(badge);

    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.animationDelay = Math.random() * 2 + 's';

    container.appendChild(el);

    return { el: el, type: type, x: x, y: y, size: t.size, value: t.value, weight: t.weight, collected: false };
  }

  // ===== 鼠标瞄准 =====
  function onAimMove(e) {
    if (!gameState.isPlaying) return;
    if (gameState.hookState !== 'aiming') return;

    var rect = container.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    var dx = mx - config.minerX;
    var dy = my - (config.minerY + config.minerH);

    if (dy < 5) return; // 不要向上瞄
    gameState.hookAngle = Math.max(-config.maxAimAngle, Math.min(config.maxAimAngle, Math.atan2(dx, dy)));
    updateHookPos();
  }

  // ===== 点击投放 =====
  function onDropClick(e) {
    if (!gameState.isPlaying) return;
    if (gameState.hookState !== 'aiming') return;
    e.preventDefault();

    gameState.hookState = 'extending';
    gameState.ropeLength = config.previewLength;
    GameAudio.playClick();
  }

  // ===== 更新钩子位置 =====
  function updateHookPos() {
    gameState.hookX = config.minerX + Math.sin(gameState.hookAngle) * gameState.ropeLength;
    gameState.hookY = config.minerY + config.minerH + Math.cos(gameState.hookAngle) * gameState.ropeLength;

    hook.style.left = (gameState.hookX - 12) + 'px';
    hook.style.top = (gameState.hookY - 16) + 'px';
    hook.style.transform = 'rotate(' + (gameState.hookAngle * 180 / Math.PI) + 'deg)';
  }

  // ===== 绘制绳索 =====
  function drawRope() {
    ropeCtx.clearRect(0, 0, cv, ch);

    var sx = config.minerX;
    var sy = config.minerY + config.minerH;

    // 绳索主体
    ropeCtx.strokeStyle = '#8D6E63';
    ropeCtx.lineWidth = 3;
    ropeCtx.lineCap = 'round';
    ropeCtx.beginPath();
    ropeCtx.moveTo(sx, sy);
    ropeCtx.lineTo(gameState.hookX, gameState.hookY);
    ropeCtx.stroke();

    // 绳索高光
    ropeCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ropeCtx.lineWidth = 1;
    ropeCtx.beginPath();
    ropeCtx.moveTo(sx + 1, sy);
    ropeCtx.lineTo(gameState.hookX + 1, gameState.hookY);
    ropeCtx.stroke();
  }

  // ===== 游戏循环 =====
  function startLoop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    gameLoop();
  }

  function gameLoop() {
    if (gameState.isPlaying) {
      if (gameState.hookState === 'extending') {
        updateExtending();
      } else if (gameState.hookState === 'retracting') {
        updateRetracting();
      }
      updateHookPos();
      drawRope();
      checkMineralCollision();
    }
    rafId = requestAnimationFrame(gameLoop);
  }

  function updateExtending() {
    gameState.ropeLength += config.hookBaseSpeed;
    gameState.hookX = config.minerX + Math.sin(gameState.hookAngle) * gameState.ropeLength;
    gameState.hookY = config.minerY + config.minerH + Math.cos(gameState.hookAngle) * gameState.ropeLength;

    // 边界检测
    if (gameState.hookX < 10 || gameState.hookX > cv - 10 ||
        gameState.hookY > ch - 10 || gameState.ropeLength >= config.hookMaxRope) {
      // 空收回
      gameState.hookState = 'retracting';
      gameState.grabbedMineral = null;
      GameAudio.playHit();
    }
  }

  function updateRetracting() {
    var speed = (config.hookBaseSpeed - 1) / (gameState.grabbedMineral ? gameState.grabbedMineral.weight : 1.0);
    speed = Math.max(2, speed);

    gameState.ropeLength -= speed;

    if (gameState.grabbedMineral) {
      var m = gameState.grabbedMineral;
      m.x = gameState.hookX - m.size / 2;
      m.y = gameState.hookY;
      m.el.style.left = m.x + 'px';
      m.el.style.top = m.y + 'px';
    }

    // 到达矿工
    if (gameState.ropeLength <= config.previewLength) {
      collectMineral();
    }
  }

  function checkMineralCollision() {
    if (gameState.hookState !== 'extending') return;

    for (var i = gameState.minerals.length - 1; i >= 0; i--) {
      var m = gameState.minerals[i];
      if (m.collected) continue;

      var dist = Math.hypot(gameState.hookX - (m.x + m.size / 2),
                            gameState.hookY - (m.y + m.size * 0.4));
      if (dist < m.size / 2 + 12) {
        // 抓到了
        gameState.hookState = 'retracting';
        gameState.grabbedMineral = m;
        m.collected = true;
        m.el.classList.add('grabbed');
        GameAudio.playCollect();
        break;
      }
    }
  }

  function collectMineral() {
    var m = gameState.grabbedMineral;

    if (m) {
      var value = m.value;
      if (value === 'random') {
        var vals = [10, 20, 50, 100, 150, 200];
        value = vals[Math.floor(Math.random() * vals.length)];
      }
      gameState.score += value;
      m.el.remove();

      // 飘分特效
      showScorePopup(m.x, m.y, '+' + value);

      // 音效
      if (value >= 100) {
        GameAudio.playWin();
      } else if (value <= 10) {
        GameAudio.playHurt();
      } else {
        GameAudio.playEat();
      }
    }

    // 重置钩子
    gameState.grabbedMineral = null;
    gameState.hookState = 'aiming';
    gameState.ropeLength = config.previewLength;
    document.getElementById('countdown').style.display = 'none';

    updateUI();

    // 检查通关
    if (gameState.score >= gameState.targetMoney) {
      levelComplete();
    }
  }

  // ===== 特效 =====
  function showScorePopup(x, y, text) {
    var pop = document.createElement('div');
    pop.className = 'score-popup';
    pop.textContent = text;
    pop.style.left = x + 'px';
    pop.style.top = y + 'px';
    if (text.indexOf('200') >= 0 || text.indexOf('100') >= 0) {
      pop.style.color = '#FFD54F';
      pop.style.fontSize = '30px';
    }
    container.appendChild(pop);
    setTimeout(function() { pop.remove(); }, 1200);
  }

  // ===== 游戏流程 =====
  function startGame() {
    GameAudio.playWin();
    document.getElementById('start-screen').classList.add('hidden');
    gameState.isPlaying = true;
    initGame();
    startLoop();
  }

  function restartGame() {
    document.getElementById('game-over').classList.add('hidden');
    gameState.isPlaying = true;
    initGame();
    startLoop();
  }

  function nextLevel() {
    if (gameState.level >= config.maxLevel) {
      document.getElementById('level-complete').classList.add('hidden');
      document.getElementById('complete-screen').classList.remove('hidden');
      GameAudio.playVictory();
      return;
    }
    gameState.level++;
    document.getElementById('level-complete').classList.add('hidden');
    gameState.isPlaying = true;
    initGame();
    startLoop();
  }

  function levelComplete() {
    gameState.isPlaying = false;
    clearTimers();
    GameAudio.playWin();
    document.getElementById('complete-level').textContent = gameState.level;
    document.getElementById('level-complete').classList.remove('hidden');
    document.getElementById('countdown').style.display = 'none';
  }

  function gameOver() {
    gameState.isPlaying = false;
    clearTimers();
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('countdown').style.display = 'none';
  }

  // ===== UI 更新 =====
  function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('time').textContent = gameState.time;
    document.getElementById('target-amount').textContent = gameState.targetMoney;
    document.getElementById('tip-bar').textContent = [
      '移动鼠标瞄准 · 点击放下钩子 · 抓取金矿！',
      '优先抓钻石和大金块，避开石头！',
      '时间紧迫，快选高价值目标！'
    ][Math.min(gameState.level - 1, 2)];
  }

  // ===== 公开 API =====
  return {
    init: init,
    startGame: startGame,
    restartGame: restartGame,
    nextLevel: nextLevel
  };
})();
