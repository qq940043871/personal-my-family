/**
 * store.js 业务自测（Node 环境，用内存对象模拟 wx.storage）
 * 覆盖：签到积分口径 / 成长与进化 / 龙鳞 / 经文 / 领养 / 换宠 / 改名 / 放归 / 比武 / 成员增删改
 */

// ---- 模拟小程序 API ----
const memory = {}
global.wx = {
  getStorageSync(key) {
    return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : ''
  },
  setStorageSync(key, value) {
    memory[key] = JSON.parse(JSON.stringify(value))
  }
}

const store = require('../family-check-in-mini/utils/store.js')

// 拍照必填：Node 侧没有文件系统，photos.js 会原样返回该路径
const PHOTO = '/unit-test/photo.jpg'

let passed = 0
let failed = 0

function check(name, cond, extra) {
  if (cond) {
    passed++
    console.log('  ✓ ' + name)
  } else {
    failed++
    console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : ''))
  }
}

function section(title) {
  console.log('\n' + title)
}

/* ============ 1. 初始数据 ============ */
section('1. 初始数据')
check('5 位家庭成员', store.getMembers().length === 5, store.getMembers().length)
check('爸爸存在', !!store.findMember('dad'))
check('奶奶存在', !!store.findMember('grandma'))

/* ============ 2. 成员初始任务全部为未完成状态用于测试 ============ */
section('2. 家长签到（积分 + 成长）')
const dadBefore = JSON.parse(JSON.stringify(store.findMember('dad')))
const r1 = store.doCheckin('dad', 'd3', PHOTO)
check('签到返回结果', !!r1)
check('任务被标记完成', store.findMember('dad').tasks.find(t => t.id === 'd3').done === true)
check('积分 +15', store.findMember('dad').points === dadBefore.points + 15,
  store.findMember('dad').points)
check('成长 +10', store.findMember('dad').grow === dadBefore.grow + 10, store.findMember('dad').grow)
check('总签到 +1', store.findMember('dad').totalCheckins === dadBefore.totalCheckins + 1)
check('连签 +1', store.findMember('dad').streak === dadBefore.streak + 1)
check('重复签到返回 null', store.doCheckin('dad', 'd3') === null)
check('不存在的任务返回 null', store.doCheckin('dad', 'not-exist') === null)
check('不存在的成员返回 null', store.doCheckin('nobody', 'd1') === null)

/* ============ 3. 幼儿：星星 + 2 倍速 + 进化 ============ */
section('3. 幼儿签到（星星 / 2 倍成长 / 进化）')
const babyBefore = JSON.parse(JSON.stringify(store.findMember('erbao')))
check('幼儿初始阶段为小鸡', store.stageFor(babyBefore).stage === '小鸡', store.stageFor(babyBefore).stage)
const rBaby1 = store.doCheckin('erbao', 'e1', PHOTO)
check('星星 +5', store.findMember('erbao').stars === babyBefore.stars + 5, store.findMember('erbao').stars)
check('成长 +20（2 倍速）', store.findMember('erbao').grow === babyBefore.grow + 20, store.findMember('erbao').grow)
check('第一次未进化', rBaby1.evolved === false, rBaby1.evolved)
const rBaby2 = store.doCheckin('erbao', 'e2', PHOTO)
check('第二次触发进化（小鸡 → 大公鸡）', rBaby2.evolved === true, rBaby2.newStage)
check('进化后阶段为大公鸡', rBaby2.newStage.stage === '大公鸡', rBaby2.newStage.stage)
check('幼儿不用积分口径而用星星', store.scoreLabel(store.findMember('erbao')) === '星星')

/* ============ 4. 奶奶：恩典值 + 经文 ============ */
section('4. 奶奶签到（恩典值 / 经文）')
const gBefore = JSON.parse(JSON.stringify(store.findMember('grandma')))
const rG = store.doCheckin('grandma', 'g4', PHOTO)
check('恩典值 +10', store.findMember('grandma').grace === gBefore.grace + 10, store.findMember('grandma').grace)
check('推送经文', !!rG.verse && !!rG.verse.text, rG.verse)
check('经文带出处', !!rG.verse.ref, rG.verse)
check('奶奶积分口径为恩典值', store.scoreLabel(store.findMember('grandma')) === '恩典值')
check('奶奶签到不加积分', store.findMember('grandma').points === 0)
check('奶奶 stage 使用慢成长体系', store.stageFor(store.findMember('grandma')).stage.indexOf('龟') > -1,
  store.stageFor(store.findMember('grandma')).stage)

/* ============ 5. 9 岁孩子：龙鳞每 5 次一片 ============ */
section('5. 学龄孩子签到（龙鳞）')
const dabao = store.findMember('dabao')
const startScales = dabao.dragonScales
const checkinsBefore = dabao.totalCheckins
// 补到下一次 5 的倍数
let need = 5 - (checkinsBefore % 5)
const undone = dabao.tasks.filter(t => !t.done)
let used = 0
for (let i = 0; i < need && used < undone.length; i++) {
  const res = store.doCheckin('dabao', undone[used].id, PHOTO)
  used++
  if (i === need - 1) {
    check('每 5 次签到获得 1 片龙鳞', store.findMember('dabao').dragonScales === startScales + 1,
      { before: startScales, after: store.findMember('dabao').dragonScales })
    check('签到结果标记获得龙鳞', res && res.scaleGained === true)
  }
}

/* ============ 6. 领养系统 ============ */
section('6. 宠物领养')
const mom = store.findMember('mom')
check('妈妈积分足够', store.scoreValue(mom) === 3250, store.scoreValue(mom))
const adoptable = store.getAdoptablePets('mom')
check('可领养列表非空', adoptable.length > 0, adoptable.length)
check('可领养列表不含默认宠物', adoptable.every(p => !p.defaultFor))
check('可领养列表不含已拥有', adoptable.every(p => !mom.adoptedPets.includes(p.id)))
const highEnd = adoptable.find(p => p.requiredPoints === 3000)
check('包含积分达标的传说宠物（3250 分可领 3000 分档）', !!highEnd, highEnd && highEnd.name)

const catalog = store.getAllCatalogPets('mom')
check('全图鉴含锁定项', catalog.some(p => p.unlocked === false))
check('全图鉴含解锁项', catalog.some(p => p.unlocked === true))

const adoptRes = store.adoptPet('mom', 'lion_fire')
check('领养成功', adoptRes.success === true, adoptRes.msg)
check('领养后计入 adoptedPets', store.findMember('mom').adoptedPets.indexOf('lion_fire') > -1)
check('重复领养被拒绝', store.adoptPet('mom', 'lion_fire').success === false)
check('余额不足的宠物被拒绝', store.adoptPet('mom', 'fox_nine').success === false)
check('默认宠物不可领养', store.adoptPet('mom', 'dad_default').success === false)
check('不存在的宠物被拒绝', store.adoptPet('mom', 'no_such_pet').success === false)

// 幼儿走成长进度解锁（不比积分）：结果必须与当前成长门槛一致
// 注意：本节跑在幼儿签到之后，小宝成长值可能已达 85%，所以不能用写死的"必须失败"
const babyNow = store.findMember('erbao')
const mythicForBaby = store.getAllCatalogPets('erbao').find(p => p.rarity === 'mythic')
const babyEligible = store.petUnlockedFor(babyNow, mythicForBaby)
const babyAdopt = store.adoptPet('erbao', mythicForBaby.id)
check('幼儿领养结果与成长门槛一致（不比积分）', babyAdopt.success === babyEligible,
  babyAdopt.msg + ' / 成长=' + Math.round((babyNow.grow / babyNow.totalGrow) * 100) + '%')
check('幼儿被拒时给出成长条件提示',
  babyEligible || (!!babyAdopt.msg && babyAdopt.msg.indexOf('成长') > -1), babyAdopt.msg)

/* ============ 7. 出战 / 改名 / 放归 ============ */
section('7. 出战 / 改名 / 放归')
check('切换出战成功', store.switchActivePet('mom', 'lion_fire') === true)
check('出战宠物已更新', store.findMember('mom').activePetId === 'lion_fire')
check('成员卡宠物名同步为图鉴名', store.findMember('mom').pet.name === '火焰狮',
  store.findMember('mom').pet.name)
const pets = store.getMemberPets('mom')
check('已拥有 2 只宠物', pets.length === 2, pets.length)
check('出战标记正确', pets.find(p => p.id === 'lion_fire').active === true)

const renameRes = store.renamePet('mom', 'lion_fire', '小烈焰')
check('改名成功', renameRes.success === true && renameRes.name === '小烈焰', renameRes)
check('成员卡宠物名同步为自定义名', store.findMember('mom').pet.name === '小烈焰',
  store.findMember('mom').pet.name)
check('改名带稀有度标签', store.getMemberPets('mom').find(p => p.id === 'lion_fire').rarityLabel === '史诗')
const restoreRes = store.renamePet('mom', 'lion_fire', '   ')
check('空名恢复图鉴默认名', restoreRes.name === '火焰狮', restoreRes)

check('放归失败（仅剩 1 只时）', store.releasePet('dad', 'dad_default').success === false)
const releaseRes = store.releasePet('mom', 'mom_default')
check('放归非出战宠物成功', releaseRes.success === true, releaseRes.msg)
check('放归后自动切到剩余宠物', store.findMember('mom').activePetId === 'lion_fire',
  store.findMember('mom').activePetId)
check('放归后宠物数正确', store.getMemberPets('mom').length === 1)

/* ============ 8. 比武 ============ */
section('8. 宠物比武')
const dadM = store.findMember('dad')
const momM = store.findMember('mom')
const battle = store.doBattle(dadM, momM)
check('比武产生结果', !!battle)
check('胜者是其中一方', battle.winner.id === 'dad' || battle.winner.id === 'mom', battle.winner.id)
check('败者是另一方', battle.loser.id !== battle.winner.id)
const babyVsMom = store.doBattle(store.findMember('erbao'), momM)
check('幼儿可以参战（不再判平局）', !!babyVsMom)
check('幼儿参战带萌宠加成', babyVsMom && babyVsMom.bonus1 === 40, babyVsMom && babyVsMom.bonus1)
check('成人参战无加成', babyVsMom && babyVsMom.bonus2 === 0, babyVsMom && babyVsMom.bonus2)
check('幼儿战力含加成',
  store.getPetTotalPower(store.findMember('erbao')) >
  store.getPetAttrs(store.findMember('erbao')).strength +
  store.getPetAttrs(store.findMember('erbao')).wisdom +
  store.getPetAttrs(store.findMember('erbao')).vitality +
  store.getPetAttrs(store.findMember('erbao')).charm)
check('同一个成员不能和自己比武',
  store.doBattle(store.findMember('dad'), store.findMember('dad')) === null)

const winnerBefore = store.scoreValue(battle.winner)
store.rewardBattleWinner(battle.winner.id, 30)
check('胜者积分 +30', store.scoreValue(store.findMember(battle.winner.id)) === winnerBefore + 30,
  { before: winnerBefore, after: store.scoreValue(store.findMember(battle.winner.id)) })

const attrs = store.getPetAttrs(dadM)
check('四维属性齐全', ['strength', 'wisdom', 'vitality', 'charm'].every(k => typeof attrs[k] === 'number'))
check('属性不超过 100', Object.keys(attrs).every(k => attrs[k] <= 100))
check('总战力 = 四维之和', store.getPetTotalPower(dadM) ===
  attrs.strength + attrs.wisdom + attrs.vitality + attrs.charm)
check('null 成员不崩溃', store.getPetAttrs(null).strength === 0)

/* ============ 9. 成员增删改 ============ */
section('9. 成员增删改')
const countBefore = store.getMembers().length
const added = store.addMember({ name: '  测试成员  ', age: 30, petName: '小七' })
check('新增成员成功', store.getMembers().length === countBefore + 1)
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

// 年龄变更应等比换算成长值并切换体系
store.updateMember(addedBaby.id, { age: 40 })
const converted = store.findMember(addedBaby.id)
check('年龄变更后角色重算', converted.role === '家长', converted.role)
check('年龄变更后成长上限切换', converted.totalGrow === 1000, converted.totalGrow)
check('年龄变更成长值等比换算', converted.grow === 0, converted.grow)

store.updateMember(added.id, { name: '改过的名字', petName: '改名宠物' })
check('更新姓名生效', store.findMember(added.id).name === '改过的名字')
check('更新宠物名生效', store.findMember(added.id).pet.name === '改名宠物')
check('更新不存在的成员返回 null', store.updateMember('ghost', { name: 'x' }) === null)

// 删除到只剩 1 位
let guard = 0
while (store.getMembers().length > 1 && guard < 30) {
  store.removeMember(store.getMembers()[store.getMembers().length - 1].id)
  guard++
}
check('可删除到只剩 1 位', store.getMembers().length === 1, store.getMembers().length)
check('最后 1 位不可删除', store.removeMember(store.getMembers()[0].id).success === false)
check('删除不存在的成员失败', store.removeMember('ghost').success === false)

/* ============ 10. 统计与持久化 ============ */
section('10. 统计与持久化')
const stats = store.getFamilyStats()
check('统计包含 totalCheckins', typeof stats.totalCheckins === 'number')
check('统计包含 todayTotal', stats.todayTotal > 0, stats.todayTotal)
check('todayDone 不超过 todayTotal', stats.todayDone <= stats.todayTotal)
check('写入过本地存储', !!memory['family_members_v1'])
// 先调用一次，验证首次访问会落缓存
const verse1 = store.getTodayVerse()
const verse2 = store.getTodayVerse()
check('首次访问写入经文缓存', !!memory['family_verse_v1'])
check('经文缓存带日期与内容',
  !!memory['family_verse_v1'].date && !!memory['family_verse_v1'].verse.text)
check('经文同日保持一致', verse1.text === verse2.text)

store.resetAll()
check('恢复初始数据后为 5 位成员', store.getMembers().length === 5, store.getMembers().length)
check('恢复后爸爸积分回到 2340', store.findMember('dad').points === 2340,
  store.findMember('dad').points)
check('恢复后妈妈只剩默认宠物', store.findMember('mom').adoptedPets.length === 1)
check('跨页意图传递', (function () {
  store.setPendingPetMember('grandma')
  return store.consumePendingPetMember() === 'grandma' && store.consumePendingPetMember() === ''
})())

/* ============ 11. 当前视角成员与家庭信息 ============ */
section('11. 当前视角成员与家庭信息')
check('初始未完成引导', store.isOnboarded() === false)
check('设置当前成员成功', store.setCurrentMember('dad') === true)
check('当前成员可读取', !!store.getCurrentMember() && store.getCurrentMember().id === 'dad')
check('完成引导后 isOnboarded 为真', store.isOnboarded() === true)
check('无效成员设置失败', store.setCurrentMember('ghost') === false)
check('家庭信息默认名', store.getFamilyInfo().name === '我们家', store.getFamilyInfo().name)
store.setFamilyInfo({ name: '  测试之家  ' })
check('家庭名去空格生效', store.getFamilyInfo().name === '测试之家', store.getFamilyInfo().name)
check('家庭信息落缓存', !!memory['family_info_v1'] && memory['family_info_v1'].name === '测试之家')
check('当前成员落缓存', memory['family_current_member_v1'] === 'dad', memory['family_current_member_v1'])

// 新增临时成员并切到它，删除后应回到未引导状态
store.addMember({ name: '临时', age: 30 })
const tmpId = store.getMembers()[store.getMembers().length - 1].id
check('切换到临时成员成功', store.setCurrentMember(tmpId) === true)
store.removeMember(tmpId)
check('删除当前成员后回到未引导', store.isOnboarded() === false)

// resetAll：当前成员若仍存在于演示数据中则保留
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

/* ============ 13. 签到拍照：必填 + 持久化 + 回看 ============ */
section('13. 签到拍照（必填 / 重拍 / 删除 / 回看）')
const photoMember = store.findMember('dad')
const pendingTask = photoMember.tasks.find(t => !t.done)
check('存在未签到任务用于验证', !!pendingTask, pendingTask && pendingTask.id)

const blocked = store.doCheckin('dad', pendingTask.id)
check('无照片签到被拦截', !!blocked && blocked.blocked === true, blocked)
check('被拦截时任务仍未完成',
  store.findMember('dad').tasks.find(t => t.id === pendingTask.id).done === false)
check('被拦截时给出提示语', !!blocked && typeof blocked.msg === 'string' && blocked.msg.length > 0, blocked && blocked.msg)

const shotPath = PHOTO + '?v=1'
const okShot = store.doCheckin('dad', pendingTask.id, shotPath)
check('带照片签到成功', !!okShot && okShot.blocked !== true && okShot.evolved !== undefined)
const taskAfterShot = store.findMember('dad').tasks.find(t => t.id === pendingTask.id)
check('照片路径已写入任务', taskAfterShot.photo === shotPath, taskAfterShot.photo)
check('记录拍照时间戳', taskAfterShot.photoAt > 0, taskAfterShot.photoAt)

const retake = store.updateTaskPhoto('dad', pendingTask.id, PHOTO + '?v=2')
check('重拍成功', retake.success === true && retake.photo === PHOTO + '?v=2', retake.photo)
check('重拍后任务仍为已完成',
  store.findMember('dad').tasks.find(t => t.id === pendingTask.id).done === true)

const myPhotos = store.getMemberPhotos('dad')
check('回看列表包含刚拍的任务',
  myPhotos.some(p => p.taskId === pendingTask.id && p.photo === PHOTO + '?v=2'),
  myPhotos.length)
check('回看列表不含未拍照的任务', myPhotos.every(p => !!p.photo))

const cleared = store.clearTaskPhoto('dad', pendingTask.id)
check('删除照片成功', cleared.success === true)
check('删除后 photo 置空',
  store.findMember('dad').tasks.find(t => t.id === pendingTask.id).photo === null)
check('删除后任务仍是已完成（不回滚签到）',
  store.findMember('dad').tasks.find(t => t.id === pendingTask.id).done === true)

const famPhotos = store.getFamilyPhotos()
check('全家照片按成员聚合', Array.isArray(famPhotos))
check('全家照片只含有照片的成员', famPhotos.every(m => m.photos.length > 0 && m.count === m.photos.length))

/* ============ 14. 幼儿差异化：战力加成 / 统一榜 / 专属解锁 ============ */
section('14. 幼儿差异化（加成 / 统一榜 / 专属解锁）')
const baby = store.findMember('erbao')
const babyRatio = baby.grow / (baby.totalGrow || 100)
check('小宝属于低龄幼儿', baby.age <= 4, baby.age)

check('幼儿普通宠物零门槛', store.toddlerUnlockRatio('common') === 0)
check('幼儿神话宠物门槛为成长 85%', store.toddlerUnlockRatio('mythic') === 0.85)

const commonPet = store.PET_CATALOG.find(p => p.rarity === 'common' && !p.defaultFor)
const mythicPet = store.PET_CATALOG.find(p => p.rarity === 'mythic')
check('幼儿能解锁普通宠物', store.petUnlockedFor(baby, commonPet) === true)
check('幼儿神话解锁与成长门槛一致',
  store.petUnlockedFor(baby, mythicPet) === (babyRatio >= 0.85),
  { ratio: babyRatio, unlocked: store.petUnlockedFor(baby, mythicPet) })
check('幼儿解锁文案是成长百分比',
  store.petUnlockText(baby, mythicPet).indexOf('成长') > -1,
  store.petUnlockText(baby, mythicPet))
check('成人解锁文案仍是积分',
  store.petUnlockText(store.findMember('dad'), mythicPet).indexOf('积分') > -1,
  store.petUnlockText(store.findMember('dad'), mythicPet))

const famRank = store.getFamilyRanking()
check('全家排行榜含所有成员', famRank.length === store.getMembers().length, famRank.length)
check('小宝在榜上', famRank.some(r => r.memberId === 'erbao'))
check('奶奶也在榜上', famRank.some(r => r.memberId === 'grandma'))
check('排行榜按完成率降序', famRank.every((r, i) => i === 0 || famRank[i - 1].rate >= r.rate))
check('小宝行带萌宠加成 40', famRank.find(r => r.memberId === 'erbao').bonus === 40)
check('成人行无加成', famRank.find(r => r.memberId === 'dad').bonus === 0)
check('getRankingMembers 不再按年龄过滤',
  store.getRankingMembers().length === store.getMembers().length,
  store.getRankingMembers().length)

// 确定性验证"成长不足 → 拒绝 + 成长提示"：把成长值临时归零再恢复
const babyGrowBackup = baby.grow
const mythicLocked = store.PET_CATALOG.find(p => p.id === 'fox_nine')  // 尚未被小宝领养的神话宠
baby.grow = 0
const lockedAdopt = store.adoptPet('erbao', mythicLocked.id)
check('成长归零时幼儿领不到神话宠物', lockedAdopt.success === false, lockedAdopt.msg)
check('被拒文案给出成长百分比门槛',
  !!lockedAdopt.msg && lockedAdopt.msg.indexOf('成长') > -1, lockedAdopt.msg)
check('成长归零时普通宠物仍可领', store.petUnlockedFor(baby, commonPet) === true)
baby.grow = babyGrowBackup
check('恢复成长值后判定还原',
  store.petUnlockedFor(baby, mythicPet) === (babyRatio >= 0.85))

/* ============ 汇总 ============ */
console.log('\n========================================')
console.log('通过 %d 项，失败 %d 项', passed, failed)
console.log('========================================')
process.exit(failed === 0 ? 0 : 1)
