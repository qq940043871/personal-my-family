/**
 * 全家签到 · 业务数据层（原生小程序版）
 * 由 family-check-in/store/index.js（uni-app + Vue reactive 版）移植而来，
 * 去掉 Vue 依赖，改为纯 JS 模块 + 本地缓存持久化。
 * 页面在 onShow 时读取快照并 setData，写操作后重新拉取快照。
 */

const STORAGE_KEY = 'family_members_v1'
const VERSE_KEY = 'family_verse_v1'

const photos = require('./photos.js')

/* ==================== 宠物成长阶段（按年龄差异） ==================== */

// 5 阶段标准（家长 + 9 岁孩子）
function getPetStage(grow, totalGrow = 1000) {
  const ratio = grow / totalGrow
  if (ratio < 0.1) return { stage: '蛋', level: 1, icon: '🥚' }
  if (ratio < 0.3) return { stage: '幼年期', level: 2, icon: '🐣' }
  if (ratio < 0.6) return { stage: '成长期', level: 3, icon: '🐥' }
  if (ratio < 0.9) return { stage: '成熟期', level: 4, icon: '🐔' }
  return { stage: '完全体', level: 5, icon: '🦄' }
}

// 3 阶段（3 岁幼儿）
function getToddlerPetStage(grow, totalGrow = 100) {
  const ratio = grow / totalGrow
  if (ratio < 0.33) return { stage: '蛋宝宝', level: 1, icon: '🥚', color: '#FBBF24' }
  if (ratio < 0.66) return { stage: '小鸡', level: 2, icon: '🐥', color: '#F59E0B' }
  return { stage: '大公鸡', level: 3, icon: '🐔', color: '#EF4444' }
}

// 5 阶段慢成长（奶奶）
function getElderPetStage(grow, totalGrow = 1600) {
  const ratio = grow / totalGrow
  if (ratio < 0.12) return { stage: '小龟', level: 1, icon: '🐢', color: '#78716C' }
  if (ratio < 0.35) return { stage: '少年龟', level: 2, icon: '🐢', color: '#A8A29E' }
  if (ratio < 0.55) return { stage: '壮年龟', level: 3, icon: '🐢', color: '#84CC16' }
  if (ratio < 0.8) return { stage: '智慧龟', level: 4, icon: '🐢', color: '#EAB308' }
  return { stage: '恩典之龟', level: 5, icon: '🐢💫', color: '#F59E0B' }
}

// 通用获取阶段（根据 member 自动选体系）
function stageFor(member) {
  if (!member) return { stage: '—', level: 0, icon: '🥚' }
  if (member.age <= 4) return getToddlerPetStage(member.grow, member.totalGrow)
  if (member.age >= 55) return getElderPetStage(member.grow, member.totalGrow)
  return getPetStage(member.grow, member.totalGrow)
}

/* ==================== 比武属性 ==================== */

const PET_ATTRS = [
  { key: 'strength', label: '力量', icon: '⚡' },
  { key: 'wisdom', label: '智慧', icon: '🧠' },
  { key: 'vitality', label: '活力', icon: '💚' },
  { key: 'charm', label: '魅力', icon: '✨' }
]

/* ==================== 宠物图鉴与稀有度 ==================== */

const RARITY_INFO = {
  common: { label: '普通', color: '#94A3B8', bg: '#F1F5F9', borderColor: '#CBD5E1', powerBonus: 0 },
  rare: { label: '稀有', color: '#3B82F6', bg: '#EFF6FF', borderColor: '#93C5FD', powerBonus: 10 },
  epic: { label: '史诗', color: '#8B5CF6', bg: '#F5F3FF', borderColor: '#C4B5FD', powerBonus: 20 },
  legendary: { label: '传说', color: '#F59E0B', bg: '#FFFBEB', borderColor: '#FCD34D', powerBonus: 35 },
  mythic: { label: '神话', color: '#EF4444', bg: '#FEF2F2', borderColor: '#FCA5A5', powerBonus: 50 }
}

const PET_CATALOG = [
  // ---- 默认宠物（初始拥有） ----
  {
    id: 'dad_default', name: '铁柱', species: '忠诚犬', icon: '🐶', rarity: 'rare', requiredPoints: 0, basePower: 30, desc: '爸爸的忠诚伙伴', defaultFor: 'dad',
    skills: [
      { icon: '🛡️', name: '忠诚守护', desc: '时刻守护家人，为大家增添安全感' },
      { icon: '👃', name: '灵鼻寻物', desc: '帮忙找回丢失的遥控器和钥匙' }
    ]
  },
  {
    id: 'mom_default', name: '露娜', species: '优雅猫', icon: '🐱', rarity: 'rare', requiredPoints: 0, basePower: 28, desc: '妈妈的优雅伴侣', defaultFor: 'mom',
    skills: [
      { icon: '🌙', name: '安神呼噜', desc: '轻柔的呼噜声抚平一天的疲惫' },
      { icon: '🐾', name: '轻步夜巡', desc: '悄悄巡视全家，守护每晚安眠' }
    ]
  },
  {
    id: 'dabao_default', name: '小龙', species: '战斗龙', icon: '🐉', rarity: 'epic', requiredPoints: 0, basePower: 45, desc: '龙之试炼的伙伴', defaultFor: 'dabao',
    skills: [
      { icon: '🔥', name: '小火花', desc: '喷出温暖火苗，为家人点亮勇气' },
      { icon: '🛡️', name: '逆鳞护主', desc: '危险时刻挺身而出，战力大增' }
    ]
  },
  {
    id: 'erbao_default', name: '蛋蛋', species: '小萌鸡', icon: '🐣', rarity: 'common', requiredPoints: 0, basePower: 8, desc: '宝宝的第一个朋友', defaultFor: 'erbao',
    skills: [
      { icon: '🌅', name: '清晨报晓', desc: '准时打鸣，叫全家起床啦' },
      { icon: '🤸', name: '萌力十足', desc: '呆萌舞蹈治愈所有不开心' }
    ]
  },
  {
    id: 'grandma_default', name: '恩典', species: '信仰龟', icon: '🐢', rarity: 'rare', requiredPoints: 0, basePower: 25, desc: '恒久忍耐的恩典', defaultFor: 'grandma',
    skills: [
      { icon: '🧘', name: '长寿祝福', desc: '见证并祝福每位家人的成长' },
      { icon: '🐢', name: '稳步前行', desc: '不急不躁，坚持就是胜利' }
    ]
  },

  // ---- 普通级 ----
  {
    id: 'cat_tabby', name: '小花猫', species: '猫咪', icon: '🐈', rarity: 'common', requiredPoints: 0, basePower: 18, desc: '一只可爱的虎斑猫，喜欢晒太阳',
    skills: [
      { icon: '☀️', name: '暖阳治愈', desc: '晒着太阳打盹，治愈周围的人' },
      { icon: '🐾', name: '悄无声息', desc: '走路轻巧，是最安静的伙伴' }
    ]
  },
  {
    id: 'dog_corgi', name: '小柯基', species: '柯基犬', icon: '🐕', rarity: 'common', requiredPoints: 100, basePower: 20, desc: '短腿但跑得飞快的小家伙',
    skills: [
      { icon: '🏃', name: '疾风短腿', desc: '小短腿倒腾出飞快的速度' },
      { icon: '🍑', name: '电臀摇摆', desc: '开心扭臀，逗笑全家人' }
    ]
  },
  {
    id: 'bird_swift', name: '雨燕', species: '飞鸟', icon: '🐦', rarity: 'common', requiredPoints: 200, basePower: 16, desc: '飞得最快的鸟儿之一',
    skills: [
      { icon: '💨', name: '疾风俯冲', desc: '贴地疾飞，快到只剩影子' },
      { icon: '🧭', name: '永不迷路', desc: '无论多远都能找到回家的路' }
    ]
  },
  {
    id: 'hamster_gold', name: '金丝熊', species: '仓鼠', icon: '🐹', rarity: 'common', requiredPoints: 300, basePower: 14, desc: '囤积坚果的小能手',
    skills: [
      { icon: '🥜', name: '颊囊囤粮', desc: '腮帮子塞满坚果，快乐加倍' },
      { icon: '😴', name: '憨睡养神', desc: '酣睡一觉，恢复满满元气' }
    ]
  },
  {
    id: 'fish_koi', name: '锦鲤', species: '观赏鱼', icon: '🐟', rarity: 'common', requiredPoints: 400, basePower: 15, desc: '带来好运的锦鲤',
    skills: [
      { icon: '🍀', name: '好运加持', desc: '有它在身边，事事都顺利' },
      { icon: '🌊', name: '鱼跃龙门', desc: '奋力一跃，寓意步步高升' }
    ]
  },

  // ---- 稀有级 ----
  {
    id: 'fox_arctic', name: '北极狐', species: '灵狐', icon: '🦊', rarity: 'rare', requiredPoints: 500, basePower: 38, desc: '聪明又敏捷的白色精灵',
    skills: [
      { icon: '❄️', name: '雪地潜行', desc: '雪白身影融入风雪，来去无踪' },
      { icon: '👂', name: '敏锐听觉', desc: '雪下细微动静也逃不过它的耳朵' }
    ]
  },
  {
    id: 'eagle_golden', name: '金雕', species: '猛禽', icon: '🦅', rarity: 'rare', requiredPoints: 700, basePower: 42, desc: '天空的霸主，锐利如刀',
    skills: [
      { icon: '👁️', name: '锐眼洞察', desc: '高空俯瞰，一眼锁定目标' },
      { icon: '🪂', name: '御风滑翔', desc: '展开双翼，乘风翱翔千里' }
    ]
  },
  {
    id: 'panda_baby', name: '熊猫宝宝', species: '大熊猫', icon: '🐼', rarity: 'rare', requiredPoints: 900, basePower: 35, desc: '憨态可掬的国宝',
    skills: [
      { icon: '🎋', name: '竹林盛宴', desc: '抱着竹子大快朵颐，满足感爆棚' },
      { icon: '🤗', name: '滚滚抱抱', desc: '一个圆滚滚的拥抱，暖化人心' }
    ]
  },
  {
    id: 'wolf_white', name: '白狼', species: '狼族', icon: '🐺', rarity: 'rare', requiredPoints: 1200, basePower: 44, desc: '团队狩猎的王者',
    skills: [
      { icon: '🐺', name: '群狼战术', desc: '指挥伙伴协同作战，配合无间' },
      { icon: '🌕', name: '月夜长嚎', desc: '对月长嚎，鼓舞全队士气' }
    ]
  },

  // ---- 史诗级 ----
  {
    id: 'dragon_young', name: '幼龙', species: '龙族', icon: '🐲', rarity: 'epic', requiredPoints: 1500, basePower: 62, desc: '沉睡已久的龙宝宝，潜力无穷',
    skills: [
      { icon: '🔥', name: '火苗喷吐', desc: '吐出灼热火苗，战斗中威力可观' },
      { icon: '🪽', name: '初次振翅', desc: '扑腾着小翅膀，即将一飞冲天' }
    ]
  },
  {
    id: 'unicorn_moon', name: '月影独角兽', species: '神兽', icon: '🦄', rarity: 'epic', requiredPoints: 1800, basePower: 58, desc: '月光下闪耀的神秘生物',
    skills: [
      { icon: '✨', name: '月光治愈', desc: '洒下月辉，抚平伤痛恢复活力' },
      { icon: '🌈', name: '彩虹疾驰', desc: '踏着彩虹奔跑，美丽而迅猛' }
    ]
  },
  {
    id: 'shark_hammer', name: '锤头鲨', species: '深海巨兽', icon: '🦈', rarity: 'epic', requiredPoints: 2200, basePower: 66, desc: '海洋的顶级掠食者',
    skills: [
      { icon: '🌊', name: '深海冲撞', desc: '借海水之力发起雷霆一击' },
      { icon: '🧲', name: '锤头感应', desc: '敏锐感知周围的一切动静' }
    ]
  },
  {
    id: 'lion_fire', name: '火焰狮', species: '炎兽', icon: '🦁', rarity: 'epic', requiredPoints: 2600, basePower: 68, desc: '鬃毛燃烧着永不熄灭的烈焰',
    skills: [
      { icon: '🔥', name: '烈焰鬃毛', desc: '燃烧的鬃毛让敌人不敢靠近' },
      { icon: '📢', name: '王者咆哮', desc: '一声怒吼震慑全场，士气大振' }
    ]
  },

  // ---- 传说级 ----
  {
    id: 'phoenix_flame', name: '烈焰凤凰', species: '神鸟', icon: '🐦‍🔥', rarity: 'legendary', requiredPoints: 3000, basePower: 88, desc: '浴火重生，不死不灭',
    skills: [
      { icon: '♻️', name: '浴火重生', desc: '倒下后从灰烬中重生，越战越勇' },
      { icon: '🪶', name: '焚天羽翼', desc: '振翅掀起火浪，横扫千军' }
    ]
  },
  {
    id: 'kirin_jade', name: '碧玉麒麟', species: '圣兽', icon: '🦬', rarity: 'legendary', requiredPoints: 3800, basePower: 92, desc: '瑞兽降世，福泽万代',
    skills: [
      { icon: '💎', name: '玉光赐福', desc: '周身玉光护体，为家人带来福气' },
      { icon: '👣', name: '麒麟踏祥', desc: '步步生莲，行走处祥云环绕' }
    ]
  },

  // ---- 神话级 ----
  {
    id: 'dragon_golden', name: '五爪金龙', species: '天龙', icon: '🐉', rarity: 'mythic', requiredPoints: 5000, basePower: 115, desc: '传说中至高无上的龙皇',
    skills: [
      { icon: '⚡', name: '龙皇雷霆', desc: '召唤九天神雷，威震八方' },
      { icon: '🌧️', name: '行云布雨', desc: '翻云覆雨，掌控天地气象' }
    ]
  },
  {
    id: 'fox_nine', name: '九尾天狐', species: '仙狐', icon: '🦊✨', rarity: 'mythic', requiredPoints: 6000, basePower: 110, desc: '千年修行，九尾通天',
    skills: [
      { icon: '🔥', name: '九尾天火', desc: '九条尾巴齐燃天火，焚尽一切' },
      { icon: '🌀', name: '魅惑之瞳', desc: '眼波流转间令对手失去战意' }
    ]
  }
]

function findPetInCatalog(petId) {
  return PET_CATALOG.find(p => p.id === petId) || null
}

/* ==================== 每日经文（奶奶专属） ==================== */

const BIBLE_VERSES = [
  { text: '你要专心仰赖耶和华，不可倚靠自己的聪明。', ref: '箴言 3:5' },
  { text: '我靠着那加给我力量的，凡事都能做。', ref: '腓立比书 4:13' },
  { text: '喜乐的心乃是良药，忧伤的灵使骨枯干。', ref: '箴言 17:22' },
  { text: '你们得救在乎归回安息，你们得力在乎平静安稳。', ref: '以赛亚书 30:15' },
  { text: '凡劳苦担重担的人，可以到我这里来，我就使你们得安息。', ref: '马太福音 11:28' },
  { text: '不要为明天忧虑，因为明天自有明天的忧虑。', ref: '马太福音 6:34' },
  { text: '爱是恒久忍耐，又有恩慈。', ref: '哥林多前书 13:4' },
  { text: '耶和华是我的牧者，我必不至缺乏。', ref: '诗篇 23:1' },
  { text: '在你一切所行的事上，都要认定他，他必指引你的路。', ref: '箴言 3:6' },
  { text: '我留下平安给你们，我将我的平安赐给你们。', ref: '约翰福音 14:27' }
]

let verseIndex = Math.floor(Math.random() * BIBLE_VERSES.length)

function getDailyVerse() {
  verseIndex = (verseIndex + 1) % BIBLE_VERSES.length
  return BIBLE_VERSES[verseIndex]
}

// 首页展示用：同一天保持同一段经文
function getTodayVerse() {
  const today = formatDate(new Date())
  try {
    const cached = wx.getStorageSync(VERSE_KEY)
    if (cached && cached.date === today && cached.verse) return cached.verse
  } catch (e) {
    console.warn('读取经文缓存失败', e)
  }
  const verse = BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)]
  try {
    wx.setStorageSync(VERSE_KEY, { date: today, verse })
  } catch (e) {
    console.warn('写入经文缓存失败', e)
  }
  return verse
}

function formatDate(d) {
  const m = d.getMonth() + 1
  const day = d.getDate()
  return d.getFullYear() + '-' + m + '-' + day
}

/* ==================== 属灵果实勋章（奶奶专属） ==================== */

const SPIRITUAL_FRUITS = [
  { id: 's1', name: '仁爱', icon: '❤️', desc: '爱人如己' },
  { id: 's2', name: '喜乐', icon: '😊', desc: '常常喜乐' },
  { id: 's3', name: '和平', icon: '🕊️', desc: '使人和平' },
  { id: 's4', name: '忍耐', icon: '⏳', desc: '恒久忍耐' },
  { id: 's5', name: '恩慈', icon: '🤲', desc: '以恩慈相待' },
  { id: 's6', name: '良善', icon: '🌟', desc: '行善不丧志' },
  { id: 's7', name: '信实', icon: '🤝', desc: '信实可靠' },
  { id: 's8', name: '温柔', icon: '🕯️', desc: '温柔的心' },
  { id: 's9', name: '节制', icon: '⚖️', desc: '凡事节制' }
]

/* ==================== 家庭成员初始数据 ==================== */

// 头像以内联 base64 提供（见 utils/avatars.js，由 tools/gen_avatars_b64.py 生成）。
// 不用 '/images/avatars/xxx.jpg' 这类本地路径：部分运行环境解析不到，会整片显示破图。
const AVATARS = require('./avatars.js')

const memberData = [
  {
    id: 'dad', name: '爸爸', role: '家长', emoji: '👨', age: 38,
    pet: { type: '🐶', name: '铁柱', species: '忠诚犬' },
    adoptedPets: ['dad_default'], activePetId: 'dad_default', petNames: {},
    grow: 420, totalGrow: 1000,
    streak: 12, totalCheckins: 156, points: 2340, grace: 0,
    themeColor: '#2563EB',
    avatarUrl: AVATARS.dad,
    tasks: [
      { id: 'd1', name: '晨跑 / 健身 30 分钟', icon: '🏃', category: '运动', done: true, points: 10, trial: '力量试炼' },
      { id: 'd2', name: '早起打卡 (7:00前)', icon: '🌅', category: '生活', done: true, points: 10, trial: null },
      { id: 'd3', name: '陪孩子 20 分钟', icon: '👨‍👦', category: '家庭', done: false, points: 15, trial: '爱心试炼' }
    ]
  },
  {
    id: 'mom', name: '妈妈', role: '家长', emoji: '👩', age: 36,
    pet: { type: '🐱', name: '露娜', species: '优雅猫' },
    adoptedPets: ['mom_default'], activePetId: 'mom_default', petNames: {},
    grow: 680, totalGrow: 1000,
    streak: 23, totalCheckins: 203, points: 3250, grace: 0,
    themeColor: '#EC4899',
    avatarUrl: AVATARS.mom,
    tasks: [
      { id: 'm1', name: '瑜伽 20 分钟', icon: '🧘', category: '运动', done: true, points: 10, trial: null },
      { id: 'm2', name: '阅读 30 分钟', icon: '📖', category: '学习', done: true, points: 10, trial: '智慧试炼' },
      { id: 'm3', name: '冥想 10 分钟', icon: '🧠', category: '生活', done: true, points: 10, trial: null }
    ]
  },
  {
    id: 'dabao', name: '小龙', role: '学龄', emoji: '👦', age: 9,
    pet: { type: '🐉', name: '小龙', species: '战斗龙' },
    adoptedPets: ['dabao_default'], activePetId: 'dabao_default', petNames: {},
    grow: 250, totalGrow: 1000,
    streak: 8, totalCheckins: 89, points: 1560, grace: 0,
    themeColor: '#F59E0B',
    avatarUrl: AVATARS.dabao,
    dragonScales: 3,
    skills: [
      { id: 'fire', name: '喷火', level: 1, unlocked: true, desc: '温暖鼓励' },
      { id: 'fly', name: '飞行', unlocked: false, cost: 5, desc: '需 5 龙鳞' },
      { id: 'thunder', name: '雷电', unlocked: false, cost: 8, desc: '灰化状态' }
    ],
    milestones: [
      { label: '第一次签到', reached: true },
      { label: '首次连签7天', reward: '获得龙鳞', reached: true },
      { label: '获得龙鳞', sub: '幼龙进化中', reached: false }
    ],
    tasks: [
      { id: 'b1', name: '力量试炼：跳绳 500 个', icon: '⚡', category: '运动', done: true, points: 15, trial: '力量试炼' },
      { id: 'b2', name: '智慧试炼：阅读 30 分钟', icon: '📚', category: '学习', done: false, points: 15, trial: '智慧试炼' },
      { id: 'b3', name: '作业试炼：完成作业', icon: '✏️', category: '学习', done: false, points: 15, trial: '智慧试炼' },
      { id: 'b4', name: '技艺试炼：练琴 20 分钟', icon: '🎹', category: '兴趣', done: false, points: 15, trial: '技艺试炼' }
    ]
  },
  {
    id: 'erbao', name: '小宝', role: '幼儿', emoji: '👶', age: 3,
    pet: { type: '🐣', name: '蛋蛋', species: '小萌鸡' },
    adoptedPets: ['erbao_default'], activePetId: 'erbao_default', petNames: {},
    grow: 45, totalGrow: 100,   // 3 阶段，快速成长
    streak: 5, totalCheckins: 22, points: 220, grace: 0,
    themeColor: '#FBBF24',
    avatarUrl: AVATARS.erbao,
    stars: 22,  // 用 ⭐ 代替积分
    tasks: [
      { id: 'e1', name: '刷牙齿', icon: '🦷', category: '生活', done: false, points: 5, trial: null },
      { id: 'e2', name: '收玩具', icon: '🧸', category: '生活', done: false, points: 5, trial: null },
      { id: 'e3', name: '乖乖吃饭', icon: '🍚', category: '生活', done: false, points: 5, trial: null },
      { id: 'e4', name: '乖乖午睡', icon: '😴', category: '生活', done: false, points: 5, trial: null }
    ]
  },
  {
    id: 'grandma', name: '奶奶', role: '长辈', emoji: '👵', age: 68,
    pet: { type: '🐢', name: '恩典', species: '信仰龟' },
    adoptedPets: ['grandma_default'], activePetId: 'grandma_default', petNames: {},
    grow: 350, totalGrow: 1600,  // 慢成长
    streak: 15, totalCheckins: 134, points: 0, grace: 1890,
    themeColor: '#A88B6A',
    avatarUrl: AVATARS.grandma,
    spiritualFruits: ['s1', 's2'],
    todayVerse: null,
    tasks: [
      { id: 'g1', name: '读圣经 30 分钟', icon: '📖', category: '学习', done: true, points: 0, grace: 15, trial: null },
      { id: 'g2', name: '散步 30 分钟', icon: '🚶', category: '运动', done: true, points: 0, grace: 10, trial: null },
      { id: 'g3', name: '按时吃药', icon: '💊', category: '健康', done: true, points: 0, grace: 10, trial: null },
      { id: 'g4', name: '养生操 15 分钟', icon: '🤸', category: '运动', done: false, points: 0, grace: 10, trial: null }
    ]
  }
]

/* ==================== 排名 / 成就 / 家庭挑战 ==================== */

const weeklyRank = [
  { memberId: 'mom', name: '妈妈', emoji: '👩', rate: 100, petGrow: 142 },
  { memberId: 'dad', name: '爸爸', emoji: '👨', rate: 92, petGrow: 118 },
  { memberId: 'dabao', name: '大儿子', emoji: '👦', rate: 85, petGrow: 85 }
]

const monthlyRank = [
  { memberId: 'mom', name: '妈妈', emoji: '👩', rate: 98, petGrow: 580, streak: 30 },
  { memberId: 'dad', name: '爸爸', emoji: '👨', rate: 94, petGrow: 520, streak: 28 },
  { memberId: 'dabao', name: '大儿子', emoji: '👦', rate: 82, petGrow: 380, streak: 22 }
]

const yearlyRank = [
  { memberId: 'mom', name: '妈妈', emoji: '👩', rate: 96, totalPoints: 12050, keyword: '自律女王' },
  { memberId: 'dad', name: '爸爸', emoji: '👨', rate: 91, totalPoints: 9800, keyword: '稳步前进' },
  { memberId: 'dabao', name: '大儿子', emoji: '👦', rate: 82, totalPoints: 6500, keyword: '最佳突破' }
]

const achievements = [
  { id: 'a1', icon: '🔥', name: '7天连签' },
  { id: 'a2', icon: '💯', name: '全勤周' },
  { id: 'a3', icon: '🏆', name: '周冠军' },
  { id: 'a4', icon: '🥇', name: '月金牌' },
  { id: 'a5', icon: '📚', name: '阅读100' },
  { id: 'a6', icon: '🏃', name: '运动100' },
  { id: 'a7', icon: '🦄', name: '宠物满级' },
  { id: 'a8', icon: '⭐', name: '年度MVP' },
  { id: 'a9', icon: '🎯', name: '全勤月' }
]

const memberAchievements = {
  mom: ['a1', 'a2', 'a3', 'a4', 'a5', 'a7'],
  dad: ['a1', 'a2', 'a6'],
  dabao: ['a1', 'a5'],
  erbao: ['a1'],
  grandma: ['a1', 'a2', 'a6']
}

const familyChallenge = {
  title: '本周家庭挑战',
  goal: '全家累计阅读 20 小时',
  current: 12.5,
  target: 20,
  unit: '小时'
}

/* ==================== 成员数据装载与持久化 ==================== */

let members = loadMembers()

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function loadMembers() {
  try {
    const saved = wx.getStorageSync(STORAGE_KEY)
    if (saved && Array.isArray(saved) && saved.length) return saved
  } catch (e) {
    console.warn('读取本地成员数据失败', e)
  }
  return clone(memberData)
}

function persistMembers() {
  try {
    wx.setStorageSync(STORAGE_KEY, clone(members))
  } catch (e) {
    console.warn('保存本地成员数据失败', e)
  }
}

function getMembers() {
  return members
}

function findMember(memberId) {
  return members.find(m => m.id === memberId) || null
}

/* ==================== 当前视角成员与家庭信息 ==================== */

const FAMILY_KEY = 'family_info_v1'
const CURRENT_KEY = 'family_current_member_v1'

function loadFamilyInfo() {
  try {
    const saved = wx.getStorageSync(FAMILY_KEY)
    if (saved && typeof saved === 'object' && saved.name) return saved
  } catch (e) { /* 忽略 */ }
  return { name: '我们家', createdAt: Date.now() }
}

let familyInfo = loadFamilyInfo()

let currentMemberId = ''
try {
  currentMemberId = wx.getStorageSync(CURRENT_KEY) || ''
} catch (e) {
  currentMemberId = ''
}

// 家庭信息（名称等）
function getFamilyInfo() {
  return familyInfo
}

function setFamilyInfo(data = {}) {
  if (data.name !== undefined) {
    familyInfo.name = (String(data.name).trim() || familyInfo.name).slice(0, 12)
  }
  try {
    wx.setStorageSync(FAMILY_KEY, clone(familyInfo))
  } catch (e) {
    console.warn('保存家庭信息失败', e)
  }
  return familyInfo
}

// 当前视角成员（单人视角的核心）
function getCurrentMemberId() {
  return currentMemberId
}

function setCurrentMember(memberId) {
  if (!findMember(memberId)) return false
  currentMemberId = memberId
  try {
    wx.setStorageSync(CURRENT_KEY, currentMemberId)
  } catch (e) {
    console.warn('保存当前成员失败', e)
  }
  return true
}

function getCurrentMember() {
  return findMember(currentMemberId)
}

// 是否已完成「我是谁」引导
function isOnboarded() {
  return !!currentMemberId && !!findMember(currentMemberId)
}

function clearOnboarding() {
  currentMemberId = ''
  try {
    wx.setStorageSync(CURRENT_KEY, '')
  } catch (e) { /* 忽略 */ }
}

// 根据年龄推导角色与成长体系
function roleForAge(age) {
  if (age <= 4) return '幼儿'
  if (age >= 55) return '长辈'
  if (age <= 17) return '学龄'
  return '家长'
}

function totalGrowForAge(age) {
  if (age <= 4) return 100
  if (age >= 55) return 1600
  return 1000
}

function defaultTasksFor(memberId) {
  return [
    { id: memberId + '_t1', name: '早起打卡', icon: '🌅', category: '生活', done: false, points: 10, trial: null },
    { id: memberId + '_t2', name: '阅读 20 分钟', icon: '📖', category: '学习', done: false, points: 10, trial: null },
    { id: memberId + '_t3', name: '运动 20 分钟', icon: '🏃', category: '运动', done: false, points: 10, trial: null }
  ]
}

// 新增家庭成员
function addMember(data = {}) {
  const age = Math.max(0, Math.min(120, Number(data.age) || 0))
  const id = 'm' + Date.now()
  const totalGrow = totalGrowForAge(age)
  const member = {
    id,
    name: (data.name || '').trim() || '新成员',
    role: roleForAge(age),
    emoji: data.emoji || '🧑',
    age,
    pet: { type: '🐾', name: (data.petName || '').trim() || '小伙伴', species: '家庭萌宠' },
    adoptedPets: [],
    activePetId: null,
    petNames: {},
    grow: 0,
    totalGrow,
    streak: 0,
    totalCheckins: 0,
    points: 0,
    grace: 0,
    stars: 0,
    themeColor: data.themeColor || '#10B981',
    avatarUrl: data.avatarUrl || '',
    tasks: defaultTasksFor(id)
  }
  members.push(member)
  persistMembers()
  return member
}

// 修改家庭成员（姓名/头像/年龄/主题色/宠物名）
function updateMember(memberId, data = {}) {
  const member = findMember(memberId)
  if (!member) return null

  if (data.name !== undefined) member.name = (data.name || '').trim() || member.name
  if (data.emoji !== undefined) member.emoji = data.emoji || member.emoji
  if (data.themeColor !== undefined) member.themeColor = data.themeColor || member.themeColor
  if (data.petName !== undefined && member.pet) {
    member.pet.name = (data.petName || '').trim() || member.pet.name
  }

  if (data.age !== undefined) {
    const age = Math.max(0, Math.min(120, Number(data.age) || 0))
    if (age !== member.age) {
      const oldTotal = member.totalGrow
      member.age = age
      member.role = roleForAge(age)
      // 年龄段变化会切换成长体系，等比换算保留进度
      const newTotal = totalGrowForAge(age)
      member.grow = Math.min(newTotal, Math.round((member.grow / (oldTotal || 1)) * newTotal))
      member.totalGrow = newTotal
    }
  }

  persistMembers()
  return member
}

// 删除家庭成员（至少保留 1 名）
function removeMember(memberId) {
  if (members.length <= 1) return { success: false, msg: '至少需要保留 1 位成员' }
  const index = members.findIndex(m => m.id === memberId)
  if (index === -1) return { success: false, msg: '成员不存在' }
  members.splice(index, 1)
  // 删除的是当前视角成员 → 回到引导页重新选择
  if (currentMemberId === memberId) clearOnboarding()
  persistMembers()
  return { success: true }
}

/* ==================== 积分口径 ==================== */

function scoreValue(member) {
  if (!member) return 0
  if (member.age <= 4) return member.stars || member.points || 0
  if (member.age >= 55) return member.grace || 0
  return member.points || 0
}

function scoreLabel(member) {
  if (!member) return '积分'
  if (member.age <= 4) return '星星'
  if (member.age >= 55) return '恩典值'
  return '积分'
}

/* ==================== 签到 ==================== */

// 汇总全部成员的任务（附成员信息）
function getAllTasks() {
  const all = []
  members.forEach(m => {
    m.tasks.forEach(t => {
      all.push(Object.assign({}, t, {
        memberId: m.id,
        memberName: m.name,
        memberEmoji: m.emoji,
        memberAge: m.age
      }))
    })
  })
  return all
}

/**
 * 执行签到
 * @returns {Object|null} 签到结果（用于弹窗展示），失败返回 null
 */
function doCheckin(memberId, taskId, photoPath = null) {
  const member = findMember(memberId)
  if (!member) return null
  const task = member.tasks.find(t => t.id === taskId)
  if (!task || task.done) return null

  // 拍照必填：不拍不算完成，也不给积分
  if (!photoPath) {
    return { blocked: true, msg: '请先拍照再签到哦 📷' }
  }

  // 临时路径 → 永久目录，避免重启后裂图
  task.photo = photos.savePhoto(photoPath, memberId, taskId) || photoPath
  task.photoAt = Date.now()

  task.done = true

  // 积分 / 恩典值 / 星星
  if (member.age >= 55) {
    member.grace += (task.grace || 10)
  } else if (member.age <= 4) {
    member.stars = (member.stars || 0) + (task.points || 5)
    member.points += (task.points || 5)
  } else {
    member.points += task.points
  }

  member.totalCheckins += 1
  member.streak += 1

  const oldStage = stageFor(member)

  // 成长值：幼儿 2 倍速
  const growBoost = member.age <= 4 ? 20 : 10
  member.grow = Math.min(member.totalGrow, member.grow + growBoost)

  const newStage = stageFor(member)
  const evolved = newStage.level > oldStage.level

  // 9 岁孩子：龙鳞（每 5 次签到一片）
  let scaleGained = false
  if (member.age === 9 && member.dragonScales !== undefined) {
    member.dragonScales = member.dragonScales || 0
    if (member.totalCheckins % 5 === 0) {
      member.dragonScales += 1
      scaleGained = true
    }
  }

  // 奶奶：推送经文
  const verse = member.age >= 55 ? getDailyVerse() : null
  if (verse) member.todayVerse = verse

  persistMembers()

  return {
    member: clone(member),
    task: clone(task),
    evolved,
    newStage,
    photo: task.photo,
    verse,
    scaleGained
  }
}

/* ==================== 签到照片（重拍 / 删除 / 回看） ==================== */

// 已签到的任务重拍照片
function updateTaskPhoto(memberId, taskId, photoPath) {
  const member = findMember(memberId)
  if (!member) return { success: false, msg: '成员不存在' }
  const task = member.tasks.find(t => t.id === taskId)
  if (!task) return { success: false, msg: '任务不存在' }
  if (!photoPath) return { success: false, msg: '照片无效' }

  task.photo = photos.savePhoto(photoPath, memberId, taskId) || photoPath
  task.photoAt = Date.now()
  persistMembers()
  return { success: true, photo: task.photo }
}

// 删除某个任务的签到照片（任务本身仍保持已完成）
function clearTaskPhoto(memberId, taskId) {
  const member = findMember(memberId)
  if (!member) return { success: false, msg: '成员不存在' }
  const task = member.tasks.find(t => t.id === taskId)
  if (!task) return { success: false, msg: '任务不存在' }
  if (!task.photo) return { success: true }

  photos.removePhoto(task.photo)
  task.photo = null
  task.photoAt = 0
  persistMembers()
  return { success: true }
}

// 某人已完成任务里的照片（回看用）
function getMemberPhotos(memberId) {
  const member = findMember(memberId)
  if (!member) return []
  return (member.tasks || [])
    .filter(t => t.done && t.photo)
    .map(t => ({
      taskId: t.id,
      taskName: t.name,
      icon: t.icon,
      photo: t.photo,
      photoAt: t.photoAt || 0
    }))
}

// 全家今日照片墙（按成员聚合）
function getFamilyPhotos() {
  const out = []
  members.forEach(m => {
    const list = getMemberPhotos(m.id)
    if (!list.length) return
    out.push({
      memberId: m.id,
      name: m.name,
      emoji: m.emoji,
      avatarUrl: m.avatarUrl || '',
      themeColor: m.themeColor,
      count: list.length,
      photos: list
    })
  })
  return out
}

/* ==================== 家庭统计 ==================== */

function getFamilyStats() {
  return {
    totalStreak: members.reduce((s, m) => s + m.streak, 0),
    totalCheckins: members.reduce((s, m) => s + m.totalCheckins, 0),
    totalPoints: members.reduce((s, m) => s + (m.points || 0), 0),
    todayDone: members.reduce((s, m) => s + m.tasks.filter(t => t.done).length, 0),
    todayTotal: members.reduce((s, m) => s + m.tasks.length, 0)
  }
}

// 参与排名的成员（5 ~ 50 岁）
// 参与排名的成员：全家都上同一张榜（幼儿有萌宠加成，老人有恩典值口径）
function getRankingMembers() {
  return members.slice()
}

// 全家统一排行榜：先按今日完成率，再按战力（含幼儿加成）
// 用完成率做主排序，是因为各人分数口径不同（积分 / 星星 / 恩典值）不能直接比大小
function getFamilyRanking() {
  return members
    .map(m => {
      const stage = stageFor(m)
      return {
        memberId: m.id,
        name: m.name,
        emoji: m.emoji,
        role: m.role,
        age: m.age,
        themeColor: m.themeColor,
        avatarUrl: m.avatarUrl || '',
        rate: doneRate(m),
        power: getPetTotalPower(m),
        bonus: toddlerBattleBonus(m),
        isToddler: m.age <= 4,
        streak: m.streak,
        petGrow: m.grow,
        stageName: stage.stage,
        scoreValue: scoreValue(m),
        scoreLabel: scoreLabel(m)
      }
    })
    .sort((a, b) => (b.rate - a.rate) || (b.power - a.power))
}

// 夫妻羁绊：两人都全勤
function getCoupleBond() {
  const dad = findMember('dad')
  const mom = findMember('mom')
  if (!dad || !mom) return false
  return dad.tasks.every(t => t.done) && mom.tasks.every(t => t.done)
}

/* ==================== 宠物领养系统 ==================== */

// 幼儿（≤4 岁）专属解锁条件：不比积分（星星永远攒不到 500/3000），改为看成长进度
const TODDLER_UNLOCK = {
  common: 0,
  rare: 0.3,
  epic: 0.5,
  legendary: 0.7,
  mythic: 0.85
}

function toddlerUnlockRatio(rarity) {
  const v = TODDLER_UNLOCK[rarity]
  return v === undefined ? 1 : v
}

// 这只宠物对这个人是否已解锁（幼儿走成长进度，其他人走积分）
function petUnlockedFor(member, pet) {
  if (!member || !pet) return false
  if (member.age <= 4) {
    const ratio = (member.grow || 0) / (member.totalGrow || 100)
    return ratio >= toddlerUnlockRatio(pet.rarity)
  }
  return scoreValue(member) >= (pet.requiredPoints || 0)
}

// 解锁条件文案（幼儿显示「成长 30%」，其他人显示「500 积分」）
function petUnlockText(member, pet) {
  if (!member || !pet) return ''
  if (member.age <= 4) {
    const need = toddlerUnlockRatio(pet.rarity)
    return need <= 0 ? '免费领' : ('成长 ' + Math.round(need * 100) + '%')
  }
  if (!pet.requiredPoints) return '免费领'
  return pet.requiredPoints + ' ' + scoreLabel(member)
}

// 已达标但未领养的宠物
function getAdoptablePets(memberId) {
  const member = findMember(memberId)
  if (!member) return []
  return PET_CATALOG.filter(p =>
    !p.defaultFor &&
    petUnlockedFor(member, p) &&
    !(member.adoptedPets || []).includes(p.id)
  )
}

// 全部未领养宠物（含锁定状态，用于图鉴展示）
function getAllCatalogPets(memberId) {
  const member = findMember(memberId)
  if (!member) return []
  return PET_CATALOG
    .filter(p => !p.defaultFor && !(member.adoptedPets || []).includes(p.id))
    .map(p => Object.assign({}, p, { unlocked: petUnlockedFor(member, p) }))
}

// 已领养宠物（含自定义名与出战状态）
function getMemberPets(memberId) {
  const member = findMember(memberId)
  if (!member) return []
  return (member.adoptedPets || [])
    .map(id => findPetInCatalog(id))
    .filter(Boolean)
    .map(p => Object.assign({}, p, {
      name: (member.petNames && member.petNames[p.id]) || p.name,
      active: p.id === member.activePetId,
      rarityLabel: (RARITY_INFO[p.rarity] || {}).label || '',
      rarityColor: (RARITY_INFO[p.rarity] || {}).color || '#94A3B8'
    }))
}

// 全量图鉴 + 归属状态（领养中心与图鉴合并后的唯一数据源）
// 每只宠物带：owned 是否已拥有 / active 是否出战中 / canAdopt 可领养 / locked 积分不足 / isDefault 初始宠
function getCatalogWithOwnership(memberId) {
  const member = findMember(memberId)
  if (!member) return []
  const ownedIds = member.adoptedPets || []
  const memberPets = getMemberPets(memberId)
  return PET_CATALOG.map(p => {
    const owned = ownedIds.indexOf(p.id) > -1
    const mp = owned ? memberPets.find(x => x.id === p.id) : null
    const rarity = RARITY_INFO[p.rarity] || {}
    const canAdopt = !owned && !p.defaultFor && petUnlockedFor(member, p)
    return Object.assign({}, p, {
      displayName: mp ? mp.name : p.name,
      owned,
      active: !!(mp && mp.active),
      // 初始宠物不可领养；已拥有的不重复领养
      canAdopt,
      locked: !owned && !p.defaultFor && !canAdopt,
      isDefault: !!p.defaultFor,
      unlockText: petUnlockText(member, p),
      isToddlerView: member.age <= 4,
      rarityLabel: rarity.label || '',
      rarityColor: rarity.color || '#94A3B8',
      rarityBonus: rarity.powerBonus || 0,
      totalPower: p.basePower + (rarity.powerBonus || 0)
    })
  })
}

// 当前出战宠物
function getActivePet(memberId) {
  const member = findMember(memberId)
  if (!member) return null
  return findPetInCatalog(member.activePetId)
}

// 领养
function adoptPet(memberId, petId) {
  const member = findMember(memberId)
  if (!member) return { success: false, msg: '成员不存在' }

  const pet = findPetInCatalog(petId)
  if (!pet) return { success: false, msg: '宠物不存在' }
  if (pet.defaultFor) return { success: false, msg: '这是默认宠物，无需领养' }

  if (!petUnlockedFor(member, pet)) {
    return { success: false, msg: '还没达到领养条件：' + petUnlockText(member, pet) }
  }
  if ((member.adoptedPets || []).includes(petId)) return { success: false, msg: '已经领养过了' }

  if (!member.adoptedPets) member.adoptedPets = []
  member.adoptedPets.push(petId)

  // 没有出战宠物时自动出战
  if (!member.activePetId) {
    switchActivePet(memberId, petId)
  } else {
    persistMembers()
  }
  return { success: true, pet: clone(pet), member: clone(member) }
}

// 切换出战
function switchActivePet(memberId, petId) {
  const member = findMember(memberId)
  if (!member) return false
  if (!(member.adoptedPets || []).includes(petId)) return false
  member.activePetId = petId
  const pet = findPetInCatalog(petId)
  if (pet && member.pet) {
    const customName = member.petNames && member.petNames[petId]
    member.pet = { type: pet.icon, name: customName || pet.name, species: pet.species }
  }
  persistMembers()
  return true
}

// 宠物改名（留空恢复图鉴默认名）
function renamePet(memberId, petId, name) {
  const member = findMember(memberId)
  if (!member) return { success: false, msg: '成员不存在' }
  if (!(member.adoptedPets || []).includes(petId)) return { success: false, msg: '尚未领养该宠物' }
  const pet = findPetInCatalog(petId)
  if (!pet) return { success: false, msg: '宠物不存在' }

  if (!member.petNames) member.petNames = {}
  const trimmed = (name || '').trim().slice(0, 10)
  if (trimmed) {
    member.petNames[petId] = trimmed
  } else {
    delete member.petNames[petId]
  }
  if (member.activePetId === petId && member.pet) {
    member.pet.name = member.petNames[petId] || pet.name
  }
  persistMembers()
  return { success: true, name: member.petNames[petId] || pet.name }
}

// 放归宠物（至少保留一只）
function releasePet(memberId, petId) {
  const member = findMember(memberId)
  if (!member) return { success: false, msg: '成员不存在' }
  const adopted = member.adoptedPets || []
  if (!adopted.includes(petId)) return { success: false, msg: '尚未领养该宠物' }
  if (adopted.length <= 1) return { success: false, msg: '至少保留一只宠物哦' }

  member.adoptedPets = adopted.filter(id => id !== petId)
  if (member.petNames) delete member.petNames[petId]
  if (member.activePetId === petId) {
    switchActivePet(memberId, member.adoptedPets[0])
    return { success: true }
  }
  persistMembers()
  return { success: true }
}

// 有成员解锁了新宠物但未领养（首页提醒用）
function getNewAdoptableCount() {
  let count = 0
  members.forEach(m => {
    count += getAdoptablePets(m.id).length
  })
  return count
}

/* ==================== 宠物属性与比武 ==================== */

// 宠物属性（含稀有度加成）
function getPetAttrs(member) {
  if (!member) {
    return { strength: 0, wisdom: 0, vitality: 0, charm: 0 }
  }
  const ratio = Math.round((member.grow / (member.totalGrow || 1)) * 100)
  const activePet = findPetInCatalog(member.activePetId)
  const rarityBonus = activePet ? ((RARITY_INFO[activePet.rarity] || {}).powerBonus || 0) : 0
  const seed = (i) => member.id.charCodeAt(i) || 0

  return {
    strength: Math.min(100, Math.round(ratio * 0.8 + (seed(0) % 25) + rarityBonus * 0.4)),
    wisdom: Math.min(100, Math.round(ratio * 0.75 + (seed(1) % 30) + rarityBonus * 0.35)),
    vitality: Math.min(100, Math.round(ratio * 0.7 + (seed(2) % 35) + rarityBonus * 0.3)),
    charm: Math.min(100, Math.round(ratio * 0.85 + (seed(3) % 20) + rarityBonus * 0.45))
  }
}

// 幼儿（≤4 岁）萌宠加成：统一战力口径下的补偿。
// 幼儿的宠物基础战力天生偏低（初始伙伴是普通级），不加成的话在统一榜里永远垫底。
const TODDLER_BATTLE_BONUS = 40

function toddlerBattleBonus(member) {
  return (member && member.age <= 4) ? TODDLER_BATTLE_BONUS : 0
}

function getPetTotalPower(member) {
  const attrs = getPetAttrs(member)
  return attrs.strength + attrs.wisdom + attrs.vitality + attrs.charm + toddlerBattleBonus(member)
}

// 比武：全员可参战（幼儿带萌宠加成），不再直接判平局/拒绝
function doBattle(member1, member2) {
  if (!member1 || !member2 || member1.id === member2.id) return null

  const power1 = getPetTotalPower(member1)
  const power2 = getPetTotalPower(member2)

  const r1 = power1 + Math.floor(Math.random() * 40)
  const r2 = power2 + Math.floor(Math.random() * 40)
  const winner = r1 >= r2 ? member1 : member2
  const loser = r1 >= r2 ? member2 : member1
  return {
    winner,
    loser,
    power1: r1,
    power2: r2,
    basePower1: power1,
    basePower2: power2,
    bonus1: toddlerBattleBonus(member1),
    bonus2: toddlerBattleBonus(member2)
  }
}

// 比武胜利奖励（写回真实数据）
function rewardBattleWinner(memberId, bonus = 30) {
  const member = findMember(memberId)
  if (!member) return
  if (member.age >= 55) {
    member.grace = (member.grace || 0) + bonus
  } else if (member.age <= 4) {
    member.stars = (member.stars || 0) + bonus
    member.points = (member.points || 0) + bonus
  } else {
    member.points = (member.points || 0) + bonus
  }
  persistMembers()
}

/* ==================== 跨页跳转意图（tabBar 不能带参） ==================== */

let pendingPetMemberId = ''

function setPendingPetMember(memberId) {
  pendingPetMemberId = memberId
}

function consumePendingPetMember() {
  const id = pendingPetMemberId
  pendingPetMemberId = ''
  return id
}

/* ==================== 视图辅助 ==================== */

function growPercent(member) {
  if (!member || !member.totalGrow) return 0
  return Math.round((member.grow / member.totalGrow) * 100)
}

function doneRate(member) {
  if (!member || !member.tasks.length) return 0
  return Math.round((member.tasks.filter(t => t.done).length / member.tasks.length) * 100)
}

// 重置为初始演示数据（我的页提供入口）
function resetAll() {
  members.length = 0
  clone(memberData).forEach(m => members.push(m))
  persistMembers()
  // 演示数据里的照片路径已经失效，一并清掉沙盒里的文件
  photos.clearAll()
  // 当前视角成员若还在新数据里就保留，否则回引导
  if (!isOnboarded()) clearOnboarding()
  return getMembers()
}

module.exports = {
  // 阶段
  getPetStage,
  getToddlerPetStage,
  getElderPetStage,
  stageFor,
  // 常量
  PET_ATTRS,
  RARITY_INFO,
  PET_CATALOG,
  SPIRITUAL_FRUITS,
  // 经文
  getDailyVerse,
  getTodayVerse,
  // 成员
  getMembers,
  findMember,
  loadMembers,
  roleForAge,
  addMember,
  updateMember,
  removeMember,
  // 当前视角 / 家庭信息
  getFamilyInfo,
  setFamilyInfo,
  getCurrentMemberId,
  setCurrentMember,
  getCurrentMember,
  isOnboarded,
  clearOnboarding,
  // 积分口径
  scoreValue,
  scoreLabel,
  // 签到
  getAllTasks,
  doCheckin,
  updateTaskPhoto,
  clearTaskPhoto,
  getMemberPhotos,
  getFamilyPhotos,
  // 统计
  getFamilyStats,
  getRankingMembers,
  getFamilyRanking,
  getCoupleBond,
  // 排名 / 成就
  weeklyRank,
  monthlyRank,
  yearlyRank,
  achievements,
  memberAchievements,
  familyChallenge,
  // 宠物
  getAdoptablePets,
  getAllCatalogPets,
  getMemberPets,
  getCatalogWithOwnership,
  petUnlockedFor,
  petUnlockText,
  toddlerUnlockRatio,
  getActivePet,
  adoptPet,
  switchActivePet,
  renamePet,
  releasePet,
  getNewAdoptableCount,
  findPetInCatalog,
  // 属性 / 比武
  getPetAttrs,
  getPetTotalPower,
  toddlerBattleBonus,
  doBattle,
  rewardBattleWinner,
  // 视图辅助
  growPercent,
  doneRate,
  resetAll,
  // 跨页跳转意图
  setPendingPetMember,
  consumePendingPetMember
}
