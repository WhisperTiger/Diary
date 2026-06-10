# 日记应用云端同步功能实现计划

## 当前状态

- 现有应用：基于 staticrypt 的加密日记页面（`index.html`）
- 数据存储：浏览器 localStorage（本地存储）
- 问题：无法在多设备间同步数据

## 实现方案：Node.js 自建后端 + SQLite 数据库

### 1. 后端服务（server/）

```
server/
├── package.json          # Node.js 依赖
├── .gitignore           # Git 忽略配置
├── .env.example         # 环境变量示例
├── src/
│   ├── index.js         # Express 服务器（API 端点）
│   └── db.js            # SQLite 数据库初始化
└── data/                # SQLite 数据库文件（git 忽略）
```

### 2. 前端同步客户端（sync-client.js）

- 封装同步 API 调用
- JWT 认证管理
- 本地存储 token

### 3. 部署到 Vercel

- 部署后端 API 服务
- 获取 HTTPS URL
- 替换前端 API 地址

---

## 实现步骤

### 第一步：创建后端服务

已完成：
- `server/package.json` - 定义依赖（express, cors, sqlite3, bcrypt, jsonwebtoken）
- `server/src/index.js` - Express 服务器端点
  - `POST /api/auth/register` - 用户注册
  - `POST /api/auth/login` - 用户登录（返回 JWT token）
  - `GET /api/diaries/:date` - 获取指定日期日记
  - `POST /api/diaries` - 保存日记
  - `GET /api/diaries/:start/:end` - 获取日期范围日记
- `server/src/db.js` - SQLite 数据库（users + diaries 表）

### 第二步：创建前端同步客户端

已完成：
- `sync-client.js` - 前端同步模块

### 第三步：修改 index.html

需要：
1. 添加同步客户端脚本引用
2. 在 staticrypt 解密后初始化同步客户端
3. 添加登录/注册表单
4. 实现自动同步功能

### 第四步：部署到 Vercel

需要：
1. 在 Vercel 创建账号
2. 创建新项目并导入仓库
3. 配置环境变量（JWT_SECRET）
4. 部署并获取 URL

### 第五步：配置前端 API 地址

需要：
1. 在 `index.html` 中设置 Vercel 部署的 API URL
2. 添加用户登录/注册 UI

---

## 数据库表结构

### users 表
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
username TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### diaries 表
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
username TEXT NOT NULL
date TEXT NOT NULL
content TEXT NOT NULL
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (username) REFERENCES users(username)
```

---

## API 端点说明

### 登录
```bash
POST /api/auth/login
Body: { username: "whispertiger", password: "Caihong0105" }
Response: { message: "登录成功", token: "xxx", user: { id: 1, username: "whispertiger" } }
```

### 获取日记
```bash
GET /api/diaries/2026-06-10
Headers: Authorization: Bearer <token>
Response: { content: "今天的日记..." }
```

### 保存日记
```bash
POST /api/diaries
Headers: Authorization: Bearer <token>
Body: { date: "2026-06-10", content: "今天的日记..." }
Response: { message: "保存成功" }
```

---

## 安全考虑

1. **密码哈希**：使用 bcrypt（10 轮盐值）
2. **JWT 认证**：30 天过期时间
3. **HTTPS**：Vercel 自动提供 HTTPS
4. **CORS**：允许所有来源（生产环境应限制）
5. **输入验证**：API 端点包含基本输入验证

---

## 下一步

1. 安装后端依赖：`cd server && npm install`
2. 测试后端服务：`cd server && npm run dev`
3. 部署到 Vercel
4. 修改 `index.html` 添加同步功能 UI
5. 测试完整流程
