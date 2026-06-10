// 同步 UI 控制器
class SyncUI {
  constructor(syncClient) {
    this.syncClient = syncClient;
    this.uiVisible = false;
  }

  // 显示登录表单
  showLogin() {
    const formHTML = `
      <div class="staticrypt-page">
        <div class="staticrypt-form">
          <div class="staticrypt-instructions">
            <p class="staticrypt-title">云端同步登录</p>
            <p>输入你的账号密码进行同步</p>
          </div>
          <hr class="staticrypt-hr" />
          <form id="sync-login-form">
            <input type="text" id="sync-username" placeholder="用户名" required />
            <input type="password" id="sync-password" placeholder="密码" required />
            <input type="submit" class="staticrypt-decrypt-button" value="登录" />
          </form>
          <p style="margin-top: 20px;">
            还没有账号？<a href="#" id="sync-register-link">立即注册</a>
          </p>
        </div>
      </div>
    `;
    
    document.getElementById('staticrypt_content').innerHTML = formHTML;
    
    // 绑定登录表单提交
    document.getElementById('sync-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('sync-username').value;
      const password = document.getElementById('sync-password').value;
      
      try {
        await this.syncClient.login(username, password);
        alert('登录成功！正在同步数据...');
        this.uiVisible = true;
        this.restoreOriginalUI();
      } catch (error) {
        alert('登录失败: ' + error.message);
      }
    });
    
    // 绑定注册链接
    document.getElementById('sync-register-link').addEventListener('click', async (e) => {
      e.preventDefault();
      await this.showRegister();
    });
  }

  // 显示注册表单
  async showRegister() {
    const formHTML = `
      <div class="staticrypt-page">
        <div class="staticrypt-form">
          <div class="staticrypt-instructions">
            <p class="staticrypt-title">注册新账号</p>
            <p>创建你的日记账号</p>
          </div>
          <hr class="staticrypt-hr" />
          <form id="sync-register-form">
            <input type="text" id="reg-username" placeholder="用户名" required />
            <input type="password" id="reg-password" placeholder="密码" required />
            <input type="submit" class="staticrypt-decrypt-button" value="注册" />
          </form>
          <p style="margin-top: 20px;">
            已有账号？<a href="#" id="reg-login-link">立即登录</a>
          </p>
        </div>
      </div>
    `;
    
    document.getElementById('staticrypt_content').innerHTML = formHTML;
    
    document.getElementById('sync-register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value;
      const password = document.getElementById('reg-password').value;
      
      try {
        await this.syncClient.register(username, password);
        alert('注册成功！请登录');
        this.showLogin();
      } catch (error) {
        alert('注册失败: ' + error.message);
      }
    });
    
    document.getElementById('reg-login-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.showLogin();
    });
  }

  // 恢复原始日记 UI
  restoreOriginalUI() {
    // 读取原始 HTML 备份
    fetch('index.html.bak')
      .then(response => response.text())
      .then(html => {
        document.open();
        document.write(html);
        document.close();
        this.uiVisible = true;
      })
      .catch(() => {
        alert('无法加载原始页面，请刷新页面重试');
      });
  }

  // 检查同步状态
  checkSyncStatus() {
    if (!this.syncClient.isAuthenticated()) {
      this.showLogin();
      return false;
    }
    return true;
  }

  // 显示同步状态
  showSyncStatus(message, isSuccess) {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      background: ${isSuccess ? '#4CAF50' : '#f44336'};
      color: white;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    statusDiv.textContent = message;
    
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
      statusDiv.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => statusDiv.remove(), 300);
    }, 3000);
  }
}
