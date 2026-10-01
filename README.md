# personal-my-family — 家庭主题项目仓库

一个围绕家庭生活组织的多项目仓库，涵盖家庭应用、亲子工具、孩子学习资料与启蒙游戏。

## 目录导航

| 目录 | 类型 | 说明 |
|------|------|------|
| [family-check-in/](family-check-in/) | uni-app 项目 | 全家签到 APP，按年龄差异化习惯养成 |
| [family-check-in-mini/](family-check-in-mini/) | 微信小程序 | 全家签到小程序版（原生开发） |
| [family-check-in-tools/](family-check-in-tools/) | 工具脚本 | 签到应用的素材生成、头像处理与调试脚本 |
| [hello_course_pdf/](hello_course_pdf/) | 学习资料 | 幼小衔接 + 三年级上册练习 PDF |
| [kids-coding/](kids-coding/) | 课件 | 少儿编程 30 天 PPT（Day01–30） |
| [kids-learning-chinese/](kids-learning-chinese/) | 代码 + 文档 | 启蒙游戏（编程/识字）、中文学习 App、教材资源 |

---

## family-check-in/ — 全家签到 APP

uni-app（Vue 3）实现的家庭习惯打卡应用，核心设计见
[`docs/全家签到APP功能设计.md`](family-check-in/docs/全家签到APP功能设计.md)。

- 5 位家庭成员（3 岁 / 9 岁 / 35×2 / 60 岁）差异化任务与宠物成长
- 夫妻 PK、宠物比武、周月年结算、奶奶专属经文推送

## family-check-in-mini/ — 全家签到小程序

签到应用的微信小程序版（原生框架，不依赖 uni-app），页面结构：

- 首页 / 打卡 / 宠物 / 家庭 / 我的（底部 TabBar）
- 欢迎页、任务详情、成员管理、宠物比武等二级页面

## family-check-in-tools/ — 素材与调试工具

配合签到应用使用的 Python / JS 脚本：头像批量生成与分析（`gen_avatars_b64.py`、`analyze_avatars.py`）、图标资产制作（`make_assets.py`、`make_tab_family.py`）、布局测量与校验（`measure_*.py`、`validate.py`）等。`_` 开头的临时调试文件不入库。

## hello_course_pdf/ — 学习资料 PDF

按年级 → 学科两级分类：

```
hello_course_pdf/
├── 幼小衔接/
│   ├── 语文/   拼音、笔画、300 字、仿写句子等
│   ├── 数学/   每日一练（两份内容不同，均保留）
│   └── 英语/   字母闪卡、打卡帖、大小写练习
└── 三年级上/
    ├── 语文/   一课一练、默写单、字帖、仿写、识字专练
    ├── 数学/   第二单元提优卷
    └── 英语/   晨读晚默、英汉互译、二升三暑假单词
```

## kids-coding/ — 少儿编程 30 天课件

按天分段的 5 份 PPT，顺序播放即完整课程：

1. `少儿编程30天_Day01-05.pptx`
2. `少儿编程30天_Day06-10.pptx`
3. `少儿编程30天_Day11-15.pptx`
4. `少儿编程30天_Day16-20.pptx`
5. `少儿编程30天_Day21-30.pptx`

## kids-learning-chinese/ — 启蒙游戏与学习资源

详见该目录的 [README.md](kids-learning-chinese/README.md)。包含：

- **docs/** — PRD、GDD 产品与设计文档
- **game/** — 浏览器游戏（大鱼吃小鱼、键盘小特工、黄金矿工、汉字大冒险 + 100 款小游戏合集）
- **chinese-app/** — uni-app 中文学习应用
- **courses/** — 语文电子教材（PDF + 逐页 PNG）及下载工具

---

## 快速开始

```bash
# 全家签到 APP（uni-app，HBuilderX 或 CLI 均可）
cd family-check-in && npm install && npm run dev

# 全家签到小程序：用微信开发者工具打开 family-check-in-mini/ 目录

# 启蒙游戏（纯静态，浏览器直接打开）
start kids-learning-chinese/game/index.html

# 中文学习 App
cd kids-learning-chinese/chinese-app && npm install
```

## 仓库说明

- 根目录 `.gitignore` 统一忽略 `node_modules/`、`dist/`、`unpackage/`、环境变量及各 AI 工具的本地状态文件
- 历史上的 `family-life-video/`（父亲的手 / 母亲的灶台短视频脚本）已移出本仓库
