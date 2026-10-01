// ===== 小米平板5 三栏布局专用工具 =====
// 断点判断、三栏布局状态、旋转监听（原 pad-land-helper.js 已合并至此）

import { ref, computed } from 'vue'

// ===== 断点常量 =====
export const BREAKPOINTS = {
  PHONE: 0,          // 手机竖屏
  PHONE_LAND: 600,   // 手机横屏/小折叠
  TABLET_PORT: 680,  // 小平板竖屏/分屏 —— 三栏布局跳转阈值
  TABLET_LAND: 853,  // 小米平板5 标准横屏总宽
  TABLET_LG: 960,    // 大屏平板横屏
}

// ===== 三栏布局状态 =====
export function useLayoutState() {
  const leftCollapsed = ref(false)
  const rightCollapsed = ref(false)
  const middleView = ref('home')   // home | couple-pk | family | pets
  const rightTab = ref('pet')      // pet | achievement | score

  const leftWidth = computed(() =>
    leftCollapsed.value ? 72 : 220   // LEFT_COLLAPSED : LEFT_NAV
  )
  const rightWidth = computed(() =>
    rightCollapsed.value ? 0 : 220   // RIGHT_PANEL
  )

  function toggleLeft() {
    leftCollapsed.value = !leftCollapsed.value
  }
  function toggleRight() {
    rightCollapsed.value = !rightCollapsed.value
  }
  function setMiddleView(view) {
    middleView.value = view
  }
  function setRightTab(tab) {
    rightTab.value = tab
  }

  return {
    leftCollapsed, rightCollapsed,
    middleView, rightTab,
    leftWidth, rightWidth,
    toggleLeft, toggleRight,
    setMiddleView, setRightTab,
  }
}

// ===== 屏幕旋转/窗口尺寸监听 =====
export function onRotateWatch(callback) {
  try {
    uni.onWindowResize((res) => {
      callback({
        w: res.windowWidth,
        h: res.windowHeight,
        landscape: res.windowWidth > res.windowHeight,
      })
    })
  } catch {}
}
