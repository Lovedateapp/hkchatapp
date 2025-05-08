-- 確保admins表存在
CREATE TABLE IF NOT EXISTS public.admins (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- 啟用RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 刪除所有現有策略
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;
DROP POLICY IF EXISTS "Authenticated users can view admins" ON public.admins;
DROP POLICY IF EXISTS "Service role can manage admins" ON public.admins;

-- 創建新的策略
-- 允許所有已認證用戶查看管理員表
CREATE POLICY "Authenticated users can view admins" ON public.admins
  FOR SELECT USING (auth.role() = 'authenticated');

-- 允許服務角色完全管理管理員表
CREATE POLICY "Service role can manage admins" ON public.admins
  USING (auth.role() = 'service_role');

-- 允許管理員添加新管理員
CREATE POLICY "Admins can insert new admins" ON public.admins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
    )
  );

-- 允許管理員刪除其他管理員（但不能刪除自己）
CREATE POLICY "Admins can delete other admins" ON public.admins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
    ) AND user_id != auth.uid()
  );
