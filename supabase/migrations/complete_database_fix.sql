-- 檢查並創建 users 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    CREATE TABLE public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      username TEXT,
      district TEXT,
      gender TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      avatar_url TEXT,
      is_vip BOOLEAN DEFAULT false,
      vip_until TIMESTAMP WITH TIME ZONE,
      check_in_streak INTEGER DEFAULT 0,
      last_check_in DATE
    );
  ELSE
    -- 確保 users 表有所有必要的列
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'district') THEN
      ALTER TABLE public.users ADD COLUMN district TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'gender') THEN
      ALTER TABLE public.users ADD COLUMN gender TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'check_in_streak') THEN
      ALTER TABLE public.users ADD COLUMN check_in_streak INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_check_in') THEN
      ALTER TABLE public.users ADD COLUMN last_check_in DATE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_vip') THEN
      ALTER TABLE public.users ADD COLUMN is_vip BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'vip_until') THEN
      ALTER TABLE public.users ADD COLUMN vip_until TIMESTAMP WITH TIME ZONE;
    END IF;
  END IF;
END $$;

-- 檢查並創建 posts 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'posts') THEN
    CREATE TABLE public.posts (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      district TEXT,
      categories TEXT[],
      anonymous_name TEXT,
      avatar_seed TEXT,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0
    );
  ELSE
    -- 確保 posts 表有所有必要的列
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'like_count') THEN
      ALTER TABLE public.posts ADD COLUMN like_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'comment_count') THEN
      ALTER TABLE public.posts ADD COLUMN comment_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'anonymous_name') THEN
      ALTER TABLE public.posts ADD COLUMN anonymous_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'avatar_seed') THEN
      ALTER TABLE public.posts ADD COLUMN avatar_seed TEXT;
    END IF;
    
    -- 如果存在 likes 列但不存在 like_count 列，則重命名
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'likes') 
       AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'like_count') THEN
      ALTER TABLE public.posts RENAME COLUMN likes TO like_count;
    END IF;
    
    -- 如果存在 random_username 列但不存在 anonymous_name 列，則重命名
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'random_username') 
       AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'anonymous_name') THEN
      ALTER TABLE public.posts RENAME COLUMN random_username TO anonymous_name;
    END IF;
  END IF;
END $$;

-- 檢查並創建 comments 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
    CREATE TABLE public.comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES public.posts(id) ON DELETE CASCADE,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      username TEXT,
      is_author BOOLEAN DEFAULT false,
      anonymous_name TEXT,
      avatar_seed TEXT
    );
  ELSE
    -- 確保 comments 表有所有必要的列
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'is_author') THEN
      ALTER TABLE public.comments ADD COLUMN is_author BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'anonymous_name') THEN
      ALTER TABLE public.comments ADD COLUMN anonymous_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'avatar_seed') THEN
      ALTER TABLE public.comments ADD COLUMN avatar_seed TEXT;
    END IF;
    
    -- 如果存在 username 列但不存在 anonymous_name 列，則重命名
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'username') 
       AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'anonymous_name') THEN
      ALTER TABLE public.comments RENAME COLUMN username TO anonymous_name;
    END IF;
  END IF;
END $$;

-- 檢查並創建 check_ins 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'check_ins') THEN
    CREATE TABLE public.check_ins (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(user_id, check_in_date)
    );
  END IF;
END $$;

-- 檢查並創建 notifications 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE TABLE public.notifications (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      read BOOLEAN DEFAULT false,
      related_id TEXT,
      related_type TEXT,
      sender_id TEXT
    );
  END IF;
END $$;

-- 檢查並創建 reports 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reports') THEN
    CREATE TABLE public.reports (
      id SERIAL PRIMARY KEY,
      reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      post_id INTEGER REFERENCES public.posts(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      content TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
END $$;

-- 設置 RLS 策略
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 策略
DO $$
BEGIN
  -- Users 表策略
  DROP POLICY IF EXISTS "Users can view all users" ON public.users;
  CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
  CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
  
  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
  CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
  
  -- Posts 表策略
  DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
  CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
  CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  
  DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
  CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
  
  -- Comments 表策略
  DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
  CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
  CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  
  -- Check-ins 表策略
  DROP POLICY IF EXISTS "Users can view their own check-ins" ON public.check_ins;
  CREATE POLICY "Users can view their own check-ins" ON public.check_ins FOR SELECT USING (auth.uid() = user_id);
  
  DROP POLICY IF EXISTS "Users can create their own check-ins" ON public.check_ins;
  CREATE POLICY "Users can create their own check-ins" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
  
  -- Notifications 表策略
  DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
  CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
  
  DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
  CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
  
  DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
  CREATE POLICY "Anyone can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
  
  -- Reports 表策略
  DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
  CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);
  
  DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
  CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
END $$;

-- 創建用戶註冊觸發器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查觸發器是否存在，如果不存在則創建
DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
END $$;

-- 為現有用戶創建記錄
INSERT INTO public.users (id, email, username, created_at, updated_at)
SELECT id, email, email, NOW(), NOW()
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 創建 VIP 檢查函數
CREATE OR REPLACE FUNCTION public.check_vip_status(user_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
  is_vip BOOLEAN;
BEGIN
  SELECT u.is_vip INTO is_vip
  FROM public.users u
  WHERE u.id = user_id;
  
  RETURN COALESCE(is_vip, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 創建獲取剩餘 VIP 天數函數
CREATE OR REPLACE FUNCTION public.get_remaining_vip_days(user_id uuid)
RETURNS INTEGER AS $$
DECLARE
  days_remaining INTEGER;
BEGIN
  SELECT 
    CASE 
      WHEN u.vip_until IS NULL THEN 0
      WHEN u.vip_until < NOW() THEN 0
      ELSE EXTRACT(DAY FROM u.vip_until - NOW())::INTEGER
    END INTO days_remaining
  FROM public.users u
  WHERE u.id = user_id;
  
  RETURN COALESCE(days_remaining, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 創建更新 VIP 狀態函數
CREATE OR REPLACE FUNCTION public.update_vip_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果用戶連續打卡達到7天，給予30天VIP
  IF NEW.check_in_streak >= 7 AND (NEW.is_vip = false OR NEW.vip_until IS NULL OR NEW.vip_until < NOW()) THEN
    NEW.is_vip := true;
    NEW.vip_until := NOW() + INTERVAL '30 days';
  END IF;
  
  -- 如果VIP已過期，重置狀態
  IF NEW.vip_until IS NOT NULL AND NEW.vip_until < NOW() THEN
    NEW.is_vip := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 創建 VIP 更新觸發器
DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_user_update_vip_status ON public.users;
  CREATE TRIGGER on_user_update_vip_status
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_vip_status();
END $$;

-- 創建打卡函數
CREATE OR REPLACE FUNCTION public.check_in(user_id uuid)
RETURNS JSONB AS $$
DECLARE
  last_check_in_date DATE;
  current_streak INTEGER;
  result JSONB;
BEGIN
  -- 獲取用戶上次打卡日期和當前連續打卡天數
  SELECT u.last_check_in, u.check_in_streak INTO last_check_in_date, current_streak
  FROM public.users u
  WHERE u.id = user_id;
  
  -- 如果今天已經打卡，返回錯誤
  IF last_check_in_date = CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '今天已經打卡過了',
      'streak', current_streak
    );
  END IF;
  
  -- 插入新的打卡記錄
  INSERT INTO public.check_ins (user_id, check_in_date)
  VALUES (user_id, CURRENT_DATE);
  
  -- 更新用戶的打卡記錄
  IF last_check_in_date IS NULL OR last_check_in_date < CURRENT_DATE - INTERVAL '1 day' THEN
    -- 如果是第一次打卡或者中斷了連續打卡，重置連續打卡天數
    UPDATE public.users
    SET 
      check_in_streak = 1,
      last_check_in = CURRENT_DATE
    WHERE id = user_id;
    
    current_streak := 1;
  ELSIF last_check_in_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- 如果是連續打卡，增加連續打卡天數
    UPDATE public.users
    SET 
      check_in_streak = check_in_streak + 1,
      last_check_in = CURRENT_DATE
    WHERE id = user_id;
    
    current_streak := current_streak + 1;
    
    -- 如果連續打卡達到7天，給予VIP
    IF current_streak >= 7 THEN
      UPDATE public.users
      SET 
        is_vip = true,
        vip_until = CURRENT_DATE + INTERVAL '30 days'
      WHERE id = user_id AND (is_vip = false OR vip_until IS NULL OR vip_until < CURRENT_DATE);
    END IF;
  END IF;
  
  -- 返回成功結果
  RETURN jsonb_build_object(
    'success', true,
    'message', '打卡成功',
    'streak', current_streak
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
