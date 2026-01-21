/**
 * @fileOverview Express服务器入口
 * 时间轴后端API服务
 */

import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { initDatabase, saveDatabase, getDb } from './database.js'
import timelineService from './timelineService.js'
import recordService from './recordService.js'
import { handleUpload, handleMultipleUpload, deleteFile } from './upload.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务 - 上传的图片和视频
const DATA_DIR = path.resolve(__dirname, '../data')
app.use('/uploads', express.static(DATA_DIR))

// API路由
// ============= 时间轴相关 =============

/**
 * 获取所有时间轴
 */
app.get('/api/timelines', (req, res) => {
  try {
    const timelines = timelineService.getAllTimelines()
    res.json({ success: true, data: timelines })
  } catch (error) {
    console.error('获取时间轴列表失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 获取单个时间轴
 */
app.get('/api/timelines/:id', (req, res) => {
  try {
    const timeline = timelineService.getTimelineById(req.params.id)
    if (!timeline) {
      return res.status(404).json({ success: false, error: '时间轴不存在' })
    }
    res.json({ success: true, data: timeline })
  } catch (error) {
    console.error('获取时间轴失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 创建时间轴
 */
app.post('/api/timelines', (req, res) => {
  try {
    const { name, startDate, remark } = req.body
    
    if (!name || !startDate) {
      return res.status(400).json({ success: false, error: '名称和起始日期不能为空' })
    }
    
    const id = timelineService.createTimeline(name, startDate, remark || '')
    const timeline = timelineService.getTimelineById(id)
    
    res.json({ success: true, data: timeline })
  } catch (error) {
    console.error('创建时间轴失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 更新时间轴
 */
app.put('/api/timelines/:id', (req, res) => {
  try {
    const { name, startDate, remark } = req.body
    const updates = {}
    
    if (name !== undefined) updates.name = name
    if (startDate !== undefined) updates.startDate = startDate
    if (remark !== undefined) updates.remark = remark
    
    const success = timelineService.updateTimeline(req.params.id, updates)
    
    if (!success) {
      return res.status(404).json({ success: false, error: '时间轴不存在或无更新' })
    }
    
    const timeline = timelineService.getTimelineById(req.params.id)
    res.json({ success: true, data: timeline })
  } catch (error) {
    console.error('更新时间轴失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 删除时间轴
 */
app.delete('/api/timelines/:id', (req, res) => {
  try {
    const success = timelineService.deleteTimeline(req.params.id)
    
    if (!success) {
      return res.status(404).json({ success: false, error: '时间轴不存在' })
    }
    
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('删除时间轴失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 切换时间轴（获取时间轴及其所有记录）
 */
app.get('/api/timelines/:id/switch', (req, res) => {
  try {
    const data = timelineService.switchTimeline(req.params.id)
    
    if (!data) {
      return res.status(404).json({ success: false, error: '时间轴不存在' })
    }
    
    res.json({ success: true, data })
  } catch (error) {
    console.error('切换时间轴失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ============= 记录相关 =============

/**
 * 获取时间轴的所有记录
 */
app.get('/api/timelines/:timelineId/records', (req, res) => {
  try {
    const records = recordService.getRecordsByTimelineId(req.params.timelineId)
    res.json({ success: true, data: records })
  } catch (error) {
    console.error('获取记录列表失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 获取单个记录
 */
app.get('/api/records/:id', (req, res) => {
  try {
    const record = recordService.getRecordById(req.params.id)
    if (!record) {
      return res.status(404).json({ success: false, error: '记录不存在' })
    }
    res.json({ success: true, data: record })
  } catch (error) {
    console.error('获取记录失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 创建记录
 */
app.post('/api/timelines/:timelineId/records', (req, res) => {
  try {
    const { title, description, date, type, level, location, tags, photos, videoUrl, mediaPath } = req.body
    
    if (!title || !date) {
      return res.status(400).json({ success: false, error: '标题和日期不能为空' })
    }
    
    const id = recordService.createRecord({
      timelineId: req.params.timelineId,
      title,
      description: description || '',
      date,
      type: type || 'text',
      level: level || 1,
      location: location || '',
      tags: tags || [],
      photos: photos || [],
      videoUrl: videoUrl || '',
      mediaPath: mediaPath || ''
    })
    
    const record = recordService.getRecordById(id)
    res.json({ success: true, data: record })
  } catch (error) {
    console.error('创建记录失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 更新记录
 */
app.put('/api/records/:id', (req, res) => {
  try {
    const { title, description, date, type, level, location, tags, photos, videoUrl, mediaPath } = req.body
    const updates = {}
    
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (date !== undefined) updates.date = date
    if (type !== undefined) updates.type = type
    if (level !== undefined) updates.level = level
    if (location !== undefined) updates.location = location
    if (videoUrl !== undefined) updates.videoUrl = videoUrl
    if (mediaPath !== undefined) updates.mediaPath = mediaPath
    if (tags !== undefined) updates.tags = tags
    if (photos !== undefined) updates.photos = photos
    
    const success = recordService.updateRecord(req.params.id, updates)
    
    if (!success) {
      return res.status(404).json({ success: false, error: '记录不存在或无更新' })
    }
    
    const record = recordService.getRecordById(req.params.id)
    res.json({ success: true, data: record })
  } catch (error) {
    console.error('更新记录失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * 删除记录
 */
app.delete('/api/records/:id', (req, res) => {
  try {
    // 先获取记录，删除关联的文件
    const record = recordService.getRecordById(req.params.id)
    if (!record) {
      return res.status(404).json({ success: false, error: '记录不存在' })
    }
    
    // 删除媒体文件
    if (record.media_path) {
      deleteFile(record.media_path)
    }
    if (record.photos) {
      record.photos.forEach(photo => {
        // photo可能是相对路径或完整路径
        const photoPath = path.isAbsolute(photo) ? photo : path.join(DATA_DIR, photo)
        deleteFile(photoPath)
      })
    }
    
    const success = recordService.deleteRecord(req.params.id)
    
    if (!success) {
      return res.status(404).json({ success: false, error: '记录不存在' })
    }
    
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('删除记录失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ============= 文件上传 =============

/**
 * 上传单文件
 */
app.post('/api/upload', handleUpload, (req, res) => {
  res.json({ 
    success: true, 
    data: req.uploadResult 
  })
})

/**
 * 上传多文件
 */
app.post('/api/upload/multiple', handleMultipleUpload, (req, res) => {
  res.json({ 
    success: true, 
    data: req.uploadResults 
  })
})

// ============= 健康检查 =============

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// ============= 清空数据库（仅开发环境） =============

app.post('/api/admin/clear-all', (req, res) => {
  try {
    const db = getDb()
    // 清空记录表
    db.run('DELETE FROM records')
    // 清空时间轴表
    db.run('DELETE FROM timelines')
    saveDatabase()
    
    res.json({ success: true, message: '所有数据已清空' })
  } catch (error) {
    console.error('清空数据库失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ success: false, error: err.message })
})

// 启动服务器
async function startServer() {
  try {
    await initDatabase()
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                   时间轴服务器已启动                       ║
╠═══════════════════════════════════════════════════════════╣
║  地址: http://localhost:${PORT}                              ║
║  API:  http://localhost:${PORT}/api                          ║
║  上传: http://localhost:${PORT}/uploads                      ║
╚═══════════════════════════════════════════════════════════╝
      `)
    })
  } catch (error) {
    console.error('启动服务器失败:', error)
    process.exit(1)
  }
}

startServer()
