// ============================================================
// 同步 UI 控制器 - Supabase 版本
// 替换旧的 sync-ui.js，提供 Supabase 登录/注册界面
// ============================================================

class SyncUI {
  constructor(supabaseClient) {
    this.client = supabaseClient;
    this._container = null;
    this._onAuthSuccess = null; // 登录成功后的回调
  }

  /**
   * 设置登录成功后的回调
   */
  onSuccess(callback) {
    this._onAuthSuccess = callback;
  }

  /**
   * 显示登录表单（覆盖在日记应用上）
   */
  showLogin(emailHint = '') {
    this._render(`
      <div class="staticrypt-page sync-form">
        <div class="staticrypt-form">
          <div class="staticrypt-instructions">
            <p class="staticrypt-title">📔 云端同步</p>
            <p>登录 Supabase 账号，多设备同步日记</p>
          </div>
          <hr class="staticrypt-hr" />
          <form id="sync-login-form" onsubmit="return false">
            <input type="email" id="sync-email" placeholder="邮箱地址"
                   value="${this._escape(emailHint)}" required autofocus />
            <input type="password" id="sync-password" placeholder="密码" required />
            <div id="sync-error" style="color:#f44336;font-size:14px;margin-bottom:10px;display:none;"></div>
            <input type="submit" class="staticrypt-decrypt-button" value="登录" />
          </form>
          <p style="margin-top:15px;font-size:14px;">
            还没有账号？<a href="#" id="sync-register-link">立即注册</a>
          </p>
          <p style="margin-top:5px;font-size:13px;color:#999;">
            <a href="#" id="sync-forgot-link">忘记密码？</a>
          </p>
        </div>
      </div>
    `);

    this._bindLoginForm();
    document.getElementById('sync-register-link').onclick = (e) => {
      e.preventDefault();
      this.showRegister();
    };
    document.getElementById('sync-forgot-link').onclick = (e) => {
      e.preventDefault();
      this.showResetPassword();
    };
  }

  /**
   * 显示注册表单
   */
  showRegister() {
    this._render(`
      <div class="staticrypt-page sync-form">
        <div class="staticrypt-form">
          <div class="staticrypt-instructions">
            <p class="staticrypt-title">📝 注册新账号</p>
            <p>创建 Supabase 账号开始同步</p>
          </div>
          <hr class="staticrypt-hr" />
          <form id="sync-register-form" onsubmit="return false">
            <input type="email" id="reg-email" placeholder="邮箱地址" required autofocus />
            <input type="password" id="reg-password" placeholder="密码（至少6位）" required minlength="6" />
            <div id="sync-error" style="color:#f44336;font-size:14px;margin-bottom:10px;display:none;"></div>
            <div id="sync-success" style="color:#4CAF50;font-size:14px;margin-bottom:10px;display:none;"></div>
            <input type="submit" class="staticrypt-decrypt-button" value="注册" />
          </form>
          <p style="margin-top:15px;font-size:14px;">
            已有账号？<a href="#" id="reg-login-link">立即登录</a>
          </p>
        </div>
      </div>
    `);

    this._bindRegisterForm();
    document.getElementById('reg-login-link').onclick = (e) => {
      e.preventDefault();
      this.showLogin();
    };
  }

  /**
   * 显示重置密码
   */
  showResetPassword() {
    this._render(`
      <div class="staticrypt-page sync-form">
        <div class="staticrypt-form">
          <div class="staticrypt-instructions">
            <p class="staticrypt-title">🔑 重置密码</p>
            <p>输入邮箱，我们将发送重置链接</p>
          </div>
          <hr class="staticrypt-hr" />
          <form id="sync-reset-form" onsubmit="return false">
            <input type="email" id="reset-email" placeholder="邮箱地址" required autofocus />
            <div id="sync-error" style="color:#f44336;font-size:14px;margin-bottom:10px;display:none;"></div>
            <div id="sync-success" style="color:#4CAF50;font-size:14px;margin-bottom:10px;display:none;"></div>
            <input type="submit" class="staticrypt-decrypt-button" value="发送重置链接" />
          </form>
          <p style="margin-top:15px;font-size:14px;">
            <a href="#" id="reset-login-link">返回登录</a>
          </p>
        </div>
      </div>
    `);

    this._bindResetForm();
    document.getElementById('reset-login-link').onclick = (e) => {
      e.preventDefault();
      this.showLogin();
    };
  }

  /**
   * 隐藏同步 UI，恢复日记应用
   */
  hide() {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  /**
   * 显示临时状态提示
   */
  showToast(message, isSuccess = true) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${isSuccess ? '#4CAF50' : '#f44336'};
      color: white;
      border-radius: 6px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      z-index: 99999;
      animation: slideIn 0.3s ease-out;
      pointer-events: none;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ---- 内部方法 ----

  _render(html) {
    // 移除旧的容器
    this.hide();

    // 创建覆盖层
    this._container = document.createElement('div');
    this._container.id = 'sync-overlay';
    this._container.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(118, 184, 82, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99990;
      font-family: "Arial", sans-serif;
    `;
    this._container.innerHTML = html;
    document.body.appendChild(this._container);
  }

  _bindLoginForm() {
    document.getElementById('sync-login-form').onsubmit = async () => {
      const email = document.getElementById('sync-email').value.trim();
      const password = document.getElementById('sync-password').value;
      const errorEl = document.getElementById('sync-error');

      if (!email || !password) {
        this._showError('请填写邮箱和密码');
        return;
      }

      try {
        this._setLoading(true);
        await this.client.signIn(email, password);
        this.hide();
        this.showToast('登录成功，正在同步数据...', true);
        if (this._onAuthSuccess) this._onAuthSuccess();
      } catch (err) {
        this._showError(err.message || '登录失败');
      } finally {
        this._setLoading(false);
      }
    };
  }

  _bindRegisterForm() {
    document.getElementById('sync-register-form').onsubmit = async () => {
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;

      if (!email || password.length < 6) {
        this._showError('密码至少需要6位');
        return;
      }

      try {
        this._setLoading(true);
        const result = await this.client.signUp(email, password);

        // 检查是否需要邮箱验证
        if (result.user && result.user.identities && result.user.identities.length === 0) {
          this._showError('该邮箱已注册，请直接登录');
          return;
        }

        if (result.session) {
          // 邮箱验证已关闭，直接登录成功
          this.hide();
          this.showToast('注册成功！正在同步...', true);
          if (this._onAuthSuccess) this._onAuthSuccess();
        } else {
          // 需要邮箱验证
          this._showSuccess('注册成功！请检查邮箱并点击验证链接，然后返回登录。');
        }
      } catch (err) {
        this._showError(err.message || '注册失败');
      } finally {
        this._setLoading(false);
      }
    };
  }

  _bindResetForm() {
    document.getElementById('sync-reset-form').onsubmit = async () => {
      const email = document.getElementById('reset-email').value.trim();

      if (!email) {
        this._showError('请输入邮箱地址');
        return;
      }

      try {
        this._setLoading(true);
        const { error } = await this.client.client.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + window.location.pathname,
        });
        if (error) throw error;
        this._showSuccess('重置链接已发送到你的邮箱，请查收。');
      } catch (err) {
        this._showError(err.message || '发送失败');
      } finally {
        this._setLoading(false);
      }
    };
  }

  _showError(msg) {
    const el = document.getElementById('sync-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
    const succ = document.getElementById('sync-success');
    if (succ) succ.style.display = 'none';
  }

  _showSuccess(msg) {
    const el = document.getElementById('sync-success');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
    const err = document.getElementById('sync-error');
    if (err) err.style.display = 'none';
  }

  _setLoading(loading) {
    const btns = document.querySelectorAll('#sync-overlay .staticrypt-decrypt-button');
    btns.forEach(btn => {
      btn.disabled = loading;
      btn.value = loading ? '处理中...' : btn.value.replace('处理中...', '');
      btn.style.opacity = loading ? '0.6' : '1';
    });
  }

  _escape(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}

// 创建全局单例
window.syncUI = new SyncUI(window.diarySupabase);
