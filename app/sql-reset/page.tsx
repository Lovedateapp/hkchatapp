"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Code, Copy, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export default function SqlResetPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const resetSql = `
-- 完全重置數據庫並創建新結構
-- 警告：此腳本將刪除所有現有數據！

-- 首先，刪除所有現有表和函數
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.check_ins CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.hk_lexicon CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- 刪除所有自定義函數
DROP FUNCTION IF EXISTS public.generate_hk_name();
DROP FUNCTION IF EXISTS public.generate_avatar_seed();
DROP FUNCTION IF EXISTS public.update_comment_count();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.find_nearby_vip(float, float, int);
DROP FUNCTION IF EXISTS public.update_streak_days();
DROP FUNCTION IF EXISTS public.has_checked_in_today(UUID);
DROP FUNCTION IF EXISTS public.get_user_streak_days(UUID);
DROP FUNCTION IF EXISTS public.is_user_vip(UUID);
DROP FUNCTION IF EXISTS public.get_vip_expiry_date(UUID);
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.check_postgis_extension();
DROP FUNCTION IF EXISTS public.create_postgis_extension();
DROP FUNCTION IF EXISTS public.create_users_table();
DROP FUNCTION IF EXISTS public.create_posts_table();
DROP FUNCTION IF EXISTS public.fill_lexicon_data();

-- 確保 PostGIS 擴展已啟用
CREATE EXTENSION IF NOT EXISTS postgis;

-- 創建用戶表
CREATE TABLE public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  anonymous_id TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  vip_expires_at TIMESTAMPTZ,
  streak_days INT DEFAULT 0,
  location GEOGRAPHY(POINT,4326),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 創建帖子表
CREATE TABLE public.posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  anonymous_name TEXT NOT NULL,  -- 格式：旺角奶茶#9527
  avatar_seed TEXT NOT NULL,     -- 示例：a3f8b2c4
  district TEXT,                 -- 新增區域字段
  categories TEXT[] DEFAULT '{}',-- 新增分類字段
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 創建評論表
CREATE TABLE public.comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  anonymous_name TEXT NOT NULL,  -- 與發帖不同
  avatar_seed TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 創建詞庫表
CREATE TABLE public.hk_lexicon (
  id SERIAL PRIMARY KEY,
  category TEXT CHECK(category IN ('地點','食物','稱謂','動詞','形容詞','符號','數字','潮語')),
  term TEXT NOT NULL
);

-- 插入詞庫數據
INSERT INTO hk_lexicon (category, term) VALUES
-- 地點 (Places)
('地點','旺角'),('地點','銅鑼灣'),('地點','觀塘'),('地點','尖沙咀'),('地點','深水埗'),
('地點','元朗'),('地點','荃灣'),('地點','沙田'),('地點','大埔'),('地點','將軍澳'),
-- 食物 (Food)
('食物','蛋撻'),('食物','奶茶'),('食物','菠蘿包'),('食物','燒賣'),('食物','魚蛋'),
('食物','雞蛋仔'),('食物','叉燒包'),('食物','腸粉'),('食物','雲吞麵'),('食物','煲仔飯'),
-- 稱謂 (Titles)
('稱謂','巴打'),('稱謂','絲打'),('稱謂','師奶'),('稱謂','大佬'),('稱謂','細佬'),
('稱謂','靚女'),('稱謂','靚仔'),('稱謂','阿叔'),('稱謂','阿姐'),('稱謂','老闆'),
-- 動詞 (Verbs)
('動詞','OT'),('動詞','放飛'),('動詞','食嘢'),('動詞','傾偈'),('動詞','吹水'),
('動詞','打邊爐'),('動詞','睇戲'),('動詞','行街'),('動詞','買嘢'),('動詞','玩嘢'),
-- 形容詞 (Adjectives)
('形容詞','MK'),('形容詞','好正'),('形容詞','勁'),('形容詞','靚'),('形容詞','型'),
('形容詞','醒'),('形容詞','叻'),('形容詞','堅'),('形容詞','爆'),('形容詞','潮'),
-- 符號 (Symbols)
('符號','★'),('符號','♥'),('符號','☆'),('符號','♪'),('符號','✓'),
('符號','♡'),('符號','✌'),('符號','☺'),('符號','♛'),('符號','♕'),
-- 數字 (Numbers)
('數字','2024'),('數字','007'),('數字','123'),('數字','520'),('數字','1314'),
('數字','666'),('數字','888'),('數字','999'),('數字','101'),('數字','404'),
-- 潮語 (Slang)
('潮語','係咁先'),('潮語','GG'),('潮語','on9'),('潮語','收皮'),('潮語','唔該'),
('潮語','多謝'),('潮語','好心'),('潮語','冇眼睇'),('潮語','發夢'),('潮語','好L煩');

-- 創建打卡表
CREATE TABLE public.check_ins (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, check_in_date)
);

-- 創建舉報表
CREATE TABLE public.reports (
  id BIGSERIAL PRIMARY KEY,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 創建管理員表
CREATE TABLE public.admins (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 創建通知表
CREATE TABLE public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  related_id TEXT,
  related_type TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

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
  `.trim()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resetSql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-6 w-6" />
            SQL 重置腳本
          </CardTitle>
          <CardDescription>複製此 SQL 腳本並在 Supabase SQL 編輯器中執行以完全重置數據庫</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>使用說明</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal pl-4 space-y-2">
                <li>複製下方的 SQL 腳本</li>
                <li>登錄到您的 Supabase 控制台</li>
                <li>打開 SQL 編輯器（在左側導航欄中）</li>
                <li>粘貼腳本並執行</li>
                <li>等待執行完成</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="relative">
            <Button variant="outline" size="sm" className="absolute right-2 top-2 z-10" onClick={copyToClipboard}>
              {copied ? (
                <span className="flex items-center gap-1">已複製</span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy className="h-4 w-4" /> 複製
                </span>
              )}
            </Button>
            <div className="border rounded-lg p-4 bg-muted/50 h-96 overflow-y-auto font-mono text-sm relative">
              <pre>{resetSql}</pre>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            打開 Supabase 控制台
          </Button>

          <Button variant="outline" className="w-full" onClick={() => router.push("/test-connection")}>
            測試連接
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
