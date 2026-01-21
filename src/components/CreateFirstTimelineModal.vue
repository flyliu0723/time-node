<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="modal-overlay">
        <div class="create-timeline-modal">
          <div class="modal-header">
            <h2>欢迎使用时间轴</h2>
            <p class="subtitle">创建你的第一个时间轴，记录生活中的美好时刻</p>
          </div>
          
          <form class="modal-form" @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>时间轴名称 *</label>
              <input 
                v-model="form.name" 
                type="text" 
                placeholder="如：桉桉的人生、我的旅行记录"
                required
                maxlength="20"
                ref="nameInput"
              />
            </div>
            
            <div class="form-group">
              <label>起始日期 *</label>
              <input 
                v-model="form.startDate" 
                type="date"
                required
              />
            </div>
            
            <div class="form-group">
              <label>备注</label>
              <textarea 
                v-model="form.remark" 
                placeholder="可选，简单描述这个时间轴的用途"
                rows="2"
                maxlength="100"
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="submit-btn" :disabled="!isValid">
                创建时间轴
              </button>
            </div>
          </form>
          
          <div class="modal-tips">
            <p>💡 提示：创建后可以在左上角切换不同的时间轴</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTimelineStore } from '../stores/timeline'

const emit = defineEmits(['close', 'created'])

const store = useTimelineStore()
const nameInput = ref(null)

const form = ref({
  name: '',
  startDate: new Date().toISOString().split('T')[0],
  remark: ''
})

const isValid = computed(() => {
  return form.value.name.trim() && form.value.startDate
})

const handleSubmit = async () => {
  if (!isValid.value) return
  
  try {
    const timeline = await store.createTimeline(
      form.value.name.trim(),
      form.value.startDate,
      form.value.remark.trim()
    )
    emit('created', timeline)
  } catch (err) {
    alert('创建失败: ' + err.message)
  }
}

onMounted(() => {
  // 自动聚焦到输入框
  if (nameInput.value) {
    nameInput.value.focus()
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
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.create-timeline-modal {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 420px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  text-align: center;
  margin-bottom: 24px;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #888;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.2s ease;
  background: #fafafa;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #7d8a9a;
  background: white;
  box-shadow: 0 0 0 3px rgba(125, 138, 154, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.form-actions {
  margin-top: 8px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #7d8a9a 0%, #9a8c7c 100%);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(125, 138, 154, 0.3);
}

.submit-btn:disabled {
  background: #ddd;
  cursor: not-allowed;
}

.modal-tips {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.modal-tips p {
  font-size: 12px;
  color: #aaa;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .create-timeline-modal,
.modal-leave-to .create-timeline-modal {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

.modal-enter-active .create-timeline-modal,
.modal-leave-active .create-timeline-modal {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
