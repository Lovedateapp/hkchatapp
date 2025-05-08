-- 完整的數據庫設置腳本
-- 包含表結構、函數、觸發器和示例數據

-- 確保 PostGIS 擴展已啟用
CREATE EXTENSION IF NOT EXISTS postgis;

-- 創建用戶表
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  anonymous_id TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  vip_expires_at TIMESTAMPTZ,
  streak_days INT DEFAULT 0,
  location GEOGRAPHY(POINT,4326),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 創建帖子表
CREATE TABLE IF NOT EXISTS public.posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  anonymous_name TEXT NOT NULL,  -- 格式：旺角奶茶#9527
  avatar_seed TEXT NOT NULL,     -- 示例：a3f8b2c4
  district TEXT,                 -- 區域字段
  categories TEXT[] DEFAULT '{}',-- 分類字段
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 創建評論表
CREATE TABLE IF NOT EXISTS public.comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- 創建打卡表
CREATE TABLE IF NOT EXISTS public.check_ins (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, check_in_date)
);

-- 創建舉報表
CREATE TABLE IF NOT EXISTS public.reports (
  id BIGSERIAL PRIMARY KEY,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 創建管理員表
CREATE TABLE IF NOT EXISTS public.admins (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 創建通知表
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  related_id TEXT,
  related_type TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 插入詞庫數據
INSERT INTO hk_lexicon (category, term) VALUES
-- 地點 (Places)
('地點','旺角'),('地點','銅鑼灣'),('地點','觀塘'),('地點','尖沙咀'),('地點','深水埗'),
('地點','元朗'),('地點','荃灣'),('地點','沙田'),('地點','大埔'),('地點','將軍澳'),
('地點','中環'),('地點','灣仔'),('地點','油麻地'),('地點','九龍城'),('地點','黃大仙'),
('地點','屯門'),('地點','粉嶺'),('地點','上水'),('地點','西貢'),('地點','赤鱲角'),
-- 食物 (Food)
('食物','蛋撻'),('食物','奶茶'),('食物','菠蘿包'),('食物','燒賣'),('食物','魚蛋'),
('食物','雞蛋仔'),('食物','叉燒包'),('食物','腸粉'),('食物','雲吞麵'),('食物','煲仔飯'),
('食物','咖喱魚蛋'),('食物','碗仔翅'),('食物','車仔麵'),('食物','糯米雞'),('食物','蘿蔔糕'),
('食物','豬扒包'),('食物','蛋牛治'),('食物','凍檸茶'),('食物','絲襪奶茶'),('食物','楊枝甘露'),
-- 稱謂 (Titles)
('稱謂','巴打'),('稱謂','絲打'),('稱謂','師奶'),('稱謂','大佬'),('稱謂','細佬'),
('稱謂','靚女'),('稱謂','靚仔'),('稱謂','阿叔'),('稱謂','阿姐'),('稱謂','老闆'),
('稱謂','契爺'),('稱謂','契媽'),('稱謂','阿嬸'),('稱謂','阿婆'),('稱謂','阿伯'),
('稱謂','表哥'),('稱謂','表姐'),('稱謂','堂兄'),('稱謂','堂妹'),('稱謂','師兄'),
-- 動詞 (Verbs)
('動詞','OT'),('動詞','放飛'),('動詞','食嘢'),('動詞','傾偈'),('動詞','吹水'),
('動詞','打邊爐'),('動詞','睇戲'),('動詞','行街'),('動詞','買嘢'),('動詞','玩嘢'),
('動詞','搭棚'),('動詞','執嘢'),('動詞','搵食'),('動詞','飲茶'),('動詞','打卡'),
('動詞','影相'),('動詞','打機'),('動詞','煲劇'),('動詞','放工'),('動詞','返工'),
-- 形容詞 (Adjectives)
('形容詞','MK'),('形容詞','好正'),('形容詞','勁'),('形容詞','靚'),('形容詞','型'),
('形容詞','醒'),('形容詞','叻'),('形容詞','堅'),('形容詞','爆'),('形容詞','潮'),
('形容詞','核突'),('形容詞','好嘢'),('形容詞','犀利'),('形容詞','勁爆'),('形容詞','醒目'),
('形容詞','好味'),('形容詞','好玩'),('形容詞','好睇'),('形容詞','好聽'),('形容詞','好正'),
-- 符號 (Symbols)
('符號','★'),('符號','♥'),('符號','☆'),('符號','♪'),('符號','✓'),
('符號','♡'),('符號','✌'),('符號','☺'),('符號','♛'),('符號','♕'),
('符號','✨'),('符號','⭐'),('符號','🔥'),('符號','💯'),('符號','👍'),
('符號','🎵'),('符號','💪'),('符號','👏'),('符號','🙌'),('符號','💖'),
-- 數字 (Numbers)
('數字','2024'),('數字','007'),('數字','123'),('數字','520'),('數字','1314'),
('數字','666'),('數字','888'),('數字','999'),('數字','101'),('數字','404'),
('數字','7749'),('數字','9527'),('數字','5201314'),('數字','687'),('數字','168'),
('數字','18'),('數字','88'),('數字','66'),('數字','99'),('數字','777'),
-- 潮語 (Slang)
('潮語','係咁先'),('潮語','GG'),('潮語','on9'),('潮語','收皮'),('潮語','唔該'),
('潮語','多謝'),('潮語','好心'),('潮語','冇眼睇'),('潮語','發夢'),('潮語','好L煩'),
('潮語','頂硬上'),('潮語','唔好意思'),('潮語','唔該晒'),('潮語','唔使客氣'),('潮語','咁都得'),
('潮語','無問題'),('潮語','搞掂'),('潮語','冇可能'),('潮語','點解'),('潮語','咁樣');

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

-- 創建發帖觸發器
DROP TRIGGER IF EXISTS before_post_insert ON posts;
CREATE TRIGGER before_post_insert
BEFORE INSERT ON posts
FOR EACH ROW
WHEN (NEW.anonymous_name IS NULL OR NEW.avatar_seed IS NULL)
EXECUTE FUNCTION set_post_identity();

-- 設置評論觸發器
CREATE OR REPLACE FUNCTION set_comment_identity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.anonymous_name := generate_hk_name();
  NEW.avatar_seed := generate_avatar_seed();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建評論觸發器
DROP TRIGGER IF EXISTS before_comment_insert ON comments;
CREATE TRIGGER before_comment_insert
BEFORE INSERT ON comments
FOR EACH ROW
WHEN (NEW.anonymous_name IS NULL OR NEW.avatar_seed IS NULL)
EXECUTE FUNCTION set_comment_identity();

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

-- 創建評論計數觸發器
DROP TRIGGER IF EXISTS update_comment_count ON comments;
CREATE TRIGGER update_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_comment_count();

-- 創建用戶註冊觸發器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 創建用戶註冊觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

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

-- 創建打卡觸發器
DROP TRIGGER IF EXISTS update_streak_on_check_in ON check_ins;
CREATE TRIGGER update_streak_on_check_in
AFTER INSERT ON check_ins
FOR EACH ROW
EXECUTE FUNCTION update_streak_days();

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

-- 設置 RLS 策略
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hk_lexicon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can view lexicon" ON public.hk_lexicon;
DROP POLICY IF EXISTS "Users can view their own check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Users can create their own check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- 創建新策略
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view all posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view lexicon" ON public.hk_lexicon FOR SELECT USING (true);

CREATE POLICY "Users can view their own check-ins" ON public.check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own check-ins" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 為管理員創建額外的RLS策略
CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE USING (is_admin(auth.uid()));

-- 授予必要的權限
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.posts TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.comments TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.hk_lexicon TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.check_ins TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.reports TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.admins TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.notifications TO postgres, anon, authenticated, service_role;

GRANT USAGE, SELECT ON SEQUENCE hk_lexicon_id_seq TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE posts_id_seq TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE comments_id_seq TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE check_ins_id_seq TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE reports_id_seq TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE admins_id_seq TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO postgres, anon, authenticated, service_role;

-- 創建示例數據
-- 注意：這裡我們使用 UUID 生成函數來創建示例用戶 ID
-- 在實際使用中，這些 ID 應該與 auth.users 表中的 ID 匹配

-- 創建示例用戶
DO $$
DECLARE
  sample_user_id1 UUID := gen_random_uuid();
  sample_user_id2 UUID := gen_random_uuid();
  sample_user_id3 UUID := gen_random_uuid();
  sample_admin_id UUID := gen_random_uuid();
  
  -- 香港各區
  districts TEXT[] := ARRAY[
    '中西區', '灣仔區', '東區', '南區', 
    '油尖旺區', '深水埗區', '九龍城區', '黃大仙區', '觀塘區',
    '葵青區', '荃灣區', '屯門區', '元朗區', '北區', '大埔區', '沙田區', '西貢區', '離島區'
  ];
  
  -- 帖子分類
  categories TEXT[] := ARRAY[
    '美食', '購物', '娛樂', '交通', '教育', '工作', '住宿', '旅遊', '健康', '科技', '時事', '閒聊'
  ];
  
  -- 臨時變量
  i INT;
  random_district TEXT;
  random_categories TEXT[];
  post_id BIGINT;
  comment_id BIGINT;
BEGIN
  -- 插入示例用戶
  INSERT INTO auth.users (id, email) VALUES 
    (sample_user_id1, 'user1@example.com'),
    (sample_user_id2, 'user2@example.com'),
    (sample_user_id3, 'user3@example.com'),
    (sample_admin_id, 'admin@example.com')
  ON CONFLICT (id) DO NOTHING;
  
  -- 插入用戶資料
  INSERT INTO public.users (id, anonymous_id, vip_expires_at, streak_days, location) VALUES 
    (sample_user_id1, 'user1_anon', NOW() + INTERVAL '15 days', 3, ST_SetSRID(ST_MakePoint(114.1694, 22.3193), 4326)),
    (sample_user_id2, 'user2_anon', NOW() + INTERVAL '5 days', 5, ST_SetSRID(ST_MakePoint(114.1733, 22.2783), 4326)),
    (sample_user_id3, 'user3_anon', NULL, 1, ST_SetSRID(ST_MakePoint(114.1277, 22.3569), 4326)),
    (sample_admin_id, 'admin_anon', NOW() + INTERVAL '365 days', 30, ST_SetSRID(ST_MakePoint(114.1095, 22.3964), 4326))
  ON CONFLICT (id) DO UPDATE SET 
    vip_expires_at = EXCLUDED.vip_expires_at,
    streak_days = EXCLUDED.streak_days,
    location = EXCLUDED.location;
  
  -- 設置管理員
  INSERT INTO public.admins (user_id) VALUES (sample_admin_id)
  ON CONFLICT DO NOTHING;
  
  -- 創建示例帖子
  FOR i IN 1..50 LOOP
    -- 隨機選擇區域和分類
    random_district := districts[floor(random() * array_length(districts, 1) + 1)];
    
    -- 隨機選擇1-3個分類
    random_categories := ARRAY[]::TEXT[];
    FOR j IN 1..floor(random() * 3) + 1 LOOP
      random_categories := array_append(
        random_categories, 
        categories[floor(random() * array_length(categories, 1) + 1)]
      );
    END LOOP;
    
    -- 隨機選擇用戶ID
    DECLARE
      random_user_id UUID;
    BEGIN
      random_user_id := (ARRAY[sample_user_id1, sample_user_id2, sample_user_id3, sample_admin_id])[floor(random() * 4 + 1)];
      
      -- 插入帖子
      INSERT INTO public.posts (
        user_id, content, district, categories, created_at
      ) VALUES (
        random_user_id,
        '這是一個示例帖子 #' || i || ' 在' || random_district || '。' || 
        '這裡是一些隨機內容，用於測試帖子顯示。香港真是一個美麗的城市，有很多好吃的美食和有趣的地方可以探索。',
        random_district,
        random_categories,
        NOW() - (random() * INTERVAL '30 days')
      ) RETURNING id INTO post_id;
      
      -- 為每個帖子添加1-5條評論
      FOR j IN 1..floor(random() * 5) + 1 LOOP
        -- 隨機選擇評論用戶
        DECLARE
          comment_user_id UUID;
        BEGIN
          comment_user_id := (ARRAY[sample_user_id1, sample_user_id2, sample_user_id3, sample_admin_id])[floor(random() * 4 + 1)];
          
          -- 插入評論
          INSERT INTO public.comments (
            post_id, user_id, content, created_at
          ) VALUES (
            post_id,
            comment_user_id,
            '這是帖子 #' || i || ' 的評論 #' || j || '。我覺得這個地方很不錯！',
            NOW() - (random() * INTERVAL '15 days')
          ) RETURNING id INTO comment_id;
          
          -- 有小概率創建舉報
          IF random() < 0.1 THEN
            INSERT INTO public.reports (
              reporter_id, post_id, reason, status, created_at
            ) VALUES (
              comment_user_id,
              post_id,
              '這個帖子包含不適當的內容',
              (ARRAY['pending', 'reviewed', 'resolved', 'rejected'])[floor(random() * 4 + 1)],
              NOW() - (random() * INTERVAL '10 days')
            );
          END IF;
        END;
      END LOOP;
    END;
  END LOOP;
  
  -- 創建示例打卡記錄
  -- 為用戶1創建連續3天的打卡
  INSERT INTO public.check_ins (user_id, check_in_date) VALUES
    (sample_user_id1, CURRENT_DATE - 2),
    (sample_user_id1, CURRENT_DATE - 1),
    (sample_user_id1, CURRENT_DATE)
  ON CONFLICT DO NOTHING;
  
  -- 為用戶2創建連續5天的打卡
  INSERT INTO public.check_ins (user_id, check_in_date) VALUES
    (sample_user_id2, CURRENT_DATE - 4),
    (sample_user_id2, CURRENT_DATE - 3),
    (sample_user_id2, CURRENT_DATE - 2),
    (sample_user_id2, CURRENT_DATE - 1),
    (sample_user_id2, CURRENT_DATE)
  ON CONFLICT DO NOTHING;
  
  -- 為用戶3創建1天的打卡
  INSERT INTO public.check_ins (user_id, check_in_date) VALUES
    (sample_user_id3, CURRENT_DATE)
  ON CONFLICT DO NOTHING;
  
  -- 創建示例通知
  INSERT INTO public.notifications (user_id, type, content, related_id, related_type, read, created_at) VALUES
    (sample_user_id1, 'comment', '有人回覆了你的帖子', post_id::text, 'post', false, NOW() - INTERVAL '2 days'),
    (sample_user_id1, 'system', '恭喜你獲得了VIP資格！', NULL, NULL, true, NOW() - INTERVAL '15 days'),
    (sample_user_id2, 'like', '有人喜歡了你的帖子', post_id::text, 'post', false, NOW() - INTERVAL '1 day'),
    (sample_user_id3, 'system', '歡迎加入我們的社區！', NULL, NULL, true, NOW() - INTERVAL '7 days'),
    (sample_admin_id, 'report', '有新的舉報需要處理', post_id::text, 'post', false, NOW() - INTERVAL '3 days');
END $$;
