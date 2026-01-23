<template>
  <!--
    时间轴主容器组件
    功能：拖拽滚动、缩放控制、节点渲染、最小导航
  -->
  <div 
    class="timeline-container" 
    ref="containerRef"
    @mousedown="handleContainerMouseDown"
    @mouseup="handleContainerMouseUp"
    @mouseleave="handleContainerMouseUp"
    @wheel="handleContainerWheel"
    :class="{ 'is-dragging': isDragging }"
  >
    <!-- 时间轴选择器 -->
    <TimelineSelector />
    
    <!-- 右下角放大缩小按钮 -->
    <div class="zoom-controls">
      <button class="zoom-btn" @click="zoomIn" title="放大">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
      <div class="zoom-indicator">{{ zoomLabel }}</div>
      <button class="zoom-btn" @click="zoomOut" title="缩小">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M19 13H5v-2h14v2z"/>
        </svg>
      </button>
      <button class="zoom-btn reset-btn" @click="resetZoom" title="重置">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
        </svg>
      </button>
    </div>

    <div 
      class="timeline-wrapper"
      ref="timelineWrapper"
      :style="transformStyle"
    >
      <div class="timeline-track">
        <div class="timeline-line"></div>
        
        <div 
          v-for="item in virtualItems" 
          :key="item.item.id"
          class="timeline-node-wrapper"
          :class="{ 
            'left': item.index % 2 === 0,
            'right': item.index % 2 === 1,
            'active': selectedRecord?.id === item.item.id,
            'centered': item.isCentered,
            'highlight': item.item.level >= 3
          }"
          :style="{ left: `${item.position}px` }"
          @click="handleNodeClick(item.item)"
        >
          <TimelineNode 
            :record="item.item" 
            :index="item.index"
            :zoom-level="zoomLevel"
            :is-centered="item.isCentered"
          />
        </div>

        <div 
          v-if="todayNode"
          class="today-node-wrapper"
          :style="{ left: `${todayNode.position}px` }"
          :key="todayNode.id"
        >
          <div class="today-marker">
            <span class="today-label">今日</span>
            <div class="today-dot"></div>
          </div>
        </div>

        <!-- <EmptyStateBubble
          v-for="bubble in visibleBubbles"
          :key="bubble.date"
          :date="bubble.date"
          :index="bubble.index"
          :gap="260"
        /> -->
      </div>
    </div>
    
    <div class="level-legend" v-if="zoomLevel >= 0.5">
      <span class="legend-item level-3">
        <svg viewBox="0 0 24 24" width="12" height="12">
          <polygon fill="currentColor" points="12,2 22,20 2,20"/>
        </svg>
      </span>
      <span class="legend-item level-2">
        <svg viewBox="0 0 24 24" width="12" height="12">
          <rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
      </span>
      <span class="legend-item level-1">
        <svg viewBox="0 0 24" width="12" height="12">
          <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </span>
    </div>

    <Minimap 
      :records="records"
      :current-scroll="scrollX"
      :zoom-level="zoomLevel"
      :active-record-id="selectedRecord?.id"
      @jump="handleJump"
      @scroll="handleMinimapScroll"
    />

    <button class="add-btn" @click="$emit('add')" title="添加记录">
      <svg viewBox="0 0 24 24" width="22" height="22">
        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
      <span class="add-btn-label">添加记录</span>
    </button>

    <button 
      class="back-now-btn" 
      @click="scrollToNow"
      :class="{ visible: !isAtNow }"
      title="回到现在"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <span class="back-now-label">回到今天</span>
    </button>
  </div>
</template>

<script setup>
/**
 * @fileOverview Timeline.vue - 时间轴主组件
 * 
 * 功能描述：
 * 1. 时间轴容器，处理拖拽滚动和滚轮事件
 * 2. 整合 useTimeline composable 获取所有时间轴功能
 * 3. 渲染时间轴节点、缩放控件、最小导航栏
 * 4. 管理节点点击和选中状态
 */

import { ref, onMounted, onUnmounted } from 'vue'
import GridBackground from './GridBackground.vue'
import TimelineNode from './TimelineNode.vue'
import Minimap from './Minimap.vue'
import EmptyStateBubble from './EmptyStateBubble.vue'
import TimelineSelector from './TimelineSelector.vue'
import { useTimeline } from '../composables/useTimeline'

const emit = defineEmits(['select', 'add'])

const containerRef = ref(null)
const timelineWrapper = ref(null)

  const {
    records,
    selectedRecord,
    scrollX,
    velocity,
    isDragging,
    zoomLevel,
    zoomLabel,
    virtualItems,
    visibleBubbles,
    isAtNow,
    transformStyle,
    todayNode,
    scrollToNow,
    handleJump,
    handleMinimapScroll,
    selectRecord,
    startDrag,
    onDrag,
    stopDrag,
    handleWheel: scrollHandleWheel
  } = useTimeline()

const handleNodeClick = (record) => {
  selectRecord(record)
  emit('select', record)
}

const handleContainerMouseDown = (e) => {
  if (e.button === 0) {
    startDrag(e.clientX)
  }
}

const handleContainerMouseUp = () => {
  if (isDragging.value) {
    stopDrag()
  }
}

const handleContainerWheel = (e) => {
  e.preventDefault()
  scrollHandleWheel(e.deltaY, zoomLevel.value, e.ctrlKey || e.metaKey)
}

onMounted(() => {
  document.addEventListener('mousemove', (e) => {
    if (isDragging.value) {
      onDrag(e.clientX)
    }
  })
})

onUnmounted(() => {
  // Cleanup is handled by useTimeline
})
</script>

<style scoped>
.timeline-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  cursor: grab;
  user-select: none;
  overflow: hidden;
  touch-action: none;
  contain: layout paint;
}

.timeline-container:active,
.timeline-container.is-dragging {
  cursor: grabbing;
}

.zoom-controls {
  position: fixed;
  bottom: 100px;
  left: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f8f8f8;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #666;
}

.zoom-btn svg {
  width: 16px;
  height: 16px;
}

.zoom-btn:hover {
  background: #f0f0f0;
  transform: scale(1.08);
}

.zoom-btn:active {
  transform: scale(0.95);
}

.zoom-indicator {
  font-size: 10px;
  color: #999;
  font-weight: 500;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  padding: 6px 0;
  letter-spacing: 2px;
}

.reset-btn {
  margin-top: 5px;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.timeline-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: center center;
  contain: layout style;
  margin: -40px 0;
  box-sizing: border-box;
}

.timeline-track {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  height: 3px;
  min-width: calc(100% + 3000px);
  will-change: transform;
}

.timeline-line {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%,
    #ccc 5%,
    #bbb 50%,
    #bbb 95%,
    transparent 100%
  );
  transform: translateY(-50%);
  border-radius: 1px;
}

.timeline-node-wrapper {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  transition: opacity 0.2s ease, transform 0.2s ease, z-index 0s;
}

.timeline-node-wrapper.centered {
  z-index: 10;
}

.timeline-node-wrapper:hover {
  z-index: 20;
  transform: translateY(-50%) scale(1.02);
}

.today-node-wrapper {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
}

.today-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.today-label {
  font-size: 11px;
  font-weight: 600;
  color: #667eea;
  background: white;
  padding: 4px 10px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
  margin-bottom: 8px;
  white-space: nowrap;
  border: 2px solid #667eea;
}

.today-dot {
  width: 10px;
  height: 10px;
  background: #667eea;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
}

.level-legend {
  position: fixed;
  top: 20px;
  right: 30px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px 16px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.legend-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.legend-item.level-3 {
  background: rgba(180, 122, 122, 0.15);
  color: #b58585;
}

.legend-item.level-2 {
  background: rgba(180, 170, 140, 0.15);
  color: #b5a085;
}

.legend-item.level-1 {
  background: rgba(160, 160, 160, 0.12);
  color: #a0a0a0;
}

.legend-item:hover {
  transform: scale(1.1);
}

.add-btn {
  position: fixed;
  bottom: 115px;
  right: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 20px;
  border: none;
  border-radius: 30px;
  background: linear-gradient(135deg, #7d8a9a 0%, #9a8c7c 100%);
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(125, 138, 154, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
}

.add-btn svg {
  flex-shrink: 0;
}

.add-btn-label {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.add-btn:hover {
  padding-right: 24px;
  box-shadow: 0 6px 30px rgba(125, 138, 154, 0.4);
}

.add-btn:hover .add-btn-label {
  opacity: 1;
  transform: translateX(0);
}

.add-btn:active {
  transform: scale(0.98);
}

.back-now-btn {
  position: fixed;
  bottom: 160px;
  right: 30px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: white;
  color: #7d8a9a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
}

.back-now-btn.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.back-now-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 20px rgba(125, 138, 154, 0.2);
  color: #7d8a9a;
}

.back-now-btn:active {
  transform: translateY(0) scale(0.95);
}
</style>
