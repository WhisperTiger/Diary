# GitHub + Vercel 部署指南

## 整体架构

```
前端（GitHub Pages）: https://whispertiger.github.io/diary/
后端（Vercel）: https://diary-api.vercel.app
```

## 第一部分：创建 GitHub 仓库

### 1. 访问 GitHub
- 打开 https://github.com
- 登录你的账号 `WhisperTiger`

### 2. 创建新仓库
1. 点击右上角 **+ → New repository**
2. 仓库名称：`diary`
3. 描述：`个人日记应用`
4. **不要**勾选 "Add a README file"
5. 点击 **Create repository**

### 3. 推送本地代码

```bash
# 在 diary/ 目录执行
git remote add origin https://github.com/WhisperTiger/diary.git
git branch -M main
git push -u origin main
```

## 第二部分：启用 GitHub Pages

### 1. 进入仓库设置
1. 进入你的仓库：`github.com/WhisperTiger/diary`
2. 点击 **Settings**
3. 左侧菜单选择 **Pages**

### 2. 配置 Pages
1. Source: **Deploy from a branch**
2. Branch: `main`
3. Folder: `/ (root)`
4. 点击 **Save**

### 3. 等待部署（1-2分钟）
部署完成后显示：
```
Your site is live at https://whispertiger.github.io/diary/
```

## 第三部分：在 Vercel 部署后端

### 1. 注册/登录 Vercel
- 访问 https://vercel.com
- 使用 GitHub 账号登录

### 2. 创建新项目
1. 点击 **Add New Project**
2. 选择 **Import Git Repository**
3. 选择你的 `WhisperTiger/diary` 仓库
4. 点击 **Import**

### 3. 配置项目设置

**Root Directory** 修改为：`server`

**环境变量配置：**
点击 **Environment Variables** 添加：

| Name | Value | Environment |
|------|-------|-------------|
| `JWT_SECRET` | 生成随机字符串（见下方） | Production, Preview, Development |
| `PORT` | `3000` | Production, Preview, Development |

**生成 JWT_SECRET：**
```powershell
# 运行此命令生成 32 位随机字符串
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 4. 部署
点击 **Deploy** 按钮

### 5. 获取后端 URL
部署完成后显示：
```
https://diary-api.vercel.app
```

## 第四部分：配置前端使用后端 URL

### 1. 修改 config.js
将 `config.js` 修改为：

```javascript
const CONFIG = {
  API_URL: 'https://diary-api.vercel.app', // 替换为你的 Vercel URL
  
  // 同步设置
  SYNC_ENABLED: true,
  AUTO_SYNC: true,
  SYNC_INTERVAL: 30000, // 毫秒
};
```

### 2. 提交并推送到 GitHub
```bash
git add config.js
git commit -m "更新后端 API 地址"
git push origin main
```

## 第五部分：测试完整流程

### 1. 访问前端页面
打开：`https://whispertiger.github.io/diary/`

### 2. 测试注册功能
1. 输入密码解密日记页面
2. 页面会显示"云端同步登录"表单
3. 输入用户名 `whispertiger` 和密码 `Caihong0105`
4. 点击注册

### 3. 测试同步功能
1. 登录成功后，日记会自动保存到云端
2. 在其他设备访问同一地址
3. 登录同一账号
4. 应该能看到同步的日记

## 部署完成检查清单

### ✅ 前端
- [ ] GitHub 仓库已创建
- [ ] 代码已推送到 GitHub
- [ ] GitHub Pages 已启用
- [ ] 可以访问：`https://whispertiger.github.io/diary/`

### ✅ 后端
- [ ] Vercel 项目已创建
- [ ] 环境变量已配置（JWT_SECRET, PORT）
- [ ] 后端已部署
- [ ] 可以访问：`https://diary-api.vercel.app/health`
- [ ] 前端 config.js 已更新为 Vercel URL

### ✅ 功能测试
- [ ] 注册功能正常
- [ ] 登录功能正常
- [ ] 保存日记到云端正常
- [ ] 从云端获取日记正常

## 故障排除

### 1. GitHub Pages 不显示页面
- 检查 GitHub Actions 日志
- 确保 `index.html` 在根目录
- 等待 1-2 分钟重新部署

### 2. Vercel 部署失败
- 检查环境变量是否配置正确
- 确保 `server/` 目录有正确的 `package.json`
- 检查 Vercel Build Logs

### 3. API 连接错误
- 检查 `config.js` 中的 `API_URL`
- 测试后端健康检查：`https://diary-api.vercel.app/health`
- 检查 CORS 设置

### 4. 同步失败
- 检查浏览器开发者工具 Console 标签
- 确认 JWT token 是否正常保存
- 检查 API 返回状态码

## 维护指南

### 更新代码
```bash
# 本地修改后
git add .
git commit -m "更新说明"
git push origin main
# GitHub Pages 会自动更新
# Vercel 会自动更新后端
```

### 重置数据库
如果需要重置数据库：
1. 删除 Vercel 项目
2. 重新创建 Vercel 项目
3. 数据库文件会重新创建

### 备份数据库
由于使用 SQLite 文件，可以通过：
1. 在 Vercel 查看日志文件
2. 或实现导出/导入功能
```

---

**部署完成！** 现在你有一个完整的云端同步日记应用：
- 前端：GitHub Pages（免费、自动部署）
- 后端：Vercel（免费、支持 Node.js）
- 数据库：SQLite（无需额外配置）

访问地址：`https://whispertiger.github.io/diary/`
