# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## Project Overview

"萌趣启蒙乐园" (Fun Enlightenment Paradise) — children's educational games and learning resources targeting ages 3-9. The project teaches basic computer interaction (mouse, keyboard) and Chinese character recognition through browser games, plus a uni-app Chinese-learning client. Current version: V1.0, approved.

## Commands

### Run the project

```bash
cd game && npm run start   # serves on http://localhost:8080
cd game && npm run dev      # same as start
```

Alternatively, open any HTML file directly in a browser — no build step or server is required for development.

### Build, Test, Lint

There is **no build step, test suite, or linter** configured in this project. The project is pure static HTML/CSS/JS with zero build-tool dependencies (the `chinese-app/` uni-app client has its own toolchain).

## Architecture

The project consists of browser games (static HTML/CSS/JS), a uni-app Chinese-learning client, course materials, and design documentation. No shared JavaScript module system across games, no router, no backend.

### File map

```
docs/
├── PRD-V1.0-少儿编程游戏需求文档.md    # Product requirements (levels, sound, rollout plan)
└── GDD-V1.0-游戏设计详细规格书.md      # Detailed game design (art, per-level specs, UI layouts)
game/
├── index.html                           # Game 1: "大鱼吃小鱼" (Big Fish Eats Small Fish) — mouse
├── keyboard-game.html                   # Game 2: "键盘小特工" (Keyboard Agent) — keyboard
├── gold-miner.html                      # Game 3: "黄金矿工" (Gold Miner)
├── chinese-adventure.html               # Game 4: "汉字大冒险" (Chinese Adventure) — literacy
├── fish-game.html                       # Fish-themed extension
├── js/ css/ images/ icons/ words/       # Shared assets and per-game scripts
├── games/                               # 100 standalone mini-games (see games/README.md)
└── package.json                         # npm scripts for a static dev server
chinese-app/                             # uni-app Chinese learning client
├── pages/ index | learning | exercise | report
├── data/chinese-data.js                 # Question/word data
└── manifest.json pages.json
courses/                                 # Textbook PDFs + per-page PNGs + download tool
axure/                                   # Prototype screenshots
```

### Game 1: Big Fish Eats Small Fish (game/index.html)

| Aspect | Detail |
|--------|--------|
| Target age | 3-6 years |
| Controls | Mouse movement + click |
| Learning goal | Mouse familiarization, size comparison |
| Game loop | `requestAnimationFrame`-based `gameLoop()` |

### Game 2: Keyboard Agent (game/keyboard-game.html)

| Aspect | Detail |
|--------|--------|
| Target age | 5-9 years |
| Controls | Arrow keys / WASD + Space |
| Learning goal | Keyboard familiarization, direction sense |
| Game loop | `setInterval(gameUpdate, 50)` |

### Other main games

| Game | File | Focus |
|------|------|-------|
| Gold Miner | `gold-miner.html` | Timing / strategy |
| Chinese Adventure | `chinese-adventure.html` | Character recognition |
| 100 mini-games | `games/*.html` | Arcade, puzzle, math, 3D, etc. |

### Internal structure of each game file

Each HTML game file follows the same monolith pattern:

1. **`<style>` block** — all CSS, including `@keyframes` animations and responsive breakpoints
2. **HTML body** — DOM structure: background layers, status bar, game container with overlay screens (start / level-complete / game-over), player SVG, UI hints
3. **`gameState` object** — holds all mutable state (`score`, `level`, `lives` or `time`, `isPlaying`, entity tracking)
4. **Game loop** — drives entity movement, collision detection (Euclidean distance), and UI updates
5. **`playTone()` function** — Web Audio API synthesized sound effects (duplicated verbatim across game files)
6. **Entity management** — game entities are DOM elements moved via CSS `transform` / `left` / `top`

### Tech stack

- **Languages**: HTML5, CSS3, vanilla JavaScript (ES6+); `chinese-app/` uses Vue 3 + uni-app
- **Dependencies**: None for games — only Google Fonts (Noto Sans SC, loaded via `<link>`)
- **Audio**: Web Audio API (`window.AudioContext`), no external audio files
- **Graphics**: Inline SVG, emoji, PNG sprites under `images/` and `words/`
- **State**: No persistence in games (no localStorage, no backend). State resets on page reload
- **Navigation**: Full page reloads via `window.location.href`

### Design documentation

The `docs/` directory contains the PRD and GDD in Chinese. These are the authoritative references for:

- Per-level mechanics, difficulty curves, and teaching objectives (GDD sections)
- Art direction: color palettes, character designs, animation specs (GDD sections)
- Future modules planned: "Programming Town" with sequencing, loops, conditionals, and variables (PRD)
- Rollout plan: MVP (Month 1) → V1.0 (Month 2) → V1.1-V1.2 (Months 3-4)
- Both documents open with an "Implemented vs Planned" status table reflecting the current codebase
