-- 刪除現有的策略
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;

-- 創建新的策略，避免無限遞歸
-- 允許所有已認證用戶查看管理員表
CREATE POLICY "Authenticated users can view admins" ON public.admins
  FOR SELECT USING (auth.role() = 'authenticated');

-- 創建一個特殊的服務角色策略，用於管理員操作
CREATE POLICY "Service role can manage admins" ON public.admins
  USING (auth.role() = 'service_role');

-- 修復 is_admin 函數，避免無限遞歸
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  admin_exists BOOLEAN;
BEGIN
  -- 直接查詢，不通過RLS
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = user_uuid
  ) INTO admin_exists;
  
  RETURN admin_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
