// ============================================================
// 同步集成模块 - Supabase 版本 v2
// 将 Supabase 同步功能集成到现有的日记应用中
// ============================================================

/**
 * Toast 通知辅助（在 syncUI 可用前也能工作）
 */
function syncToast(message, isSuccess = true) {
  try {
    if (window.syncUI && window.syncUI.showToast) {
      window.syncUI.showToast(message, isSuccess);
      return;
    }
  } catch (e) { /* fallback */ }

  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 99999;
    padding: 12px 24px; color: white; border-radius: 6px;
    font-size: 14px; font-family: Arial, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    background: ${isSuccess ? '#4CAF50' : '#f44336'};
    animation: slideIn 0.3s ease-out;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

/**
 * 在 staticrypt 解密完成后调用
 */
async function initSyncAfterDecrypt() {
  console.log('[Sync] === 开始初始化 Supabase 同步 ===');

  // 1. 检查配置
  if (typeof CONFIG === 'undefined') {
    console.error('[Sync] CONFIG 对象不存在！config.js 未加载？');
    syncToast('⚠️ config.js 未加载，无法启用同步', false);
    return;
  }
  if (!CONFIG.SYNC_ENABLED) {
    console.log('[Sync] 同步功能已禁用 (SYNC_ENABLED=false)');
    return;
  }

  // 2. 获取客户端实例
  const client = window.diarySupabase;
  if (!client) {
    console.error('[Sync] diarySupabase 实例不存在！supabase-client.js 未加载？');
    syncToast('⚠️ supabase-client.js 未加载', false);
    return;
  }

  // 3. 初始化 Supabase
  const initOk = client.init();
  if (!initOk) {
    console.error('[Sync] Supabase 客户端初始化失败');
    if (typeof CONFIG.SUPABASE_URL === 'undefined' || CONFIG.SUPABASE_URL.indexOf('YOUR_') === 0) {
      syncToast('⚠️ 请在 config.js 中填入 SUPABASE_URL 和密钥', false);
    } else if (typeof supabase === 'undefined') {
      syncToast('⚠️ Supabase SDK 加载失败，请刷新页面', false);
    } else {
      syncToast('⚠️ Supabase 初始化失败，请检查配置', false);
    }
    return;
  }

  console.log('[Sync] Supabase 客户端就绪:', CONFIG.SUPABASE_URL);

  // 4. 获取 UI
  const ui = window.syncUI;
  if (!ui) {
    console.warn('[Sync] syncUI 未加载');
    syncToast('⚠️ 同步界面加载失败', false);
    return;
  }

  // 5. 注册登录成功回调
  ui.onSuccess(async () => {
    console.log('[Sync] 登录成功，加载云端数据...');
    try {
      await loadCloudDataIntoLocal(client);
      setupSyncIntegration(client, ui);
      syncToast('✅ 云端同步已启用', true);
    } catch (err) {
      console.error('[Sync] 云端数据加载失败:', err);
      syncToast('⚠️ 云端同步失败: ' + err.message, false);
    }
  });

  // 6. 检查认证状态
  try {
    const authed = await client.isAuthenticated();
    if (authed) {
      console.log('[Sync] 已有有效登录会话');
      try {
        await loadCloudDataIntoLocal(client);
        setupSyncIntegration(client, ui);
        syncToast('✅ 已自动登录云端同步', true);
      } catch (err) {
        console.error('[Sync] 加载失败:', err);
      }
    } else {
      console.log('[Sync] 未登录，显示登录界面...');
      setTimeout(() => {
        try { ui.showLogin(); } catch (e) {
          console.error('[Sync] 显示登录界面失败:', e);
          syncToast('⚠️ 登录界面加载失败，请刷新重试', false);
        }
      }, 1000);
    }
  } catch (err) {
    console.warn('[Sync] 认证状态检查异常:', err.message);
    setTimeout(() => {
      try { ui.showLogin(); } catch (e) { syncToast('⚠️ 网络异常，请检查连接', false); }
    }, 1000);
  }

  // 7. 监听认证变化（仅监听登出；登录由 onSuccess 回调处理）
  try {
    client.onAuthStateChange((event, session) => {
      console.log('[Sync] Auth 状态变化:', event);
      if (event === 'SIGNED_OUT') {
        console.log('[Sync] 已登出');
        // 不清除数据，用户可重新登录
      }
    });
  } catch (e) {
    console.warn('[Sync] 监听注册失败:', e);
  }
}

/**
 * 探测日记应用使用的 localStorage key
 */
function findDiaryStorageKey() {
  // 尝试多个可能的 key
  const candidates = ['diary_data', 'diaryData', 'diary-entries', 'diaryEntries', 'journal_data'];
  for (const key of candidates) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data && (data.entries || Array.isArray(data))) {
          console.log('[Sync] 检测到日记数据 key:', key);
          return { key, data, format: data.entries ? 'entries' : 'array' };
        }
      } catch (e) { /* 不是 JSON */ }
      console.log('[Sync] 发现非 JSON 数据 key:', key, '跳过');
    }
  }
  // 扫描所有 localStorage keys
  console.log('[Sync] 扫描所有 localStorage keys:', Object.keys(localStorage));
  return null;
}

/**
 * 将云端日记加载合并到本地 localStorage
 */
async function loadCloudDataIntoLocal(client) {
  try {
    const cloudDiaries = await client.getDiariesInRange('2020-01-01', '2099-12-31');

    if (!cloudDiaries || cloudDiaries.length === 0) {
      console.log('[Sync] 云端无日记数据');
      return;
    }

    console.log(`[Sync] 从云端加载了 ${cloudDiaries.length} 篇日记`);

    // 探测本地数据 key
    const localInfo = findDiaryStorageKey();
    const storageKey = localInfo ? localInfo.key : 'diary_data';

    // 解析本地数据
    let localData = { entries: [] };
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) localData = JSON.parse(raw);
      if (!localData.entries) localData.entries = [];
    } catch (e) {
      localData = { entries: [] };
    }

    // 合并云端数据到本地（云端优先）
    const localMap = new Map(localData.entries.map(e => [e.date, e]));
    let mergeCount = 0;

    for (const cloud of cloudDiaries) {
      const local = localMap.get(cloud.date);
      if (!local) {
        const entry = buildLocalEntry(cloud.date, cloud.content);
        localData.entries.push(entry);
        mergeCount++;
      } else if (cloud.content) {
        const merged = buildLocalEntry(cloud.date, cloud.content);
        Object.assign(local, merged);
        mergeCount++;
      }
    }

    localData.entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // 保存回 localStorage
    localStorage.setItem(storageKey, JSON.stringify(localData));
    console.log(`[Sync] 合并完成，更新 ${mergeCount} 篇 → key: ${storageKey}`);

    // 尝试触发页面刷新
    if (typeof window.refreshDiaryView === 'function') {
      window.refreshDiaryView();
    }
  } catch (err) {
    console.error('[Sync] 加载云端数据失败:', err);
    throw err;
  }
}

/**
 * 将云端 content JSON 转换为本地日记条目格式
 */
function buildLocalEntry(date, content) {
  if (!content) return { date, content: '' };
  if (typeof content === 'string') return { date, content };
  return {
    date,
    content: content.text || '',
    mood: content.mood || '',
    energy: content.energy || 0,
    sleep: content.sleep || '',
    exercise: content.exercise || [],
    city: content.city || '',
    weather: content.weather || '',
    workStatus: content.workStatus || '',
    isHoliday: content.isHoliday || false,
    bodyStatus: content.bodyStatus || '',
    diet: content.diet || '',
    family: content.family || '',
    tags: content.tags || [],
    todos: content.todos || [],
  };
}

/**
 * 从本地 localStorage 提取当前日记条目
 */
function getCurrentDiaryEntry() {
  try {
    const localInfo = findDiaryStorageKey();
    if (!localInfo) return null;

    const { data, format } = localInfo;
    const entries = format === 'array' ? data : (data.entries || []);

    if (entries.length === 0) return null;

    // 尝试根据 UI 获取当前日期
    const dateEl = document.querySelector('.date-display, #current-date, [data-date], input[type="date"]');
    let currentDate = null;
    if (dateEl) {
      currentDate = dateEl.textContent?.trim() || dateEl.dataset?.date || dateEl.value;
    }

    if (currentDate) {
      return entries.find(e => e.date === currentDate) || entries[0];
    }

    return entries[0];
  } catch (e) {
    console.warn('[Sync] 获取日记条目失败:', e);
    return null;
  }
}

/**
 * 设置自动同步集成
 */
function setupSyncIntegration(client, ui) {
  console.log('[Sync] 设置同步集成...');
  addSyncButton(client, ui);
  hookLocalStorageSave(client, ui);

  if (CONFIG.SYNC_INTERVAL > 0 && CONFIG.AUTO_SYNC) {
    setInterval(async () => {
      try {
        const entry = getCurrentDiaryEntry();
        if (entry) await client.saveDiary(entry.date, entry.content);
      } catch (e) {
        console.warn('[Sync] 周期同步失败:', e.message);
      }
    }, CONFIG.SYNC_INTERVAL);
  }

  console.log('[Sync] 同步集成完成 ✅');
}

/**
 * Hook localStorage 写入（监控所有可能的 key）
 */
function hookLocalStorageSave(client, ui) {
  const originalSetItem = Storage.prototype.setItem;

  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (CONFIG.AUTO_SYNC) {
      triggerAutoSave(client);
    }
  };

  console.log('[Sync] localStorage 写入监听已激活');
}

let autoSaveTimer = null;
function triggerAutoSave(client) {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    try {
      if (!(await client.isAuthenticated())) return;
      const entry = getCurrentDiaryEntry();
      if (entry && entry.date) {
        await client.saveDiary(entry.date, entry.content || entry);
        console.log('[Sync] ✅ 已同步:', entry.date);
      }
    } catch (err) {
      console.warn('[Sync] 自动同步失败:', err.message);
    }
  }, 1500);
}

/**
 * 浮动同步按钮
 */
function addSyncButton(client, ui) {
  if (document.getElementById('sync-float-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'sync-float-btn';
  btn.innerHTML = '☁️';
  btn.title = '同步到云端';
  btn.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 99999;
    background: #4CAF50; color: white; border: none; border-radius: 50%;
    width: 52px; height: 52px; font-size: 24px; cursor: pointer;
    box-shadow: 0 3px 12px rgba(0,0,0,0.3);
    transition: transform 0.2s, background 0.2s;
  `;
  btn.onmouseenter = () => { btn.style.transform = 'scale(1.1)'; btn.style.background = '#45a049'; };
  btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; btn.style.background = '#4CAF50'; };

  btn.onclick = async () => {
    try {
      const authed = await client.isAuthenticated();
      if (!authed) { ui.showLogin(); return; }
      const entry = getCurrentDiaryEntry();
      if (entry) await client.saveDiary(entry.date, entry.content || entry);
      await loadCloudDataIntoLocal(client);
      syncToast('✅ 同步完成', true);
    } catch (err) {
      syncToast('同步失败: ' + err.message, false);
    }
  };

  document.body.appendChild(btn);
}

// 导出全局
window.initSyncAfterDecrypt = initSyncAfterDecrypt;
window.loadCloudDataIntoLocal = loadCloudDataIntoLocal;
window.setupSyncIntegration = setupSyncIntegration;
