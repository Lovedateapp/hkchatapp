-- 創建通知表
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  sender_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 設置行級安全策略
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 創建通知的安全策略
CREATE POLICY "用戶可以查看自己的通知" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用戶可以更新自己的通知" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- 授予必要的權限
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
