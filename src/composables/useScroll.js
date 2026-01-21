import { ref, computed } from 'vue'

/**
 * @fileOverview 滚动管理组合式函数
 * 处理拖拽滚动、惯性滚动和边界控制
 */

/**
 * 滚动管理组合式函数
 * 提供触摸/鼠标拖拽滚动、速度衰减和边界限制功能
 * 
 * @param {Object} options - 配置选项
 * @param {number} [options.dampFactor=0.1] - 阻尼系数，控制滚动平滑度
 * @returns {Object} 滚动控制函数和状态
 */
export function useScroll(options = {}) {
  const {
    dampFactor = 0.1
  } = options

  const scrollX = ref(0)
  const velocity = ref(0)
  const isDragging = ref(false)
  const dragStartX = ref(0)
  const dragStartScroll = ref(0)

  let velocityRafId = null
  let lastScrollX = 0
  let lastTime = Date.now()

  const minScroll = ref(-2000)
  const maxScroll = ref(2000)

  const isAtBoundary = computed(() => {
    return scrollX.value <= minScroll.value || scrollX.value >= maxScroll.value
  })

  const updateVelocity = (currentScroll) => {
    const now = Date.now()
    const delta = now - lastTime
    
    if (delta > 0) {
      velocity.value = (currentScroll - lastScrollX) * (1000 / delta)
    }
    
    lastScrollX = currentScroll
    lastTime = now
  }

  const decayVelocity = () => {
    if (Math.abs(velocity.value) < 0.1) {
      velocity.value = 0
      return
    }
    
    velocity.value *= 0.9
    const newScroll = scrollX.value + velocity.value
    
    if (newScroll <= minScroll.value || newScroll >= maxScroll.value) {
      velocity.value = 0
      return
    }
    
    scrollX.value = newScroll
    velocityRafId = requestAnimationFrame(decayVelocity)
  }

  const startDrag = (clientX) => {
    if (velocityRafId) {
      cancelAnimationFrame(velocityRafId)
    }
    
    isDragging.value = true
    dragStartX.value = clientX
    dragStartScroll.value = scrollX.value
    lastScrollX = scrollX.value
    lastTime = Date.now()
  }

  const onDrag = (clientX) => {
    if (!isDragging.value) return
    
    const deltaX = clientX - dragStartX.value
    scrollX.value = dragStartScroll.value + deltaX
    
    updateVelocity(scrollX.value)
  }

  const stopDrag = () => {
    isDragging.value = false
    decayVelocity()
  }

  const handleWheel = (deltaY, zoomLevel = 1, isZoom = false) => {
    if (isZoom) {
      return
    }
    
    const scrollDelta = deltaY > 0 ? 60 : -60
    const newScroll = scrollX.value + scrollDelta / zoomLevel
    scrollX.value = Math.max(minScroll.value, Math.min(maxScroll.value, newScroll))
    
    velocity.value = -deltaY / zoomLevel
  }

  const scrollTo = (position) => {
    scrollX.value = Math.max(minScroll.value, Math.min(maxScroll.value, position))
    velocity.value = 0
  }

  const scrollBy = (delta) => {
    scrollX.value = Math.max(minScroll.value, Math.min(maxScroll.value, scrollX.value + delta))
  }

  const clampScroll = () => {
    scrollX.value = Math.max(minScroll.value, Math.min(maxScroll.value, scrollX.value))
  }

  const stopDecay = () => {
    if (velocityRafId) {
      cancelAnimationFrame(velocityRafId)
      velocityRafId = null
    }
    velocity.value = 0
  }

  const setBounds = (min, max) => {
    minScroll.value = min
    maxScroll.value = max
    clampScroll()
  }

  const updateBounds = (recordCount, nodeGap) => {
    if (recordCount > 0) {
      const newMin = -(recordCount - 1) * nodeGap + 300
      if (newMin !== minScroll.value) {
        minScroll.value = newMin
      }
    }
  }

  return {
    scrollX,
    velocity,
    isDragging,
    isAtBoundary,
    minScroll,
    maxScroll,
    startDrag,
    onDrag,
    stopDrag,
    handleWheel,
    scrollTo,
    scrollBy,
    clampScroll,
    stopDecay,
    setBounds,
    updateBounds,
    updateVelocity
  }
}
