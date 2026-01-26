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
          
          <div class="modal-body">
            <!-- 左侧：标题、内容、标签 -->
            <div class="left-panel">
              <div class="modal-header">
                <span class="modal-type" :class="record.type">
                  {{ typeLabel }}
                </span>
                <h2 class="modal-title">{{ record.title }}</h2>
                <p class="modal-date">{{ formattedDate }}</p>
              </div>
              
              <div class="left-content">
                <div v-if="record.description" class="description-section">
                  <p>{{ record.description }}</p>
                </div>
                
                <div v-if="record.tags?.length" class="tags-section">
                  <div class="tags-list">
                    <span 
                      v-for="tag in record.tags" 
                      :key="tag" 
                      class="tag-item"
                    >#{{ tag }}</span>
                  </div>
                </div>
                
                <div v-if="record.location" class="location-section">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>{{ typeof record.location === 'string' ? record.location : record.location.name }}</span>
                </div>
              </div>
            </div>
            
            <!-- 右侧：照片/视频从上往下排 -->
            <div class="right-panel">
              <div v-if="record.type === 'photo'" class="photo-list">
                <div 
                  v-for="(photo, index) in record.photos" 
                  :key="index"
                  class="photo-item"
                >
                  <img :src="photo" :alt="`Photo ${index + 1}`" />
                </div>
              </div>
              
              <div v-else-if="record.type === 'video'" class="video-list">
                <video 
                  v-if="record.videos?.length" 
                  :src="record.videos[0]" 
                  controls
                ></video>
                <div v-else class="video-placeholder">
                  <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  record: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

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
  
})
</script>

<style scoped>
.detail-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  padding: 40px;
}

.detail-modal {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 1100px;
  max-height: calc(100vh - 80px);
  min-height: 400px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border: none;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 20;
  color: #666;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.15);
  transform: rotate(90deg);
}

.modal-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.left-panel {
  flex: 0 0 380px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f0f0f0;
  overflow-y: auto;
  max-height: 100%;
}

.modal-header {
  margin-bottom: 24px;
}

.modal-type {
  display: inline-block;
  padding: 5px 14px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
  letter-spacing: 0.5px;
}

.modal-type.photo {
  background: rgba(102, 126, 234, 0.12);
  color: #667eea;
}

.modal-type.video {
  background: rgba(118, 75, 162, 0.12);
  color: #764ba2;
}

.modal-type.text {
  background: rgba(240, 147, 43, 0.12);
  color: #f0932b;
}

.modal-title {
  font-size: 26px;
  font-weight: 600;
  color: #222;
  margin: 0 0 10px 0;
  line-height: 1.3;
}

.modal-date {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.left-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.description-section {
  margin-bottom: 24px;
}

.description-section p {
  font-size: 15px;
  line-height: 1.85;
  color: #444;
  margin: 0;
}

.tags-section {
  margin-bottom: 24px;
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
  border-radius: 18px;
  transition: all 0.3s ease;
}

.tag-item:hover {
  background: rgba(102, 126, 234, 0.2);
}

.location-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 12px;
  color: #666;
  font-size: 14px;
}

.location-section svg {
  flex-shrink: 0;
  color: #999;
}

.right-panel {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  background: #f8f8f8;
}

.photo-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.photo-item {
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.photo-item img {
  width: 100%;
  display: block;
}

.video-list {
  padding: 16px;
}

.video-list video {
  width: 100%;
  border-radius: 12px;
  display: block;
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

.modal-enter-active,
.modal-leave-active {
  transition: all 0.35s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .detail-modal,
.modal-leave-to .detail-modal {
  transform: scale(0.95);
  opacity: 0;
}

.modal-enter-active .detail-modal,
.modal-leave-active .detail-modal {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
