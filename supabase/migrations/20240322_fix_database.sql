-- 確保 profiles 表存在並有正確的結構
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gender TEXT,
  district TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 確保行級安全策略已啟用
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 重新創建安全策略 (先刪除可能存在的策略)
DROP POLICY IF EXISTS "用戶可以查看所有個人資料" ON public.profiles;
DROP POLICY IF EXISTS "用戶只能更新自己的個人資料" ON public.profiles;
DROP POLICY IF EXISTS "用戶只能插入自己的個人資料" ON public.profiles;

-- 創建 profiles 的安全策略
CREATE POLICY "用戶可以查看所有個人資料" ON public.profiles
  FOR SELECT USING (true);
  
CREATE POLICY "用戶只能更新自己的個人資料" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
  
CREATE POLICY "用戶只能插入自己的個人資料" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 創建自動創建用戶個人資料的觸發器
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 為新用戶註冊添加觸發器
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_user();

-- 為現有用戶創建個人資料
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 授予匿名用戶對 profiles 表的訪問權限
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
