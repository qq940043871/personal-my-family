// ============================================================
// 萌趣编程启蒙乐园 - 主菜单逻辑
// ============================================================
const MainMenu = (function() {
  function init() {
    createBubbles();
  }

  /** 创建泡泡背景粒子 */
  function createBubbles() {
    const container = document.getElementById('bubbles');
    const colors = [
      'rgba(255,255,255,0.15)', 'rgba(102,126,234,0.15)',
      'rgba(240,147,251,0.15)', 'rgba(76,175,80,0.15)',
      'rgba(255,138,101,0.15)', 'rgba(255,215,0,0.12)'
    ];

    for (let i = 0; i < 30; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble-item';
      const size = 8 + Math.random() * 16;
      bubble.style.width = size + 'px';
      bubble.style.height = size + 'px';
      bubble.style.left = Math.random() * 100 + '%';
      bubble.style.background = colors[Math.floor(Math.random() * colors.length)];
      bubble.style.animationDuration = (8 + Math.random() * 12) + 's';
      bubble.style.animationDelay = Math.random() * 12 + 's';
      if (Math.random() > 0.7) {
        bubble.style.borderRadius = '0';
        bubble.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
      }
      container.appendChild(bubble);
    }
  }

  /** 导航到游戏 */
  function navigateTo(url) {
    GameAudio.playButton();
    setTimeout(function() {
      window.location.href = url;
    }, 150);
  }

  function startFishGame() {
    navigateTo('fish-game.html');
  }

  function startKeyboardGame() {
    navigateTo('keyboard-game.html');
  }

  function startChineseGame() {
    navigateTo('chinese-adventure.html');
  }

  function startGoldMiner() {
    navigateTo('gold-miner.html');
  }

  return {
    init,
    startFishGame,
    startKeyboardGame,
    startChineseGame,
    startGoldMiner
  };
})();
