-- 確保reports表存在
CREATE TABLE IF NOT EXISTS public.reports (
  id SERIAL PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id),
  post_id INTEGER,
  post_content TEXT,
  poster_id UUID,
  comment_id INTEGER,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 啟用RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 刪除所有現有策略
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
DROP POLICY IF EXISTS "Service role can manage reports" ON public.reports;

-- 創建新的策略
-- 允許已認證用戶創建報告
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 允許用戶查看自己的報告
CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- 允許服務角色完全管理報告
CREATE POLICY "Service role can manage reports" ON public.reports
  USING (auth.role() = 'service_role');

-- 允許管理員查看所有報告
CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
    )
  );

-- 允許管理員更新報告
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE user_id = auth.uid()
    )
  );
