-- 檢查並添加 district 列到 users 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'district'
  ) THEN
    ALTER TABLE public.users ADD COLUMN district TEXT;
  END IF;
END $$;
