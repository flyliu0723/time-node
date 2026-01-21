/**
 * @fileOverview API服务封装
 * 提供与后端通信的方法
 */

const API_BASE = 'http://localhost:3000/api'

/**
 * 通用请求方法
 */
async function request(method, endpoint, data = null) {
  const url = `${API_BASE}${endpoint}`
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data)
  }
  
  try {
    const response = await fetch(url, options)
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || '请求失败')
    }
    
    return result
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error)
    throw error
  }
}

// ============= 时间轴API =============

/**
 * 获取所有时间轴
 */
export async function getTimelines() {
  return request('GET', '/timelines')
}

/**
 * 获取单个时间轴
 */
export async function getTimeline(id) {
  return request('GET', `/timelines/${id}`)
}

/**
 * 创建时间轴
 */
export async function createTimeline(data) {
  return request('POST', '/timelines', data)
}

/**
 * 更新时间轴
 */
export async function updateTimeline(id, data) {
  return request('PUT', `/timelines/${id}`, data)
}

/**
 * 删除时间轴
 */
export async function deleteTimeline(id) {
  return request('DELETE', `/timelines/${id}`)
}

/**
 * 切换时间轴（获取时间轴及其所有记录）
 */
export async function switchTimeline(id) {
  return request('GET', `/timelines/${id}/switch`)
}

// ============= 记录API =============

/**
 * 获取时间轴的所有记录
 */
export async function getRecords(timelineId) {
  return request('GET', `/timelines/${timelineId}/records`)
}

/**
 * 获取单个记录
 */
export async function getRecord(id) {
  return request('GET', `/records/${id}`)
}

/**
 * 创建记录
 */
export async function createRecord(timelineId, data) {
  return request('POST', `/timelines/${timelineId}/records`, data)
}

/**
 * 更新记录
 */
export async function updateRecord(id, data) {
  return request('PUT', `/records/${id}`, data)
}

/**
 * 删除记录
 */
export async function deleteRecord(id) {
  return request('DELETE', `/records/${id}`)
}

// ============= 文件上传API =============

/**
 * 上传单文件
 * @param {File} file - 文件对象
 * @param {string} date - 记录日期
 * @returns {Promise<Object>} 上传结果
 */
export async function uploadFile(file, date) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('date', date)
  
  const url = `${API_BASE}/upload`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || '上传失败')
    }
    
    return result
  } catch (error) {
    console.error('Upload Error:', error)
    throw error
  }
}

/**
 * 上传多文件
 * @param {FileList} files - 文件列表
 * @param {string} date - 记录日期
 * @returns {Promise<Array>} 上传结果数组
 */
export async function uploadMultipleFiles(files, date) {
  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }
  formData.append('date', date)
  
  const url = `${API_BASE}/upload/multiple`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || '上传失败')
    }
    
    return result
  } catch (error) {
    console.error('Upload Multiple Error:', error)
    throw error
  }
}

// ============= 健康检查 =============

/**
 * 检查服务器健康状态
 */
export async function healthCheck() {
  return request('GET', '/health')
}

export default {
  // Timelines
  getTimelines,
  getTimeline,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  switchTimeline,
  
  // Records
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  
  // Upload
  uploadFile,
  uploadMultipleFiles,
  
  // Health
  healthCheck
}
