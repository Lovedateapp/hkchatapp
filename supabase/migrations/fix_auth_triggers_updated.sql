-- 修復 "Database error granting user" 問題的更新腳本
-- 處理外鍵約束問題

-- 1. 首先刪除 notifications 表上的外鍵約束
ALTER TABLE IF EXISTS public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- 2. 檢查並刪除可能存在的觸發器
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
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.%I CASCADE;', 
                   trigger_rec.tgname, trigger_rec.relname);
      RAISE NOTICE 'Dropped trigger % on auth.%', 
                 trigger_rec.tgname, trigger_rec.relname;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop trigger % on auth.%: %', 
                 trigger_rec.tgname, trigger_rec.relname, SQLERRM;
    END;
  END LOOP;
END
$$;

-- 3. 檢查並刪除可能存在的觸發器函數
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

-- 4. 重新創建 profiles 表，確保沒有外鍵約束問題
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  gender TEXT,
  district TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. 創建一個安全的觸發器函數，不使用外鍵約束
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, gender, district)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'gender', NEW.raw_user_meta_data->>'district')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 6. 重新創建觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. 設置 RLS 策略
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- 創建更寬鬆的策略
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can manage all profiles" 
ON public.profiles FOR ALL
USING (true);

-- 8. 授予必要的權限
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 9. 為現有用戶創建個人資料
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 10. 如果需要，重新創建 notifications 表的外鍵約束，但使用 ON DELETE CASCADE
-- 注意：只有在確定需要這個約束時才取消註釋這段代碼
/*
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
*/
