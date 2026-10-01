# 16宫格图标库 - 使用索引

共 **48个图标**，分布在3个16宫格SVG文件中。

## 文件清单

| 文件 | 编号范围 | 主题 |
|------|---------|------|
| `16-grid-icons.svg` | 1-16 | 游戏类别 + 基础UI + 编程概念 |
| `16-grid-icons-02.svg` | 17-32 | 游戏控制 + 道具 + 反馈 |
| `16-grid-icons-03.svg` | 33-48 | 编程概念 + 工具 + 通用UI |

---

## Set 1: 游戏类别 + 基础UI + 编程概念 (1-16)

| 编号 | ID | 名称 | 用途 |
|------|-----|------|------|
| 1 | `icon-fish` | 小鱼 | 大鱼吃小鱼 |
| 2 | `icon-keyboard` | 键盘 | 键盘小特工 |
| 3 | `icon-book` | 书本 | 汉字大冒险 |
| 4 | `icon-pickaxe` | 镐子 | 黄金矿工 |
| 5 | `icon-settings` | 设置 | 设置入口 |
| 6 | `icon-sound` | 喇叭 | 音量控制 |
| 7 | `icon-pause` | 暂停 | 暂停按钮 |
| 8 | `icon-back` | 返回 | 返回导航 |
| 9 | `icon-star` | 星星 | 分数显示 |
| 10 | `icon-heart` | 爱心 | 生命值 |
| 11 | `icon-clock` | 时钟 | 倒计时 |
| 12 | `icon-crown` | 皇冠 | 通关成就 |
| 13 | `icon-home` | 主页 | 主菜单 |
| 14 | `icon-mouse` | 鼠标 | 鼠标训练 |
| 15 | `icon-loop` | 循环 | 编程L2 |
| 16 | `icon-branch` | 分支 | 编程L3 |

## Set 2: 游戏控制 + 道具 + 反馈 (17-32)

| 编号 | ID | 名称 | 用途 |
|------|-----|------|------|
| 17 | `icon-play` | 播放 | 开始游戏 |
| 18 | `icon-refresh` | 刷新 | 重新开始 |
| 19 | `icon-shield` | 护盾 | 保护道具(L6) |
| 20 | `icon-lightning` | 闪电 | 加速道具(L4) |
| 21 | `icon-lock` | 锁 | 锁定关卡 |
| 22 | `icon-check` | 勾选 | 正确/通关 |
| 23 | `icon-close` | 关闭 | 错误/取消 |
| 24 | `icon-trophy` | 奖杯 | 成就系统 |
| 25 | `icon-apple` | 苹果 | 键盘游戏收集 |
| 26 | `icon-coin` | 金币 | 矿工游戏货币 |
| 27 | `icon-bulb` | 灯泡 | 提示/灵感 |
| 28 | `icon-rocket` | 火箭 | 奖励加速 |
| 29 | `icon-forward` | 前进 | 下一关 |
| 30 | `icon-eye` | 眼睛 | 可见/家长监控 |
| 31 | `icon-plus` | 加号 | 添加/放大 |
| 32 | `icon-target` | 准星 | 精度/瞄准 |

## Set 3: 编程概念 + 工具 + 通用UI (33-48)

| 编号 | ID | 名称 | 用途 |
|------|-----|------|------|
| 33 | `icon-block` | 积木块 | 顺序执行(L1) |
| 34 | `icon-variable` | 变量盒 | 变量概念(L4) |
| 35 | `icon-pencil` | 铅笔 | 编辑/绘画 |
| 36 | `icon-flag` | 旗帜 | 目标/终点 |
| 37 | `icon-upload` | 上传 | 上传/分享 |
| 38 | `icon-download` | 下载 | 下载/保存 |
| 39 | `icon-search` | 搜索 | 放大镜查找 |
| 40 | `icon-filter` | 漏斗 | 筛选/过滤 |
| 41 | `icon-bookmark` | 书签 | 收藏保存 |
| 42 | `icon-pin` | 定位针 | 位置标记 |
| 43 | `icon-cloud` | 云 | 云端保存 |
| 44 | `icon-chat` | 对话 | 消息/反馈 |
| 45 | `icon-user` | 用户 | 个人中心 |
| 46 | `icon-calendar` | 日历 | 日期/计划 |
| 47 | `icon-camera` | 相机 | 拍照/截图 |
| 48 | `icon-info` | 信息 | 帮助说明 |

---

## CSS Sprite坐标

所有三个文件共享相同的网格布局（592×592，120px单元格，20px间距），可以用统一坐标公式：

```
background-position: -(26 + col*140)px -(26 + row*140)px;
```

其中 `col`(0-3) 为列，`row`(0-3) 为行。

## 设计规格

- 风格：极简线性（outline），2px描边
- 颜色：`#5B8FE8`（靛蓝色），全局替换为项目主色
- 画布：592×592px，4×4宫格
- 单元格：120×120px，间距20px
- 每个图标可独立提取为单个SVG（找到 `<g id="icon-xxx">` 放入 120×120 画布，改 `transform` 为 `translate(60,60)`）
