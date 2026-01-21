# Time Node Server

时间轴应用的后端服务。

## 功能特性

- **多时间轴管理**：支持创建、编辑、删除多个时间轴
- **记录管理**：每个时间轴独立管理自己的记录
- **文件上传**：支持图片和视频上传，按日期组织存储
- **SQLite数据库**：轻量级数据库，数据存储在本地

## 项目结构

```
server/
├── index.js          # Express服务器入口
├── database.js       # SQLite数据库模块
├── timelineService.js # 时间轴服务
├── recordService.js   # 记录服务
├── upload.js         # 文件上传处理
└── package.json
```

## 目录结构

```
data/
├── timeline.db       # SQLite数据库文件
├── image/
│   └── YYYY-MM/     # 按年月组织的图片
└── video/
    └── YYYY-MM/     # 按年月组织的视频
```

## API接口

### 时间轴

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/timelines | 获取所有时间轴 |
| GET | /api/timelines/:id | 获取单个时间轴 |
| POST | /api/timelines | 创建时间轴 |
| PUT | /api/timelines/:id | 更新时间轴 |
| DELETE | /api/timelines/:id | 删除时间轴 |
| GET | /api/timelines/:id/switch | 切换时间轴（获取时间轴及其记录） |

### 记录

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/timelines/:id/records | 获取时间轴的所有记录 |
| GET | /api/records/:id | 获取单个记录 |
| POST | /api/timelines/:id/records | 创建记录 |
| PUT | /api/records/:id | 更新记录 |
| DELETE | /api/records/:id | 删除记录 |

### 文件上传

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/upload | 上传单文件 |
| POST | /api/upload/multiple | 上传多文件 |

## 启动方式

```bash
cd server
npm install
npm start
```

服务器将在 http://localhost:3000 启动

## 数据格式

### 创建时间轴
```json
{
  "name": "桉桉的人生",
  "startDate": "2025-01-28",
  "remark": "桉桉的成长记录"
}
```

### 创建记录
```json
{
  "title": "第一次走路",
  "description": "桉桉今天第一次独立走路了！",
  "date": "2025-03-15",
  "type": "photo",
  "level": 3,
  "tags": ["成长", "里程碑"],
  "photos": ["/uploads/image/2025-03/uuid1.jpg"]
}
```
