// ============================================================
// 同步集成模块 - GitHub Gist 版本
// 无需登录，Token 配置后即可多设备同步
// ============================================================

let _syncInitialized = false;
let _syncToastTimer = null;

function syncToast(msg, isGood = true) {
  const old = document.getElementById('sync-toast');
  if (old) old.remove();
  clearTimeout(_syncToastTimer);

  const t = document.createElement('div');
  t.id = 'sync-toast';
  t.textContent = msg;
  t.style.cssText = `
    position:fixed;top:20px;right:20px;z-index:99999;
    padding:10px 20px;border-radius:6px;font-size:14px;
    font-family:Arial,sans-serif;pointer-events:none;
    color:#fff;background:${isGood?'#4CAF50':'#f44336'};
    box-shadow:0 4px 12px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(t);
  _syncToastTimer = setTimeout(() => t.remove(), 3000);
}

/** staticrypt 解密后调用 */
async function initSyncAfterDecrypt() {
  if (_syncInitialized) return;
  _syncInitialized = true;

  const gist = window.gistSync;
  if (!gist) { console.warn('[Gist] gistSync 未加载'); return; }

  gist.loadConfig();

  // 添加浮动同步按钮
  addGistSyncButton(gist);

  if (gist.isConfigured()) {
    // 已配置 → 自动拉取
    syncToast('☁️ 正在同步...');
    const result = await gist.pull();
    if (result.success && result.merged > 0) {
      syncToast(`☁️ 从云端同步了 ${result.merged} 条记录`);
      refreshDiaryIfPossible();
    } else {
      syncToast('☁️ 数据已是最新');
    }
  } else {
    // 未配置 → 显示设置引导
    setTimeout(() => showGistSetup(gist), 1000);
  }
}

/** 显示 Gist 配置面板 */
function showGistSetup(gist) {
  const old = document.getElementById('gist-setup-overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'gist-setup-overlay';
  overlay.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;z-index:99990;
    background:rgba(0,0,0,0.6);display:flex;align-items:center;
    justify-content:center;font-family:Arial,sans-serif;
  `;

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:30px;max-width:420px;width:90%;box-shadow:0 8px 30px rgba(0,0,0,0.3)">
      <h2 style="margin:0 0 8px;font-size:20px">☁️ 云端同步设置</h2>
      <p style="margin:0 0 16px;color:#666;font-size:13px;line-height:1.6">
        使用 GitHub Gist 同步日记到所有设备。<br>
        <a href="https://github.com/settings/tokens/new?scopes=gist&description=diary-sync" target="_blank" style="color:#4CAF50">点击创建 Gist Token</a>（仅勾选 gist 权限）。<br>
        <b>每台设备用同一个 Token 即可自动关联。</b>
      </p>
      <label style="display:block;font-size:12px;color:#333;margin-bottom:4px">GitHub Token</label>
      <input type="password" id="gist-token-input" placeholder="ghp_..." value="${escHtml(gist.getToken())}"
        style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box;margin-bottom:12px">
      <div id="gist-setup-msg" style="font-size:13px;margin-bottom:12px;display:none"></div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button onclick="document.getElementById('gist-setup-overlay').remove()"
          style="padding:8px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:14px">取消</button>
        <button id="gist-connect-btn"
          style="padding:8px 20px;border:none;border-radius:6px;background:#4CAF50;color:#fff;cursor:pointer;font-size:14px">保存并连接</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('gist-connect-btn').onclick = async () => {
    const token = document.getElementById('gist-token-input').value.trim();
    const msgEl = document.getElementById('gist-setup-msg');
    const btn = document.getElementById('gist-connect-btn');

    if (!token) { msgEl.textContent = '请输入 Token'; msgEl.style.cssText = 'color:#f44336;font-size:13px;margin-bottom:12px'; return; }

    btn.disabled = true; btn.textContent = '连接中...';
    msgEl.textContent = '正在验证并创建同步...'; msgEl.style.cssText = 'color:#333;font-size:13px;margin-bottom:12px';

    const result = await gist.configure(token);
    if (result.success) {
      overlay.remove();
      syncToast('☁️ 云端同步已就绪！');
      // 首次配置后拉取
      const pullResult = await gist.pull();
      if (pullResult.merged > 0) {
        syncToast(`☁️ 从云端同步了 ${pullResult.merged} 条记录`);
        refreshDiaryIfPossible();
      }
    } else {
      msgEl.textContent = '❌ ' + result.message;
      msgEl.style.cssText = 'color:#f44336;font-size:13px;margin-bottom:12px';
      btn.disabled = false; btn.textContent = '重试';
    }
  };
}

/** 浮动同步按钮 */
function addGistSyncButton(gist) {
  if (document.getElementById('gist-sync-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'gist-sync-btn';
  btn.textContent = '☁️';
  btn.title = '云端同步';
  btn.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:99999;
    background:#4CAF50;color:#fff;border:none;border-radius:50%;
    width:48px;height:48px;font-size:22px;cursor:pointer;
    box-shadow:0 3px 12px rgba(0,0,0,0.3);
    transition:transform 0.2s;
  `;
  btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
  btn.onmouseleave = () => btn.style.transform = 'scale(1)';

  btn.onclick = async () => {
    if (!gist.isConfigured()) { showGistSetup(gist); return; }
    syncToast('☁️ 同步中...');
    const pushR = await gist.push();
    if (!pushR.success) { syncToast('上传失败: ' + pushR.message, false); return; }
    const pullR = await gist.pull();
    if (pullR.success) {
      syncToast(pullR.merged > 0 ? `☁️ 同步完成 (${pullR.merged} 条更新)` : '☁️ 已是最新');
      if (pullR.merged > 0) refreshDiaryIfPossible();
    } else {
      syncToast('下载失败: ' + pullR.message, false);
    }
  };

  document.body.appendChild(btn);
}

function refreshDiaryIfPossible() {
  // 尝试触发日记应用刷新
  if (typeof refreshAll === 'function') refreshAll();
  else if (typeof loadData === 'function') { loadData(); if (typeof refreshAll === 'function') refreshAll(); }
}

function escHtml(s) { return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

window.initSyncAfterDecrypt = initSyncAfterDecrypt;
window.showGistSetup = showGistSetup;
