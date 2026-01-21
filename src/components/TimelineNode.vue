<template>
  <div 
    class="timeline-node" 
    :class="[positionClass, zoomClass, { centered: isCentered, highlight: record.level >= 3 }]"
  >
    <div class="node-connector" :class="positionClass"></div>
    
    <div class="node-content" :class="positionClass">
      <div class="node-date">{{ formattedDate }}</div>
      
      <div class="node-card-wrapper" :class="'level-' + record.level">
        <div class="breath-glow"></div>
        <div class="node-card" @click="$emit('click')">
          <div class="level-indicator" :class="'level-' + record.level">
            <div class="level-shape">
              <svg v-if="record.level === 3" viewBox="0 0 24 24" width="14" height="14">
                <polygon fill="currentColor" points="12,2 22,20 2,20"/>
              </svg>
              <svg v-else-if="record.level === 2" viewBox="0 0 24 24" width="14" height="14">
                <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="14" height="14">
                <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
          </div>
          
          <template v-if="zoomLevel < 0.4">
            <div class="ultra-simplified">
              <span class="tiny-icon" :class="record.type">
                <svg v-if="record.type === 'photo'" viewBox="0 0 24 24" width="12" height="12">
                  <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <svg v-else-if="record.type === 'video'" viewBox="0 0 24 24" width="12" height="12">
                  <path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="12" height="12">
                  <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </span>
            </div>
          </template>
          
          <template v-else-if="zoomLevel < 0.7">
            <div class="simplified-content">
              <span class="card-icon-small" :class="record.type">
                <svg v-if="record.type === 'photo'" viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <svg v-else-if="record.type === 'video'" viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </span>
              <span class="simplified-title">{{ record.title }}</span>
            </div>
          </template>
          
          <template v-else-if="zoomLevel < 1.2">
            <div class="card-header">
              <span class="card-icon" :class="record.type">
                <svg v-if="record.type === 'photo'" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <svg v-else-if="record.type === 'video'" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </span>
              <span class="card-title">{{ record.title }}</span>
            </div>
            <div class="card-preview-mini">
              <p v-if="record.description" class="card-description-mini">{{ truncatedDescription }}</p>
              <div v-if="record.tags?.length" class="card-tags-mini">
                <span 
                  v-for="tag in record.tags.slice(0, 2)" 
                  :key="tag" 
                  class="tag-mini"
                  :style="{ '--tag-color': getTagColor(tag) }"
                >{{ tag }}</span>
              </div>
            </div>
          </template>
          
          <template v-else>
            <div class="card-header">
              <span class="card-icon" :class="record.type">
                <svg v-if="record.type === 'photo'" viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <svg v-else-if="record.type === 'video'" viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </span>
              <span class="card-title">{{ record.title }}</span>
            </div>
            
            <div class="card-preview">
              <div v-if="record.type === 'photo'" class="photo-preview">
                <div class="photo-grid" v-if="record.photos?.length > 1">
                  <div 
                    v-for="(photo, idx) in record.photos.slice(0, 4)" 
                    :key="idx"
                    class="photo-item"
                    :style="{ backgroundImage: `url(${photo})` }"
                  ></div>
                </div>
                <div 
                  v-else-if="record.photos?.length === 1"
                  class="single-photo"
                  :style="{ backgroundImage: `url(${record.photos[0]})` }"
                ></div>
              </div>
              
              <div v-else-if="record.type === 'video'" class="video-preview">
                <div class="video-thumbnail">
                  <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="white" d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              
              <p v-if="record.description" class="card-description">{{ record.description }}</p>
              
              <div v-if="record.tags?.length" class="card-tags">
                <span 
                  v-for="tag in record.tags" 
                  :key="tag" 
                  class="tag"
                  :style="{ '--tag-color': getTagColor(tag) }"
                >{{ tag }}</span>
              </div>
            </div>
            
            <div class="card-footer">
              <span class="view-detail">点击查看详情 →</span>
            </div>
          </template>
        </div>
      </div>
    </div>
    
    <div class="node-dot-wrapper" :class="['level-' + record.level, { centered: isCentered }]">
      <div class="node-dot"></div>
      <div class="dot-pulse" v-if="record.level === 3"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * @fileOverview TimelineNode.vue - 时间轴节点组件
 * 
 * 功能描述：
 * 1. 渲染单个时间轴记录卡片
 * 2. 根据 zoomLevel 显示不同详细程度的内容
 * 3. 支持照片、视频、文字三种类型
 * 4. 根据重要程度(level)显示不同样式
 * 5. 居中时放大显示，带呼吸动画效果
 */

import { computed } from 'vue'

const props = defineProps({
  /** 记录数据对象 */
  record: {
    type: Object,
    required: true
  },
  /** 在时间轴中的索引位置（用于决定左右布局） */
  index: {
    type: Number,
    required: true
  },
  /** 当前缩放级别（影响显示内容详细程度） */
  zoomLevel: {
    type: Number,
    default: 1
  },
  /** 是否处于屏幕中央位置 */
  isCentered: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

/** 根据索引决定显示在左侧还是右侧 */
const positionClass = computed(() => {
  return props.index % 2 === 0 ? 'left' : 'right'
})

/** 根据缩放级别返回对应的CSS类名 */
const zoomClass = computed(() => {
  if (props.zoomLevel < 0.4) return 'ultra-simplified'
  if (props.zoomLevel < 0.7) return 'simplified'
  if (props.zoomLevel < 1.2) return 'normal'
  return 'detailed'
})

const formattedDate = computed(() => {
  const date = new Date(props.record.date)
  if (props.zoomLevel < 0.5) {
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  }
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' })
})

const truncatedDescription = computed(() => {
  if (!props.record.description) return ''
  return props.record.description.length > 40 
    ? props.record.description.substring(0, 40) + '...'
    : props.record.description
})

const tagColorMap = {
  '旅行': '#7c9a92', '云南': '#7c9a92', '雪山': '#8ba4b4',
  '工作': '#a0938d', '成长': '#8d9da8', '新起点': '#9a8c7c',
  '技术': '#7d8a9a', '重构': '#8a9a8d', '项目': '#9a8d8a',
  '技术分享': '#8a9a8d', 'Vue3': '#7d8a9a', '前端': '#7c9a92',
  '徒步': '#8d9a8d', '自然': '#8ba4b4', '户外': '#9a928c',
  '读书': '#9a8c7c', '编程': '#7d8a9a', '学习': '#8d9da8',
  '家庭': '#a0938d', '新年': '#b49a8d', '团聚': '#9a928c',
  '开源': '#7d8a9a', 'Vue': '#7d8a9a', 'GitHub': '#8a9a8d',
  '日常': '#9a928c', '随笔': '#8d9da8', '生活': '#a0938d',
  '摄影': '#8ba4b4', '练习': '#9a8c7c', '周末': '#b49a8d',
  '独自旅行': '#7c9a92', '团队': '#9a8d8a', '贡献': '#8d9a8d',
  '视频': '#9a8c7c', '朋友': '#a0938d'
}

const getTagColor = (tag) => {
  return tagColorMap[tag] || '#9a9a9a'
}
</script>

<style scoped>
.timeline-node {
  position: relative;
  display: flex;
  align-items: center;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
}

.timeline-node.centered {
  transform: translateY(-50%) scale(1.03);
  z-index: 15;
}

.timeline-node.centered .node-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.timeline-node.centered.left .node-card {
  transform: translateX(-4px) translateY(-2px);
}

.timeline-node.centered.right .node-card {
  transform: translateX(4px) translateY(-2px);
}

.node-connector {
  position: absolute;
  width: 160px;
  height: 1px;
  background: linear-gradient(90deg, rgba(180, 180, 180, 0.4), transparent);
  transition: all 0.3s ease;
}

.node-connector.left {
  right: 50%;
  background: linear-gradient(90deg, transparent, rgba(180, 180, 180, 0.4));
}

.node-connector.right {
  left: 50%;
}

.node-content {
  width: 160px;
  position: absolute;
  transition: all 0.3s ease;
}

.node-content.left {
  top: 10px;
  left: calc(50% + 20px);
  text-align: right;
}

.node-content.right {
  bottom: 20px;
  left: calc(50% + 20px);
  text-align: left;
}

.node-date {
  font-size: 10px;
  color: #999;
  margin-bottom: 4px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.timeline-node.centered .node-date {
  color: #7d8a9a;
  font-weight: 600;
}

.node-card-wrapper {
  position: relative;
  border-radius: 12px;
  background: white;
  transition: all 0.3s ease;
}

.node-card-wrapper.level-3 {
  box-shadow: 0 4px 20px rgba(180, 122, 122, 0.15);
}

.node-card-wrapper.level-3 .node-card {
  border: 1px solid rgba(180, 122, 122, 0.15);
}

.node-card-wrapper.level-2 {
  box-shadow: 0 4px 16px rgba(180, 170, 140, 0.12);
}

.node-card-wrapper.level-2 .node-card {
  border: 1px solid rgba(180, 170, 140, 0.15);
}

.node-card-wrapper.level-1 {
  box-shadow: 0 4px 12px rgba(160, 160, 160, 0.08);
}

.node-card-wrapper.level-1 .node-card {
  border: 1px solid rgba(160, 160, 160, 0.1);
}

.breath-glow {
  position: absolute;
  inset: -2px;
  border-radius: 14px;
  background: transparent;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.node-card-wrapper.level-3:hover .breath-glow,
.node-card-wrapper.level-3.centered .breath-glow {
  opacity: 1;
  background: radial-gradient(ellipse at center, rgba(180, 122, 122, 0.1) 0%, transparent 70%);
  animation: breathe 2s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
}

.node-card {
  background: white;
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.node-card:hover {
  transform: translateY(-2px);
}

.node-card-wrapper.level-3:hover {
  box-shadow: 0 8px 30px rgba(180, 122, 122, 0.2);
}

.node-card-wrapper.level-2:hover {
  box-shadow: 0 8px 24px rgba(180, 170, 140, 0.18);
}

.node-card-wrapper.level-1:hover {
  box-shadow: 0 6px 20px rgba(160, 160, 160, 0.12);
}

.level-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.node-content.right .level-indicator {
  justify-content: flex-start;
}

.node-content.left .level-indicator {
  justify-content: flex-end;
}

.level-shape {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.level-3 .level-shape {
  color: #b58585;
}

.level-2 .level-shape {
  color: #b5a085;
}

.level-1 .level-shape {
  color: #a0a0a0;
}

.ultra-simplified .node-content {
  width: 40px;
}

.ultra-simplified .node-date {
  display: none;
}

.ultra-simplified .level-indicator {
  display: none;
}

.tiny-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
  color: #aaa;
  transition: all 0.3s ease;
}

.tiny-icon.photo {
  background: rgba(124, 154, 146, 0.12);
  color: #7c9a92;
}

.tiny-icon.video {
  background: rgba(154, 140, 124, 0.12);
  color: #9a8c7c;
}

.tiny-icon.text {
  background: rgba(125, 138, 154, 0.12);
  color: #7d8a9a;
}

.simplified-content {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.card-icon-small {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
  color: #aaa;
  transition: all 0.3s ease;
}

.card-icon-small.photo {
  background: rgba(124, 154, 146, 0.12);
  color: #7c9a92;
}

.card-icon-small.video {
  background: rgba(154, 140, 124, 0.12);
  color: #9a8c7c;
}

.card-icon-small.text {
  background: rgba(125, 138, 154, 0.12);
  color: #7d8a9a;
}

.simplified-title {
  font-weight: 500;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.node-content.right .card-header {
  flex-direction: row;
}

.node-content.left .card-header {
  flex-direction: row-reverse;
}

.card-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
  color: #aaa;
  transition: all 0.3s ease;
}

.card-icon.photo {
  background: rgba(124, 154, 146, 0.12);
  color: #7c9a92;
}

.card-icon.video {
  background: rgba(154, 140, 124, 0.12);
  color: #9a8c7c;
}

.card-icon.text {
  background: rgba(125, 138, 154, 0.12);
  color: #7d8a9a;
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: #444;
}

.card-preview-mini {
  margin-bottom: 6px;
}

.card-description-mini {
  font-size: 10px;
  color: #777;
  line-height: 1.5;
  margin: 4px 0;
}

.card-tags-mini {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 4px;
}

.tag-mini {
  font-size: 9px;
  color: var(--tag-color, #9a9a9a);
  background: color-mix(in srgb, var(--tag-color, #9a9a9a) 10%, transparent);
  padding: 2px 6px;
  border-radius: 4px;
}

.card-preview {
  margin-bottom: 8px;
}

.photo-preview {
  margin-bottom: 6px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3px;
  border-radius: 6px;
  overflow: hidden;
}

.photo-item {
  aspect-ratio: 1;
  background-size: cover;
  background-position: center;
  border-radius: 4px;
}

.single-photo {
  width: 100%;
  height: 70px;
  background-size: cover;
  background-position: center;
  border-radius: 6px;
}

.video-preview {
  position: relative;
}

.video-thumbnail {
  width: 100%;
  height: 70px;
  background: linear-gradient(135deg, #a0938d 0%, #9a928c 100%);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-description {
  font-size: 10px;
  color: #777;
  line-height: 1.6;
  margin: 6px 0;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 6px;
}

.node-content.right .card-tags {
  justify-content: flex-start;
}

.node-content.left .card-tags {
  justify-content: flex-end;
}

.tag {
  font-size: 9px;
  color: var(--tag-color, #9a9a9a);
  background: color-mix(in srgb, var(--tag-color, #9a9a9a) 10%, transparent);
  padding: 2px 6px;
  border-radius: 4px;
}

.card-footer {
  padding-top: 6px;
  border-top: 1px solid #f5f5f5;
}

.view-detail {
  font-size: 9px;
  color: #aaa;
  transition: color 0.3s ease;
}

.node-card:hover .view-detail {
  color: #7d8a9a;
}

.node-dot-wrapper {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  transition: all 0.3s ease;
  will-change: transform;
}

.node-dot {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.node-dot-wrapper.level-3 .node-dot {
  border: 2.5px solid #c9a8a8;
}

.node-dot-wrapper.level-2 .node-dot {
  border: 2px solid #c9b8a8;
}

.node-dot-wrapper.level-1 .node-dot {
  border: 1.5px solid #b0b0b0;
}

.node-dot-wrapper.centered .node-dot {
  transform: scale(1.3);
}

.dot-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(180, 122, 122, 0.3);
  transform: translate(-50%, -50%);
  animation: pulse 2s ease-out infinite;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
}

.timeline-node:hover .node-dot-wrapper {
  transform: translateY(-50%) scale(1.15);
}
</style>
