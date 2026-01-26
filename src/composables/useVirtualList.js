import { ref, computed } from 'vue'

/**
 * @fileOverview 虚拟列表组合式函数
 * 实现只渲染可视区域内元素的虚拟滚动优化
 */

/**
 * 虚拟列表组合式函数
 * 根据滚动位置计算可见元素，支持大列表的高性能渲染
 * 
 * @param {ComputedRef<Array>} items - 要渲染的列表数据（响应式引用）
 * @param {Object} options - 配置选项
 * @param {number} [options.nodeGap=260] - 元素间距（像素）
 * @param {number} [options.buffer=3] - 缓冲区大小，两侧额外渲染的元素数量
 * @param {number} [options.containerWidth] - 容器宽度，默认取窗口宽度
 * @returns {Object} 虚拟列表状态和导航函数
 */
export function useVirtualList(items, options = {}) {
  const {
    nodeGap = 260,
    buffer = 3,
    containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1920,
    maxPosition = Infinity
  } = options

  const scrollX = ref(0)
  const zoomLevel = ref(1)

  const viewportSize = computed(() => containerWidth / zoomLevel.value)
  const startScroll = computed(() => -scrollX.value)

  const visibleWindow = computed(() => {
    const start = Math.max(0, Math.floor((startScroll.value - viewportSize.value) / nodeGap))
    const end = Math.min(
      items.value.length,
      Math.ceil((startScroll.value + viewportSize.value * 2) / nodeGap) + buffer
    )
    return { start, end }
  })

  const virtualItems = computed(() => {
    const { start, end } = visibleWindow.value
    const centerX = containerWidth / 2
    const tolerance = containerWidth * 0.35
    const result = []

    for (let i = start; i < end; i++) {
      const item = items.value[i]
      if (!item) continue

      const position = i * nodeGap + 150
      const screenX = position + scrollX.value + centerX / zoomLevel.value
      const isCentered = Math.abs(screenX - centerX) < tolerance

      result.push({
        item,
        index: i,
        position,
        isCentered
      })
    }

    return result
  })

  const getItemPosition = (index) => index * nodeGap + 150

  const scrollToIndex = (index) => {
    scrollX.value = -index * nodeGap
  }

  const scrollToPosition = (position) => {
    scrollX.value = -position
  }

  const scrollBy = (delta) => {
    scrollX.value += delta
  }

  return {
    scrollX,
    zoomLevel,
    visibleWindow,
    virtualItems,
    getItemPosition,
    scrollToIndex,
    scrollToPosition,
    scrollBy
  }
}
