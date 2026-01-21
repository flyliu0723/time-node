/**
 * @fileOverview 时间轴服务
 * 处理时间轴的CRUD操作
 */

import { query, queryOne, run, lastInsertRowId } from './database.js'
import recordService from './recordService.js'

/**
 * 获取所有时间轴
 */
export function getAllTimelines() {
  const results = query(`
    SELECT 
      t.*,
      (SELECT COUNT(*) FROM records WHERE timeline_id = t.id) as record_count
    FROM timelines t
    ORDER BY t.created_at DESC
  `)
  return results
}

/**
 * 获取单个时间轴
 */
export function getTimelineById(id) {
  return queryOne(`
    SELECT 
      t.*,
      (SELECT COUNT(*) FROM records WHERE timeline_id = t.id) as record_count
    FROM timelines t
    WHERE t.id = ?
  `, [Number(id)])
}

/**
 * 创建时间轴
 */
export function createTimeline(name, startDate, remark = '') {
  const now = Date.now()
  const id = run(
    `INSERT INTO timelines (name, start_date, remark, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [name, startDate, remark, now, now],
    true // returnId
  )
  return getTimelineById(id)
}

/**
 * 更新时间轴
 */
export function updateTimeline(id, updates) {
  const fields = []
  const values = []
  
  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.startDate !== undefined) {
    fields.push('start_date = ?')
    values.push(updates.startDate)
  }
  if (updates.remark !== undefined) {
    fields.push('remark = ?')
    values.push(updates.remark)
  }
  
  if (fields.length === 0) return false
  
  fields.push('updated_at = ?')
  values.push(Date.now())
  values.push(id)
  
  run(`UPDATE timelines SET ${fields.join(', ')} WHERE id = ?`, values)
  return true
}

/**
 * 删除时间轴（同时删除所有记录）
 */
export function deleteTimeline(id) {
  // 先删除关联的记录
  run('DELETE FROM records WHERE timeline_id = ?', [id])
  // 再删除时间轴
  const result = run('DELETE FROM timelines WHERE id = ?', [id])
  return result > 0
}

/**
 * 切换时间轴时获取数据
 */
export function switchTimeline(id) {
  const timeline = getTimelineById(id)
  if (!timeline) return null
  
  const records = recordService.getRecordsByTimelineId(id)
  
  return {
    timeline,
    records
  }
}

export default {
  getAllTimelines,
  getTimelineById,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  switchTimeline
}
