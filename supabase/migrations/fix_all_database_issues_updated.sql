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
    
    -- 設置 RLS 策略
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view all users" 
      ON public.users FOR SELECT 
      USING (true);
      
    CREATE POLICY "Users can update their own profile" 
      ON public.users FOR UPDATE 
      USING (auth.uid() = id);
      
    CREATE POLICY "Users can insert their own profile" 
      ON public.users FOR INSERT 
      WITH CHECK (auth.uid() = id);
  ELSE
    -- 確保 users 表有所有必要的列
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE public.users ADD COLUMN email TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding email column: %', SQLERRM;
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'district') THEN
        ALTER TABLE public.users ADD COLUMN district TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding district column: %', SQLERRM;
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'gender') THEN
        ALTER TABLE public.users ADD COLUMN gender TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding gender column: %', SQLERRM;
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'check_in_streak') THEN
        ALTER TABLE public.users ADD COLUMN check_in_streak INTEGER DEFAULT 0;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding check_in_streak column: %', SQLERRM;
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_check_in') THEN
        ALTER TABLE public.users ADD COLUMN last_check_in DATE;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding last_check_in column: %', SQLERRM;
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_vip') THEN
        ALTER TABLE public.users ADD COLUMN is_vip BOOLEAN DEFAULT false;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding is_vip column: %', SQLERRM;
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'vip_until') THEN
        ALTER TABLE public.users ADD COLUMN vip_until TIMESTAMP WITH TIME ZONE;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding vip_until column: %', SQLERRM;
    END;
  END IF;
END $$;

-- 檢查並創建 notifications 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE TABLE public.notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      related_id TEXT,
      related_type TEXT,
      sender_id UUID,
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- 設置 RLS 策略
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "用戶可以查看自己的通知" 
      ON public.notifications FOR SELECT 
      USING (auth.uid() = user_id);
      
    CREATE POLICY "用戶可以更新自己的通知" 
      ON public.notifications FOR UPDATE 
      USING (auth.uid() = user_id);
      
    CREATE POLICY "用戶可以插入通知" 
      ON public.notifications FOR INSERT 
      WITH CHECK (true);
  ELSE
    -- 確保 notifications 表有所有必要的列
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'sender_id') THEN
        ALTER TABLE public.notifications ADD COLUMN sender_id UUID;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding sender_id column: %', SQLERRM;
    END;
  END IF;
END $$;

-- 檢查並創建 comments 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
    CREATE TABLE public.comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      username TEXT,
      is_author BOOLEAN DEFAULT false,
      anonymous_name TEXT,
      avatar_seed TEXT
    );
    
    -- 設置 RLS 策略
    ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Everyone can view comments" 
      ON public.comments FOR SELECT 
      USING (true);
      
    CREATE POLICY "Authenticated users can insert comments" 
      ON public.comments FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated');
      
    CREATE POLICY "Users can update their own comments" 
      ON public.comments FOR UPDATE 
      USING (auth.uid() = user_id);
  ELSE
    -- 確保 comments 表有所有必要的列
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'is_author') THEN
        ALTER TABLE public.comments ADD COLUMN is_author BOOLEAN DEFAULT false;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding is_author column: %', SQLERRM;
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'anonymous_name') THEN
        ALTER TABLE public.comments ADD COLUMN anonymous_name TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding anonymous_name column: %', SQLERRM;
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'avatar_seed') THEN
        ALTER TABLE public.comments ADD COLUMN avatar_seed TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding avatar_seed column: %', SQLERRM;
    END;
  END IF;
END $$;

-- 創建或更新打卡函數
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

-- 為現有用戶創建記錄
DO $$
BEGIN
  -- 檢查 email 列是否存在
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email') THEN
    -- 如果存在，使用 email 列
    INSERT INTO public.users (id, email, created_at, updated_at)
    SELECT id, email, NOW(), NOW()
    FROM auth.users
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- 如果不存在，只使用 id 和時間戳
    INSERT INTO public.users (id, created_at, updated_at)
    SELECT id, NOW(), NOW()
    FROM auth.users
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 授予必要的權限
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
GRANT EXECUTE ON FUNCTION public.check_in(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_in(uuid) TO service_role;
