<template>
  <div class="file-uploader">
    <div 
      class="drop-zone" 
      :class="{ 'is-dragging': isDragging, 'has-files': files.length > 0 }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input 
        ref="fileInput"
        type="file" 
        :multiple="multiple"
        :accept="acceptTypes"
        @change="handleFileSelect"
        hidden
      />
      
      <div v-if="files.length === 0" class="upload-placeholder" @click="triggerFileInput">
        <svg class="upload-icon" viewBox="0 0 24 24" width="48" height="48">
          <path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
        </svg>
        <p class="upload-text">{{ placeholder }}</p>
        <p class="upload-hint">或拖拽文件到此处</p>
      </div>
      
      <div v-else class="file-list">
        <div 
          v-for="(file, index) in files" 
          :key="index"
          class="file-item"
          :class="{ 'uploading': file.uploading, 'error': file.error }"
        >
          <div class="file-preview">
            <img v-if="file.preview" :src="file.preview" :alt="file.name" />
            <div v-else class="file-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
              </svg>
            </div>
          </div>
          
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
          </div>
          
          <div class="file-progress" v-if="file.uploading">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: file.progress + '%' }"></div>
            </div>
          </div>
          
          <div class="file-status" v-if="file.error">
            <span class="error-text">{{ file.error }}</span>
          </div>
          
          <button 
            v-if="!file.uploading && !file.error"
            class="remove-btn" 
            @click="removeFile(index)"
            type="button"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <button 
          v-if="files.length < maxFiles"
          class="add-more-btn" 
          @click="triggerFileInput"
          type="button"
        >
          + 添加更多
        </button>
      </div>
    </div>
    
    <div v-if="uploadError" class="upload-error">
      {{ uploadError }}
    </div>
  </div>
</template>

<script setup>
/**
 * @fileOverview FileUploader.vue - 通用文件上传组件
 * 
 * 功能描述：
 * 1. 拖拽或点击选择文件
 * 2. 显示文件预览和上传进度
 * 3. 支持多个文件同时上传
 * 4. 上传到服务器并返回文件路径
 */

import { ref, computed } from 'vue'
import * as api from '../services/api.js'

const props = defineProps({
  /** 是否支持多文件 */
  multiple: {
    type: Boolean,
    default: true
  },
  /** 最大文件数量 */
  maxFiles: {
    type: Number,
    default: 10
  },
  /** 接受的MIME类型 */
  acceptTypes: {
    type: String,
    default: 'image/*,video/*'
  },
  /** 日期（用于文件分类存储） */
  date: {
    type: String,
    default: ''
  },
  /** 占位文字 */
  placeholder: {
    type: String,
    default: '点击或拖拽上传文件'
  }
})

const emit = defineEmits(['update:files', 'upload-complete'])

const fileInput = ref(null)
const isDragging = ref(false)
const files = ref([])
const uploadError = ref('')
const uploadingCount = ref(0)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e) => {
  const selectedFiles = Array.from(e.target.files || [])
  addFiles(selectedFiles)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const droppedFiles = Array.from(e.dataTransfer.files || [])
  addFiles(droppedFiles)
}

const addFiles = async (newFiles) => {
  const remainingSlots = props.maxFiles - files.value.length
  
  for (let i = 0; i < Math.min(newFiles.length, remainingSlots); i++) {
    const file = newFiles[i]
    
    // 创建预览
    let preview = null
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file)
    }
    
    const fileItem = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview,
      uploading: true,
      progress: 0,
      error: '',
      path: null,
      url: null
    }
    
    files.value.push(fileItem)
    
    // 开始上传
    await uploadFile(fileItem)
  }
  
  emit('update:files', files.value.map(f => f.path).filter(p => p))
}

const uploadFile = async (fileItem) => {
  try {
    const formData = new FormData()
    formData.append('file', fileItem.file)
    formData.append('date', props.date)
    
    const xhr = new XMLHttpRequest()
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        fileItem.progress = Math.round((e.loaded / e.total) * 100)
      }
    }
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText)
        fileItem.uploading = false
        fileItem.path = result.data.filePath
        fileItem.url = result.data.url
        fileItem.progress = 100
        
        checkUploadComplete()
      } else {
        throw new Error(xhr.responseText || '上传失败')
      }
    }
    
    xhr.onerror = () => {
      throw new Error('网络错误，上传失败')
    }
    
    xhr.open('POST', 'http://localhost:3000/api/upload')
    xhr.send(formData)
    
  } catch (error) {
    fileItem.uploading = false
    fileItem.error = error.message
    uploadingCount.value--
    uploadError.value = '部分文件上传失败'
  }
}

const checkUploadComplete = () => {
  uploadingCount.value--
  if (uploadingCount.value === 0) {
    emit('upload-complete', files.value.map(f => f.path).filter(p => p))
  }
}

const removeFile = (index) => {
  const file = files.value[index]
  
  // 释放预览URL
  if (file.preview) {
    URL.revokeObjectURL(file.preview)
  }
  
  files.value.splice(index, 1)
  emit('update:files', files.value.map(f => f.path).filter(p => p))
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 暴露方法给父组件
defineExpose({
  getFiles: () => files.value.map(f => f.path).filter(p => p),
  clearFiles: () => {
    files.value.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview)
    })
    files.value = []
  }
})
</script>

<style scoped>
.file-uploader {
  width: 100%;
}

.drop-zone {
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
  background: #fafafa;
}

.drop-zone:hover,
.drop-zone.is-dragging {
  border-color: #7d8a9a;
  background: rgba(125, 138, 154, 0.05);
}

.drop-zone.has-files {
  padding: 12px;
}

.upload-placeholder {
  text-align: center;
  padding: 30px;
  cursor: pointer;
}

.upload-placeholder:hover .upload-icon {
  color: #7d8a9a;
  transform: translateY(-2px);
}

.upload-icon {
  color: #bbb;
  transition: all 0.2s ease;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #666;
  margin: 0 0 4px 0;
}

.upload-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #eee;
}

.file-preview {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
  flex-shrink: 0;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbb;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 11px;
  color: #999;
}

.file-progress {
  width: 80px;
}

.progress-bar {
  height: 4px;
  background: #eee;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #7d8a9a 0%, #9a8c7c 100%);
  transition: width 0.2s ease;
}

.file-status {
  flex: 1;
}

.error-text {
  font-size: 12px;
  color: #e74c3c;
}

.remove-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.add-more-btn {
  padding: 10px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  color: #7d8a9a;
  font-size: 13px;
  transition: all 0.2s ease;
}

.add-more-btn:hover {
  border-color: #7d8a9a;
  background: rgba(125, 138, 154, 0.05);
}

.upload-error {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 6px;
  font-size: 12px;
  color: #e74c3c;
}
</style>
