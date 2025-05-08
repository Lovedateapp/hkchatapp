-- 確保 auth.users 表有正確的權限
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- 確保 users 表存在並有正確的結構
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_check_in DATE,
  check_in_streak INTEGER DEFAULT 0,
  is_vip BOOLEAN DEFAULT false,
  vip_until TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT false,
  gender TEXT,
  district TEXT
);

-- 確保 users 表有正確的權限
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 創建或替換用戶創建觸發器函數
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 刪除現有觸發器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 創建新的觸發器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 確保 users 表有正確的 RLS 策略
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 確保 check_ins 表存在
CREATE TABLE IF NOT EXISTS public.check_ins (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, check_in_date)
);

-- 確保 check_ins 表有正確的權限
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- 確保 check_ins 表有正確的 RLS 策略
DROP POLICY IF EXISTS "Users can view their own check-ins" ON public.check_ins;
CREATE POLICY "Users can view their own check-ins" ON public.check_ins
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own check-ins" ON public.check_ins;
CREATE POLICY "Users can insert their own check-ins" ON public.check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 確保 reports 表存在
CREATE TABLE IF NOT EXISTS public.reports (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 確保 reports 表有正確的權限
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 確保 reports 表有正確的 RLS 策略
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;
CREATE POLICY "Users can insert their own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 設置指定用戶為管理員
INSERT INTO public.users (id, email, is_admin, created_at, updated_at)
VALUES ('8054649d-d34c-4218-9d07-f94cca7c6d21', 'admin@example.com', true, NOW(), NOW())
ON CONFLICT (id) 
DO UPDATE SET is_admin = true, updated_at = NOW();
