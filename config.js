// ============================================================
// Supabase 配置文件
// 请在 Supabase Dashboard → Settings → API 中获取以下两个值
// ============================================================

const CONFIG = {
  // ---- 必填：你的 Supabase 项目配置 ----
  // 在 Supabase Dashboard → Settings → API 中找到：
  //   Project URL       → 填到 SUPABASE_URL
  //   anon/public key   → 填到 SUPABASE_ANON_KEY
  //   这两个值不是秘密，可以安全地放在前端代码中
  SUPABASE_URL: 'https://ludkyjackxrqerrqksqr.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZGt5amFja3hycWVycnFrc3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTUwNTUsImV4cCI6MjA5NjY3MTA1NX0.Pom4ss_C0l99THNhrGkeiVmJ2QbbOycuhsMKbGDz8rY',

  // ---- 同步设置 ----
  SYNC_ENABLED: true,
  AUTO_SYNC: true,           // 保存后自动同步到云端
  SYNC_INTERVAL: 30000,      // 自动同步间隔（毫秒），0 表示不自动
};

// 导出配置兼容 Node.js 环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
