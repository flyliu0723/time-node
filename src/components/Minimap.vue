<template>
  <div class="minimap" v-if="records.length > 0">
    <div class="minimap-header">
      <span class="minimap-title">全程导航</span>
      <span class="minimap-range">{{ dateRange }}</span>
    </div>
    <div class="minimap-track" ref="trackRef">
      <div 
        class="minimap-progress"
        :style="{ width: progressWidth + '%', left: progressLeft + '%' }"
      ></div>
      <div 
        class="minimap-viewport"
        :style="{ 
          width: viewportWidth + '%',
          left: viewportLeft + '%'
        }"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="stopDrag"
        @mouseleave="stopDrag"
      >
        <div class="viewport-label">{{ currentDate }}</div>
      </div>
      <div 
        v-for="record in records" 
        :key="record.id"
        class="minimap-node"
        :class="['level-' + record.level, { active: record.id === activeRecordId }]"
        :style="{ left: getNodePosition(record) + '%' }"
        :title="record.title"
        @click="jumpTo(record)"
      ></div>
    </div>
    <div class="minimap-years">
      <span 
        v-for="year in years" 
        :key="year"
        class="year-marker"
        :style="{ left: getYearPosition(year) + '%' }"
      >{{ year }}</span>
    </div>
  </div>
</template>

<script setup>
/**
 * @fileOverview Minimap.vue - 时间轴最小导航组件
 * 
 * 功能描述：
 * 1. 显示时间轴全程概览
 * 2. 用视口框指示当前浏览位置
 * 3. 支持拖拽视口快速导航
 * 4. 点击节点跳转到对应位置
 * 5. 显示年份标记
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  /** 所有记录数据 */
  records: {
    type: Array,
    default: () => []
  },
  /** 当前滚动位置 */
  currentScroll: {
    type: Number,
    default: 0
  },
  /** 当前缩放级别 */
  zoomLevel: {
    type: Number,
    default: 1
  },
  /** 当前激活的记录ID */
  activeRecordId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['jump', 'scroll'])

const trackRef = ref(null)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartLeft = ref(0)

const minDate = computed(() => {
  return new Date(Math.min(...props.records.map(r => new Date(r.date))))
})

const maxDate = computed(() => {
  return new Date(Math.max(...props.records.map(r => new Date(r.date))))
})

const dateRange = computed(() => {
  const start = minDate.value.getFullYear()
  const end = maxDate.value.getFullYear()
  return start === end ? `${start}` : `${start} - ${end}`
})

const years = computed(() => {
  const start = minDate.value.getFullYear()
  const end = maxDate.value.getFullYear()
  const result = []
  for (let y = start; y <= end; y++) {
    result.push(y)
  }
  return result
})

const totalDays = computed(() => {
  const diff = maxDate.value - minDate.value
  return Math.max(diff, 1) / (1000 * 60 * 60 * 24)
})

const getNodePosition = (record) => {
  const date = new Date(record.date)
  const diff = date - minDate.value
  const days = diff / (1000 * 60 * 60 * 24)
  return (days / totalDays.value) * 100
}

const getYearPosition = (year) => {
  const yearDate = new Date(`${year}-01-01`)
  const diff = yearDate - minDate.value
  const days = diff / (1000 * 60 * 60 * 24)
  return (days / totalDays.value) * 100
}

const progressWidth = computed(() => {
  const visibleWidth = 100 / props.zoomLevel
  return Math.min(visibleWidth, 100)
})

const progressLeft = computed(() => {
  const offset = -(props.currentScroll / 2000) * 100
  return Math.max(0, Math.min(offset, 100 - progressWidth.value))
})

const viewportWidth = computed(() => {
  return 100 / props.zoomLevel
})

const viewportLeft = computed(() => {
  const maxScroll = props.records.length * 280 - 2000
  const scrollRatio = maxScroll > 0 ? props.currentScroll / maxScroll : 0
  return scrollRatio * (100 - viewportWidth.value)
})

const currentDate = computed(() => {
  const visibleStart = -props.currentScroll / 280
  const index = Math.max(0, Math.min(Math.round(visibleStart), props.records.length - 1))
  if (props.records[index]) {
    const date = new Date(props.records[index].date)
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })
  }
  return ''
})

const startDrag = (e) => {
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartLeft.value = viewportLeft.value
  document.body.style.cursor = 'grabbing'
}

const onDrag = (e) => {
  if (!isDragging.value) return
  const deltaX = e.clientX - dragStartX.value
  const trackWidth = trackRef.value?.offsetWidth || 100
  const deltaPercent = (deltaX / trackWidth) * 100
  const newLeft = Math.max(0, Math.min(100 - viewportWidth.value, dragStartLeft.value + deltaPercent))
  const scrollRatio = newLeft / (100 - viewportWidth.value)
  const maxScroll = props.records.length * 280 - 2000
  const newScroll = scrollRatio * maxScroll
  emit('scroll', newScroll)
}

const stopDrag = () => {
  isDragging.value = false
  document.body.style.cursor = 'default'
}

const jumpTo = (record) => {
  const index = props.records.findIndex(r => r.id === record.id)
  const scrollAmount = -index * 280
  emit('scroll', scrollAmount)
  emit('jump', record)
}
</script>

<style scoped>
.minimap {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid #eee;
  padding: 6px 30px 6px;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.minimap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.minimap-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.minimap-range {
  font-size: 11px;
  color: #999;
}

.minimap-track {
  position: relative;
  height: 32px;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
}

.minimap-progress {
  position: absolute;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(125, 138, 154, 0.1), rgba(125, 138, 154, 0.2));
  border-radius: 4px;
  pointer-events: none;
}

.minimap-viewport {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(125, 138, 154, 0.25);
  border: 2px solid #7d8a9a;
  border-radius: 4px;
  cursor: grab;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.minimap-viewport:hover {
  background: rgba(125, 138, 154, 0.35);
}

.minimap-viewport:active {
  cursor: grabbing;
}

.viewport-label {
  font-size: 10px;
  color: #7d8a9a;
  font-weight: 500;
  white-space: nowrap;
}

.minimap-node {
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 5;
}

.minimap-node:hover {
  transform: translate(-50%, -50%) scale(1.5);
}

.minimap-node.level-3 {
  background: #c9a8a8;
}

.minimap-node.level-2 {
  background: #c9b8a8;
}

.minimap-node.level-1 {
  background: #b0b0b0;
}

.minimap-node.active {
  box-shadow: 0 0 0 4px rgba(125, 138, 154, 0.4);
  transform: translate(-50%, -50%) scale(1.3);
}

.minimap-years {
  position: relative;
  height: 16px;
  margin-top: 6px;
}

.year-marker {
  position: absolute;
  font-size: 9px;
  color: #aaa;
  transform: translateX(-50%);
}

.minimap-node:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  margin-bottom: 4px;
  pointer-events: none;
}
</style>
