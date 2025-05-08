-- 檢查並添加 is_author 列到 comments 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'comments' 
    AND column_name = 'is_author'
  ) THEN
    ALTER TABLE public.comments ADD COLUMN is_author BOOLEAN DEFAULT false;
  END IF;
END $$;
