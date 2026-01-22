/**
 * @fileOverview 记录服务
 * 处理时间轴记录的CRUD操作
 */

import { query, queryOne, run, lastInsertRowId } from './database.js'

/**
 * 获取时间轴的所有记录
 */
export function getRecordsByTimelineId(timelineId) {
  const results = query(`
    SELECT * FROM records
    WHERE timeline_id = ?
    ORDER BY date ASC
  `, [timelineId])
  
  return results.map(record => ({
    ...record,
    tags: record.tags ? JSON.parse(record.tags) : [],
    photos: record.photos ? JSON.parse(record.photos) : [],
    videos: record.videos ? JSON.parse(record.videos) : []
  }))
}

/**
 * 获取单个记录
 */
export function getRecordById(id) {
  const result = queryOne('SELECT * FROM records WHERE id = ?', [id])
  if (!result) return null
  
  return {
    ...result,
    tags: result.tags ? JSON.parse(result.tags) : [],
    photos: result.photos ? JSON.parse(result.photos) : [],
    videos: result.videos ? JSON.parse(result.videos) : []
  }
}

/**
 * 创建记录
 */
export function createRecord(data) {
  const now = Date.now()
  
  const photos = data.photos ? JSON.stringify(data.photos) : '[]'
  const videos = data.videos ? JSON.stringify(data.videos) : '[]'
  const tags = data.tags ? JSON.stringify(data.tags) : '[]'
  
  const id = run(
    `INSERT INTO records (
      timeline_id, title, description, date, type, level,
      location, tags, photos, videos, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.timelineId,
      data.title,
      data.description || '',
      data.date,
      data.type || 'text',
      data.level || 1,
      data.location || '',
      tags,
      photos,
      videos,
      now,
      now
    ],
    true // returnId
  )
  
  return getRecordById(id)
}

/**
 * 更新记录
 */
export function updateRecord(id, updates) {
  const fields = []
  const values = []
  
  const fieldMap = {
    title: 'title',
    description: 'description',
    date: 'date',
    type: 'type',
    level: 'level',
    location: 'location',
    videoUrl: 'video_url',
    mediaPath: 'media_path'
  }
  
  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (updates[key] !== undefined) {
      fields.push(`${dbField} = ?`)
      values.push(updates[key])
    }
  }
  
  // 处理数组类型字段
  if (updates.tags !== undefined) {
    fields.push('tags = ?')
    values.push(JSON.stringify(updates.tags))
  }
  
  if (updates.photos !== undefined) {
    fields.push('photos = ?')
    values.push(JSON.stringify(updates.photos))
  }
  
  if (fields.length === 0) return false
  
  fields.push('updated_at = ?')
  values.push(Date.now())
  values.push(id)
  
  run(`UPDATE records SET ${fields.join(', ')} WHERE id = ?`, values)
  return true
}

/**
 * 删除记录
 */
export function deleteRecord(id) {
  const result = run('DELETE FROM records WHERE id = ?', [id])
  return result > 0
}

/**
 * 获取最近的记录
 */
export function getNearestRecord(timelineId, targetDate) {
  return queryOne(`
    SELECT * FROM records
    WHERE timeline_id = ?
    ORDER BY ABS(julianday(date) - julianday(?))
    LIMIT 1
  `, [timelineId, targetDate])
}

/**
 * 按日期范围获取记录
 */
export function getRecordsInRange(timelineId, startDate, endDate) {
  const results = query(`
    SELECT * FROM records
    WHERE timeline_id = ? AND date >= ? AND date <= ?
    ORDER BY date ASC
  `, [timelineId, startDate, endDate])
  
  return results.map(record => ({
    ...record,
    tags: record.tags ? JSON.parse(record.tags) : [],
    photos: record.photos ? JSON.parse(record.photos) : []
  }))
}

/**
 * 获取记录数量
 */
export function getRecordCount(timelineId) {
  const result = queryOne(`
    SELECT COUNT(*) as count FROM records WHERE timeline_id = ?
  `, [timelineId])
  return result?.count || 0
}

export default {
  getRecordsByTimelineId,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  getNearestRecord,
  getRecordsInRange,
  getRecordCount
}
