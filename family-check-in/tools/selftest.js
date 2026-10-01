/**
 * store/index.js 业务自测（Node 环境）
 *
 * uni-app 的 store 是 ES module（import/export），而 `@dcloudio/uni-app` 与 `@/utils/photos.js`
 * 在 Node 下不可直接解析，因此这里用「读源码 → 文本改写 → 写入临时 .cjs」的方式加载：
 *   - `@/utils/photos.js`  → 替换为 test/photos_stub.js（Node 侧无文件系统，原样返回路径）
 *   - 其余 `@/xxx`          → 替换为相对路径（本项目无其他运行时依赖）
 * 与小程序 tools/selftest.js 保持同一套断言口径（单人视角 + 拍照必填）。
 *
 * 用法：node tools/selftest.js
 */
const fs = require('fs')
const path = require('path')
const os = require('os')

const ROOT = path.resolve(__dirname, '..')

// ---------- 1. 内存版 uni.storage ----------
const memory = {}
global.uni = {
  getStorageSync(key) {
    return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : ''
  },
  setStorageSync(key, value) {
    memory[key] = JSON.parse(JSON.stringify(value))
  },
  showToast() {},
  showModal() {},
  navigateTo() {},
  reLaunch() {},
  switchTab() {},
  vibrateShort() {}
}

// ---------- 2. 极简 vue 响应式桩（够 store 用：对象/数组/计算属性） ----------
function reactive(obj) {
  return obj
}
function computed(fn) {
  const o = {
    get value() { return fn() },
  }
  return o
}

// ---------- 3. 临时落盘：photos 桩 + store 改写 ----------
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fam-checkin-selftest-'))

const photosStub = path.join(tmpDir, 'photos_stub.js')
fs.writeFileSync(photosStub, `'use strict'
// Node 桩：无文件系统，保存即原样返回临时路径
function savePhoto(tempPath) { return tempPath || '' }
function removePhoto() { return true }
function exists() { return false }
function clearAll() { return true }
function dirPath() { return '' }
function targetPath() { return '' }
function fileNameFor(memberId, taskId) { return memberId + '_' + taskId + '.jpg' }
module.exports = { savePhoto, removePhoto, exists, clearAll, dirPath, targetPath, fileNameFor }
module.exports.default = module.exports
`, 'utf8')

// store/index.js 是 ES module，Node 直载不了；这里把它降级成一段普通脚本：
// 抽出所有 `export function/const` 与 `export { ... }`，拼成末尾的统一导出对象。
const storeSrc = fs.readFileSync(path.join(ROOT, 'store', 'index.js'), 'utf8')

const exportedNames = []
const aliasedExports = {}
let body = storeSrc
  // 丢掉 import 语句（依赖由下方注入）
  .replace(/^\s*import\s+[^\n]*?['"][^'"]+['"]\s*$/gm, '')
  // export function foo / export function* foo
  .replace(/^export\s+function\s+([A-Za-z_$][\w$]*)/gm, (m, name) => {
    exportedNames.push(name)
    return 'function ' + name
  })
  // export const foo = / export let foo = / export var foo =
  .replace(/^export\s+(const|let|var)\s+([A-Za-z_$][\w$]*)/gm, (m, kw, name) => {
    exportedNames.push(name)
    return kw + ' ' + name
  })
  // 独立的 export { a, b as c }：内部名字可能是 function/const，无需收集，
  // 但若内部并无独立声明（如 `export { getPetAttrs_enhanced as getPetAttrs }`），
  // 则需在末尾导出时按「别名: 内部名」的形式补上。
  .replace(/^export\s*\{([^}]*)\}\s*;?/gm, (m, inner) => {
    inner.split(',').forEach((part) => {
      const bits = part.trim().split(/\s+as\s+/)
      const local = (bits[0] || '').trim()
      const alias = (bits[1] || '').trim()
      if (!local) return
      if (alias) aliasedExports[alias] = local
      else exportedNames.push(local)
    })
    return ''
  })

const uniqueNames = [...new Set(exportedNames)].filter(Boolean)
const aliasPairs = Object.keys(aliasedExports)
  .map(a => a + ': ' + aliasedExports[a])

body += '\n\nreturn { ' + uniqueNames.concat(aliasPairs).join(', ') + ' }\n'

const wrapper = `'use strict'
module.exports = function create(__deps) {
const { getStorageSync, setStorageSync, showToast, showModal, navigateTo, reLaunch, switchTab, vibrateShort } = __deps.uni
const photos = __deps.photos
const reactive = __deps.reactive
const computed = __deps.computed

${body}
}
`

const factoryPath = path.join(tmpDir, 'store_factory.cjs')
fs.writeFileSync(factoryPath, wrapper, 'utf8')

// eslint-disable-next-line import/no-dynamic-require
const factory = require(factoryPath)
const store = factory({
  uni: global.uni,
  photos: require(photosStub),
  reactive,
  computed,
})

// 拍照必填：Node 侧 photos 桩原样返回路径
const PHOTO = '/unit-test/photo.jpg'

console.log('已抽取导出符号 %d 个', uniqueNames.length)

// ---------- 3. 断言工具 ----------
let passed = 0
let failed = 0

function check(name, cond, extra) {
  if (cond) {
    passed++
    console.log('  \u2713 ' + name)
  } else {
    failed++
    console.log('  \u2717 ' + name + (extra !== undefined ? '  \u2192 ' + JSON.stringify(extra) : ''))
  }
}
function section(title) {
  console.log('\n' + title)
}

/* ============ 1. 初始数据 ============ */
section('1. 初始数据')
check('5 位家庭成员', store.members.length === 5, store.members.length)
check('爸爸存在', !!store.members.find(m => m.id === 'dad'))
check('奶奶存在', !!store.members.find(m => m.id === 'grandma'))

/* ============ 2. 家长签到 ============ */
section('2. 家长签到（积分 + 成长）')
const dadBefore = JSON.parse(JSON.stringify(store.members.find(m => m.id === 'dad')))
const r1 = store.doCheckin('dad', 'd3', PHOTO)
check('签到返回结果', !!r1)
check('任务被标记完成', store.members.find(m => m.id === 'dad').tasks.find(t => t.id === 'd3').done === true)
check('积分 +15', store.members.find(m => m.id === 'dad').points === dadBefore.points + 15,
  store.members.find(m => m.id === 'dad').points)
check('成长 +10', store.members.find(m => m.id === 'dad').grow === dadBefore.grow + 10,
  store.members.find(m => m.id === 'dad').grow)
check('总签到 +1', store.members.find(m => m.id === 'dad').totalCheckins === dadBefore.totalCheckins + 1)
check('连签 +1', store.members.find(m => m.id === 'dad').streak === dadBefore.streak + 1)
check('重复签到返回 null', store.doCheckin('dad', 'd3', PHOTO) === null)
check('不存在的任务返回 null', store.doCheckin('dad', 'not-exist', PHOTO) === null)
check('不存在的成员返回 null', store.doCheckin('nobody', 'd1', PHOTO) === null)

/* ============ 3. 幼儿 ============ */
section('3. 幼儿签到（星星 / 2 倍成长 / 进化）')
const babyBefore = JSON.parse(JSON.stringify(store.members.find(m => m.id === 'erbao')))
check('幼儿初始阶段为小鸡', store.stageFor(babyBefore).stage === '小鸡', store.stageFor(babyBefore).stage)
const rBaby1 = store.doCheckin('erbao', 'e1', PHOTO)
check('星星 +5', store.members.find(m => m.id === 'erbao').stars === babyBefore.stars + 5,
  store.members.find(m => m.id === 'erbao').stars)
check('成长 +20（2 倍速）', store.members.find(m => m.id === 'erbao').grow === babyBefore.grow + 20,
  store.members.find(m => m.id === 'erbao').grow)
check('第一次未进化', rBaby1.evolved === false, rBaby1.evolved)
const rBaby2 = store.doCheckin('erbao', 'e2', PHOTO)
check('第二次触发进化（小鸡 → 大公鸡）', rBaby2.evolved === true, rBaby2.newStage)
check('进化后阶段为大公鸡', rBaby2.newStage.stage === '大公鸡', rBaby2.newStage.stage)
check('幼儿用星星口径', store.scoreLabel(store.members.find(m => m.id === 'erbao')) === '星星')

/* ============ 4. 奶奶 ============ */
section('4. 奶奶签到（恩典值 / 经文）')
const gBefore = JSON.parse(JSON.stringify(store.members.find(m => m.id === 'grandma')))
const rG = store.doCheckin('grandma', 'g4', PHOTO)
check('恩典值 +10', store.members.find(m => m.id === 'grandma').grace === gBefore.grace + 10,
  store.members.find(m => m.id === 'grandma').grace)
check('推送经文', !!rG.verse && !!rG.verse.text, rG.verse)
check('经文带出处', !!rG.verse.ref, rG.verse)
check('奶奶口径为恩典值', store.scoreLabel(store.members.find(m => m.id === 'grandma')) === '恩典值')
check('奶奶签到不加积分', store.members.find(m => m.id === 'grandma').points === 0)
check('奶奶使用慢成长体系', store.stageFor(store.members.find(m => m.id === 'grandma')).stage.indexOf('龟') > -1,
  store.stageFor(store.members.find(m => m.id === 'grandma')).stage)

/* ============ 5. 龙鳞 ============ */
section('5. 学龄孩子签到（龙鳞）')
const dabao = store.members.find(m => m.id === 'dabao')
const startScales = dabao.dragonScales
const checkinsBefore = dabao.totalCheckins
const need = 5 - (checkinsBefore % 5)
const undone = dabao.tasks.filter(t => !t.done)
let used = 0
for (let i = 0; i < need && used < undone.length; i++) {
  const res = store.doCheckin('dabao', undone[used].id, PHOTO)
  used++
  if (i === need - 1) {
    check('每 5 次签到获得 1 片龙鳞', store.members.find(m => m.id === 'dabao').dragonScales === startScales + 1,
      { before: startScales, after: store.members.find(m => m.id === 'dabao').dragonScales })
    check('签到结果标记获得龙鳞', res && res.scaleGained === true)
  }
}

/* ============ 6. 领养 ============ */
section('6. 宠物领养')
const mom = store.members.find(m => m.id === 'mom')
check('妈妈积分足够', store.scoreValue(mom) === 3250, store.scoreValue(mom))
const adoptable = store.getAdoptablePets('mom')
check('可领养列表非空', adoptable.length > 0, adoptable.length)
check('可领养列表不含默认宠物', adoptable.every(p => !p.defaultFor))
check('可领养列表不含已拥有', adoptable.every(p => !mom.adoptedPets.includes(p.id)))
check('包含积分达标的传说宠物', !!adoptable.find(p => p.requiredPoints === 3000))

const catalog = store.getAllCatalogPets('mom')
check('全图鉴含锁定项', catalog.some(p => p.unlocked === false))
check('全图鉴含解锁项', catalog.some(p => p.unlocked === true))

const adoptRes = store.adoptPet('mom', 'lion_fire')
check('领养成功', adoptRes.success === true, adoptRes.msg)
check('领养后计入 adoptedPets', store.members.find(m => m.id === 'mom').adoptedPets.indexOf('lion_fire') > -1)
check('重复领养被拒绝', store.adoptPet('mom', 'lion_fire').success === false)
check('余额不足的宠物被拒绝', store.adoptPet('mom', 'fox_nine').success === false)
check('默认宠物不可领养', store.adoptPet('mom', 'dad_default').success === false)
check('不存在的宠物被拒绝', store.adoptPet('mom', 'no_such_pet').success === false)
check('幼儿领不到神话宠物', store.adoptPet('erbao', 'dragon_golden').success === false)

/* ============ 7. 出战 / 改名 / 放归 ============ */
section('7. 出战 / 改名 / 放归')
check('切换出战成功', store.switchActivePet('mom', 'lion_fire') === true)
check('出战宠物已更新', store.members.find(m => m.id === 'mom').activePetId === 'lion_fire')
check('成员卡宠物名同步为图鉴名', store.members.find(m => m.id === 'mom').pet.name === '火焰狮',
  store.members.find(m => m.id === 'mom').pet.name)
const pets = store.getMemberPets('mom')
check('已拥有 2 只宠物', pets.length === 2, pets.length)
check('出战标记正确', pets.find(p => p.id === 'lion_fire').active === true)

const renameRes = store.renamePet('mom', 'lion_fire', '小烈焰')
check('改名成功', renameRes.success === true && renameRes.name === '小烈焰', renameRes)
check('成员卡宠物名同步为自定义名', store.members.find(m => m.id === 'mom').pet.name === '小烈焰',
  store.members.find(m => m.id === 'mom').pet.name)
check('改名带稀有度标签', store.getMemberPets('mom').find(p => p.id === 'lion_fire').rarityLabel === '史诗')
check('空名恢复图鉴默认名', store.renamePet('mom', 'lion_fire', '   ').name === '火焰狮')

check('放归失败（仅剩 1 只时）', store.releasePet('dad', 'dad_default').success === false)
const releaseRes = store.releasePet('mom', 'mom_default')
check('放归非出战宠物成功', releaseRes.success === true, releaseRes.msg)
check('放归后自动切到剩余宠物', store.members.find(m => m.id === 'mom').activePetId === 'lion_fire',
  store.members.find(m => m.id === 'mom').activePetId)
check('放归后宠物数正确', store.getMemberPets('mom').length === 1)

/* ============ 8. 比武 ============ */
section('8. 宠物比武')
const dadM = store.members.find(m => m.id === 'dad')
const momM = store.members.find(m => m.id === 'mom')
const battle = store.doBattle(dadM, momM)
check('比武产生结果', !!battle)
check('胜者是其中一方', battle.winner.id === 'dad' || battle.winner.id === 'mom', battle.winner.id)
check('败者是另一方', battle.loser.id !== battle.winner.id)
check('幼儿参战返回 null（平局）', store.doBattle(store.members.find(m => m.id === 'erbao'), momM) === null)

const winnerBefore = store.scoreValue(battle.winner)
store.rewardBattleWinner(battle.winner.id, 30)
check('胜者积分 +30', store.scoreValue(store.members.find(m => m.id === battle.winner.id)) === winnerBefore + 30,
  { before: winnerBefore, after: store.scoreValue(store.members.find(m => m.id === battle.winner.id)) })

const attrs = store.getPetAttrs(dadM)
check('四维属性齐全', ['strength', 'wisdom', 'vitality', 'charm'].every(k => typeof attrs[k] === 'number'))
check('属性不超过 100', Object.keys(attrs).every(k => attrs[k] <= 100))
check('总战力 = 四维之和', store.getPetTotalPower(dadM) ===
  attrs.strength + attrs.wisdom + attrs.vitality + attrs.charm)
check('null 成员不崩溃', store.getPetAttrs(null).strength === 0)

/* ============ 9. 成员增删改 ============ */
section('9. 成员增删改')
const countBefore = store.members.length
const added = store.addMember({ name: '  测试成员  ', age: 30, petName: '小七' })
check('新增成员成功', store.members.length === countBefore + 1)
check('姓名去空格', added.name === '测试成员', added.name)
check('角色按年龄推导', added.role === '家长', added.role)
check('成长上限按年龄', added.totalGrow === 1000, added.totalGrow)
check('默认任务 3 条', added.tasks.length === 3)
check('默认宠物已命名', added.pet.name === '小七')

const addedBaby = store.addMember({ name: '小测试', age: 2 })
check('幼儿成长上限 100', addedBaby.totalGrow === 100, addedBaby.totalGrow)
check('幼儿角色', addedBaby.role === '幼儿', addedBaby.role)
const addedElder = store.addMember({ name: '老太', age: 70 })
check('长辈成长上限 1600', addedElder.totalGrow === 1600, addedElder.totalGrow)

store.updateMember(addedBaby.id, { age: 40 })
const converted = store.members.find(m => m.id === addedBaby.id)
check('年龄变更后角色重算', converted.role === '家长', converted.role)
check('年龄变更后成长上限切换', converted.totalGrow === 1000, converted.totalGrow)
check('年龄变更成长值等比换算', converted.grow === 0, converted.grow)

store.updateMember(added.id, { name: '改过的名字', petName: '改名宠物' })
check('更新姓名生效', store.members.find(m => m.id === added.id).name === '改过的名字')
check('更新宠物名生效', store.members.find(m => m.id === added.id).pet.name === '改名宠物')
check('更新不存在的成员返回 null', store.updateMember('ghost', { name: 'x' }) === null)

let guard = 0
while (store.members.length > 1 && guard < 30) {
  store.removeMember(store.members[store.members.length - 1].id)
  guard++
}
check('可删除到只剩 1 位', store.members.length === 1, store.members.length)
check('最后 1 位不可删除', store.removeMember(store.members[0].id).success === false)
check('删除不存在的成员失败', store.removeMember('ghost').success === false)

/* ============ 10. 统计与持久化 ============ */
section('10. 统计与持久化')
const stats = store.getFamilyStats()
check('统计包含 totalCheckins', typeof stats.totalCheckins === 'number')
check('统计包含 todayTotal', stats.todayTotal > 0, stats.todayTotal)
check('todayDone 不超过 todayTotal', stats.todayDone <= stats.todayTotal)
check('写入过本地存储', !!memory['family_members_v1'])
const verse1 = store.getTodayVerse()
const verse2 = store.getTodayVerse()
check('首次访问写入经文缓存', !!memory['family_verse_v1'])
check('经文缓存带日期与内容',
  !!memory['family_verse_v1'].date && !!memory['family_verse_v1'].verse.text)
check('经文同日保持一致', verse1.text === verse2.text,
  { v1: verse1.text, v2: verse2.text })

store.resetAll()
check('恢复初始数据后为 5 位成员', store.members.length === 5, store.members.length)
check('恢复后爸爸积分回到 2340', store.members.find(m => m.id === 'dad').points === 2340,
  store.members.find(m => m.id === 'dad').points)
check('恢复后妈妈只剩默认宠物', store.members.find(m => m.id === 'mom').adoptedPets.length === 1)
check('跨页意图传递', (function () {
  store.setPendingPetMember('grandma')
  return store.consumePendingPetMember() === 'grandma' && store.consumePendingPetMember() === ''
})())

/* ============ 11. 单人视角：当前身份与家庭信息 ============ */
section('11. 单人视角（当前身份 / 家庭信息 / 引导）')
store.clearOnboarding()
check('初始未完成引导', store.isOnboarded() === false)
check('设置当前成员成功', store.setCurrentMember('dad') === true)
check('当前成员可读取', !!store.getCurrentMember() && store.getCurrentMember().id === 'dad')
check('完成引导后 isOnboarded 为真', store.isOnboarded() === true)
check('无效成员设置失败', store.setCurrentMember('ghost') === false)
check('家庭信息默认名', store.getFamilyInfo().name === '我们家', store.getFamilyInfo().name)
store.setFamilyInfo({ name: '  测试之家  ' })
check('家庭名去空格生效', store.getFamilyInfo().name === '测试之家', store.getFamilyInfo().name)
check('家庭名超长被截断到 12 字以内', (function () {
  store.setFamilyInfo({ name: '一二三四五六七八九十十一十二十三' })
  return store.getFamilyInfo().name.length <= 12
})(), store.getFamilyInfo().name)
store.setFamilyInfo({ name: '测试之家' })
check('家庭信息落缓存', memory['family_info_v1'] && memory['family_info_v1'].name === '测试之家')
check('当前成员落缓存', memory['family_current_member_v1'] === 'dad', memory['family_current_member_v1'])

store.addMember({ name: '临时', age: 30 })
const tmpId = store.members[store.members.length - 1].id
check('切换到临时成员成功', store.setCurrentMember(tmpId) === true)
store.removeMember(tmpId)
check('删除当前成员后回到未引导', store.isOnboarded() === false)

store.setCurrentMember('mom')
store.resetAll()
check('重置后当前成员仍在则保留',
  store.isOnboarded() === true && store.getCurrentMemberId() === 'mom',
  store.getCurrentMemberId())
store.clearOnboarding()
check('清除引导后为假', store.isOnboarded() === false)

/* ============ 12. 图鉴合并进领养中心 ============ */
section('12. 图鉴合并进领养中心（getCatalogWithOwnership）')
store.setCurrentMember('dad')
const catalogAll = store.getCatalogWithOwnership('dad')
check('返回全量图鉴', catalogAll.length === store.PET_CATALOG.length, catalogAll.length)

const dadPet = catalogAll.find(p => p.id === 'dad_default')
check('自己的默认宠 = 已拥有 + 出战中', !!dadPet && dadPet.owned === true && dadPet.active === true, dadPet)

const momPet = catalogAll.find(p => p.id === 'mom_default')
check('他人默认宠：不可领养、不锁分、标记为专属',
  !!momPet && momPet.owned === false && momPet.canAdopt === false && momPet.locked === false && momPet.isDefault === true,
  momPet)

check('canAdopt 与 locked 互斥', catalogAll.every(p => !(p.canAdopt && p.locked)))
check('已拥有的不再是可领养/锁定', catalogAll.every(p => !p.owned || (!p.canAdopt && !p.locked)))
check('总战力 = 基础战力 + 稀有加成',
  catalogAll.every(p => p.totalPower === p.basePower + (store.RARITY_INFO[p.rarity].powerBonus || 0)))

const tabby = catalogAll.find(p => p.id === 'cat_tabby')
check('免费宠物默认可领养', !!tabby && tabby.canAdopt === true, tabby)

store.adoptPet('dad', 'cat_tabby')
const tabbyAfter = store.getCatalogWithOwnership('dad').find(p => p.id === 'cat_tabby')
check('领养后变为已拥有', !!tabbyAfter && tabbyAfter.owned === true && tabbyAfter.canAdopt === false && tabbyAfter.locked === false, tabbyAfter)

store.renamePet('dad', 'cat_tabby', '小虎')
const tabbyRenamed = store.getCatalogWithOwnership('dad').find(p => p.id === 'cat_tabby')
check('displayName 跟随改名', !!tabbyRenamed && tabbyRenamed.displayName === '小虎', tabbyRenamed && tabbyRenamed.displayName)
check('成员不存在返回空数组', store.getCatalogWithOwnership('nobody').length === 0)

/* ============ 13. 签到拍照 ============ */
section('13. 签到拍照（必填 / 重拍 / 删除 / 回看）')
store.resetAll()
store.setCurrentMember('dad')
const pendingTask = store.members.find(m => m.id === 'dad').tasks.find(t => !t.done)
check('存在未签到任务用于验证', !!pendingTask, pendingTask && pendingTask.id)

const blocked = store.doCheckin('dad', pendingTask.id)
check('无照片签到被拦截', !!blocked && blocked.blocked === true, blocked)
check('被拦截时任务仍未完成',
  store.members.find(m => m.id === 'dad').tasks.find(t => t.id === pendingTask.id).done === false)
check('被拦截时给出提示语', !!blocked && typeof blocked.msg === 'string' && blocked.msg.length > 0, blocked && blocked.msg)

const shotPath = PHOTO + '?v=1'
const okShot = store.doCheckin('dad', pendingTask.id, shotPath)
check('带照片签到成功', !!okShot && okShot.blocked !== true && okShot.evolved !== undefined)
const taskAfterShot = store.members.find(m => m.id === 'dad').tasks.find(t => t.id === pendingTask.id)
check('照片路径已写入任务', taskAfterShot.photo === shotPath, taskAfterShot.photo)
check('记录拍照时间戳', taskAfterShot.photoAt > 0, taskAfterShot.photoAt)

const retake = store.updateTaskPhoto('dad', pendingTask.id, PHOTO + '?v=2')
check('重拍成功', retake.success === true && retake.photo === PHOTO + '?v=2', retake.photo)
check('重拍后任务仍为已完成',
  store.members.find(m => m.id === 'dad').tasks.find(t => t.id === pendingTask.id).done === true)

const myPhotos = store.getMemberPhotos('dad')
check('回看列表包含刚拍的任务',
  myPhotos.some(p => p.taskId === pendingTask.id && p.photo === PHOTO + '?v=2'),
  myPhotos.length)
check('回看列表不含未拍照的任务', myPhotos.every(p => !!p.photo))

const cleared = store.clearTaskPhoto('dad', pendingTask.id)
check('删除照片成功', cleared.success === true)
check('删除后 photo 置空',
  store.members.find(m => m.id === 'dad').tasks.find(t => t.id === pendingTask.id).photo === null)
check('删除后任务仍是已完成（不回滚签到）',
  store.members.find(m => m.id === 'dad').tasks.find(t => t.id === pendingTask.id).done === true)

const famPhotos = store.getFamilyPhotos()
check('全家照片按成员聚合', Array.isArray(famPhotos))
check('全家照片只含有照片的成员', famPhotos.every(m => m.photos.length > 0 && m.count === m.photos.length))

/* ============ 14. 出战宠物命名口径 ============ */
section('14. 出战宠物命名口径（getActivePet 与 getMemberPets 一致）')
store.resetAll()
store.adoptPet('dad', 'cat_tabby')
store.switchActivePet('dad', 'cat_tabby')
store.renamePet('dad', 'cat_tabby', '小虎')
const ap = store.getActivePet('dad')
check('出战宠物带自定义名', !!ap && ap.name === '小虎', ap && ap.name)
check('出战宠物带稀有度标签', !!ap && !!ap.rarityLabel, ap && ap.rarityLabel)
check('出战宠物与 getMemberPets 同名',
  ap.name === store.getMemberPets('dad').find(p => p.id === 'cat_tabby').name)
check('不存在的成员返回 null', store.getActivePet('nobody') === null)

/* ============ 汇总 ============ */
console.log('\n========================================')
console.log('通过 %d 项，失败 %d 项', passed, failed)
console.log('========================================')

// 清理临时目录
try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch (e) { /* 忽略 */ }

process.exit(failed === 0 ? 0 : 1)
