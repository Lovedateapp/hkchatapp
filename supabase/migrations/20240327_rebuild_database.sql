-- First, enable the PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Complete database rebuild with improved structure
-- This migration creates a more robust database design for the Hong Kong dating app

-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.hk_lexicon CASCADE;
DROP TABLE IF EXISTS public.check_ins CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;

-- 重新構建數據庫結構

-- 用戶核心表
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  anonymous_id TEXT NOT NULL UNIQUE,
  vip_expires_at TIMESTAMPTZ,
  streak_days INT DEFAULT 0,
  location GEOGRAPHY(POINT,4326),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 帖子表
CREATE TABLE IF NOT EXISTS public.posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  anonymous_name TEXT NOT NULL,  -- 格式：旺角奶茶#9527
  avatar_seed TEXT NOT NULL,     -- 示例：a3f8b2c4
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 評論表
CREATE TABLE IF NOT EXISTS public.comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  anonymous_name TEXT NOT NULL,  -- 與發帖不同
  avatar_seed TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 創建詞庫表
CREATE TABLE IF NOT EXISTS public.hk_lexicon (
  id SERIAL PRIMARY KEY,
  category TEXT CHECK(category IN ('地點','食物','稱謂','動詞','形容詞','符號','數字','潮語')),
  term TEXT NOT NULL
);

-- 插入示例詞彙（部分示例）
INSERT INTO hk_lexicon (category, term) VALUES
('地點','旺角'),('地點','觀塘'),('地點','銅鑼灣'),('地點','中環'),('地點','尖沙咀'),
('地點','深水埗'),('地點','荃灣'),('地點','沙田'),('地點','元朗'),('地點','大埔'),
('食物','蛋撻'),('食物','奶茶'),('食物','菠蘿包'),('食物','燒賣'),('食物','雞蛋仔'),
('食物','魚蛋'),('食物','叉燒包'),('食物','腸粉'),('食物','雲吞麵'),('食物','咖喱魚蛋'),
('稱謂','巴打'),('稱謂','絲打'),('稱謂','師奶'),('稱謂','阿叔'),('稱謂','靚仔'),
('稱謂','靚女'),('稱謂','大佬'),('稱謂','細佬'),('稱謂','阿哥'),('稱謂','阿姐'),
('動詞','OT'),('動詞','放飛'),('動詞','傾偈'),('動詞','搭棚'),('動詞','執嘢'),
('動詞','搵食'),('動詞','吹水'),('動詞','打邊爐'),('動詞','飲茶'),('動詞','睇戲'),
('形容詞','MK'),('形容詞','好正'),('形容詞','勁爆'),('形容詞','核突'),('形容詞','醒目'),
('形容詞','好嘢'),('形容詞','犀利'),('形容詞','堅'),('形容詞','靚'),('形容詞','型'),
('符號','★'),('符號','♥'),('符號','☆'),('符號','♪'),('符號','✓'),
('符號','♛'),('符號','♕'),('符號','☺'),('符號','☻'),('符號','♡'),
('數字','2024'),('數字','007'),('數字','123'),('數字','520'),('數字','1314'),
('數字','666'),('數字','888'),('數字','999'),('數字','101'),('數字','404'),
('潮語','係咁先'),('潮語','GG'),('潮語','廢青'),('潮語','黃屍'),('潮語','藍絲'),
('潮語','手足'),('潮語','老細'),('潮語','收皮'),('潮語','唔該'),('潮語','多謝')
ON CONFLICT DO NOTHING;

-- 創建名稱生成函數
CREATE OR REPLACE FUNCTION generate_hk_name()
RETURNS TEXT AS $$
DECLARE
  location_term TEXT;
  food_term TEXT;
  number_term TEXT;
  result TEXT;
BEGIN
  -- 隨機選擇詞彙
  SELECT term INTO location_term FROM hk_lexicon WHERE category = '地點' ORDER BY random() LIMIT 1;
  SELECT term INTO food_term FROM hk_lexicon WHERE category = '食物' ORDER BY random() LIMIT 1;
  SELECT term INTO number_term FROM hk_lexicon WHERE category = '數字' ORDER BY random() LIMIT 1;
  
  -- 組合名稱
  result := location_term || food_term || '#' || substring(number_term from 1 for 4);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 創建頭像種子生成函數
CREATE OR REPLACE FUNCTION generate_avatar_seed()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdef0123456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 設置發帖觸發器
CREATE OR REPLACE FUNCTION set_post_identity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.anonymous_name := generate_hk_name();
  NEW.avatar_seed := generate_avatar_seed();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 刪除現有觸發器（如果存在）
DROP TRIGGER IF EXISTS before_post_insert ON posts;

-- 創建新觸發器
CREATE TRIGGER before_post_insert
BEFORE INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION set_post_identity();

-- 設置評論觸發器
CREATE OR REPLACE FUNCTION set_comment_identity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.anonymous_name := generate_hk_name();
  NEW.avatar_seed := generate_avatar_seed();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 刪除現有觸發器（如果存在）
DROP TRIGGER IF EXISTS before_comment_insert ON comments;

-- 創建新觸發器
CREATE TRIGGER before_comment_insert
BEFORE INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION set_comment_identity();

-- 創建評論計數更新函數
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 刪除現有觸發器（如果存在）
DROP TRIGGER IF EXISTS update_comment_count ON comments;

-- 創建新觸發器
CREATE TRIGGER update_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- 設置 RLS 策略
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hk_lexicon ENABLE ROW LEVEL SECURITY;

-- 刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can view lexicon" ON public.hk_lexicon;

-- 創建新策略
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view all posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view lexicon" ON public.hk_lexicon FOR SELECT USING (true);

-- 授予必要的權限
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.posts TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.comments TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.hk_lexicon TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE hk_lexicon_id_seq TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE posts_id_seq TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE comments_id_seq TO postgres, anon, authenticated, service_role;

-- 創建用戶註冊觸發器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, anonymous_id)
  VALUES (NEW.id, gen_random_uuid()::text)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 刪除現有觸發器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 創建新觸發器
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 創建附近VIP用戶查詢函數
CREATE OR REPLACE FUNCTION find_nearby_vip(lat float, lon float, radius int)
RETURNS TABLE (
  id UUID,
  anonymous_id TEXT,
  vip_expires_at TIMESTAMPTZ,
  streak_days INT,
  distance FLOAT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.anonymous_id,
    u.vip_expires_at,
    u.streak_days,
    ST_Distance(
      u.location,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)
    )::float AS distance,
    u.created_at
  FROM 
    users u
  WHERE 
    u.vip_expires_at > NOW()
    AND u.location IS NOT NULL
    AND ST_DWithin(
      u.location,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326),
      radius
    )
  ORDER BY 
    distance ASC;
END;
$$ LANGUAGE plpgsql;

-- 創建打卡表
CREATE TABLE IF NOT EXISTS public.check_ins (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, check_in_date)
);

-- 設置 RLS 策略
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- 刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Users can create their own check-ins" ON public.check_ins;

-- 創建新策略
CREATE POLICY "Users can view their own check-ins" ON public.check_ins 
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create their own check-ins" ON public.check_ins 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 授予必要的權限
GRANT ALL ON public.check_ins TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE check_ins_id_seq TO postgres, anon, authenticated, service_role;

-- 創建更新連續打卡天數的函數
CREATE OR REPLACE FUNCTION update_streak_days()
RETURNS TRIGGER AS $$
DECLARE
  last_check_in DATE;
  current_streak INT;
BEGIN
  -- 獲取用戶最後一次打卡日期
  SELECT check_in_date INTO last_check_in
  FROM check_ins
  WHERE user_id = NEW.user_id AND check_in_date < NEW.check_in_date
  ORDER BY check_in_date DESC
  LIMIT 1;
  
  -- 獲取當前連續打卡天數
  SELECT streak_days INTO current_streak
  FROM users
  WHERE id = NEW.user_id;
  
  -- 如果是第一次打卡或者昨天沒有打卡，重置連續天數為1
  IF last_check_in IS NULL OR last_check_in < (NEW.check_in_date - INTERVAL '1 day') THEN
    UPDATE users SET streak_days = 1 WHERE id = NEW.user_id;
  -- 如果昨天有打卡，增加連續天數
  ELSIF last_check_in = (NEW.check_in_date - INTERVAL '1 day') THEN
    UPDATE users SET streak_days = streak_days + 1 WHERE id = NEW.user_id;
    
    -- 檢查是否達到7天連續打卡，如果是，授予30天VIP
    IF current_streak + 1 >= 7 THEN
      UPDATE users 
      SET vip_expires_at = GREATEST(COALESCE(vip_expires_at, NOW()), NOW()) + INTERVAL '30 days'
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 刪除現有觸發器（如果存在）
DROP TRIGGER IF EXISTS update_streak_on_check_in ON check_ins;

-- 創建新觸發器
CREATE TRIGGER update_streak_on_check_in
AFTER INSERT ON check_ins
FOR EACH ROW EXECUTE FUNCTION update_streak_days();

-- 創建檢查用戶是否已經打卡的函數
CREATE OR REPLACE FUNCTION has_checked_in_today(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  check_in_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM check_ins 
    WHERE user_id = user_uuid AND check_in_date = CURRENT_DATE
  ) INTO check_in_exists;
  
  RETURN check_in_exists;
END;
$$ LANGUAGE plpgsql;

-- 創建獲取用戶連續打卡天數的函數
CREATE OR REPLACE FUNCTION get_user_streak_days(user_uuid UUID)
RETURNS INT AS $$
DECLARE
  days INT;
BEGIN
  SELECT streak_days INTO days FROM users WHERE id = user_uuid;
  RETURN COALESCE(days, 0);
END;
$$ LANGUAGE plpgsql;

-- 創建檢查用戶是否是VIP的函數
CREATE OR REPLACE FUNCTION is_user_vip(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_vip BOOLEAN;
BEGIN
  SELECT (vip_expires_at > NOW()) INTO is_vip FROM users WHERE id = user_uuid;
  RETURN COALESCE(is_vip, FALSE);
END;
$$ LANGUAGE plpgsql;

-- 創建獲取VIP過期日期的函數
CREATE OR REPLACE FUNCTION get_vip_expiry_date(user_uuid UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  expiry_date TIMESTAMPTZ;
BEGIN
  SELECT vip_expires_at INTO expiry_date FROM users WHERE id = user_uuid;
  RETURN expiry_date;
END;
$$ LANGUAGE plpgsql;

-- 創建舉報表
CREATE TABLE IF NOT EXISTS public.reports (
  id BIGSERIAL PRIMARY KEY,
  reporter_id UUID REFERENCES users(id) NOT NULL,
  post_id BIGINT REFERENCES posts(id),
  comment_id BIGINT REFERENCES comments(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 設置 RLS 策略
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;

-- 創建新策略
CREATE POLICY "Users can view their own reports" ON public.reports 
  FOR SELECT USING (auth.uid() = reporter_id);
  
CREATE POLICY "Users can create reports" ON public.reports 
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 授予必要的權限
GRANT ALL ON public.reports TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE reports_id_seq TO postgres, anon, authenticated, service_role;

-- 創建管理員表
CREATE TABLE IF NOT EXISTS public.admins (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 設置 RLS 策略
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 創建檢查用戶是否是管理員的函數
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  admin_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM admins 
    WHERE user_id = user_uuid
  ) INTO admin_exists;
  
  RETURN admin_exists;
END;
$$ LANGUAGE plpgsql;

-- 為管理員創建額外的RLS策略
CREATE POLICY "Admins can view all reports" ON public.reports 
  FOR SELECT USING (is_admin(auth.uid()));
  
CREATE POLICY "Admins can update reports" ON public.reports 
  FOR UPDATE USING (is_admin(auth.uid()));

-- 授予必要的權限
GRANT ALL ON public.admins TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE admins_id_seq TO postgres, anon, authenticated, service_role;
