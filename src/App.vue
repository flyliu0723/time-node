<template>
  <div class="app">
    <GridBackground />
    <Timeline :records="store.records" @select="openDetail" @add="openAddModal" />
    <DetailModal 
      v-if="store.selectedRecord" 
      :record="store.selectedRecord"
      @close="closeDetail"
    />
    <AddRecordModal 
      v-if="showAddModal"
      @close="closeAddModal"
      @save="saveNewRecord"
    />
    <!-- 创建第一个时间轴的弹窗 -->
    <CreateFirstTimelineModal
      v-if="showCreateTimelineModal"
      @close="closeCreateTimelineModal"
      @created="onTimelineCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GridBackground from './components/GridBackground.vue'
import Timeline from './components/Timeline.vue'
import DetailModal from './components/DetailModal.vue'
import AddRecordModal from './components/AddRecordModal.vue'
import CreateFirstTimelineModal from './components/CreateFirstTimelineModal.vue'
import { useTimelineStore } from './stores/timeline'

const store = useTimelineStore()
const showAddModal = ref(false)
const showCreateTimelineModal = ref(false)

const openDetail = (record) => {
  store.selectRecord(record)
}

const closeDetail = () => {
  store.clearSelection()
}

const openAddModal = () => {
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
}

const closeCreateTimelineModal = () => {
  showCreateTimelineModal.value = false
}

const onTimelineCreated = async (timeline) => {
  showCreateTimelineModal.value = false
  // 切换到新创建的时间轴
  await store.switchTimeline(timeline.id)
  // 打开添加记录的弹窗
  showAddModal.value = true
}

const saveNewRecord = async (record) => {
  try {
    await store.addRecord(record)
    closeAddModal()
  } catch (err) {
    alert('添加记录失败: ' + err.message)
  }
}

onMounted(async () => {
  await store.loadTimelines()
  
  // 如果没有时间轴，显示创建时间轴弹窗
  if (store.timelines.length === 0) {
    showCreateTimelineModal.value = true
  } else if (!store.currentTimelineId) {
    // 加载第一个时间轴
    await store.switchTimeline(store.timelines[0].id)
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
}

.app {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
