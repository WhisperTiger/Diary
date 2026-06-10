# 📔 我的日记 — 部署与使用指南

## 本地使用

双击 `index.html`，浏览器里直接开始记日记。

数据保存在浏览器的 **LocalStorage** 中，不会上传到任何服务器。

> 清空浏览器数据会导致日记丢失，请定期导出备份。

---

## 部署到 GitHub Pages

### 第一步：在终端中初始化并提交

在 `diary/` 目录下打开终端（PowerShell 或 Git Bash），依次执行：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "feat: 日记应用初始版本"
```

### 第二步：在 GitHub 上创建仓库

1. 登录 [GitHub](https://github.com)，点击右上角 **+ → New repository**
2. Repository name 填 `diary`（或其他名称）
3. **不要**勾选 "Add a README file"（本地已经有了）
4. 点击 **Create repository**

### 第三步：推送代码

GitHub 会显示推送命令，复制执行：

```bash
git remote add origin https://github.com/你的用户名/diary.git
git branch -M main
git push -u origin main
```

### 第四步：启用 GitHub Pages

1. 进入仓库 **Settings → Pages**
2. Source 选择 **Deploy from a branch**
3. Branch 选 `main`，文件夹选 `/ (root)`
4. 点击 **Save**
5. 等待 1-2 分钟，页面顶部会显示 URL：
   `https://你的用户名.github.io/diary/`

部署完成后，手机和电脑都能通过这个地址访问。

---

## 多设备云端同步（Supabase）

应用已内置 Supabase 同步支持。启用后，日记数据自动备份到云端，在任何设备登录同一账号即可访问。

### 启用步骤

1. 在 [Supabase](https://supabase.com) 创建免费项目
2. 在 SQL Editor 中执行 `supabase-schema.sql`
3. 在 `config.js` 中填入你的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`
4. 重新部署到 GitHub Pages

详细步骤见 **[DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md)**。

### 同步机制

| 操作 | 行为 |
|------|------|
| 保存日记 | 自动上传到 Supabase |
| 打开页面 | 自动从云端拉取最新数据 |
| 点击 ☁️ 按钮 | 手动双向同步 |
| 登录新设备 | 云端数据自动合并到本地 |

---

## 日常使用

| 你想做的事 | 操作方式 |
|-----------|---------|
| 记今天的日记 | 打开页面 → 填写 → 点「保存」或 `Ctrl+S` |
| 补记昨天的日记 | 点「◀」回到昨天 → 填写 → 保存 |
| 查看某天的日记 | 点击日历上的日期，或在历史列表中搜索 |
| 规划未来 | 点「▶」翻到未来日期 → 添加待办事项 → 保存 |
| 手机访问 | 浏览器打开 GitHub Pages 地址 |
| 备份数据 | 点「📤 导出」，下载 JSON 文件；或启用云端同步 |
| 换设备后恢复 | 登录 Supabase 账号自动同步，或导入 JSON |
| 多设备同步 | 启用 Supabase 同步，所有设备自动保持一致 |

---

## 功能一览

- **日历视图** — 点击任意日期切换，可导航到任意月份（含未来月份）
- **距离标签** — 显示"今天 / 昨天 / 3天前 / 5天后"
- **结构化记录**
  - 精力评分（5 星点击）
  - 心情（7 种 emoji）
  - 睡眠（充足/一般/不足）
  - 运动（跑步、力量、散步、游泳、骑行、羽毛球、其他、无 — 可多选）
  - 所在城市
  - 天气
  - 工作状态（工作/请假/休息）
  - 是否节假日
  - 身体状态
  - 饮食
  - 家人情况
- **自由书写** — 今日事项、感想
- **待办事项** — 添加/勾选完成/删除
- **标签系统** — 8 个预设 + 自定义标签
- **搜索** — 在历史列表中按关键词搜索
- **导出/导入** — JSON 格式备份与跨设备迁移
- **☁️ 云端同步** — 通过 Supabase 实现多设备自动同步
- **键盘快捷键** — `Ctrl+S` 保存，`← →` 切换日期
- **响应式设计** — 手机、平板、电脑均适配

---

## 自定义

所有代码在单个 `index.html` 文件中，直接编辑即可：

- **颜色主题**：修改 `:root` 中的 CSS 变量（约第 9 行）
- **预设标签**：修改 `PRESET_TAGS` 数组
- **运动选项**：修改 `EXERCISE_OPTIONS` 数组
- **心情列表**：修改 `MOOD_OPTIONS` 数组
- **工作状态**：修改 `WORK_STATUS_OPTIONS` 数组
