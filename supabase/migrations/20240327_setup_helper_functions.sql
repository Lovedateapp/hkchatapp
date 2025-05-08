-- Helper functions for database setup

-- Function to check if PostGIS extension is enabled
CREATE OR REPLACE FUNCTION check_postgis_extension()
RETURNS BOOLEAN AS $$
DECLARE
  extension_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'postgis'
  ) INTO extension_exists;
  
  RETURN extension_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create PostGIS extension
CREATE OR REPLACE FUNCTION create_postgis_extension()
RETURNS BOOLEAN AS $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS postgis;
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create users table
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS BOOLEAN AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users PRIMARY KEY,
    anonymous_id TEXT NOT NULL UNIQUE,
    vip_expires_at TIMESTAMPTZ,
    streak_days INT DEFAULT 0,
    location GEOGRAPHY(POINT,4326),
    created_at TIMESTAMPTZ DEFAULT now()
  );
  
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
  CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
  
  GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create posts table
CREATE OR REPLACE FUNCTION create_posts_table()
RETURNS BOOLEAN AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.posts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    anonymous_name TEXT NOT NULL,
    avatar_seed TEXT NOT NULL,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  
  ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "Users can view all posts" ON public.posts FOR SELECT USING (true);
  CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
  
  GRANT ALL ON public.posts TO postgres, anon, authenticated, service_role;
  GRANT USAGE, SELECT ON SEQUENCE posts_id_seq TO postgres, anon, authenticated, service_role;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fill lexicon data
CREATE OR REPLACE FUNCTION fill_lexicon_data()
RETURNS BOOLEAN AS $$
BEGIN
  -- Create lexicon table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.hk_lexicon (
    id SERIAL PRIMARY KEY,
    category TEXT CHECK(category IN ('地點','食物','稱謂','動詞','形容詞','符號','數字','潮語')),
    term TEXT NOT NULL
  );
  
  ALTER TABLE public.hk_lexicon ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Anyone can view lexicon" ON public.hk_lexicon FOR SELECT USING (true);
  GRANT ALL ON public.hk_lexicon TO postgres, anon, authenticated, service_role;
  GRANT USAGE, SELECT ON SEQUENCE hk_lexicon_id_seq TO postgres, anon, authenticated, service_role;
  
  -- Insert sample data
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
  
  -- Create name generation function
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
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
