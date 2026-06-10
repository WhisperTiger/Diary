// ============================================================
// Supabase 客户端封装 - 替换旧的 sync-client.js
// 提供：认证管理 + 日记 CRUD + 云端同步
// ============================================================

class DiarySupabaseClient {
  constructor() {
    this.client = null;
    this._initialized = false;
  }

  // ---- 初始化 ----

  /**
   * 初始化 Supabase 客户端
   * 必须在加载 supabase-js SDK 后调用
   */
  init() {
    if (this._initialized) return true;

    if (typeof CONFIG === 'undefined') {
      console.warn('[Supabase] CONFIG 未定义，跳过初始化');
      return false;
    }

    if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      console.warn('[Supabase] 请先在 config.js 中配置 SUPABASE_URL 和 SUPABASE_ANON_KEY');
      return false;
    }

    if (typeof supabase === 'undefined' || !supabase.createClient) {
      console.error('[Supabase] supabase-js SDK 未加载，请在 HTML 中引入 CDN');
      return false;
    }

    try {
      this.client = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true, // 支持邮箱验证回调
        },
      });
      this._initialized = true;
      console.log('[Supabase] 客户端初始化成功');
      return true;
    } catch (e) {
      console.error('[Supabase] 初始化失败:', e);
      return false;
    }
  }

  // ---- 认证 ----

  /**
   * 注册新用户（邮箱 + 密码）
   */
  async signUp(email, password) {
    this._ensureInit();
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  /**
   * 登录
   */
  async signIn(email, password) {
    this._ensureInit();
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  /**
   * 登出
   */
  async signOut() {
    if (!this.client) return;
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  /**
   * 获取当前会话
   */
  async getSession() {
    if (!this.client) return null;
    const { data } = await this.client.auth.getSession();
    return data.session;
  }

  /**
   * 获取当前用户
   */
  async getUser() {
    if (!this.client) return null;
    const { data } = await this.client.auth.getUser();
    return data.user;
  }

  /**
   * 是否已登录
   */
  async isAuthenticated() {
    const session = await this.getSession();
    return !!session;
  }

  /**
   * 监听认证状态变化
   * @param {function} callback - (event, session) => void
   */
  onAuthStateChange(callback) {
    if (!this.client) return null;
    return this.client.auth.onAuthStateChange(callback);
  }

  // ---- 日记 CRUD ----

  /**
   * 保存日记（插入或更新）
   * 利用 user_id + date 的唯一约束实现 upsert
   */
  async saveDiary(date, content) {
    this._ensureAuth();

    // content 可以是字符串或对象，统一存为 JSON
    const contentObj = typeof content === 'string'
      ? { text: content }
      : content;

    const { data, error } = await this.client
      .from('diaries')
      .upsert(
        { date, content: contentObj },
        { onConflict: 'user_id, date' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 获取指定日期的日记
   */
  async getDiary(date) {
    this._ensureAuth();

    const { data, error } = await this.client
      .from('diaries')
      .select('date, content, updated_at')
      .eq('date', date)
      .maybeSingle();

    if (error) throw error;
    return data; // null 表示当天没有日记
  }

  /**
   * 获取日期范围内的日记列表
   */
  async getDiariesInRange(startDate, endDate) {
    this._ensureAuth();

    const { data, error } = await this.client
      .from('diaries')
      .select('date, content, updated_at')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .limit(200);

    if (error) throw error;
    return data || [];
  }

  /**
   * 获取所有日记的日期列表（用于日历标记）
   */
  async getAllDates() {
    this._ensureAuth();

    const { data, error } = await this.client
      .from('diaries')
      .select('date')
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map(d => d.date);
  }

  /**
   * 删除指定日期的日记
   */
  async deleteDiary(date) {
    this._ensureAuth();

    const { error } = await this.client
      .from('diaries')
      .delete()
      .eq('date', date);

    if (error) throw error;
  }

  /**
   * 批量同步：将本地日记上传到云端
   * @param {Array} entries - [{date, content}, ...]
   */
  async batchUpload(entries) {
    this._ensureAuth();

    const rows = entries.map(e => ({
      date: e.date,
      content: typeof e.content === 'string' ? { text: e.content } : e.content,
    }));

    const { data, error } = await this.client
      .from('diaries')
      .upsert(rows, { onConflict: 'user_id, date' })
      .select();

    if (error) throw error;
    return data;
  }

  // ---- 内部辅助 ----

  _ensureInit() {
    if (!this._initialized) this.init();
    if (!this.client) throw new Error('Supabase 客户端未初始化');
  }

  async _ensureAuth() {
    this._ensureInit();
    const authed = await this.isAuthenticated();
    if (!authed) throw new Error('未登录，请先登录');
  }
}

// 创建全局单例
window.diarySupabase = new DiarySupabaseClient();
