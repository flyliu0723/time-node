import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '../services/api.js'

/**
 * @fileOverview timeline.js - 时间轴状态管理 Store
 * 
 * 功能描述：
 * 1. 管理多个时间轴（timeline）
 * 2. 每个时间轴有自己的记录列表
 * 3. 支持时间轴的增删改查和切换
 * 4. 提供记录的增删改查操作
 * 5. 处理筛选和排序逻辑
 * 
 * 数据结构：
 * - timelines: 时间轴列表
 * - currentTimelineId: 当前时间轴ID
 * - records: 当前时间轴的记录列表
 */

export const useTimelineStore = defineStore('timeline', () => {
  /** 时间轴列表 */
  const timelines = ref([])
  
  /** 当前选中的时间轴ID */
  const currentTimelineId = ref(null)
  
  /** 当前时间轴的记录列表 */
  const records = ref([])
  
  /** 当前选中的记录 */
  const selectedRecord = ref(null)
  
  /** 加载状态 */
  const loading = ref(false)
  
  /** 错误信息 */
  const error = ref(null)
  
  /** 筛选条件配置 */
  const filters = ref({
    minLevel: 1,
    types: ['photo', 'video', 'text']
  })

  /** 当前时间轴信息 */
  const currentTimeline = computed(() => {
    return timelines.value.find(t => t.id === currentTimelineId.value) || null
  })

  /** 按筛选条件过滤后的记录 */
  const filteredRecords = computed(() => {
    return records.value.filter(record => {
      if (record.level < filters.value.minLevel) return false
      if (!filters.value.types.includes(record.type)) return false
      return true
    })
  })

  const sortedRecords = computed(() => {
    return [...filteredRecords.value].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    )
  })

  const firstRecord = computed(() => {
    return sortedRecords.value[0] || null
  })

  const lastRecord = computed(() => {
    return sortedRecords.value[sortedRecords.value.length - 1] || null
  })

  const recordCount = computed(() => records.value.length)

  const levels = computed(() => {
    const set = new Set(records.value.map(r => r.level))
    return [...set].sort((a, b) => a - b)
  })

  const years = computed(() => {
    const set = new Set(records.value.map(r => new Date(r.date).getFullYear()))
    return [...set].sort((a, b) => a - b)
  })

  const tags = computed(() => {
    const allTags = records.value.flatMap(r => r.tags || [])
    const counts = {}
    allTags.forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  })

  /** 加载所有时间轴 */
  async function loadTimelines() {
    try {
      loading.value = true
      error.value = null
      const result = await api.getTimelines()
      // 将 snake_case 转换为 camelCase
      timelines.value = (result.data || []).map(t => ({
        id: t.id,
        name: t.name,
        startDate: t.start_date,
        remark: t.remark,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        recordCount: t.record_count
      }))
    } catch (err) {
      error.value = err.message
      console.error('加载时间轴列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  /** 加载时间轴及其记录 */
  async function loadTimelineWithRecords(timelineId) {
    try {
      loading.value = true
      error.value = null
      const result = await api.switchTimeline(timelineId)
      
      if (result.data) {
        const t = result.data.timeline
        // 将 snake_case 转换为 camelCase
        const timeline = {
          id: t.id,
          name: t.name,
          startDate: t.start_date,
          remark: t.remark,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          recordCount: t.record_count
        }
        
        const timelineRecords = (result.data.records || []).map(r => ({
          id: r.id,
          timelineId: r.timeline_id,
          title: r.title,
          description: r.description,
          date: r.date,
          type: r.type,
          level: r.level,
          location: r.location,
          tags: r.tags || [],
          photos: (r.photos || []).map(p => '/uploads/image/' + p),
          videos: (r.videos || []).map(v => '/uploads/video/' + v),
          videoUrl: r.video_url ? '/uploads/video/' + r.video_url : null,
          mediaPath: r.media_path,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }))
        
        // 更新时间轴列表
        const existingIndex = timelines.value.findIndex(t => t.id === timeline.id)
        if (existingIndex >= 0) {
          timelines.value[existingIndex] = timeline
        } else {
          timelines.value.push(timeline)
        }
        
        currentTimelineId.value = timeline.id
        records.value = timelineRecords
        selectedRecord.value = null
      }
    } catch (err) {
      error.value = err.message
      console.error('加载时间轴失败:', err)
    } finally {
      loading.value = false
    }
  }

  /** 加载当前时间轴的记录 */
  async function loadRecords(timelineId) {
    try {
      loading.value = true
      const result = await api.getRecords(timelineId)
      records.value = (result.data || []).map(r => ({
        id: r.id,
        timelineId: r.timeline_id,
        title: r.title,
        description: r.description,
        date: r.date,
        type: r.type,
        level: r.level,
        location: r.location,
        tags: r.tags || [],
        photos: (r.photos || []).map(p => '/uploads/image/' + p),
        videos: (r.videos || []).map(v => '/uploads/video/' + v),
        videoUrl: r.video_url ? '/uploads/video/' + r.video_url : null,
        mediaPath: r.media_path,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }))
    } catch (err) {
      error.value = err.message
      console.error('加载记录失败:', err)
    } finally {
      loading.value = false
    }
  }

  /** 创建新时间轴 */
  async function createTimeline(name, startDate, remark = '') {
    try {
      loading.value = true
      error.value = null
      const result = await api.createTimeline({ name, startDate, remark })
      
      if (result.data) {
        const t = result.data
        // 将 snake_case 转换为 camelCase
        const timeline = {
          id: t.id,
          name: t.name,
          startDate: t.start_date,
          remark: t.remark,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          recordCount: t.record_count
        }
        timelines.value.push(timeline)
        currentTimelineId.value = timeline.id
        records.value = []
        return timeline
      }
    } catch (err) {
      error.value = err.message
      console.error('创建时间轴失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 更新时间轴信息 */
  async function updateTimeline(id, updates) {
    try {
      loading.value = true
      error.value = null
      const result = await api.updateTimeline(id, updates)
      
        const t = result.data
        // 将 snake_case 转换为 camelCase
        const updatedTimeline = {
          id: t.id,
          name: t.name,
          startDate: t.start_date,
          remark: t.remark,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          recordCount: t.record_count
        }
        const index = timelines.value.findIndex(t => t.id === id)
        if (index >= 0) {
          timelines.value[index] = updatedTimeline
        }
    } catch (err) {
      error.value = err.message
      console.error('更新时间轴失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 删除时间轴 */
  async function deleteTimeline(id) {
    try {
      loading.value = true
      error.value = null
      await api.deleteTimeline(id)
      
      const index = timelines.value.findIndex(t => t.id === id)
      if (index >= 0) {
        timelines.value.splice(index, 1)
        delete records.value
        records.value = []
        
        if (currentTimelineId.value === id && timelines.value.length > 0) {
          currentTimelineId.value = timelines.value[0].id
          await loadRecords(currentTimelineId.value)
        }
      }
    } catch (err) {
      error.value = err.message
      console.error('删除时间轴失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 切换当前时间轴 */
  async function switchTimeline(id) {
    await loadTimelineWithRecords(id)
  }

  /** 添加记录到当前时间轴 */
  async function addRecord(record) {
    if (!currentTimelineId.value) {
      throw new Error('请先选择一个时间轴')
    }
    
    try {
      loading.value = true
      error.value = null
      const result = await api.createRecord(currentTimelineId.value, record)
      
      if (result.data) {
        const r = result.data
        const mappedRecord = {
          id: r.id,
          timelineId: r.timeline_id,
          title: r.title,
          description: r.description,
          date: r.date,
          type: r.type,
          level: r.level,
          location: r.location,
          tags: r.tags || [],
          photos: (r.photos || []).map(p => '/uploads/image/' + p),
          videos: (r.videos || []).map(v => '/uploads/video/' + v),
          videoUrl: r.video_url ? '/uploads/video/' + r.video_url : null,
          mediaPath: r.media_path,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }
        records.value.push(mappedRecord)
        records.value.sort((a, b) => new Date(a.date) - new Date(b.date))
        return result.data
      }
    } catch (err) {
      error.value = err.message
      console.error('添加记录失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 更新记录 */
  async function updateRecord(id, updates) {
    try {
      loading.value = true
      error.value = null
      const result = await api.updateRecord(id, updates)
      
      if (result.data) {
        const r = result.data
        const mappedRecord = {
          id: r.id,
          timelineId: r.timeline_id,
          title: r.title,
          description: r.description,
          date: r.date,
          type: r.type,
          level: r.level,
          location: r.location,
          tags: r.tags || [],
          photos: (r.photos || []).map(p => '/uploads/image/' + p),
          videos: (r.videos || []).map(v => '/uploads/video/' + v),
          videoUrl: r.video_url ? '/uploads/video/' + r.video_url : null,
          mediaPath: r.media_path,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }
        const index = records.value.findIndex(rec => rec.id === id)
        if (index >= 0) {
          records.value[index] = mappedRecord
        }
      }
    } catch (err) {
      error.value = err.message
      console.error('更新记录失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 删除记录 */
  async function deleteRecord(id) {
    try {
      loading.value = true
      error.value = null
      await api.deleteRecord(id)
      
      const index = records.value.findIndex(r => r.id === id)
      if (index >= 0) {
        records.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err.message
      console.error('删除记录失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function selectRecord(record) {
    selectedRecord.value = record
  }

  function clearSelection() {
    selectedRecord.value = null
  }

  function setFilter(key, value) {
    filters.value[key] = value
  }

  function getRecordById(id) {
    return records.value.find(r => r.id == id)
  }

  function getNearestRecord(date) {
    const targetDate = new Date(date)
    let nearest = null
    let minDiff = Infinity
    
    records.value.forEach(record => {
      const recordDate = new Date(record.date)
      const diff = Math.abs(targetDate - recordDate)
      if (diff < minDiff) {
        minDiff = diff
        nearest = record
      }
    })
    
    return nearest
  }

  function getRecordsInRange(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return records.value.filter(record => {
      const date = new Date(record.date)
      return date >= start && date <= end
    })
  }

  return {
    // State
    timelines,
    currentTimelineId,
    records,
    selectedRecord,
    loading,
    error,
    filters,
    
    // Computed
    currentTimeline,
    filteredRecords,
    sortedRecords,
    firstRecord,
    lastRecord,
    recordCount,
    levels,
    years,
    tags,
    
    // Actions - Timeline
    loadTimelines,
    createTimeline,
    updateTimeline,
    deleteTimeline,
    switchTimeline,
    
    // Actions - Records
    loadRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    selectRecord,
    clearSelection,
    setFilter,
    getRecordById,
    getNearestRecord,
    getRecordsInRange
  }
})
