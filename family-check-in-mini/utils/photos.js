/**
 * 签到照片持久化
 *
 * 背景：wx.chooseMedia 返回的是 tempFilePath（临时文件），小程序冷启动后
 * 系统随时会清理，直接存进 storage 的话隔天就是裂图。
 * 这里的做法：拍照后立刻把文件复制进 wx.env.USER_DATA_PATH/photos/，
 * 这个目录是小程序自己的永久沙盒，除非卸载小程序或主动删除，文件一直有效。
 *
 * Node 侧（tools/selftest.js）没有 wx.getFileSystemManager，
 * 全部降级为「原样返回路径」，保证自测不崩。
 */

const DIR_NAME = 'photos'

function fs() {
  if (typeof wx === 'undefined' || !wx.getFileSystemManager) return null
  try {
    return wx.getFileSystemManager()
  } catch (e) {
    return null
  }
}

function root() {
  // USER_DATA_PATH 形如 "wxfile://usr" / "http://usr"，可直接拼子目录
  if (typeof wx !== 'undefined' && wx.env && wx.env.USER_DATA_PATH) {
    return wx.env.USER_DATA_PATH
  }
  return ''
}

function dirPath() {
  const r = root()
  return r ? r + '/' + DIR_NAME : ''
}

function ensureDir() {
  const f = fs()
  const dir = dirPath()
  if (!f || !dir) return false
  try {
    // recursive: true — 目录已存在也不报错
    f.mkdirSync(dir, true)
    return true
  } catch (e) {
    // 已存在时会抛 exist，忽略
    return true
  }
}

/**
 * 生成稳定的目标文件名：同一个人同一个任务始终覆盖同一个文件，
 * 避免反复拍照把沙盒塞满。
 */
function fileNameFor(memberId, taskId) {
  const safe = (s) => String(s || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '')
  return safe(memberId) + '_' + safe(taskId) + '.jpg'
}

function targetPath(memberId, taskId) {
  const dir = dirPath()
  if (!dir) return ''
  return dir + '/' + fileNameFor(memberId, taskId)
}

/**
 * 把临时照片保存到永久目录
 * @returns {String} 永久路径；失败时回退原临时路径（至少当次还能看）
 */
function savePhoto(tempPath, memberId, taskId) {
  if (!tempPath) return ''
  const f = fs()
  const dest = targetPath(memberId, taskId)
  if (!f || !dest) return tempPath

  ensureDir()
  try {
    // 覆盖写：先删再拷，避免文件被占用导致失败
    try { f.unlinkSync(dest) } catch (e) {}
    f.copyFileSync(tempPath, dest)
    return dest
  } catch (e) {
    return tempPath
  }
}

function removePhoto(path) {
  if (!path) return false
  const f = fs()
  if (!f) return false
  try {
    f.unlinkSync(path)
    return true
  } catch (e) {
    return false
  }
}

function exists(path) {
  if (!path) return false
  const f = fs()
  if (!f) return false
  try {
    f.accessSync(path)
    return true
  } catch (e) {
    return false
  }
}

/** 清空全部签到照片（重置数据时用） */
function clearAll() {
  const f = fs()
  const dir = dirPath()
  if (!f || !dir) return false
  try {
    const files = f.readdirSync(dir)
    files.forEach(name => {
      try { f.unlinkSync(dir + '/' + name) } catch (e) {}
    })
  } catch (e) {
    return false
  }
  return true
}

module.exports = {
  savePhoto,
  removePhoto,
  exists,
  clearAll,
  dirPath,
  targetPath,
  fileNameFor
}
