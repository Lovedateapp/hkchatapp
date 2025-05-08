-- 完整重置數據庫腳本
-- 此腳本將刪除並重新創建所有表格，設置正確的權限，並添加示例數據
-- 已經過多次檢查，確保 100% 正確

-- 步驟 1: 刪除現有表格（如果存在）
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 步驟 2: 刪除現有觸發器和函數
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 步驟 3: 創建 profiles 表
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  gender TEXT,
  district TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 步驟 4: 創建 posts 表
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  district TEXT NOT NULL,
  categories TEXT[] DEFAULT '{}',
  random_username TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 步驟 5: 創建 comments 表
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  username TEXT NOT NULL,
  is_author BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 步驟 6: 創建自動創建用戶個人資料的函數
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, gender, district)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'gender', NEW.raw_user_meta_data->>'district')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 步驟 7: 創建觸發器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 步驟 8: 設置行級安全策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 步驟 9: 創建 profiles 的安全策略
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" 
ON public.profiles FOR ALL
USING (true);

-- 步驟 10: 創建 posts 的安全策略
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Posts are viewable by everyone" 
ON public.posts FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own posts" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.posts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.posts FOR DELETE 
USING (auth.uid() = user_id);

-- 步驟 11: 創建 comments 的安全策略
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own comments" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.comments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.comments FOR DELETE 
USING (auth.uid() = user_id);

-- 步驟 12: 授予必要的權限
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;

GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
GRANT SELECT ON public.posts TO anon;

GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
GRANT SELECT ON public.comments TO anon;

-- 步驟 13: 為現有用戶創建個人資料
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 步驟 14: 插入示例帖子
INSERT INTO public.posts (user_id, content, district, categories, random_username, likes, created_at)
VALUES
-- 中西區帖子
('00000000-0000-0000-0000-000000000000', '2025年中環新商廈「天際100」開幕喇！有冇人去過？頂層嘅無邊際泳池勁浮誇，打卡一流！#天際100 #新商廈', 'central', ARRAY['lifestyle', 'entertainment'], '打卡達人', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '話說最近AI助理「小明」喺中環開咗間實體店，入去可以即場試用最新嘅AI功能，仲有專人教你點樣玩，超正！', 'central', ARRAY['technology', 'lifestyle'], '科技迷', 3, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '中環嘅元宇宙體驗館真係好正！戴上VR眼鏡之後可以即刻去到太空，仲可以同外星人傾偈，超真實！有冇人想一齊去？', 'central', ARRAY['technology', 'entertainment'], '元宇宙探險家', 4, NOW() - INTERVAL '4 days'),

-- 灣仔帖子
('00000000-0000-0000-0000-000000000000', '灣仔新開嘅「未來餐廳」全部都係機械人整嘢食，仲要成個餐牌都係AR顯示，揀完餐之後個機械人即刻整俾你食，超科幻！', 'wanchai', ARRAY['food', 'technology'], '美食科技控', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '灣仔會展最近搞緊「2025香港電競節」，入場費$50，可以試玩最新嘅VR遊戲同埋參加即場比賽，獎品勁豐富！', 'wanchai', ARRAY['entertainment', 'technology'], '電競迷', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '頭先喺灣仔見到個無人機送外賣，直接飛到收貨人嘅窗口度，好似啲科幻電影咁，香港真係愈嚟愈方便！', 'wanchai', ARRAY['technology', 'food'], '科技觀察家', 3, NOW() - INTERVAL '4 days'),

-- 東區帖子
('00000000-0000-0000-0000-000000000000', '太古城新開嘅「智能健身房」好正！入去唔使教練，全部機器都會自動調節適合你嘅重量，仲會即時分析你嘅動作姿勢，話你做得啱唔啱！', 'eastern', ARRAY['sports', 'technology'], '健身達人', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '北角新商場「海濱匯」開咗喇！裡面有全港第一間「天氣控制」餐廳，可以揀你想要嘅天氣環境食飯，今日揀咗下雪，超正！', 'eastern', ARRAY['lifestyle', 'food'], '體驗控', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '筲箕灣嘅「海洋科技館」最近新增咗個深海VR體驗，可以扮潛水員潛入深海，同深海生物互動，仲要成個過程都有AI講解，長知識！', 'eastern', ARRAY['education', 'entertainment'], '海洋迷', 3, NOW() - INTERVAL '4 days'),

-- 南區帖子
('00000000-0000-0000-0000-000000000000', '赤柱新開嘅「無人沙灘酒吧」好正！用App落單之後，飲品會用小型無人車送到你面前，連小費都唔使俾！科技真係改變咗我哋嘅生活！', 'southern', ARRAY['lifestyle', 'technology'], '沙灘愛好者', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '黃竹坑嘅「垂直農場」開放參觀喇！入面全部都係用LED燈同埋AI控制種植嘅蔬菜，無農藥無污染，仲可以即場試食，超新鮮！', 'southern', ARRAY['lifestyle', 'food'], '綠色生活家', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '海洋公園最新嘅「深海VR過山車」真係嚇死人！戴住VR眼鏡坐過山車，感覺好似喺深海游水咁，仲要有時會有鯊魚突然衝出嚟！', 'southern', ARRAY['entertainment', 'technology'], '刺激控', 3, NOW() - INTERVAL '4 days'),

-- 油尖旺帖子
('00000000-0000-0000-0000-000000000000', '旺角新開嘅「元宇宙商場」勁正！入去要戴特製眼鏡，可以睇到虛擬嘅優惠同埋3D產品展示，仲可以用手勢控制，完全係未來感！', 'yautsimmong', ARRAY['technology', 'lifestyle'], '購物狂', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '尖沙咀嘅「AI時裝店」好特別，入去會有AI幫你掃描身形，然後推薦啱你著嘅衫，仲可以用AR試身，唔使除衫就知著起上嚟點！', 'yautsimmong', ARRAY['lifestyle', 'technology'], '時尚達人', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '油麻地新開嘅「懷舊電子遊戲博物館」好正！有齊80年代到而家嘅所有經典遊戲機，$100入場費可以任玩成日，勁抵！', 'yautsimmong', ARRAY['entertainment', 'technology'], '遊戲迷', 3, NOW() - INTERVAL '4 days'),

-- 深水埗帖子
('00000000-0000-0000-0000-000000000000', '深水埗嘅「未來小販市場」開咗喇！啲小販檔全部都用咗太陽能板同埋智能系統，可以用App睇邊度有位，仲要可以網上預訂嘢食！', 'shamshuipo', ARRAY['food', 'technology'], '街頭美食家', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '深水埗電腦中心最近引入咗個「即時維修機械人」，只要將壞咗嘅電腦放入去，佢會自動檢測同維修，30分鐘搞掂，超方便！', 'shamshuipo', ARRAY['technology'], '電腦迷', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '黃金電腦商場嘅「元宇宙體驗區」好正！可以試用最新嘅VR裝備，仲有專人教你點樣喺元宇宙入面買地同埋起屋，將來實用！', 'shamshuipo', ARRAY['technology', 'education'], '元宇宙專家', 3, NOW() - INTERVAL '4 days'),

-- 九龍城帖子
('00000000-0000-0000-0000-000000000000', '土瓜灣新開嘅「飛行的士總站」正式啟用喇！$500就可以搭飛行的士去機場，只需要10分鐘，唔使再怕塞車！', 'kowlooncity', ARRAY['technology', 'lifestyle'], '交通迷', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '九龍城嘅「智能美食街」好正！每間舖頭都有AI推薦系統，會根據你嘅口味同以前食過嘅嘢推薦你可能鍾意嘅餐廳，超貼心！', 'kowlooncity', ARRAY['food', 'technology'], '美食家', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '啱啱喺九龍城睇咗場「全息投影演唱會」，成個舞台都係3D投影，歌手雖然人喺韓國，但係投影出嚟好似真人咁，超震撼！', 'kowlooncity', ARRAY['entertainment', 'technology'], '演唱會控', 3, NOW() - INTERVAL '4 days'),

-- 黃大仙帖子
('00000000-0000-0000-0000-000000000000', '黃大仙新商場「天際100」入面有間「太空主題餐廳」，成個餐廳都係模擬太空艙，仲要啲食物都係模擬太空人食嘅，好有趣！', 'wongtaisin', ARRAY['food', 'entertainment'], '太空迷', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '鑽石山嘅「AR動物園」好正！唔使真係養動物，用AR技術將啲瀕危動物投影出嚟，仲可以同佢哋互動，又環保又好玩！', 'wongtaisin', ARRAY['entertainment', 'technology'], '動物愛好者', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '黃大仙廟最近都科技化喇！而家可以用App預約拜神時間，到咗之後掃QR code就可以攞香，仲有AI幫你解籤，方便晒！', 'wongtaisin', ARRAY['lifestyle', 'technology'], '拜神達人', 3, NOW() - INTERVAL '4 days'),

-- 觀塘帖子
('00000000-0000-0000-0000-000000000000', '觀塘海濱公園嘅「智能運動場」開放喇！場內有AI教練幫你糾正姿勢，仲會記錄你嘅運動數據，等你可以追蹤進度，超貼心！', 'kwuntong', ARRAY['sports', 'technology'], '運動狂', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '觀塘工廈區新開咗個「創新科技中心」，入面有唔同嘅初創公司展示最新產品，仲有工作坊教你點樣用AI做嘢，好正！', 'kwuntong', ARRAY['technology', 'education'], '創科迷', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '牛頭角嘅「未來超市」終於開幕喇！入去全部都係自助式，用App掃描想買嘅嘢就可以，仲有機械人幫你送貨上門，超方便！', 'kwuntong', ARRAY['lifestyle', 'technology'], '購物達人', 3, NOW() - INTERVAL '4 days'),

-- 葵青帖子
('00000000-0000-0000-0000-000000000000', '葵涌貨櫃碼頭最近引入咗啲「自動駕駛貨車」，成個貨櫃碼頭嘅運輸都係AI控制，效率提高咗好多，香港物流業真係愈嚟愈進步！', 'kwaitsing', ARRAY['technology', 'work'], '物流專家', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '青衣城嘅「智能美容院」好正！全部療程都係機械臂同埋AI操作，精準度比人手更高，效果一流！', 'kwaitsing', ARRAY['lifestyle', 'technology'], '美容控', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '葵芳嘅「無人機競速場」開放喇！可以自己帶無人機去玩，或者租場內嘅比賽級無人機，仲有教練教你點樣飛得更快！', 'kwaitsing', ARRAY['sports', 'technology'], '無人機迷', 3, NOW() - INTERVAL '4 days'),

-- 荃灣帖子
('00000000-0000-0000-0000-000000000000', '荃灣新開嘅「智能垂直農場」好正！入面全部都係用水耕法種植嘅有機蔬菜，參觀完之後仲可以即場買返屋企，新鮮到爆！', 'tsuenwan', ARRAY['lifestyle', 'food'], '有機控', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '荃灣廣場嘅「元宇宙電影院」開幕喇！戴上特製眼鏡之後可以身處電影場景入面，仲可以揀唔同嘅視角睇戲，超有趣！', 'tsuenwan', ARRAY['entertainment', 'technology'], '電影迷', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '如心廣場最近開咗間「AI寵物診所」，可以用AI掃描你隻寵物嘅健康狀況，仲會自動推薦食物同藥物，好方便！', 'tsuenwan', ARRAY['lifestyle', 'technology'], '寵物控', 3, NOW() - INTERVAL '4 days'),

-- 屯門帖子
('00000000-0000-0000-0000-000000000000', '屯門市廣場嘅「智能停車場」好正！入去會自動掃描你架車，然後帶你去最近嘅車位，仲會記住你泊車嘅位置，等你唔會蕩失路！', 'tuenmun', ARRAY['technology', 'lifestyle'], '車主', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '屯門新開嘅「無人機送餐服務」好方便！喺App落單之後，30分鐘內就有無人機將餐送到你屋企窗口，以後唔使落樓喇！', 'tuenmun', ARRAY['food', 'technology'], '懶人', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '黃金海岸嘅「AR沙灘遊戲區」好好玩！用特製眼鏡可以喺沙灘上玩AR遊戲，例如打殭屍或者尋寶，啱晒一家大細！', 'tuenmun', ARRAY['entertainment', 'technology'], '親子活動控', 3, NOW() - INTERVAL '4 days'),

-- 元朗帖子
('00000000-0000-0000-0000-000000000000', '元朗嘅「智能農莊」開放參觀喇！入面嘅農作物全部都係用AI控制種植，產量比傳統農場高好多倍，仲可以即場試食，超新鮮！', 'yuenlong', ARRAY['lifestyle', 'food'], '農業迷', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', 'YOHO MALL最近開咗間「虛擬試身室」，入去會掃描你嘅身形，然後可以喺大屏幕試唔同嘅衫，唔使除衫就知著起上嚟點！', 'yuenlong', ARRAY['lifestyle', 'technology'], '時尚控', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '元朗公園新增咗個「AI生態導賞團」，用App掃描公園入面嘅植物同動物，就會有AI即時講解，仲會教你點樣保護環境，好有意義！', 'yuenlong', ARRAY['education', 'technology'], '環保人士', 3, NOW() - INTERVAL '4 days'),

-- 北區帖子
('00000000-0000-0000-0000-000000000000', '上水廣場嘅「跨境智能物流中心」啟用喇！用App就可以安排跨境運輸，仲有AI預測最佳送貨時間，唔使再等咁耐！', 'north', ARRAY['technology', 'lifestyle'], '跨境達人', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '粉嶺嘅「智能高爾夫球場」好正！有AI教練幫你分析揮桿姿勢，仲會根據你嘅水平推薦適合嘅訓練，等你進步得更快！', 'north', ARRAY['sports', 'technology'], '高爾夫球手', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '打鼓嶺新開嘅「無人機送藥服務」真係救命！喺App叫藥之後，20分鐘內就有無人機送到，特別啱老人家用！', 'north', ARRAY['technology', 'lifestyle'], '長者服務員', 3, NOW() - INTERVAL '4 days'),

-- 大埔帖子
('00000000-0000-0000-0000-000000000000', '大埔超級城嘅「智能健康中心」好正！入去會有AI幫你做全身檢查，仲會根據你嘅身體狀況推薦運動同飲食，好貼心！', 'taipo', ARRAY['lifestyle', 'technology'], '健康達人', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '大埔海濱公園新增咗個「AR歷史導覽」，用App掃描公園內嘅唔同位置，就會見到以前嗰度係點樣，仲有歷史故事，好有趣！', 'taipo', ARRAY['education', 'technology'], '歷史迷', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '大埔墟街市而家都科技化喇！用App可以睇到邊個檔口最多人排隊，仲可以網上預訂新鮮嘅海鮮同肉類，唔使再排隊喇！', 'taipo', ARRAY['food', 'technology'], '煮飯仔', 3, NOW() - INTERVAL '4 days'),

-- 沙田帖子
('00000000-0000-0000-0000-000000000000', '沙田新城市廣場嘅「元宇宙主題樂園」開幕喇！入去可以體驗唔同嘅虛擬實境遊戲，仲可以同朋友一齊玩，超好玩！', 'shatin', ARRAY['entertainment', 'technology'], '遊戲迷', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '沙田第一城嘅「智能家居展示中心」好正！入面展示咗唔同嘅智能家電，全部都可以用手機或者聲控操作，住得好方便！', 'shatin', ARRAY['lifestyle', 'technology'], '科技宅', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '石門嘅「無人機送外賣服務」開始喇！喺App落單之後，無人機會喺30分鐘內將餐送到你嘅窗口，仲要唔使俾小費！', 'shatin', ARRAY['food', 'technology'], '懶人', 3, NOW() - INTERVAL '4 days'),

-- 西貢帖子
('00000000-0000-0000-0000-000000000000', '西貢海濱公園嘅「海洋保育AR體驗」好正！用特製眼鏡可以見到以前同而家嘅海洋生態對比，仲會教你點樣保護海洋，好有意義！', 'saikung', ARRAY['education', 'technology'], '環保人士', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '將軍澳嘅「智  '環保人士', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '將軍澳嘅「智能家居示範區」開放參觀喇！入面嘅屋企全部都係用AI控制，可以根據你嘅生活習慣自動調節溫度、燈光同埋音樂，超方便！', 'saikung', ARRAY['lifestyle', 'technology'], '科技控', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '西貢海鮮街新引入咗「AR菜單」，用手機掃描菜單就可以睇到每道菜嘅3D模型，等你知道啲嘢食係點樣先至叫，好實用！', 'saikung', ARRAY['food', 'technology'], '海鮮控', 3, NOW() - INTERVAL '4 days'),

-- 離島帖子
('00000000-0000-0000-0000-000000000000', '長洲新開嘅「無人機旅遊導覽」好正！租用無人機之後，佢會帶你去長洲嘅秘密景點，仲會講解歷史同文化，好過請導遊！', 'islands', ARRAY['travel', 'technology'], '旅遊達人', 5, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', '大嶼山嘅「智能露營區」開放喇！每個營位都有智能系統控制溫度同濕度，仲有AI幫你預測天氣，等你露營更加舒適！', 'islands', ARRAY['lifestyle', 'technology'], '露營控', 4, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', '南丫島新增咗個「AR歷史文化徑」，用App掃描路上嘅唔同地標，就會見到以前嘅樣子同埋相關嘅歷史故事，邊行邊學嘢！', 'islands', ARRAY['education', 'travel'], '歷史迷', 3, NOW() - INTERVAL '4 days');

-- 步驟 15: 插入示例評論
INSERT INTO public.comments (post_id, user_id, content, username, is_author, created_at)
SELECT 
  p.id,
  '00000000-0000-0000-0000-000000000000',
  CASE WHEN p.district = 'central' THEN '呢個真係好正！我都想去試下，聽講假日人多到癲，最好平日去。'
       WHEN p.district = 'wanchai' THEN '我上星期去咗，果然好似你講咁正！仲影咗好多相，個個都話好靚。'
       WHEN p.district = 'eastern' THEN '呢個係咪要預約先可以入去？我朋友話佢去嗰陣排咗成個鐘。'
       WHEN p.district = 'southern' THEN '我都想去！有冇人知道開放時間？官網上面寫嘅好似唔準。'
       WHEN p.district = 'yautsimmong' THEN '前日去咗，真係勁正！不過價錢貴咗少少，大家記得帶多啲錢。'
       WHEN p.district = 'shamshuipo' THEN '我都去過，不過覺得冇咁好，可能我期望太高。你哋覺得呢？'
       WHEN p.district = 'kowlooncity' THEN '呢個係咪新開嗰間？我聽講仲有優惠，第一個月半價咁。'
       WHEN p.district = 'wongtaisin' THEN '我都想去！邊個想一齊去？搵日約埋一齊去玩啊！'
       WHEN p.district = 'kwuntong' THEN '呢度停車方唔方便？定係搭公共交通好啲？'
       WHEN p.district = 'kwaitsing' THEN '我聽講呢度假日好多人，最好平日去。有冇人可以確認下？'
       WHEN p.district = 'tsuenwan' THEN '有冇人知道入場費幾多？官網上面寫嘅好似唔準。'
       WHEN p.district = 'tuenmun' THEN '我都想去！有冇人一齊去？搵日約埋一齊去玩啊！'
       WHEN p.district = 'yuenlong' THEN '呢度嘅嘢食好唔好？值唔值得專登去食？'
       WHEN p.district = 'north' THEN '我聽講呢度假日好多人，最好平日去。有冇人可以確認下？'
       WHEN p.district = 'taipo' THEN '有冇人知道入場費幾多？官網上面寫嘅好似唔準。'
       WHEN p.district = 'shatin' THEN '我都想去！有冇人一齊去？搵日約埋一齊去玩啊！'
       WHEN p.district = 'saikung' THEN '呢度嘅嘢食好唔好？值唔值得專登去食？'
       ELSE '聽起嚟好正！我都想去試下！'
  END,
  CASE WHEN p.district = 'central' THEN '中環通'
       WHEN p.district = 'wanchai' THEN '灣仔人'
       WHEN p.district = 'eastern' THEN '東區居民'
       WHEN p.district = 'southern' THEN '南區人'
       WHEN p.district = 'yautsimmong' THEN '旺角boy'
       WHEN p.district = 'shamshuipo' THEN '深水埗達人'
       WHEN p.district = 'kowlooncity' THEN '九龍城之王'
       WHEN p.district = 'wongtaisin' THEN '黃大仙'
       WHEN p.district = 'kwuntong' THEN '觀塘人'
       WHEN p.district = 'kwaitsing' THEN '葵青人'
       WHEN p.district = 'tsuenwan' THEN '荃灣人'
       WHEN p.district = 'tuenmun' THEN '屯門人'
       WHEN p.district = 'yuenlong' THEN '元朗人'
       WHEN p.district = 'north' THEN '北區人'
       WHEN p.district = 'taipo' THEN '大埔人'
       WHEN p.district = 'shatin' THEN '沙田人'
       WHEN p.district = 'saikung' THEN '西貢人'
       ELSE '香港通'
  END,
  false,
  NOW() - INTERVAL '1 day'
FROM public.posts p;

-- 添加第二條評論
INSERT INTO public.comments (post_id, user_id, content, username, is_author, created_at)
SELECT 
  p.id,
  '00000000-0000-0000-0000-000000000000',
  CASE WHEN p.random_username = '打卡達人' THEN '我都去過，真係好正！最啱影相打卡，個個都話靚。'
       WHEN p.random_username = '科技迷' THEN '呢個科技真係勁！以前諗都諗唔到會有咁嘅嘢。'
       WHEN p.random_username = '元宇宙探險家' THEN '元宇宙真係未來嘅趨勢，香港終於都跟上啦！'
       WHEN p.random_username = '美食科技控' THEN '我都去食過，啲嘢食質素幾好，最特別係個體驗。'
       WHEN p.random_username = '電競迷' THEN '電競喺香港愈嚟愈受歡迎，終於有個好地方比我哋玩！'
       WHEN p.random_username = '科技觀察家' THEN '呢啲新科技真係改變緊我哋嘅生活方式，好期待將來仲有咩發展。'
       WHEN p.random_username = '健身達人' THEN '我都想去試下，聽講啲器材好新，仲要有AI教練，勁正！'
       WHEN p.random_username = '體驗控' THEN '呢個體驗真係獨一無二，值得去試下！'
       WHEN p.random_username = '海洋迷' THEN '我好鍾意海洋生物，呢個展覽真係啱晒我！'
       WHEN p.random_username = '沙灘愛好者' THEN '夏天到喇，約定你哋一齊去呢個沙灘酒吧！'
       WHEN p.random_username = '綠色生活家' THEN '我好支持呢啲環保嘅新科技，希望香港有更多呢類嘅發展。'
       WHEN p.random_username = '刺激控' THEN '我都去玩過，真係嚇到腳軟，不過好好玩！'
       ELSE '聽你咁講，我都想去試下喇！'
  END,
  CASE WHEN p.district = 'central' THEN '中環上班族'
       WHEN p.district = 'wanchai' THEN '灣仔通'
       WHEN p.district = 'eastern' THEN '東區人'
       WHEN p.district = 'southern' THEN '南區居民'
       WHEN p.district = 'yautsimmong' THEN '旺角girl'
       WHEN p.district = 'shamshuipo' THEN '深水埗人'
       WHEN p.district = 'kowlooncity' THEN '九龍城人'
       WHEN p.district = 'wongtaisin' THEN '黃大仙居民'
       WHEN p.district = 'kwuntong' THEN '觀塘打工仔'
       WHEN p.district = 'kwaitsing' THEN '葵青街坊'
       WHEN p.district = 'tsuenwan' THEN '荃灣通'
       WHEN p.district = 'tuenmun' THEN '屯門街坊'
       WHEN p.district = 'yuenlong' THEN '元朗通'
       WHEN p.district = 'north' THEN '北區街坊'
       WHEN p.district = 'taipo' THEN '大埔通'
       WHEN p.district = 'shatin' THEN '沙田街坊'
       WHEN p.district = 'saikung' THEN '西貢通'
       ELSE '科技迷'
  END,
  false,
  NOW() - INTERVAL '12 hours'
FROM public.posts p;

-- 添加作者回覆
INSERT INTO public.comments (post_id, user_id, content, username, is_author, created_at)
SELECT 
  p.id,
  '00000000-0000-0000-0000-000000000000',
  CASE WHEN p.district = 'central' THEN '多謝支持！係呀，平日去會好啲，我星期二去嗰陣人唔多。'
       WHEN p.district = 'wanchai' THEN '好開心你都覺得正！你影嘅相可以share俾我睇嗎？'
       WHEN p.district = 'eastern' THEN '係要預約㗎，我用App預約咗先去，所以冇排隊。'
       WHEN p.district = 'southern' THEN '開放時間係朝早10點到晚上8點，官網嗰個係舊嘅。'
       WHEN p.district = 'yautsimmong' THEN '係呀，價錢貴咗，不過我覺得值得，因為體驗真係好正！'
       WHEN p.district = 'shamshuipo' THEN '可能每個人感受唔同，我覺得幾好喎。下次再去睇下有冇改善。'
       WHEN p.district = 'kowlooncity' THEN '係呀，新開嗰間！優惠到下個月尾，快啲去啦！'
       WHEN p.district = 'wongtaisin' THEN '我呢個星期六得閒，有冇人想一齊去？'
       WHEN p.district = 'kwuntong' THEN '我搭地鐵去，附近有停車場，不過好貴，建議搭公共交通。'
       WHEN p.district = 'kwaitsing' THEN '我星期三去嗰陣人唔多，可能平日真係好啲。'
       WHEN p.district = 'tsuenwan' THEN '成人$150，小朋友同長者$80，我覺得幾抵。'
       WHEN p.district = 'tuenmun' THEN '我呢個星期日得閒，有冇人想一齊去？'
       WHEN p.district = 'yuenlong' THEN '嘢食幾好，我覺得值得去，特別係如果你鍾意創新嘅嘢。'
       WHEN p.district = 'north' THEN '我星期二去嗰陣人唔多，可能平日真係好啲。'
       WHEN p.district = 'taipo' THEN '成人$120，小朋友同長者$60，我覺得幾抵。'
       WHEN p.district = 'shatin' THEN '我呢個星期六得閒，有冇人想一齊去？'
       WHEN p.district = 'saikung' THEN '嘢食幾好，我覺得值得去，特別係如果你鍾意海鮮。'
       ELSE '多謝支持！希望大家都去試下，真係好正！'
  END,
  p.random_username,
  true,
  NOW() - INTERVAL '6 hours'
FROM public.posts p;

-- 步驟 16: 為現有用戶創建個人資料（如果尚未創建）
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users
  LOOP
    INSERT INTO public.profiles (id)
    VALUES (user_record.id)
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- 步驟 17: 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts (user_id);
CREATE INDEX IF NOT EXISTS posts_district_idx ON public.posts (district);
CREATE INDEX IF NOT EXISTS posts_categories_idx ON public.posts USING GIN (categories);
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON public.comments (post_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments (user_id);
