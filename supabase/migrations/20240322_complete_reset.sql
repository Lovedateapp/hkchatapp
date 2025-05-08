-- 重置數據庫 (刪除現有表格)
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS user_activity CASCADE;

-- 創建 profiles 表
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gender TEXT,
  district TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 創建 posts 表
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  district TEXT NOT NULL,
  categories TEXT[] DEFAULT '{}',
  random_username TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 創建 comments 表
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  username TEXT NOT NULL,
  is_author BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 創建推送通知訂閱表
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 創建用戶活動表
CREATE TABLE public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 設置行級安全策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- 創建 profiles 的安全策略
CREATE POLICY "用戶可以查看所有個人資料" ON public.profiles
  FOR SELECT USING (true);
  
CREATE POLICY "用戶只能更新自己的個人資料" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
  
CREATE POLICY "用戶只能插入自己的個人資料" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 創建 posts 的安全策略
CREATE POLICY "所有人可以查看所有帖子" ON public.posts
  FOR SELECT USING (true);
  
CREATE POLICY "已登入用戶可以創建帖子" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "用戶只能更新自己的帖子" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "用戶只能刪除自己的帖子" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- 創建 comments 的安全策略
CREATE POLICY "所有人可以查看所有評論" ON public.comments
  FOR SELECT USING (true);
  
CREATE POLICY "已登入用戶可以創建評論" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "用戶只能更新自己的評論" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "用戶只能刪除自己的評論" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- 創建推送通知訂閱的安全策略
CREATE POLICY "用戶可以查看自己的推送訂閱" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "用戶可以創建自己的推送訂閱" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "用戶可以更新自己的推送訂閱" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "用戶可以刪除自己的推送訂閱" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- 創建用戶活動的安全策略
CREATE POLICY "用戶可以查看自己的活動記錄" ON public.user_activity
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "用戶可以創建自己的活動記錄" ON public.user_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "用戶可以更新自己的活動記錄" ON public.user_activity
  FOR UPDATE USING (auth.uid() = user_id);

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
