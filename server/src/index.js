const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'diary-secret-key-change-in-production';

app.use(cors({
  origin: '*', // 生产环境应指定具体域名
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: '用户名已存在' });
          }
          return res.status(500).json({ error: '注册失败' });
        }
        res.status(201).json({ message: '注册成功' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    db.get(
      'SELECT id, username, password_hash FROM users WHERE username = ?',
      [username],
      async (err, user) => {
        if (err || !user) {
          return res.status(401).json({ error: '用户名或密码错误' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
          return res.status(401).json({ error: '用户名或密码错误' });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        res.json({ 
          message: '登录成功',
          token,
          user: { id: user.id, username: user.username }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取日记
app.get('/api/diaries/:date', verifyToken, async (req, res) => {
  try {
    const { date } = req.params;
    const { username } = req.user;

    db.get(
      'SELECT * FROM diaries WHERE username = ? AND date = ?',
      [username, date],
      (err, diary) => {
        if (err) {
          return res.status(500).json({ error: '查询失败' });
        }
        res.json(diary || { content: '' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 保存日记
app.post('/api/diaries', verifyToken, async (req, res) => {
  try {
    const { username } = req.user;
    const { date, content } = req.body;

    if (!date || content === undefined) {
      return res.status(400).json({ error: '日期和内容不能为空' });
    }

    db.run(
      `INSERT INTO diaries (username, date, content, updated_at) 
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(username, date) 
       DO UPDATE SET content = ?, updated_at = datetime('now')`,
      [username, date, content, content],
      function(err) {
        if (err) {
          return res.status(500).json({ error: '保存失败' });
        }
        res.json({ message: '保存成功' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取日期范围内的日记
app.get('/api/diaries/:start/:end', verifyToken, async (req, res) => {
  try {
    const { start, end } = req.params;
    const { username } = req.user;

    db.all(
      'SELECT date, content FROM diaries WHERE username = ? AND date >= ? AND date <= ? ORDER BY date DESC',
      [username, start, end],
      (err, diaries) => {
        if (err) {
          return res.status(500).json({ error: '查询失败' });
        }
        res.json(diaries || []);
      }
    );
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 验证中间件
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
