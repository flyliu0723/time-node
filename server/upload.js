/**
 * @fileOverview 文件上传处理模块
 * 处理图片和视频上传，拷贝文件到data目录，按日期组织存储
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import multer from 'multer'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '../../data')
const IMAGE_DIR = path.join(DATA_DIR, 'image')
const VIDEO_DIR = path.join(DATA_DIR, 'video')

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
 * 生成随机字符串文件名
 * @param {string} originalName - 原始文件名
 * @returns {string} 随机文件名（保留扩展名）
 */
function generateRandomFileName(originalName) {
  const ext = path.extname(originalName).toLowerCase()
  // 生成16位随机字符串
  const randomStr = crypto.randomBytes(8).toString('hex')
  return `${randomStr}${ext}`
}

/**
 * 获取文件的相对路径（用于存储到数据库）
 * @param {string} filePath - 文件完整路径
 * @param {string} type - 文件类型
 * @returns {string} 相对路径
 */
function getRelativePath(filePath, type) {
  const baseDir = type === 'video' ? VIDEO_DIR : IMAGE_DIR
  return path.relative(baseDir, filePath)
}

/**
 * 拷贝文件到目标目录
 * @param {string} sourcePath - 源文件路径
 * @param {string} targetDir - 目标目录
 * @param {string} fileName - 目标文件名
 * @returns {string} 目标文件完整路径
 */
function copyFile(sourcePath, targetDir, fileName) {
  const targetPath = path.join(targetDir, fileName)
  fs.copyFileSync(sourcePath, targetPath)
  return targetPath
}

/**
 * 解析multipart表单中的日期（支持字符串和文件混合）
 */
function parseUploadDate(req) {
  // 优先使用表单中的date字段
  if (req.body.date) {
    return req.body.date
  }
  // 如果没有date字段，使用当前日期
  return new Date().toISOString().split('T')[0]
}

// 临时目录用于multer
const TEMP_DIR = path.join(DATA_DIR, 'temp')
ensureDir(TEMP_DIR)

// 配置文件上传存储（先存到临时目录）
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_DIR)
  },
  filename: function (req, file, cb) {
    const uniqueName = generateRandomFileName(file.originalname)
    cb(null, uniqueName)
  }
})

// 文件过滤
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic']
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
  
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true)
  } else if (allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB
  }
})

/**
 * 处理单文件上传（拷贝到data目录）
 */
export function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '文件大小超出限制 (最大200MB)' })
      }
      return res.status(400).json({ error: err.message })
    } else if (err) {
      return res.status(400).json({ error: err.message })
    }
    
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }
    
    try {
      const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image'
      const dateStr = parseUploadDate(req)
      
      // 目标目录
      const targetDir = getDateSubDir(dateStr, fileType)
      
      // 生成随机文件名
      const fileName = generateRandomFileName(req.file.originalname)
      
      // 拷贝文件到目标目录
      const targetPath = copyFile(req.file.path, targetDir, fileName)
      
      // 删除临时文件
      fs.unlinkSync(req.file.path)
      
      // 计算相对路径
      const relativePath = getRelativePath(targetPath, fileType)
      
      const result = {
        originalName: req.file.originalname,
        fileName: fileName,
        filePath: relativePath, // 存储相对路径
        fullPath: targetPath,   // 完整路径
        fileType,
        date: dateStr,
        url: `/uploads/${fileType}/${relativePath}`,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
      
      req.uploadResult = result
      next()
    } catch (error) {
      console.error('处理上传文件失败:', error)
      // 清理临时文件
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(500).json({ error: '处理文件失败' })
    }
  })
}

/**
 * 处理多文件上传（拷贝到data目录）
 */
export function handleMultipleUpload(req, res, next) {
  upload.array('files', 20)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '文件大小超出限制 (最大200MB)' })
      }
      return res.status(400).json({ error: err.message })
    } else if (err) {
      return res.status(400).json({ error: err.message })
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' })
    }
    
    try {
      const dateStr = parseUploadDate(req)
      
      const results = req.files.map(file => {
        const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image'
        
        const targetDir = getDateSubDir(dateStr, fileType)
        const fileName = generateRandomFileName(file.originalname)
        const targetPath = copyFile(file.path, targetDir, fileName)
        
        // 删除临时文件
        fs.unlinkSync(file.path)
        
        const relativePath = getRelativePath(targetPath, fileType)
        
        return {
          originalName: file.originalname,
          fileName: fileName,
          filePath: relativePath,
          fullPath: targetPath,
          fileType,
          date: dateStr,
          url: `/uploads/${fileType}/${relativePath}`,
          size: file.size,
          mimeType: file.mimetype
        }
      })
      
      req.uploadResults = results
      next()
    } catch (error) {
      console.error('处理上传文件失败:', error)
      // 清理所有临时文件
      req.files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path)
        }
      })
      return res.status(500).json({ error: '处理文件失败' })
    }
  })
}

/**
 * 删除文件
 * @param {string} relativePath - 文件相对路径
 * @param {string} type - 文件类型 ('image' | 'video')
 * @returns {boolean} 是否删除成功
 */
export function deleteFile(relativePath, type = 'image') {
  try {
    const baseDir = type === 'video' ? VIDEO_DIR : IMAGE_DIR
    const fullPath = path.join(baseDir, relativePath)
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      return true
    }
    return false
  } catch (error) {
    console.error('删除文件失败:', error)
    return false
  }
}

/**
 * 根据相对路径获取完整路径
 * @param {string} relativePath - 相对路径
 * @param {string} type - 文件类型
 * @returns {string} 完整路径
 */
export function getFullPath(relativePath, type = 'image') {
  const baseDir = type === 'video' ? VIDEO_DIR : IMAGE_DIR
  return path.join(baseDir, relativePath)
}

/**
 * 根据相对路径获取URL
 * @param {string} relativePath - 相对路径
 * @param {string} type - 文件类型
 * @returns {string} 访问URL
 */
export function getFileUrl(relativePath, type = 'image') {
  return `/uploads/${type}/${relativePath}`
}

export default {
  upload,
  handleUpload,
  handleMultipleUpload,
  deleteFile,
  getFullPath,
  getFileUrl,
  getDateSubDir,
  generateRandomFileName
}
