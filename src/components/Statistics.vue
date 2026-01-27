<template>
  <div class="stats-modal" v-if="visible" @click.self="close">
    <div class="stats-content">
      <div class="stats-header">
        <h2 class="stats-title">数据统计</h2>
        <button class="close-btn" @click="close">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="stats-body">
        <div class="metrics-section">
          <div class="metric-card">
            <div class="metric-value">{{ totalRecords }}</div>
            <div class="metric-label">累计记录</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ streak }} 天</div>
            <div class="metric-label">持续天数</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ monthlyRecords }} 条</div>
            <div class="metric-label">本月产出</div>
          </div>
          <div class="metric-card">
            <div class="metric-value keywords">{{ topKeywords }}</div>
            <div class="metric-label">核心关键词</div>
          </div>
        </div>

        <div class="charts-section">
          <div class="heatmap-container">
            <div class="section-title">时间分布</div>
            <div class="heatmap">
              <div 
                v-for="(week, weekIndex) in heatmapData" 
                :key="weekIndex"
                class="heatmap-week"
              >
                <div 
                  v-for="(day, dayIndex) in week" 
                  :key="dayIndex"
                  class="heatmap-cell"
                  :class="getHeatmapClass(day.count)"
                  :title="`${day.date}: ${day.count} 条记录`"
                  @click="selectDay(day)"
                >
                </div>
              </div>
            </div>
            <div class="heatmap-legend">
              <span>少</span>
              <div class="legend-scale">
                <div class="legend-item" :class="'level-0'"></div>
                <div class="legend-item" :class="'level-1'"></div>
                <div class="legend-item" :class="'level-2'"></div>
                <div class="legend-item" :class="'level-3'"></div>
                <div class="legend-item" :class="'level-4'"></div>
              </div>
              <span>多</span>
            </div>
          </div>

          <div class="side-charts">
            <div class="wordcloud-container">
              <div class="section-title">高频标签</div>
              <div class="wordcloud">
                <span 
                  v-for="tag in wordCloudData" 
                  :key="tag.text"
                  class="word-tag"
                  :style="{ 
                    fontSize: `${tag.size}px`,
                    opacity: tag.opacity 
                  }"
                >
                  #{{ tag.text }}
                </span>
              </div>
            </div>

            <div class="category-container">
              <div class="section-title">类别占比</div>
              <div class="category-chart">
                <svg viewBox="0 0 200 200" class="pie-chart">
                  <circle 
                    v-for="(slice, index) in pieSlices" 
                    :key="index"
                    :cx="100" 
                    :cy="100" 
                    :r="80"
                    :fill="slice.color"
                    :stroke-dasharray="`${slice.dashArray} ${slice.circumference}`"
                    :stroke-dashoffset="slice.offset"
                    :transform="`rotate(${slice.rotation} 100 100)`"
                    stroke-width="30"
                    fill="none"
                  />
                </svg>
                <div class="category-legend">
                  <div 
                    v-for="(item, index) in categoryData" 
                    :key="index"
                    class="legend-item"
                  >
                    <div class="legend-color" :style="{ background: item.color }"></div>
                    <span class="legend-label">{{ item.label }}</span>
                    <span class="legend-value">{{ item.percentage }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="day-summary" v-if="selectedDay">
          <div class="summary-header">
            <h3>{{ selectedDay.date }}</h3>
            <span class="summary-count">{{ selectedDayRecords.length }} 条记录</span>
          </div>
          <div class="summary-list">
            <div 
              v-for="record in selectedDayRecords" 
              :key="record.id"
              class="summary-item"
            >
              <div class="item-type" :class="record.type">{{ record.type }}</div>
              <div class="item-content">
                <div class="item-title">{{ record.title }}</div>
                <div class="item-tags">
                  <span v-for="tag in record.tags" :key="tag" class="tag">#{{ tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="map-section">
          <div class="section-title">地图分布</div>
          <div class="map-placeholder">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="#ddd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <p>地图功能开发中...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTimelineStore } from '../stores/timeline'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const store = useTimelineStore()
const selectedDay = ref(null)

const records = computed(() => store.records)

const totalRecords = computed(() => records.value.length)

const streak = computed(() => {
  if (records.value.length === 0) return 0
  
  const sortedDates = [...new Set(records.value.map(r => r.date))].sort().reverse()
  let currentStreak = 0
  let checkDate = new Date()
  
  for (const dateStr of sortedDates) {
    const recordDate = new Date(dateStr)
    const diffDays = Math.floor((checkDate - recordDate) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0 || diffDays === 1) {
      currentStreak++
      checkDate = recordDate
    } else {
      break
    }
  }
  
  return currentStreak
})

const monthlyRecords = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return records.value.filter(r => {
    const recordDate = new Date(r.date)
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
  }).length
})

const topKeywords = computed(() => {
  const tagCounts = {}
  records.value.forEach(r => {
    r.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => `#${tag}`)
  
  return sortedTags.join(' ')
})

const heatmapData = computed(() => {
  const weeks = []
  const today = new Date()
  const oneYearAgo = new Date(today)
  oneYearAgo.setDate(oneYearAgo.getDate() - 364)
  
  const dateCounts = {}
  records.value.forEach(r => {
    dateCounts[r.date] = (dateCounts[r.date] || 0) + 1
  })
  
  let currentDate = new Date(oneYearAgo)
  let currentWeek = []
  
  for (let i = 0; i < 53; i++) {
    currentWeek = []
    for (let j = 0; j < 7; j++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      currentWeek.push({
        date: dateStr,
        count: dateCounts[dateStr] || 0
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weeks.push(currentWeek)
  }
  
  return weeks
})

const wordCloudData = computed(() => {
  const tagCounts = {}
  records.value.forEach(r => {
    r.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  
  const maxCount = Math.max(...Object.values(tagCounts), 1)
  
  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([text, count]) => ({
      text,
      size: 12 + (count / maxCount) * 16,
      opacity: 0.6 + (count / maxCount) * 0.4
    }))
})

const categoryData = computed(() => {
  const typeCounts = {}
  records.value.forEach(r => {
    typeCounts[r.type] = (typeCounts[r.type] || 0) + 1
  })
  
  const total = records.value.length || 1
  const colors = ['#7d8a9a', '#9a8c7c', '#b8a99a', '#d4c5b5', '#e8ddd1']
  
  return Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count], index) => ({
      label: type,
      count,
      percentage: Math.round((count / total) * 100),
      color: colors[index % colors.length]
    }))
})

const pieSlices = computed(() => {
  const total = records.value.length || 1
  const circumference = 2 * Math.PI * 80
  let currentOffset = 0
  
  return categoryData.value.map(item => {
    const percentage = item.count / total
    const dashArray = circumference * percentage
    const slice = {
      dashArray,
      circumference,
      offset: -currentOffset,
      rotation: 0,
      color: item.color
    }
    currentOffset += dashArray
    return slice
  })
})

const selectedDayRecords = computed(() => {
  if (!selectedDay.value) return []
  return records.value.filter(r => r.date === selectedDay.value.date)
})

const getHeatmapClass = (count) => {
  if (count === 0) return 'level-0'
  if (count === 1) return 'level-1'
  if (count <= 3) return 'level-2'
  if (count <= 5) return 'level-3'
  return 'level-4'
}

const selectDay = (day) => {
  if (day.count > 0) {
    selectedDay.value = day
  }
}

const close = () => {
  emit('close')
}

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    selectedDay.value = null
  }
})
</script>

<style scoped>
.stats-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.stats-content {
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.stats-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #666;
}

.stats-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.metrics-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.metric-card {
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  text-align: center;
  transition: all 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #7d8a9a;
  margin-bottom: 8px;
}

.metric-value.keywords {
  font-size: 16px;
  line-height: 1.4;
}

.metric-label {
  font-size: 12px;
  color: #999;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  margin-bottom: 32px;
}

.heatmap-container {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.heatmap {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.heatmap-week {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.heatmap-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.heatmap-cell:hover {
  transform: scale(1.2);
}

.heatmap-cell.level-0 {
  background: #ebedf0;
}

.heatmap-cell.level-1 {
  background: #9be9a8;
}

.heatmap-cell.level-2 {
  background: #40c463;
}

.heatmap-cell.level-3 {
  background: #30a14e;
}

.heatmap-cell.level-4 {
  background: #216e39;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 11px;
  color: #999;
}

.legend-scale {
  display: flex;
  gap: 2px;
}

.legend-item {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-item.level-0 {
  background: #ebedf0;
}

.legend-item.level-1 {
  background: #9be9a8;
}

.legend-item.level-2 {
  background: #40c463;
}

.legend-item.level-3 {
  background: #30a14e;
}

.legend-item.level-4 {
  background: #216e39;
}

.side-charts {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.wordcloud-container,
.category-container {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.wordcloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.word-tag {
  color: #7d8a9a;
  cursor: pointer;
  transition: all 0.2s ease;
}

.word-tag:hover {
  opacity: 1 !important;
  transform: scale(1.1);
}

.category-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.pie-chart {
  width: 160px;
  height: 160px;
}

.category-legend {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-legend .legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-label {
  flex: 1;
  color: #666;
}

.legend-value {
  font-weight: 600;
  color: #333;
}

.day-summary {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.summary-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.summary-count {
  font-size: 12px;
  color: #999;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.summary-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.item-type {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.item-type.text {
  background: #7d8a9a;
}

.item-type.photo {
  background: #9a8c7c;
}

.item-type.video {
  background: #b8a99a;
}

.item-content {
  flex: 1;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.item-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  color: #7d8a9a;
  background: rgba(125, 138, 154, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.map-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #999;
}

.map-placeholder svg {
  margin-bottom: 12px;
}

.map-placeholder p {
  font-size: 14px;
  margin: 0;
}

@media (max-width: 768px) {
  .metrics-section {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .side-charts {
    flex-direction: column;
  }
}
</style>
