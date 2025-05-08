-- 完全修復 "Database error granting user" 問題
-- 這個腳本基於 Supabase 官方文檔的建議

-- 1. 檢查並刪除可能存在的觸發器
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN 
    SELECT tgname, relname 
    FROM pg_trigger 
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid 
    WHERE relnamespace = 'auth'::regnamespace::oid
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.%I CASCADE;', 
                   trigger_rec.tgname, trigger_rec.relname);
    RAISE NOTICE 'Dropped trigger % on auth.%', 
                 trigger_rec.tgname, trigger_rec.relname;
  END LOOP;
END
$$;

-- 2. 檢查並刪除可能存在的觸發器函數
DO $$
DECLARE
  func_rec RECORD;
BEGIN
  FOR func_rec IN 
    SELECT proname 
    FROM pg_proc 
    WHERE pronamespace = 'auth'::regnamespace::oid
    AND prokind = 'f'
  LOOP
    BEGIN
      EXECUTE format('DROP FUNCTION IF EXISTS auth.%I() CASCADE;', func_rec.proname);
      RAISE NOTICE 'Dropped function auth.%', func_rec.proname;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop function auth.%: %', func_rec.proname, SQLERRM;
    END;
  END LOOP;
END
$$;

-- 3. 重新創建 profiles 表，確保沒有外鍵約束問題
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 刪除現有觸發器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 創建新的觸發器函數
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 檢查用戶是否已存在
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- 插入新用戶到 public.users 表
    INSERT INTO public.users (id, anonymous_id, streak_days, created_at)
    VALUES (
      NEW.id, 
      generate_hk_name(), 
      0, 
      NOW()
    );
    
    -- 輸出調試信息
    RAISE NOTICE 'Created new user with ID: %', NEW.id;
  ELSE
    RAISE NOTICE 'User already exists with ID: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 創建觸發器
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 確保 RLS 策略正確設置
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 允許所有已認證用戶查看自己的數據
CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- 允許所有已認證用戶更新自己的數據
CREATE POLICY "Users can update their own data" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- 手動為現有用戶創建記錄
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN SELECT id FROM auth.users WHERE id NOT IN (SELECT id FROM public.users)
  LOOP
    INSERT INTO public.users (id, anonymous_id, streak_days, created_at)
    VALUES (
      auth_user.id, 
      generate_hk_name(), 
      0, 
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created missing user record for ID: %', auth_user.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  anonymous_id TEXT,
  streak_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. 設置 RLS 策略
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.users;

-- 創建更寬鬆的策略
CREATE POLICY "Users can view their own data" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can manage all profiles" 
ON public.users FOR ALL
USING (true);

-- 7. 授予必要的權限
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 8. 為現有用戶創建個人資料
INSERT INTO public.users (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;
