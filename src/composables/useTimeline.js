import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useTimelineStore } from '../stores/timeline'
import { useVirtualList } from './useVirtualList'
import { useScroll } from './useScroll'
import { useZoom } from './useZoom'
import { useEmptyState } from './useEmptyState'
import { useDateHelpers } from './useDateHelpers'

/**
 * @fileOverview 时间轴主组合式函数
 * 整合所有时间轴相关的状态和逻辑
 */

/**
 * 时间轴主组合式函数
 * 整合滚动、缩放、虚拟列表、空状态等所有时间轴功能
 * 
 * @param {Object} options - 配置选项
 * @param {number} [options.nodeGap=260] - 节点间距（像素）
 * @param {number} [options.NODE_WIDTH=180] - 节点卡片宽度（像素）
 * @returns {Object} 时间轴完整功能集合
 */
export function useTimeline(options = {}) {
  const {
    nodeGap = 260,
    NODE_WIDTH = 180
  } = options

  const store = useTimelineStore()
  const { formatDate, getMonth, getMonthName } = useDateHelpers()

  const {
    scrollX,
    velocity,
    isDragging,
    startDrag,
    onDrag,
    stopDrag: originalStopDrag,
    handleWheel,
    scrollTo,
    scrollBy,
    stopDecay,
    setBounds,
    clampScroll
  } = useScroll()

  const stopDrag = () => {
    originalStopDrag()
  }

  const updateScrollBounds = () => {
    if (store.records.length === 0) {
      setBounds(-300, 300)
      return
    }

    const firstRecord = store.records[0]
    const lastRecord = store.records[store.records.length - 1]
    const firstDate = new Date(firstRecord.date)
    const lastDate = new Date(lastRecord.date)
    const today = new Date()
    
    const todayTime = today.getTime()
    const firstTime = firstDate.getTime()
    const lastTime = lastDate.getTime()

    const daysDiffFirst = (todayTime - firstTime) / (1000 * 60 * 60 * 24)
    const daysDiffLast = (todayTime - lastTime) / (1000 * 60 * 60 * 24)
    
    const firstPosition = daysDiffFirst * nodeGap + 150
    const lastPosition = daysDiffLast * nodeGap + 150
    
    const bufferDays = 7
    const bufferPixels = bufferDays * nodeGap
    
    const minScroll = -firstPosition - bufferPixels + 300
    const maxScroll = Math.max(300, bufferPixels + 300)

    console.log('[Bounds] minScroll:', minScroll, 'maxScroll:', maxScroll, 'firstPosition:', firstPosition, 'lastPosition:', lastPosition)
    setBounds(minScroll, maxScroll)
  }

  watch(() => store.records.length, () => {
    updateScrollBounds()
  }, { immediate: true })

  const {
    zoomLevel,
    zoomLabel,
    zoomPercent,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom
  } = useZoom({
    minZoom: 0.25,
    maxZoom: 3,
    step: 0.2
  })

  const {
    virtualItems,
    visibleWindow,
    scrollToIndex
  } = useVirtualList(computed(() => store.sortedRecords), {
    nodeGap,
    buffer: 3,
    maxPosition: computed(() => {
      const today = new Date()
      const firstRecord = store.records[0]
      if (!firstRecord) return 0
      
      const firstDate = new Date(firstRecord.date)
      const todayTime = today.getTime()
      const firstTime = firstDate.getTime()
      const daysDiff = (todayTime - firstTime) / (1000 * 60 * 60 * 24)
      
      return daysDiff * nodeGap + 150 + 7 * nodeGap
    })
  })

  const {
    generateEmptyBubbles
  } = useEmptyState({
    thresholdDays: 45
  })

  const visibleBubbles = computed(() => {
    return generateEmptyBubbles(store.records, {
      gap: nodeGap,
      visibleRange: visibleWindow.value
    })
  })

  const todayNode = computed(() => {
    if (store.records.length === 0) return null
    
    const today = new Date()
    const firstRecord = store.records[0]
    const firstDate = new Date(firstRecord.date)
    
    const todayTime = today.getTime()
    const firstTime = firstDate.getTime()
    
    const daysDiff = (todayTime - firstTime) / (1000 * 60 * 60 * 24)
    const position = daysDiff * nodeGap + 150
    
    return {
      id: 'today',
      position,
      date: today.toISOString()
    }
  })

  const isAtNow = computed(() => {
    if (store.records.length === 0) return true

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const currentIndex = Math.round(-scrollX.value / nodeGap)
    if (currentIndex < 0 || currentIndex >= store.records.length) return false

    const record = store.records[currentIndex]
    if (!record) return false

    const recordDate = new Date(record.date)
    const diff = Math.abs(today - recordDate)
    return diff < 30 * 24 * 60 * 60 * 1000
  })

  const filteredRecords = computed(() => {
    return store.filteredRecords
  })

  const transformStyle = computed(() => ({
    transform: `scale(${zoomLevel.value}) translateX(${scrollX.value}px)`,
    willChange: 'transform'
  }))

  const getNodePosition = (index) => index * nodeGap + 150

  const scrollToNow = () => {
    if (store.records.length === 0) return
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    let targetIndex = 0
    let minDiff = Infinity

    store.records.forEach((record, index) => {
      const recordDate = new Date(record.date)
      const diff = Math.abs(today - recordDate)
      if (diff < minDiff) {
        minDiff = diff
        targetIndex = index
      }
    })

    scrollToIndex(targetIndex)
  }

  const handleJump = (record) => {
    const index = store.records.findIndex(r => r.id === record.id)
    if (index !== -1) {
      scrollToIndex(index)
    }
  }

  const handleMinimapScroll = (newScroll) => {
    scrollTo(newScroll)
  }

  const selectRecord = (record) => {
    store.selectRecord(record)
  }

  const hoverNode = (id) => {
    // Hover is handled by CSS :hover, no store modification needed
  }

  const unhoverNode = () => {
    // Hover is handled by CSS :hover, no store modification needed
  }

  const addRecord = (record) => {
    store.addRecord(record)
  }

  let rafId = null

  const animateToNow = () => {
    const now = new Date()
    const target = now.getTime()
    const start = scrollX.value
    const duration = 800
    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      const currentIndex = Math.round(-start - (target % nodeGap) * eased)
      scrollToIndex(Math.max(0, Math.min(store.records.length - 1, currentIndex)))

      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      }
    }

    if (rafId) {
      cancelAnimationFrame(rafId)
    }
    rafId = requestAnimationFrame(animate)
  }

  onMounted(() => {
    scrollToNow()
  })

  onUnmounted(() => {
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
    stopDecay()
  })

  return {
    store,
    records: computed(() => store.records),
    sortedRecords: computed(() => store.sortedRecords),
    selectedRecord: computed(() => store.selectedRecord),
    
    scrollX,
    velocity,
    isDragging,
    zoomLevel,
    zoomLabel,
    zoomPercent,
    
    virtualItems,
    visibleBubbles,
    visibleWindow,
    todayNode,
    
    isAtNow,
    transformStyle,
    
    getNodePosition,
    
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    scrollTo,
    scrollBy,
    
    startDrag,
    onDrag,
    stopDrag,
    handleWheel,
    
    scrollToNow,
    animateToNow,
    handleJump,
    handleMinimapScroll,
    
    selectRecord,
    hoverNode,
    unhoverNode,
    addRecord,
    
    formatDate,
    getMonth,
    getMonthName
  }
}
