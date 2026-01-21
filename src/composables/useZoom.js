import { ref, computed } from 'vue'

/**
 * @fileOverview 缩放管理组合式函数
 * 处理缩放级别控制和缩放动画
 */

/**
 * 缩放管理组合式函数
 * 提供缩放级别的增删改查和边界限制功能
 * 
 * @param {Object} options - 配置选项
 * @param {number} [options.minZoom=0.25] - 最小缩放比例
 * @param {number} [options.maxZoom=3] - 最大缩放比例
 * @param {number} [options.step=0.2] - 缩放步进值
 * @returns {Object} 缩放状态和控制函数
 */
export function useZoom(options = {}) {
  const {
    minZoom = 0.25,
    maxZoom = 3,
    step = 0.2
  } = options

  const zoomLevel = ref(1)

  const zoomLabel = computed(() => {
    if (zoomLevel.value < 0.4) return '极简'
    if (zoomLevel.value < 0.7) return '精简'
    if (zoomLevel.value < 1.2) return '标准'
    if (zoomLevel.value < 2) return '详细'
    return '超详细'
  })

  const zoomPercent = computed(() => Math.round(zoomLevel.value * 100))

  const canZoomIn = computed(() => zoomLevel.value < maxZoom)
  const canZoomOut = computed(() => zoomLevel.value > minZoom)

  const zoomIn = () => {
    if (canZoomIn.value) {
      zoomLevel.value = Math.min(maxZoom, zoomLevel.value + step)
    }
  }

  const zoomOut = () => {
    if (canZoomOut.value) {
      zoomLevel.value = Math.max(minZoom, zoomLevel.value - step)
    }
  }

  const resetZoom = () => {
    zoomLevel.value = 1
  }

  const setZoom = (value) => {
    zoomLevel.value = Math.max(minZoom, Math.min(maxZoom, value))
  }

  const zoomBy = (delta) => {
    const newZoom = zoomLevel.value + delta
    setZoom(newZoom)
  }

  const handleWheelZoom = (deltaY) => {
    const zoomDelta = deltaY > 0 ? -0.1 : 0.1
    zoomBy(zoomDelta)
  }

  return {
    zoomLevel,
    zoomLabel,
    zoomPercent,
    canZoomIn,
    canZoomOut,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    zoomBy,
    handleWheelZoom
  }
}
