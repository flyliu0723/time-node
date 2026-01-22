/**
 * @fileOverview Express服务器入口
 * 时间轴后端API服务
 */

import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { initDatabase, getDb, saveDatabase } from './database.js'
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

// 静态文件服务
const DATA_DIR = path.resolve(__dirname, '../data')
app.use('/uploads', express.static(DATA_DIR))

// 统一响应格式
function jsonRes(res, code = 200, data = null, message = '') {
  res.json({ code, data, message })
}

// API路由
// ============= 时间轴相关 =============

app.get('/api/timelines', (req, res) => {
  try {
    const timelines = timelineService.getAllTimelines()
    jsonRes(res, 200, timelines, '获取成功')
  } catch (error) {
    console.error('获取时间轴列表失败:', error)
    jsonRes(res, 500, null, error.message)
  }
})

app.get('/api/timelines/:id', (req, res) => {
  try {
    const timeline = timelineService.getTimelineById(req.params.id)
    if (!timeline) {
      return jsonRes(res, 404, null, '时间轴不存在')
    }
    jsonRes(res, 200, timeline, '获取成功')
  } catch (error) {
    console.error('获取时间轴失败:', error)
    jsonRes(res, 500, null, error.message)
  }
})

app.post('/api/timelines', (req, res) => {
  try {
    const { name, startDate, remark } = req.body
    
    if (!name || !startDate) {
      return jsonRes(res, 400, null, '名称和起始日期不能为空')
    }
    
    const timeline = timelineService.createTimeline(name, startDate, remark || '')
    jsonRes(res, 200, timeline, '创建成功')
  } catch (error) {
    console.error('创建时间轴失败:', error)
    jsonRes(res, 500, null, error.message)
  }
})

app.put('/api/timelines/:id', (req, res) => {
  try {
    const { name, startDate, remark } = req.body
    const updates = {}
    
    if (name !== undefined) updates.name = name
    if (startDate !== undefined) updates.startDate = startDate
    if (remark !== undefined) updates.remark = remark
    
    const success = timelineService.updateTimeline(req.params.id, updates)
    
    if (!success) {
      return jsonRes(res, 404, null, '时间轴不存在或无更新')
    }
    
    const timeline = timelineService.getTimelineById(req.params.id)
    jsonRes(res, 200, timeline, '更新成功')
  } catch (error) {
    console.error('更新时间轴失败:', error)
    jsonRes(res, 500, null, error.message)
  }
})

app.delete('/api/timelines/:id', (req, res) => {
  try {
    const success = timelineService.deleteTimeline(req.params.id)
    
    if (!success) {
      return jsonRes(res, 404, null, '时间轴不存在')
    }
    
    jsonRes(res, 200, null, '删除成功')
  } catch (error) {
    console.error('删除时间轴失败:', error)
    jsonRes(res, 500, null, error.message)
  }
})

app.get('/api/timelines/:id/switch', (req, res) => {
  try {
    const data = timelineService.switchTimeline(req.params.id)
    
    if (!data) {
      return jsonRes(res, 404, null, '时间轴不存在')
    }
    
    jsonRes(res, 200, data, '获取成功')
  } catch (error) {
    console.error('切换时间轴失败:', error)
    jsonRes(res, 500, null, error.message)
  }
})

// ============= 记录相关 =============

app.get('/api/timelines/:timelineId/records', (req, res) => {
  try {
    const records = recordService.getRecordsByTimelineId(req.params.timelineId)
    jsonRes(res, 200, records, '获取成功')
  } catch (error) {
    console.error('获取记录列表失败:', error)
    jsonRes(res, 500, null, error.message)
  }
})

app.get('/api/records/:id', (req, res) => {
  try {
    const record = recordService.getRecordById(req.params.id)
    if (!record) {
      return jsonRes(res, 404, null, '记录不存在')
    }
    jsonRes(res, 200, record, '获取成功')
  } catch (error) {
    console.error('获取记录失败:', error)
    jsonRes(res, 500, null, error.message)
  }
})

app.post('/api/timelines/:timelineId/records', (req, res) => {
  try {
    const { title, description, date, type, level, location, tags, photos, videos } = req.body
    
    if (!title || !date) {
      return jsonRes(res, 400, null, '标题和日期不能为空')
    }
    
    console.log('创建记录请求:', { title, date, type, photos, videos })
    
    const record = recordService.createRecord({
      timelineId: req.params.timelineId,
      title,
      description: description || '',
      date,
      type: type || 'text',
      level: level || 1,
      location: location || '',
      tags: tags || [],
      photos: photos || [],
      videos: videos || []
    })
    
    console.log('创建记录成功:', record)
    
    jsonRes(res, 200, record, '创建成功')
  } catch (error) {
    console.error('创建记录失败:', error)
    jsonRes(res, 500, null, error.message)
  }
})

app.put('/api/records/:id', (req, res) => {
  try {
    const { title, description, date, type, level, location, tags, photos, videos } = req.body
    const updates = {}
    
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (date !== undefined) updates.date = date
    if (type !== undefined) updates.type = type
    if (level !== undefined) updates.level = level
    if (location !== undefined) updates.location = location
    if (tags !== undefined) updates.tags = tags
    if (photos !== undefined) updates.photos = photos
    if (videos !== undefined) updates.videos = videos
    
    const success = recordService.updateRecord(req.params.id, updates)
    
    if (!success) {
      return jsonRes(res, 404, null, '记录不存在或无更新')
    }
    
    const record = recordService.getRecordById(req.params.id)
    jsonRes(res, 200, record, '更新成功')
  } catch (error) {
    console.error('更新记录失败:', error)
    jsonRes(res, 500, null, error.message)
  }
})

app.delete('/api/records/:id', (req, res) => {
  try {
    const record = recordService.getRecordById(req.params.id)
    if (!record) {
      return jsonRes(res, 404, null, '记录不存在')
    }
    
    // 删除关联的文件
    if (record.photos) {
      record.photos.forEach(photo => deleteFile(photo, 'image'))
    }
    if (record.videos) {
      record.videos.forEach(video => deleteFile(video, 'video'))
    }
    
    const success = recordService.deleteRecord(req.params.id)
    
    if (!success) {
      return jsonRes(res, 404, null, '记录不存在')
    }
    
    jsonRes(res, 200, null, '删除成功')
  } catch (error) {
    console.error('删除记录失败:', error)
    jsonRes(res, 500, null, error.message)
  }
})

// ============= 文件上传 =============

app.post('/api/upload', handleUpload, (req, res) => {
  jsonRes(res, 200, req.uploadResult, '上传成功')
})

app.post('/api/upload/multiple', handleMultipleUpload, (req, res) => {
  jsonRes(res, 200, req.uploadResults, '上传成功')
})

// ============= 健康检查 =============

app.get('/api/health', (req, res) => {
  jsonRes(res, 200, { status: 'ok', timestamp: new Date().toISOString() }, '健康')
})

// ============= 清空数据库 =============

app.post('/api/admin/clear-all', (req, res) => {
  try {
    const db = getDb()
    db.run('DELETE FROM records')
    db.run('DELETE FROM timelines')
    saveDatabase()
    jsonRes(res, 200, null, '所有数据已清空')
  } catch (error) {
    console.error('清空数据库失败:', error)
    jsonRes(res, 500, null, error.message)
  }
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  jsonRes(res, 500, null, err.message)
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
