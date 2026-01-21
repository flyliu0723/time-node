<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="detail-modal-overlay" @click.self="$emit('close')">
        <div class="detail-modal">
          <button class="close-btn" @click="$emit('close')">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          
          <div class="modal-header">
            <span class="modal-type" :class="record.type">
              {{ typeLabel }}
            </span>
            <h2 class="modal-title">{{ record.title }}</h2>
            <p class="modal-date">{{ formattedDate }}</p>
          </div>
          
          <div class="modal-content">
            <div v-if="record.type === 'photo'" class="photo-gallery">
              <div 
                v-for="(photo, index) in record.photos" 
                :key="index"
                class="gallery-item"
                :class="{ active: activePhoto === index }"
                @click="activePhoto = index"
              >
                <img :src="photo" :alt="`Photo ${index + 1}`" />
              </div>
            </div>
            
            <div v-else-if="record.type === 'video'" class="video-container">
              <video 
                v-if="record.videoUrl" 
                :src="record.videoUrl" 
                controls
                autoplay
              ></video>
              <div v-else class="video-placeholder">
                <svg viewBox="0 0 24 24" width="64" height="64">
                  <path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                </svg>
              </div>
            </div>
            
            <div v-if="record.description" class="description-section">
              <h3>记录详情</h3>
              <p>{{ record.description }}</p>
            </div>
            
            <div v-if="record.tags?.length" class="tags-section">
              <h3>标签</h3>
              <div class="tags-list">
                <span 
                  v-for="tag in record.tags" 
                  :key="tag" 
                  class="tag-item"
                >#{{ tag }}</span>
              </div>
            </div>
            
            <div v-if="record.location" class="location-section">
              <h3>地点</h3>
              <p>{{ record.location }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * @fileOverview DetailModal.vue - 记录详情弹窗组件
 * 
 * 功能描述：
 * 1. 以弹窗形式展示记录详细信息
 * 2. 支持照片画廊（可切换）、视频播放
 * 3. 显示描述、标签、地点等完整信息
 * 4. 使用 Teleport 渲染到 body 下
 * 5. 带入场/退场动画效果
 */

import { ref, computed, watch } from 'vue'

const props = defineProps({
  /** 要展示的记录数据 */
  record: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const activePhoto = ref(0)

const typeLabel = computed(() => {
  const labels = {
    photo: '照片',
    video: '视频',
    text: '文字'
  }
  return labels[props.record.type] || '记录'
})

const formattedDate = computed(() => {
  const date = new Date(props.record.date)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

watch(() => props.record, () => {
  activePhoto.value = 0
})
</script>

<style scoped>
.detail-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.detail-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: rotate(90deg);
}

.modal-header {
  padding: 32px 32px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-type {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 12px;
}

.modal-type.photo {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.modal-type.video {
  background: rgba(118, 75, 162, 0.1);
  color: #764ba2;
}

.modal-type.text {
  background: rgba(240, 147, 43, 0.1);
  color: #f0932b;
}

.modal-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.modal-date {
  font-size: 14px;
  color: #888;
}

.modal-content {
  padding: 24px 32px 32px;
}

.photo-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.gallery-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px solid transparent;
}

.gallery-item:hover {
  transform: scale(1.05);
}

.gallery-item.active {
  border-color: #667eea;
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-container {
  margin-bottom: 24px;
}

.video-container video {
  width: 100%;
  border-radius: 12px;
}

.video-placeholder {
  width: 100%;
  height: 300px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.description-section,
.tags-section,
.location-section {
  margin-bottom: 24px;
}

.description-section h3,
.tags-section h3,
.location-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.description-section p {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  font-size: 13px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 6px 14px;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.tag-item:hover {
  background: rgba(102, 126, 234, 0.2);
}

.location-section p {
  font-size: 14px;
  color: #666;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .detail-modal,
.modal-leave-to .detail-modal {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

.modal-enter-active .detail-modal,
.modal-leave-active .detail-modal {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
