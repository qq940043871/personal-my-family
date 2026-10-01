// ============================================================
// 音频管理模块 - 基于共享 GameAudio 模块的适配层
// ============================================================
const CHINESE_AUDIO = (function() {
  // All audio functions delegate to the shared GameAudio module
  return {
    playCorrect: function() { GameAudio.playCorrect(); },
    playWrong: function() { GameAudio.playWrong(); },
    playClick: function() { GameAudio.playClick(); },
    playStar: function() { GameAudio.playCollect(); },
    playComplete: function() { GameAudio.playComplete(); },
    playVictory: function() { GameAudio.playVictory(); },
    playTone: function(freq, duration, type, vol) { GameAudio.playTone(freq, duration, type, vol); }
  };
})();
