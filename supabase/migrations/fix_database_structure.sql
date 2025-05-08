-- 檢查並創建必要的表

-- 檢查 users 表是否存在，如果不存在則創建
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    CREATE TABLE public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT,
      email TEXT,
      district TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      avatar_url TEXT,
      is_vip BOOLEAN DEFAULT false,
      vip_until TIMESTAMP WITH TIME ZONE,
      check_in_streak INTEGER DEFAULT 0,
      last_check_in DATE,
      push_subscription JSONB
    );
  END IF;
END $$;

-- 檢查 posts 表是否存在，如果不存在則創建
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
  END IF;
END $$;

-- 檢查 comments 表是否存在，如果不存在則創建
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
  END IF;
END $$;

-- 檢查 notifications 表是否存在，如果不存在則創建
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
      sender_id UUID
    );
  END IF;
END $$;

-- 檢查 reports 表是否存在，如果不存在則創建
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reports') THEN
    CREATE TABLE public.reports (
      id SERIAL PRIMARY KEY,
      reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      post_id INTEGER REFERENCES public.posts(id) ON DELETE CASCADE,
      comment_id INTEGER REFERENCES public.comments(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      status TEXT DEFAULT 'pending'
    );
  END IF;
END $$;

-- 檢查 check_ins 表是否存在，如果不存在則創建
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'check_ins') THEN
    CREATE TABLE public.check_ins (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
END $$;

-- 修復列名稱問題

-- 檢查 posts 表中是否有 likes 列，如果有則重命名為 like_count
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'likes'
  ) THEN
    ALTER TABLE public.posts RENAME COLUMN likes TO like_count;
  END IF;
END $$;

-- 檢查 posts 表中是否缺少 like_count 列，如果缺少則添加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN like_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 檢查 posts 表中是否缺少 comment_count 列，如果缺少則添加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'comment_count'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN comment_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 檢查 posts 表中是否缺少 anonymous_name 列，如果缺少則添加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'anonymous_name'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN anonymous_name TEXT;
  END IF;
END $$;

-- 檢查 posts 表中是否缺少 avatar_seed 列，如果缺少則添加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'avatar_seed'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN avatar_seed TEXT;
  END IF;
END $$;

-- 檢查 comments 表中是否缺少 anonymous_name 列，如果缺少則添加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'anonymous_name'
  ) THEN
    ALTER TABLE public.comments ADD COLUMN anonymous_name TEXT;
  END IF;
END $$;

-- 檢查 comments 表中是否缺少 avatar_seed 列，如果缺少則添加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'avatar_seed'
  ) THEN
    ALTER TABLE public.comments ADD COLUMN avatar_seed TEXT;
  END IF;
END $$;

-- 設置 RLS 策略

-- 為 users 表設置 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 刪除現有策略以避免衝突
  DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
  
  -- 創建新策略
  CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);
    
  CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);
    
  CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);
END $$;

-- 為 posts 表設置 RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 刪除現有策略以避免衝突
  DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
  DROP POLICY IF EXISTS "Users can insert own posts" ON public.posts;
  DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
  DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
  
  -- 創建新策略
  CREATE POLICY "Anyone can view posts" ON public.posts
    FOR SELECT USING (true);
    
  CREATE POLICY "Users can insert own posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can delete own posts" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);
END $$;

-- 為 comments 表設置 RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 刪除現有策略以避免衝突
  DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
  DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
  DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
  DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
  
  -- 創建新策略
  CREATE POLICY "Anyone can view comments" ON public.comments
    FOR SELECT USING (true);
    
  CREATE POLICY "Users can insert own comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);
END $$;

-- 為 notifications 表設置 RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 刪除現有策略以避免衝突
  DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
  
  -- 創建新策略
  CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);
    
  CREATE POLICY "Anyone can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);
END $$;

-- 為 reports 表設置 RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 刪除現有策略以避免衝突
  DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;
  DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
  
  -- 創建新策略
  CREATE POLICY "Users can insert reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);
    
  CREATE POLICY "Users can view own reports" ON public.reports
    FOR SELECT USING (auth.uid() = reporter_id);
END $$;

-- 為 check_ins 表設置 RLS
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 刪除現有策略以避免衝突
  DROP POLICY IF EXISTS "Users can view own check-ins" ON public.check_ins;
  DROP POLICY IF EXISTS "Users can insert own check-ins" ON public.check_ins;
  
  -- 創建新策略
  CREATE POLICY "Users can view own check-ins" ON public.check_ins
    FOR SELECT USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can insert own check-ins" ON public.check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$;

-- 創建用戶註冊觸發器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查觸發器是否存在，如果不存在則創建
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 創建 VIP 檢查函數
CREATE OR REPLACE FUNCTION public.check_and_update_vip_status()
RETURNS VOID AS $$
BEGIN
  -- 更新連續打卡達到7天的用戶為VIP
  UPDATE public.users
  SET 
    is_vip = true,
    vip_until = CURRENT_DATE + INTERVAL '30 days'
  WHERE 
    check_in_streak >= 7 
    AND (is_vip = false OR vip_until IS NULL);
    
  -- 重置過期VIP狀態
  UPDATE public.users
  SET is_vip = false
  WHERE vip_until < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 創建每日檢查VIP狀態的函數
CREATE OR REPLACE FUNCTION public.daily_vip_check()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.check_and_update_vip_status();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查觸發器是否存在，如果不存在則創建
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'daily_vip_status_check' 
    AND tgrelid = 'public.check_ins'::regclass
  ) THEN
    CREATE TRIGGER daily_vip_status_check
    AFTER INSERT ON public.check_ins
    FOR EACH ROW EXECUTE FUNCTION public.daily_vip_check();
  END IF;
END $$;

-- 創建檢查打卡連續性的函數
CREATE OR REPLACE FUNCTION public.update_check_in_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_check_in_date DATE;
BEGIN
  -- 獲取用戶上次打卡日期
  SELECT last_check_in INTO last_check_in_date
  FROM public.users
  WHERE id = NEW.user_id;
  
  -- 更新用戶的打卡記錄
  IF last_check_in_date IS NULL OR last_check_in_date < CURRENT_DATE - INTERVAL '1 day' THEN
    -- 如果是第一次打卡或者中斷了連續打卡，重置連續打卡天數
    UPDATE public.users
    SET 
      check_in_streak = 1,
      last_check_in = CURRENT_DATE
    WHERE id = NEW.user_id;
  ELSIF last_check_in_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- 如果是連續打卡，增加連續打卡天數
    UPDATE public.users
    SET 
      check_in_streak = check_in_streak + 1,
      last_check_in = CURRENT_DATE
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查觸發器是否存在，如果不存在則創建
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'on_check_in_update_streak' 
    AND tgrelid = 'public.check_ins'::regclass
  ) THEN
    CREATE TRIGGER on_check_in_update_streak
    BEFORE INSERT ON public.check_ins
    FOR EACH ROW EXECUTE FUNCTION public.update_check_in_streak();
  END IF;
END $$;
