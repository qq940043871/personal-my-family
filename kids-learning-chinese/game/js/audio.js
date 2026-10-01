// ============================================================
// 萌趣编程启蒙乐园 - 共享音效模块
// 基于 Web Audio API 的合成音效工具库
// ============================================================
const GameAudio = (function() {
  let audioCtx = null;

  function getCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  /** 播放指定音调 */
  function playTone(freq, duration, type, vol) {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol !== undefined ? vol : 0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch(e) { /* audio not available */ }
  }

  /** 提示 / 点击音效 */
  function playClick() {
    playTone(660, 0.08, 'sine', 0.2);
  }

  /** 获得分数 / 收集物品 */
  function playCollect() {
    playTone(700, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(900, 0.15, 'sine', 0.08), 60);
  }

  /** 吃到东西 */
  function playEat() {
    playTone(600, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(800, 0.15, 'sine', 0.08), 50);
  }

  /** 受伤 */
  function playHurt() {
    playTone(200, 0.3, 'sawtooth', 0.1);
  }

  /** 碰撞 */
  function playHit() {
    playTone(150, 0.25, 'sawtooth', 0.08);
  }

  /** 按钮按下 */
  function playButton() {
    playTone(800, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(1000, 0.1, 'sine', 0.1), 50);
  }

  /** 答对 */
  function playCorrect() {
    playTone(523, 0.12, 'sine', 0.3);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.3), 80);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 160);
  }

  /** 答错 */
  function playWrong() {
    playTone(200, 0.25, 'triangle', 0.2);
    setTimeout(() => playTone(160, 0.3, 'triangle', 0.2), 120);
  }

  /** 过关 / 胜利 */
  function playWin() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.2, 'sine', 0.1), i * 120);
    });
  }

  /** 全部完成 */
  function playComplete() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.2, 'sine', 0.3), i * 120);
    });
  }

  /** 大胜利 */
  function playVictory() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.25, 'sine', 0.35), i * 150);
    });
  }

  return {
    playTone, playClick, playCollect, playEat, playHurt,
    playHit, playButton, playCorrect, playWrong,
    playWin, playComplete, playVictory
  };
})();
