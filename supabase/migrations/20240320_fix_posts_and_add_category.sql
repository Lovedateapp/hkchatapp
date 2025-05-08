-- 添加系统用户（如果不存在）
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'system@example.com', 'SYSTEM_USER', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 添加系统用户的个人资料（如果不存在）
INSERT INTO public.profiles (id, username, avatar_url, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'System', NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 更新没有user_id的帖子，将其设置为系统用户
UPDATE public.posts
SET user_id = '00000000-0000-0000-0000-000000000000'
WHERE user_id IS NULL;

-- 确保posts表的user_id列不为空
ALTER TABLE public.posts
ALTER COLUMN user_id SET NOT NULL;

-- 添加"交友"分类到categories表（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        INSERT INTO public.categories (slug, name, description)
        VALUES ('dating', '交友', '尋找新朋友和約會對象')
        ON CONFLICT (slug) DO NOTHING;
    END IF;
END
$$;

-- 添加is_vip字段到profiles表（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_vip') THEN
        ALTER TABLE public.profiles ADD COLUMN is_vip BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;

-- 添加vip_until字段到profiles表（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'vip_until') THEN
        ALTER TABLE public.profiles ADD COLUMN vip_until TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;

-- 添加consecutive_check_ins字段到profiles表（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'consecutive_check_ins') THEN
        ALTER TABLE public.profiles ADD COLUMN consecutive_check_ins INTEGER DEFAULT 0;
    END IF;
END
$$;

-- 添加last_check_in字段到profiles表（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'last_check_in') THEN
        ALTER TABLE public.profiles ADD COLUMN last_check_in TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;
