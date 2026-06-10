-- ============================================================
-- 日记应用 Supabase 数据库迁移脚本
-- 在 Supabase Dashboard → SQL Editor 中执行此文件
-- ============================================================

-- 1. 创建日记条目表
CREATE TABLE IF NOT EXISTS diaries (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL,
  content     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),

  -- 每个用户每天只能有一篇日记
  UNIQUE(user_id, date)
);

-- 2. 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER diaries_updated_at
  BEFORE UPDATE ON diaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. 启用行级安全 (RLS)
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略：用户只能读写自己的日记
CREATE POLICY "Users can view own diaries"
  ON diaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diaries"
  ON diaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diaries"
  ON diaries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own diaries"
  ON diaries FOR DELETE
  USING (auth.uid() = user_id);

-- 5. 为 date 列创建索引（按日期范围查询常用）
CREATE INDEX idx_diaries_user_date ON diaries(user_id, date DESC);

-- 6. 确认 Auth 设置
-- 请在 Supabase Dashboard → Authentication → Settings 中：
--   - 确保 "Enable email confirmations" 按需设置（个人使用建议关闭）
--   - 在 Authentication → URL Configuration 中设置 Site URL 为你的 GitHub Pages 地址
