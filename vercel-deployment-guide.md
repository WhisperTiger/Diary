# Vercel 部署指南

## 1. 注册/登录 Vercel

访问 https://vercel.com 并使用 GitHub 账号登录

## 2. 创建新项目

1. 点击 "Add New Project"
2. 选择你的 `diary` 仓库
3. 配置项目设置：
   - Framework Preset: Other
   - Build Command: `echo Build complete`
   - Output Directory: `.`
   - Install Command: `cd server && npm install`

## 3. 添加环境变量

在 Vercel Dashboard → Settings → Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| JWT_SECRET | 生成一个随机字符串 | Production, Preview, Development |
| PORT | 3000 | Production, Preview, Development |

生成随机 JWT_SECRET：
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

## 4. 配置 Vercel 路由

创建 `vercel.json` 文件（已在项目中创建）：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server/src/index.js"
    }
  ]
}
```

## 5. 部署

点击 "Deploy" 按钮等待部署完成

## 6. 获取部署 URL

部署完成后，Vercel 会显示类似 URL：
```
https://your-project.vercel.app
```

这个 URL 就是你的 API 地址！

## 7. 配置前端 API 地址

将 `index.html` 中的 `sync-client.js` 初始化部分修改为：

```javascript
const syncClient = new DiarySyncClient({
  apiBase: 'https://your-project.vercel.app'
});
```

---

## 测试步骤

### 1. 测试注册
```bash
curl -X POST https://your-project.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"whispertiger","password":"Caihong0105"}'
```

### 2. 测试登录
```bash
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"whispertiger","password":"Caihong0105"}'
```

### 3. 测试获取日记（需要 token）
```bash
curl https://your-project.vercel.app/api/diaries/2026-06-10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. 测试保存日记（需要 token）
```bash
curl -X POST https://your-project.vercel.app/api/diaries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"date":"2026-06-10","content":"测试日记内容"}'
```

---

## 常见问题

### 1. CORS 错误
检查 Vercel 的 CORS 设置，确保允许所有来源或指定你的域名

### 2. 数据库文件问题
SQLite 数据库文件在 `server/data/diary.db`，Vercel 会自动处理

### 3. 环境变量未生效
确保在 Vercel Dashboard 的所有环境（Production, Preview, Development）中都设置了环境变量

### 4. 部署失败
检查 Build Logs，确保 `cd server && npm install` 命令成功执行
