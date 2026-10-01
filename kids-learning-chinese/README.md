# 萌趣启蒙乐园 — 启蒙游戏与学习资源

面向 3–9 岁儿童的启蒙游戏与学习资源集合，包含编程启蒙游戏、识字游戏、中文学习 App 及配套教材。

## 项目结构

```
kids-learning-chinese/
├── README.md                          ← 本文件
├── CODEBUDDY.md                       ← AI 编码代理指引
├── docs/
│   ├── PRD-V1.0-少儿编程游戏需求文档.md   ← 产品需求规格书
│   └── GDD-V1.0-游戏设计详细规格书.md     ← 游戏设计详细规格
│
├── game/                              ← 浏览器游戏（纯静态，无构建）
│   ├── index.html                     ← 游戏一：大鱼吃小鱼（鼠标）
│   ├── keyboard-game.html             ← 游戏二：键盘小特工（键盘）
│   ├── gold-miner.html                ← 黄金矿工
│   ├── chinese-adventure.html         ← 汉字大冒险（识字）
│   ├── fish-game.html                 ← 鱼类主题扩展
│   ├── js/ css/ images/ icons/ words/ ← 资源与脚本
│   ├── games/                         ← 100 款小游戏合集（见其 README）
│   └── package.json                   ← npm run start → localhost:8080
│
├── chinese-app/                       ← uni-app 中文学习应用
│   ├── pages/                         ← index / learning / exercise / report
│   ├── components/ data/ utils/
│   └── manifest.json pages.json
│
├── courses/                           ← 语文电子教材
│   ├── （…）语文二年级上/下册.pdf + 逐页 PNG/
│   ├── （…）语文三年级上/下册.pdf + 逐页 PNG/
│   └── tchMaterial-parser-main/       ← 教材下载工具（第三方）
│
└── axure/                             ← 原型截图
```

## 游戏列表

### 主游戏（game/ 根目录）

| 游戏 | 文件 | 目标年龄 | 操作 | 学习目标 |
|------|------|----------|------|----------|
| 大鱼吃小鱼 | `index.html` | 3–6 岁 | 鼠标移动 + 点击 | 认识鼠标、大小判断 |
| 键盘小特工 | `keyboard-game.html` | 5–9 岁 | 方向键/WASD + 空格 | 熟悉键盘、方向感 |
| 黄金矿工 | `gold-miner.html` | 5–8 岁 | 键盘/点击 | 反应与策略 |
| 汉字大冒险 | `chinese-adventure.html` | 6–9 岁 | 鼠标/键盘 | 识字与拼音 |

### 小游戏合集（game/games/）

100 款独立 HTML 小游戏，按类别分组：经典街机、记忆益智、数学、动作闯关、创意绘画、3D（Three.js）、逻辑策略、色彩形状、自然科学、反应挑战。清单见 [`game/games/README.md`](game/games/README.md)。

## 中文学习 App（chinese-app/）

uni-app 实现的识字练习应用，包含学习、练习、报告三个核心页面，数据见 `data/chinese-data.js`。

## 教材资源（courses/）

- 二年级 / 三年级语文上下册 PDF 原书
- 逐页 PNG（供游戏 `words/` 素材抽取）
- `tchMaterial-parser-main/`：国家中小学智慧教育平台教材下载工具（第三方，MIT）

## 快速开始

```bash
# 方式一：直接用浏览器打开
start game/index.html

# 方式二：本地静态服务器
cd game && npm run start   # http://localhost:8080
```

无构建步骤、无测试套件、无 linter —— 纯静态 HTML/CSS/JS。

## 文档说明

- **PRD**：产品需求规格说明书（产品愿景、用户分析、上线计划）
- **GDD**：游戏设计详细规格书（美术、关卡、数值、音效）
- 两份文档文首均附「已实现 vs 规划中」对照表

## 版本

当前版本：V1.0　审批状态：已通过
