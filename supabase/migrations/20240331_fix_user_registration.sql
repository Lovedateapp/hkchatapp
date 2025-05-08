-- 檢查並修復用戶註冊觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 創建一個更安全的觸發器函數
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 檢查用戶是否已存在於users表中
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- 用戶已存在，不需要再次插入
    RETURN NEW;
  END IF;

  -- 插入新用戶到users表
  INSERT INTO public.users (
    id,
    anonymous_id,
    gender,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(
      (SELECT anonymous_id FROM public.users WHERE id = NEW.id),
      'user_' || substr(md5(NEW.id::text), 1, 8)
    ),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'other'),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重新創建觸發器
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 確保users表有正確的RLS策略
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 刪除可能衝突的策略
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

-- 創建新的策略
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users" ON public.users
  USING (auth.role() = 'service_role');

-- 允許所有已認證用戶查看其他用戶的基本信息
CREATE POLICY "Authenticated users can view other users basic info" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');
