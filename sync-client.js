// 同步客户端模块
class DiarySyncClient {
  constructor(config = {}) {
    this.apiBase = config.apiBase || 'http://localhost:3000';
    this.tokenKey = 'diary_token';
    this.usernameKey = 'diary_username';
    this.token = null;
    this.username = null;
  }

  // 从 localStorage 加载认证信息
  loadAuth() {
    this.token = localStorage.getItem(this.tokenKey);
    this.username = localStorage.getItem(this.usernameKey);
    return !!this.token;
  }

  // 保存认证信息
  saveAuth(token, username) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.usernameKey, username);
    this.token = token;
    this.username = username;
  }

  // 清除认证信息
  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usernameKey);
    this.token = null;
    this.username = null;
  }

  // 检查是否已登录
  isAuthenticated() {
    return this.loadAuth();
  }

  // 注册
  async register(username, password) {
    const response = await fetch(`${this.apiBase}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '注册失败');
    }

    return { success: true };
  }

  // 登录
  async login(username, password) {
    const response = await fetch(`${this.apiBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '登录失败');
    }

    const data = await response.json();
    this.saveAuth(data.token, username);
    return { success: true, user: data.user };
  }

  // 登出
  logout() {
    this.clearAuth();
  }

  // 获取日记
  async getDiary(date) {
    if (!this.token) {
      throw new Error('未登录');
    }

    const response = await fetch(`${this.apiBase}/api/diaries/${date}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAuth();
        throw new Error('会话过期，请重新登录');
      }
      throw new Error('获取日记失败');
    }

    return await response.json();
  }

  // 保存日记
  async saveDiary(date, content) {
    if (!this.token) {
      throw new Error('未登录');
    }

    const response = await fetch(`${this.apiBase}/api/diaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ date, content })
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAuth();
        throw new Error('会话过期，请重新登录');
      }
      throw new Error('保存日记失败');
    }

    return await response.json();
  }

  // 获取日期范围内的日记
  async getDiariesInRange(start, end) {
    if (!this.token) {
      throw new Error('未登录');
    }

    const response = await fetch(`${this.apiBase}/api/diaries/${start}/${end}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearAuth();
        throw new Error('会话过期，请重新登录');
      }
      throw new Error('获取日记列表失败');
    }

    return await response.json();
  }
}
