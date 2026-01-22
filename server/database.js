/**
 * @fileOverview 数据库模块
 * 使用sql.js实现SQLite数据库操作
 */

import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.resolve(__dirname, '../data/timeline.db')

let db = null

/**
 * 初始化数据库
 */
export async function initDatabase() {
  const SQL = await initSqlJs()
  
  // 确保数据目录存在
  const dataDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  
  // 加载现有数据库或创建新数据库
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }
  
  // 设置 UTF-8 编码
  db.run('PRAGMA encoding = "UTF-8"')
  
  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS timelines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      remark TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timeline_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      level INTEGER DEFAULT 1,
      location TEXT,
      tags TEXT,
      photos TEXT,
      videos TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (timeline_id) REFERENCES timelines(id) ON DELETE CASCADE
    )
  `)
  
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_records_timeline ON records(timeline_id)
  `)
  
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_records_date ON records(date)
  `)
  
  // 迁移：添加 videos 列（如果不存在）
  try {
    db.run(`ALTER TABLE records ADD COLUMN videos TEXT DEFAULT '[]'`)
  } catch (e) {
    // 列可能已存在，忽略错误
  }
  
  saveDatabase()
  
  console.log('Database initialized successfully')
  return db
}

/**
 * 保存数据库到文件
 */
export function saveDatabase() {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(DB_PATH, buffer)
  }
}

/**
 * 获取数据库实例
 */
export function getDb() {
  return db
}

/**
 * 执行查询
 */
export function query(sql, params = []) {
  const stmt = db.prepare(sql)
  if (params.length > 0) {
    stmt.bind(params)
  }
  
  const results = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

/**
 * 执行单条查询
 */
export function queryOne(sql, params = []) {
  const results = query(sql, params)
  return results.length > 0 ? results[0] : null
}

/**
 * 执行插入/更新/删除
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数
 * @param {boolean} returnId - 是否返回最后插入的ID
 */
export function run(sql, params = [], returnId = false) {
  db.run(sql, params)
  if (returnId) {
    const stmt = db.prepare('SELECT last_insert_rowid() as id')
    stmt.step()
    const result = stmt.getAsObject()
    const id = result.id
    stmt.free()
    saveDatabase()
    return id
  }
  saveDatabase()
  return db.getRowsModified()
}

/**
 * 获取最后插入的ID
 */
export function lastInsertRowId() {
  return queryOne('SELECT last_insert_rowid() as id').id
}

export default {
  initDatabase,
  getDb,
  query,
  queryOne,
  run,
  lastInsertRowId,
  saveDatabase
}
