/**
 * @fileOverview 文件上传处理模块
 * 处理图片和视频上传，按日期组织存储
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '../../data')
const IMAGE_DIR = path.join(DATA_DIR, 'image')
const VIDEO_DIR = path.resolve(__dirname, '../../data/video')

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * 根据日期创建子目录路径
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 * @param {string} type - 文件类型 ('image' | 'video')
 * @returns {string} 子目录路径
 */
function getDateSubDir(dateStr, type) {
  const baseDir = type === 'video' ? VIDEO_DIR : IMAGE_DIR
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  
  const subDir = path.join(baseDir, `${year}-${month}`)
  ensureDir(subDir)
  return subDir
}

/**
 * 生成唯一的文件名
 * @param {string} originalName - 原始文件名
 * @returns {string} 唯一的文件名
 */
function generateUniqueFileName(originalName) {
  const ext = path.extname(originalName)
  const uuid = uuidv4()
  return `${uuid}${ext}`
}

/**
 * 获取文件的访问URL
 * @param {string} filePath - 文件路径
 * @param {string} type - 文件类型
 * @returns {string} 文件访问URL
 */
function getFileUrl(filePath, type) {
  const relativePath = path.relative(DATA_DIR, filePath)
  const urlPath = relativePath.replace(/\\/g, '/')
  return `/uploads/${type}/${urlPath}`
}

// 配置文件上传存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dateStr = req.body.date || new Date().toISOString().split('T')[0]
    const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image'
    
    const uploadDir = getDateSubDir(dateStr, fileType)
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueName = generateUniqueFileName(file.originalname)
    cb(null, uniqueName)
  }
})

// 文件过滤
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
})

/**
 * 处理单文件上传
 */
export function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '文件大小超出限制 (最大100MB)' })
      }
      return res.status(400).json({ error: err.message })
    } else if (err) {
      return res.status(400).json({ error: err.message })
    }
    
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }
    
    const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image'
    const dateStr = req.body.date || new Date().toISOString().split('T')[0]
    
    const result = {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileType,
      date: dateStr,
      url: getFileUrl(req.file.path, fileType),
      size: req.file.size,
      mimeType: req.file.mimetype
    }
    
    req.uploadResult = result
    next()
  })
}

/**
 * 处理多文件上传
 */
export function handleMultipleUpload(req, res, next) {
  upload.array('files', 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '文件大小超出限制 (最大100MB)' })
      }
      return res.status(400).json({ error: err.message })
    } else if (err) {
      return res.status(400).json({ error: err.message })
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' })
    }
    
    const dateStr = req.body.date || new Date().toISOString().split('T')[0]
    
    const results = req.files.map(file => {
      const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image'
      return {
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileType,
        date: dateStr,
        url: getFileUrl(file.path, fileType),
        size: file.size,
        mimeType: file.mimetype
      }
    })
    
    req.uploadResults = results
    next()
  })
}

/**
 * 删除文件
 */
export function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
    return false
  } catch (error) {
    console.error('删除文件失败:', error)
    return false
  }
}

/**
 * 获取文件信息
 */
export function getFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath)
    return {
      path: filePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    }
  } catch (error) {
    return null
  }
}

export default {
  upload,
  handleUpload,
  handleMultipleUpload,
  deleteFile,
  getFileInfo,
  getDateSubDir,
  generateUniqueFileName
}
