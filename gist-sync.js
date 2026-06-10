// ============================================================
// GitHub Gist 云端同步模块
// 无需登录，只需一个 GitHub Personal Access Token (gist 权限)
// ============================================================

class GistSyncClient {
  constructor() {
    this._token = null;
    this._gistId = null;
    this._lastSync = null;
    this.STORAGE_KEY = 'diary_sync_config';
    this.GIST_API = 'https://api.github.com/gists';
    this.GIST_FILENAME = 'diary.json';
    this.GIST_DESC = '我的日记 - 云端同步';
  }

  /** 从 localStorage 加载同步配置 */
  loadConfig() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const cfg = raw ? JSON.parse(raw) : {};
      this._token = cfg.token || '';
      this._gistId = cfg.gistId || '';
      this._lastSync = cfg.lastSync || null;
    } catch (e) {
      this._token = '';
      this._gistId = '';
      this._lastSync = null;
    }
    return this.isConfigured();
  }

  /** 保存配置到 localStorage */
  _saveConfig() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      token: this._token,
      gistId: this._gistId,
      lastSync: this._lastSync,
    }));
  }

  /** 是否已配置 */
  isConfigured() {
    return !!(this._token && this._gistId);
  }

  /** 获取当前 token（用于 UI 预填） */
  getToken() { return this._token; }
  getGistId() { return this._gistId; }

  /**
   * 配置同步：验证 token + 查找或创建 Gist
   * @returns {{success, message}}
   */
  async configure(token, gistId = '') {
    if (!token) return { success: false, message: '请输入 GitHub Token' };

    this._token = token;

    try {
      // 如果没有指定 gistId，搜索已有的
      if (!gistId) {
        const listResp = await fetch(`${this.GIST_API}?per_page=100`, {
          headers: { 'Authorization': `token ${token}` }
        });
        if (listResp.ok) {
          const gists = await listResp.json();
          const existing = gists.find(g =>
            g.description === this.GIST_DESC &&
            g.files[this.GIST_FILENAME]
          );
          if (existing) {
            gistId = existing.id;
          }
        }
      }

      // 创建新 Gist
      if (!gistId) {
        const localData = localStorage.getItem('diary_data') || '{}';
        const resp = await fetch(this.GIST_API, {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: this.GIST_DESC,
            public: false,
            files: { [this.GIST_FILENAME]: { content: localData } }
          })
        });
        if (!resp.ok) throw new Error((await resp.json()).message || '创建 Gist 失败');
        const gist = await resp.json();
        gistId = gist.id;
      }

      // 验证
      const verifyResp = await fetch(`${this.GIST_API}/${gistId}`, {
        headers: { 'Authorization': `token ${token}` }
      });
      if (!verifyResp.ok) throw new Error('Token 无效或 Gist 不存在');

      this._gistId = gistId;
      this._lastSync = new Date().toISOString();
      this._saveConfig();

      return { success: true, message: gistId === gistId ? 'ok' : 'ok', gistId };
    } catch (err) {
      this._token = '';
      return { success: false, message: err.message };
    }
  }

  /**
   * 上传本地数据到 Gist（先拉取合并，避免覆盖其他设备的更新）
   */
  async push() {
    if (!this.isConfigured()) return { success: false, message: '未配置同步' };

    try {
      // 1. 先从 Gist 拉取最新版本
      const fetchResp = await fetch(`${this.GIST_API}/${this._gistId}`, {
        headers: { 'Authorization': `token ${this._token}` }
      });
      if (!fetchResp.ok) throw new Error('拉取云端失败');
      const gist = await fetchResp.json();
      const file = gist.files[this.GIST_FILENAME];
      const remote = file ? JSON.parse(file.content) : {};

      // 2. 读取本地数据
      let local = {};
      try {
        const raw = localStorage.getItem('diary_data');
        local = raw ? JSON.parse(raw) : {};
      } catch (e) { local = {}; }

      // 3. 三方合并：本地 + 云端 → 以 updatedAt 较新的为准
      const merged = { ...remote };
      for (const [date, entry] of Object.entries(local)) {
        const remoteEntry = remote[date];
        if (!remoteEntry ||
            new Date(entry.updatedAt || 0) >= new Date(remoteEntry.updatedAt || 0)) {
          merged[date] = entry;
        }
      }

      // 4. 更新本地并上传
      localStorage.setItem('diary_data', JSON.stringify(merged));

      const resp = await fetch(`${this.GIST_API}/${this._gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this._token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: { [this.GIST_FILENAME]: { content: JSON.stringify(merged) } }
        })
      });
      if (!resp.ok) throw new Error('上传失败');
      this._lastSync = new Date().toISOString();
      this._saveConfig();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  /**
   * 从 Gist 拉取云端数据并合并到本地
   * @returns {{success, mergedCount}}
   */
  async pull() {
    if (!this.isConfigured()) return { success: false, message: '未配置同步', merged: 0 };

    try {
      const resp = await fetch(`${this.GIST_API}/${this._gistId}`, {
        headers: { 'Authorization': `token ${this._token}` }
      });
      if (!resp.ok) throw new Error('下载失败');
      const gist = await resp.json();
      const file = gist.files[this.GIST_FILENAME];
      if (!file) throw new Error('Gist 中无数据');

      const remote = JSON.parse(file.content);
      let local = {};
      try {
        const raw = localStorage.getItem('diary_data');
        local = raw ? JSON.parse(raw) : {};
      } catch (e) { local = {}; }

      // 智能合并：云端更新的覆盖本地
      let merged = 0;
      for (const [date, entry] of Object.entries(remote)) {
        const localEntry = local[date];
        if (!localEntry ||
            new Date(entry.updatedAt || 0) > new Date(localEntry.updatedAt || 0)) {
          local[date] = entry;
          merged++;
        }
      }

      if (merged > 0) {
        localStorage.setItem('diary_data', JSON.stringify(local));
      }

      this._lastSync = new Date().toISOString();
      this._saveConfig();

      return { success: true, merged };
    } catch (err) {
      return { success: false, message: err.message, merged: 0 };
    }
  }

  /** 重置配置 */
  reset() {
    this._token = '';
    this._gistId = '';
    this._lastSync = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

window.gistSync = new GistSyncClient();
