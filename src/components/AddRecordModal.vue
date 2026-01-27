<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="modal-overlay" @click.self="$emit('close')">
        <div class="add-modal">
          <button class="close-btn" @click="$emit('close')">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          
          <div class="modal-header">
            <h2>添加新记录</h2>
          </div>
          
          <form class="modal-form" @submit.prevent="handleSubmit">
            <div class="form-row">
              <div class="form-group">
                <label>标题 *</label>
                <input 
                  v-model="form.title" 
                  type="text" 
                  placeholder="给这段回忆起个名字"
                  required
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>日期 *</label>
                <input 
                  v-model="form.date" 
                  type="date" 
                  required
                />
              </div>
              <div class="form-group">
                <label>类型 *</label>
                <select v-model="form.type" required>
                  <option value="photo">照片</option>
                  <option value="video">视频</option>
                  <option value="text">文字</option>
                </select>
              </div>
              <div class="form-group">
                <label>重要程度</label>
                <div class="level-select">
                  <button 
                    type="button"
                    v-for="level in [1, 2, 3]" 
                    :key="level"
                    class="level-btn"
                    :class="{ active: form.level === level }"
                    @click="form.level = level"
                  >
                    <svg v-if="level === 3" viewBox="0 0 24 24" width="16" height="16">
                      <polygon fill="currentColor" points="12,2 22,20 2,20"/>
                    </svg>
                    <svg v-else-if="level === 2" viewBox="0 0 24 24" width="16" height="16">
                      <rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" width="16" height="16">
                      <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group full">
                <label>描述</label>
                <textarea 
                  v-model="form.description" 
                  placeholder="发生了什么..."
                  rows="3"
                ></textarea>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group full">
                <label>地点</label>
                <button 
                  type="button"
                  class="location-select-btn"
                  @click="showLocationPicker = true"
                >
                  <svg v-if="!form.location" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span v-if="!form.location">点击选择位置</span>
                  <span v-else class="location-text">{{ form.location.name }}</span>
                  <button 
                    v-if="form.location"
                    type="button"
                    class="location-remove-btn"
                    @click.stop="handleLocationRemove"
                  >
                    ×
                  </button>
                </button>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group full">
                <label>标签</label>
                <div class="tags-input">
                  <div class="tags-list">
                    <span 
                      v-for="(tag, idx) in form.tags" 
                      :key="tag"
                      class="tag-chip"
                    >
                      {{ tag }}
                      <button type="button" @click="removeTag(idx)">×</button>
                    </span>
                  </div>
                  <input 
                    v-model="tagInput"
                    type="text" 
                    placeholder="添加标签，按回车确认"
                    @keydown.enter.prevent="addTag"
                  />
                </div>
              </div>
            </div>
            
            <!-- 照片上传 -->
            <div class="form-row" v-if="form.type === 'photo'">
              <div class="form-group full">
                <label>照片上传</label>
                <FileUploader
                  ref="photoUploader"
                  :date="form.date"
                  accept-types="image/*"
                  :max-files="9"
                  placeholder="点击或拖拽上传照片"
                  @update:files="handlePhotosUpdate"
                />
              </div>
            </div>
            
            <!-- 视频上传 -->
            <div class="form-row" v-if="form.type === 'video'">
              <div class="form-group full">
                <label>视频上传</label>
                <FileUploader
                  ref="videoUploader"
                  :date="form.date"
                  accept-types="video/*"
                  :max-files="1"
                  placeholder="点击或拖拽上传视频"
                  @update:files="handleVideosUpdate"
                />
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="$emit('close')">取消</button>
              <button type="submit" class="submit-btn" :disabled="!isValid">
                <span v-if="!isValid">请填写必填项</span>
                <span v-else>保存记录</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
    
    <LocationPicker 
      v-if="showLocationPicker"
      :visible="showLocationPicker"
      :initial-location="form.location"
      @close="showLocationPicker = false"
      @select="handleLocationSelect"
    />
  </Teleport>
</template>

<script setup>
/**
 * @fileOverview AddRecordModal.vue - 添加记录弹窗组件
 * 
 * 功能描述：
 * 1. 提供新建记录的表单界面
 * 2. 支持标题、日期、类型、重要程度等字段
 * 3. 支持添加描述、地点、标签
 * 4. 照片/视频类型支持文件上传
 * 5. 表单验证和提交处理
 */

import { ref, computed, reactive, watch } from 'vue'
import FileUploader from './FileUploader.vue'
import LocationPicker from './LocationPicker.vue'

const emit = defineEmits(['close', 'save'])

const photoUploader = ref(null)
const videoUploader = ref(null)
const tagInput = ref('')
const showLocationPicker = ref(false)

/** 新建记录的表单数据 */
const form = reactive({
  title: '',
  date: new Date().toISOString().split('T')[0],
  type: 'photo',
  level: 2,
  description: '',
  location: null,
  tags: [],
  photos: [],
  videos: []
})

const isValid = computed(() => {
  const hasBasicInfo = form.title.trim() && form.date
  const hasMedia = form.type === 'text' || 
    (form.type === 'photo' && form.photos.length > 0) ||
    (form.type === 'video' && form.videos.length > 0)
  console.log('hasBasicInfo:', hasBasicInfo)
  console.log('hasMedia:', hasMedia)
  console.log('hasMedia:', form)
  return hasBasicInfo && hasMedia
})

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
  }
  tagInput.value = ''
}

const removeTag = (idx) => {
  form.tags.splice(idx, 1)
}

const handlePhotosUpdate = (paths) => {
  form.photos = paths
}

const handleVideosUpdate = (paths) => {
  form.videos = paths
}

const handleLocationSelect = (location) => {
  form.location = location
}

const handleLocationRemove = () => {
  form.location = null
}

const handleSubmit = () => {
  if (!isValid.value) return
  
  const record = {
    title: form.title.trim(),
    date: form.date,
    type: form.type,
    level: form.level,
    description: form.description.trim(),
    location: form.location ? JSON.stringify({
      lng: form.location.lng,
      lat: form.location.lat,
      name: form.location.name,
      address: form.location.address
    }) : null,
    tags: [...form.tags],
    photos: form.type === 'photo' ? form.photos : [],
    videos: form.type === 'video' ? form.videos : []
  }
  
  console.log('提交记录数据:', record)
  emit('save', record)
}

// 监听类型变化，清空已上传的文件
watch(() => form.type, (newType) => {
  if (newType === 'photo') {
    if (videoUploader.value) {
      videoUploader.value.clearFiles()
    }
    form.videos = []
  } else if (newType === 'video') {
    if (photoUploader.value) {
      photoUploader.value.clearFiles()
    }
    form.photos = []
  }
})
</script>

<style scoped>
.modal-overlay {
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

.add-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: #666;
}

.close-btn:hover {
  background: #eee;
  transform: rotate(90deg);
}

.modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.modal-form {
  padding: 20px 24px 24px;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  flex: 1;
}

.form-group.full {
  flex: 1 1 100%;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: #fafafa;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #7d8a9a;
  background: white;
  box-shadow: 0 0 0 3px rgba(125, 138, 154, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.level-select {
  display: flex;
  gap: 8px;
}

.level-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fafafa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  transition: all 0.2s ease;
}

.level-btn:hover {
  border-color: #ccc;
}

.level-btn.active {
  border-color: currentColor;
  background: rgba(125, 138, 154, 0.1);
}

.level-btn:nth-child(1).active {
  color: #a0a0a0;
}

.level-btn:nth-child(2).active {
  color: #b5a085;
}

.level-btn:nth-child(3).active {
  color: #b58585;
}

.tags-input {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px;
  background: #fafafa;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(125, 138, 154, 0.1);
  color: #7d8a9a;
  border-radius: 4px;
  font-size: 12px;
}

.tag-chip button {
  border: none;
  background: none;
  cursor: pointer;
  color: #999;
  padding: 0;
  font-size: 14px;
  line-height: 1;
}

.tag-chip button:hover {
  color: #e74c3c;
}

.tags-input input {
  border: none !important;
  background: transparent !important;
  padding: 4px !important;
  box-shadow: none !important;
}

.location-select-btn {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
}

.location-select-btn:hover {
  border-color: #ccc;
  background: #f5f5f5;
}

.location-select-btn svg {
  flex-shrink: 0;
}

.location-text {
  flex: 1;
  text-align: left;
  color: #333;
  font-weight: 500;
}

.location-remove-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 50%;
  cursor: pointer;
  color: #e74c3c;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.location-remove-btn:hover {
  background: #e74c3c;
  color: white;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn {
  padding: 10px 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #f5f5f5;
}

.submit-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #7d8a9a 0%, #9a8c7c 100%);
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(125, 138, 154, 0.3);
}

.submit-btn:disabled {
  background: #ddd;
  cursor: not-allowed;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .add-modal,
.modal-leave-to .add-modal {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}

.modal-enter-active .add-modal,
.modal-leave-active .add-modal {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
