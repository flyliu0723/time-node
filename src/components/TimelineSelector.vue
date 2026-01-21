<template>
  <div class="timeline-selector">
    <div class="selector-trigger" @click="toggleDropdown">
      <div v-if="currentTimeline" class="timeline-info">
        <span class="timeline-name">{{ currentTimeline.name }}</span>
        <span class="timeline-date">{{ formatDate(currentTimeline.startDate) }}</span>
      </div>
      <div v-else class="timeline-info empty">
        <span class="timeline-name">选择时间轴</span>
        <span class="timeline-date">点击创建</span>
      </div>
      <svg class="dropdown-icon" :class="{ open: isOpen }" viewBox="0 0 24 24" width="16" height="16">
        <path fill="currentColor" d="M7 10l5 5 5-5z"/>
      </svg>
    </div>
    
    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <div class="dropdown-header">选择时间轴</div>
        
        <div 
          v-for="timeline in timelines" 
          :key="timeline.id"
          class="dropdown-item"
          :class="{ active: timeline.id === currentTimelineId }"
          @click="selectTimeline(timeline.id)"
        >
          <div class="item-info">
            <span class="item-name">{{ timeline.name }}</span>
            <span class="item-date">{{ formatDate(timeline.startDate) }}</span>
          </div>
          <button 
            v-if="timelines.length > 1"
            class="delete-btn" 
            @click.stop="deleteTimelineHandler(timeline.id)"
            title="删除时间轴"
          >
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
        
        <div v-if="timelines.length === 0" class="empty-state">
          <p>还没有时间轴</p>
          <p class="empty-hint">点击下方创建第一个时间轴</p>
        </div>
        
        <div class="dropdown-divider"></div>
        
        <div class="create-section">
          <div class="create-toggle" @click="showCreateForm = !showCreateForm">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            <span>创建新时间轴</span>
          </div>
          
          <Transition name="slide">
            <div v-if="showCreateForm" class="create-form">
              <div class="form-group">
                <label>名称</label>
                <input 
                  v-model="newTimeline.name" 
                  type="text" 
                  placeholder="如：桉桉的人生"
                  maxlength="20"
                  ref="nameInput"
                />
              </div>
              <div class="form-group">
                <label>起始日期</label>
                <input 
                  v-model="newTimeline.startDate" 
                  type="date"
                />
              </div>
              <div class="form-group">
                <label>备注</label>
                <textarea 
                  v-model="newTimeline.remark" 
                  placeholder="可选"
                  rows="2"
                  maxlength="100"
                ></textarea>
              </div>
              <button 
                class="create-btn" 
                :disabled="!isCreateValid"
                @click="createNewTimeline"
              >
                创建时间轴
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
/**
 * @fileOverview TimelineSelector.vue - 时间轴选择器组件
 * 
 * 功能描述：
 * 1. 显示当前时间轴名称和起始日期
 * 2. 下拉菜单切换不同时间轴
 * 3. 创建新的时间轴
 * 4. 删除时间轴（至少保留一个）
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTimelineStore } from '../stores/timeline'

const store = useTimelineStore()

const isOpen = ref(false)
const showCreateForm = ref(false)

const newTimeline = ref({
  name: '',
  startDate: new Date().toISOString().split('T')[0],
  remark: ''
})

// 使用 store 的属性直接访问，保持响应性
const timelines = computed(() => store.timelines)
const currentTimeline = computed(() => store.currentTimeline)
const currentTimelineId = computed(() => store.currentTimelineId)

const isCreateValid = computed(() => {
  return newTimeline.value.name.trim() && newTimeline.value.startDate
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (!isOpen.value) {
    showCreateForm.value = false
    resetForm()
  }
}

const selectTimeline = async (id) => {
  await store.switchTimeline(id)
  isOpen.value = false
  showCreateForm.value = false
  resetForm()
}

const resetForm = () => {
  newTimeline.value = {
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    remark: ''
  }
}

const createNewTimeline = async () => {
  if (!isCreateValid.value) return
  
  const timeline = await store.createTimeline(
    newTimeline.value.name,
    newTimeline.value.startDate,
    newTimeline.value.remark
  )
  
  await store.switchTimeline(timeline.id)
  isOpen.value = false
  showCreateForm.value = false
  resetForm()
}

const deleteTimelineHandler = async (id) => {
  if (timelines.value.length <= 1) return
  if (confirm('确定要删除这个时间轴吗？所有记录将被删除。')) {
    await store.deleteTimeline(id)
  }
}

const handleClickOutside = (e) => {
  if (!e.target.closest('.timeline-selector')) {
    isOpen.value = false
    showCreateForm.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.timeline-selector {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 200;
}

.selector-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
}

.selector-trigger:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.timeline-info {
  display: flex;
  flex-direction: column;
}

.timeline-info.empty .timeline-name {
  color: #999;
}

.timeline-info.empty .timeline-date {
  color: #bbb;
}

.timeline-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.timeline-date {
  font-size: 11px;
  color: #999;
}

.dropdown-icon {
  color: #999;
  transition: transform 0.2s ease;
}

.dropdown-icon.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
}

.dropdown-header {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #f0f0f0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.dropdown-item:hover {
  background: #f8f8f8;
}

.dropdown-item.active {
  background: rgba(125, 138, 154, 0.1);
}

.empty-state {
  padding: 20px 16px;
  text-align: center;
  color: #999;
}

.empty-state p {
  font-size: 13px;
  margin: 0;
}

.empty-hint {
  font-size: 11px;
  color: #bbb;
  margin-top: 4px !important;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.item-date {
  font-size: 11px;
  color: #999;
}

.delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.dropdown-divider {
  height: 1px;
  background: #f0f0f0;
}

.create-section {
  padding: 8px;
}

.create-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: #7d8a9a;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.create-toggle:hover {
  background: #f5f5f5;
  color: #7d8a9a;
}

.create-form {
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
  margin-top: 8px;
}

.form-group {
  margin-bottom: 10px;
}

.form-group label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #7d8a9a;
  box-shadow: 0 0 0 2px rgba(125, 138, 154, 0.1);
}

.create-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #7d8a9a 0%, #9a8c7c 100%);
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(125, 138, 154, 0.3);
}

.create-btn:disabled {
  background: #ddd;
  cursor: not-allowed;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
