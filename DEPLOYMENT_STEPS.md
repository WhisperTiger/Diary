# 📔 日记应用 — Supabase + GitHub 部署指南

## 架构概览

```
浏览器 ──→ GitHub Pages (静态前端)
  │              │
  │         └──── Supabase SDK (CDN)
  │                    │
  └────────── Supabase ─┘
             ├── Auth (邮箱/密码登录)
             └── PostgreSQL (日记数据)
```

- **前端**：GitHub Pages 托管，免费、全球 CDN
- **后端**：Supabase 免费 Tier（500MB 数据库、50,000 月活用户、无限 API 请求）
- **无需自建服务器**，零运维

---

## 部署步骤

### 第一步：创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)，用 GitHub 登录
2. 点击 **New project**
3. 填写：
   - Name: `diary`
   - Database Password: 设置一个强密码（记下来）
   - Region: 选离你最近的（亚洲选 Southeast Asia 或 Tokyo）
4. 点击 **Create new project**，等待 1-2 分钟

### 第二步：执行数据库迁移

1. 进入 Supabase Dashboard → **SQL Editor**
2. 点击 **New query**
3. 复制 `supabase-schema.sql` 的全部内容，粘贴到编辑器中
4. 点击 **Run** 执行
5. 左侧 **Table Editor** 中应该出现 `diaries` 表

### 第三步：配置 Supabase Auth

1. 进入 **Authentication → Settings**
2. **Email Auth** 部分：
   - 如果只是个人使用 → **关闭** "Confirm email"（注册后直接登录）
   - 如果是公开应用 → **保持开启**（需要邮箱验证）
3. **Site URL**：填入你的 GitHub Pages 地址
   `https://你的用户名.github.io/diary/`
4. 点击 **Save**

### 第四步：获取 Supabase 密钥

1. 进入 **Settings → API**
2. 复制以下两个值：
   - **Project URL**（如 `https://abc123.supabase.co`）
   - **anon public key**（以 `eyJ` 开头）
3. 这两个值不是秘密，安全放在前端代码中

### 第五步：配置前端

编辑 `diary/config.js`，替换两个占位符：

```javascript
const CONFIG = {
  SUPABASE_URL: 'https://abc123.supabase.co',        // ← 改为你的 Project URL
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIs...',      // ← 改为你的 anon key
  // ...
};
```

### 第六步：推送到 GitHub Pages

```bash
cd diary
git add .
git commit -m "feat: 集成 Supabase 云端同步"
git push origin main
```

GitHub Pages 会自动重新部署。

---

## 使用方法

### 多设备同步流程

1. **设备 A**：打开 `https://你的用户名.github.io/diary/`
2. 输入 staticrypt 密码，解密日记
3. 首次使用会弹出 **Supabase 登录** 界面
4. 注册新账号（或登录已有账号）
5. 开始记日记 → 自动同步到云端

6. **设备 B**：打开同一地址，登录同一个 Supabase 账号
7. 日记自动从云端加载到本地

### 同步机制

| 操作 | 行为 |
|------|------|
| 保存日记 | 1.5 秒后自动上传到 Supabase |
| 打开页面 | 自动从云端拉取最新数据合并到本地 |
| 点击 ☁️ 按钮 | 手动双向同步 |
| 登录新设备 | 云端数据自动覆盖本地（以云端为准） |

### 离线使用

- 离线时日记保存在浏览器 localStorage
- 联网后自动同步
- 不同设备的修改以**云端最新**为准合并

---

## 安全说明

- **staticrypt 密码**：保护页面不被未授权访问（前端加密）
- **Supabase Auth**：保护日记数据不被其他用户读取
- **RLS 策略**：每个用户只能读写自己的日记（数据库级隔离）
- **HTTPS**：GitHub Pages 和 Supabase 都自动提供 HTTPS

---

## 故障排除

### 同步按钮点击后弹出登录
- 登录态已过期 → 重新登录即可

### "请先配置 SUPABASE_URL"
- `config.js` 中的 `SUPABASE_URL` 还是占位符 → 改为你的 Project URL

### "未登录，请先登录"
- 正常现象，首次使用需要注册 Supabase 账号

### 注册后提示"该邮箱已注册"
- 该邮箱已注册过 → 直接点登录

### 云端数据没加载
- 检查浏览器 Console 有无报错
- 确认 RLS 策略已执行（在 SQL Editor 中重新运行 `supabase-schema.sql`）

---

## 文件清单

| 文件 | 作用 |
|------|------|
| `index.html` | 日记应用（含 staticrypt 加密） |
| `config.js` | Supabase 配置 |
| `supabase-client.js` | Supabase SDK 封装（认证 + CRUD） |
| `sync-ui.js` | 登录/注册 UI |
| `integrate-sync.js` | 日记应用与同步的桥接 |
| `supabase-schema.sql` | 数据库迁移脚本 |
