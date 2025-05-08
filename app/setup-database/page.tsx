"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "lucide-react"

export default function SetupDatabasePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Database className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-xl text-center">數據庫設置指南</CardTitle>
          <CardDescription className="text-center">按照以下步驟設置您的 Supabase 數據庫</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">步驟 1: 登錄到 Supabase</h3>
            <p className="text-sm text-muted-foreground">
              訪問{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Supabase 控制台
              </a>{" "}
              並登錄您的帳戶。
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">步驟 2: 選擇您的項目</h3>
            <p className="text-sm text-muted-foreground">在控制台中選擇您為此應用程序創建的項目。</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">步驟 3: 打開 SQL 編輯器</h3>
            <p className="text-sm text-muted-foreground">在左側菜單中點擊 "SQL 編輯器"，然後點擊 "新查詢" 按鈕。</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">步驟 4: 運行以下 SQL 腳本</h3>
            <p className="text-sm text-muted-foreground">
              複製下面的 SQL 代碼，粘貼到 SQL 編輯器中，然後點擊 "運行" 按鈕。
            </p>
            <div className="bg-muted p-4 rounded-md overflow-auto text-xs">
              <pre>{`-- 創建 profiles 表
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gender TEXT,
  district TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 創建 posts 表
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  district TEXT NOT NULL,
  categories TEXT[] DEFAULT '{}',
  random_username TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 創建 comments 表
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  username TEXT NOT NULL,
  is_author BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 設置行級安全策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 創建 profiles 的安全策略
CREATE POLICY "用戶可以查看所有個人資料" ON public.profiles
  FOR SELECT USING (true);
  
CREATE POLICY "用戶只能更新自己的個人資料" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
  
CREATE POLICY "用戶只能插入自己的個人資料" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 創建 posts 的安全策略
CREATE POLICY "所有人可以查看所有帖子" ON public.posts
  FOR SELECT USING (true);
  
CREATE POLICY "已登入用戶可以創建帖子" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "用戶只能更新自己的帖子" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "用戶只能刪除自己的帖子" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- 創建 comments 的安全策略
CREATE POLICY "所有人可以查看所有評論" ON public.comments
  FOR SELECT USING (true);
  
CREATE POLICY "已登入用戶可以創建評論" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "用戶只能更新自己的評論" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "用戶只能刪除自己的評論" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- 為匿名用戶授予訪問權限
CREATE POLICY "匿名用戶可以查看所有帖子" ON public.posts
  FOR SELECT USING (true);
  
CREATE POLICY "匿名用戶可以查看所有評論" ON public.comments
  FOR SELECT USING (true);

-- 插入100個預設帖子
INSERT INTO public.posts (content, district, categories, random_username, created_at)
VALUES
-- 中西區帖子
('今日去蘭桂坊飲嘢，人多到癲！有冇人想約下星期再去？', 'central', ARRAY['lifestyle', 'entertainment'], '醉酒俠', NOW() - INTERVAL '1 day'),
('有冇人知中環邊度有平嘅停車場？每次泊車都畀到傻。', 'central', ARRAY['lifestyle'], '車神', NOW() - INTERVAL '2 days'),
('有冇人試過半山扶手電梯放工時段？排隊排到頂，不如行樓梯算啦！', 'central', ARRAY['work', 'lifestyle'], '行山客', NOW() - INTERVAL '3 days'),
('今朝經過IFC見到有明星拍戲，圍觀人士多到癲，搞到我遲到返工。', 'central', ARRAY['entertainment', 'work'], '娛樂達人', NOW() - INTERVAL '4 days'),
('有冇人知蘇豪區邊間餐廳最好食？想約女神食飯。', 'central', ARRAY['food', 'relationships'], '情場高手', NOW() - INTERVAL '5 days'),

-- 灣仔帖子
('灣仔電腦城最近好多特價，有冇人知邊間鋪最抵買？', 'wanchai', ARRAY['technology', 'lifestyle'], '電腦迷', NOW() - INTERVAL '1 day'),
('琼華中心嘅茶餐廳真係好好食，個菠蘿油脆卜卜，奶茶又滑，讚！', 'wanchai', ARRAY['food'], '食神', NOW() - INTERVAL '2 days'),
('灣仔利東街嘅燈飾真係靚，影相影到手軟。', 'wanchai', ARRAY['lifestyle', 'entertainment'], '打卡王', NOW() - INTERVAL '3 days'),
('修頓球場成日爆滿，有冇人想組隊夜晚去踢波？', 'wanchai', ARRAY['sports'], '波霸', NOW() - INTERVAL '4 days'),
('有冇人去過灣仔會展睇演唱會？停車方便嗎？', 'wanchai', ARRAY['entertainment', 'lifestyle'], '演唱會達人', NOW() - INTERVAL '5 days'),

-- 東區帖子
('太古城中心新開咗間火鍋店，試咗覺得一般，唔抵食。', 'eastern', ARRAY['food'], '火鍋達人', NOW() - INTERVAL '1 day'),
('筲箕灣有間新開嘅健身室，設備幾齊全，重有特價優惠。', 'eastern', ARRAY['sports', 'lifestyle'], '肌肉男', NOW() - INTERVAL '2 days'),
('柴灣工業區有間咖啡店幾有格調，啱晒打卡，有冇人去過？', 'eastern', ARRAY['food', 'lifestyle'], '咖啡控', NOW() - INTERVAL '3 days'),
('康怡廣場嘅戲院舒服咗好多，唔駛再忍受爛凳。', 'eastern', ARRAY['entertainment'], '戲迷', NOW() - INTERVAL '4 days'),
('有冇人住杏花邨？想問下平時返工去中環大概要幾耐？', 'eastern', ARRAY['work', 'lifestyle'], '返工仔', NOW() - INTERVAL '5 days'),

-- 南區帖子
('赤柱沙灘周末人多到癲，想去游水都游唔到。', 'southern', ARRAY['sports', 'lifestyle'], '水魚仔', NOW() - INTERVAL '1 day'),
('石澳嘅Thai Shack餐廳好正，啱晒同朋友去吹水。', 'southern', ARRAY['food', 'lifestyle'], '泰餐控', NOW() - INTERVAL '2 days'),
('海洋公園最近有優惠，成人門票買一送一，有冇人想去？', 'southern', ARRAY['entertainment', 'lifestyle'], '遊樂場迷', NOW() - INTERVAL '3 days'),
('黃竹坑新開嘅商場有咩好去？聽講有間新戲院？', 'southern', ARRAY['entertainment', 'lifestyle'], '好奇寶寶', NOW() - INTERVAL '4 days'),
('鴨脷洲有間隱世小店賣嘅魚蛋好出名，排隊要排成個鐘。', 'southern', ARRAY['food'], '小食控', NOW() - INTERVAL '5 days'),

-- 油尖旺帖子
('旺角女人街依家冇咩好買，全部嘢都係淘寶有得買。', 'yautsimmong', ARRAY['lifestyle', 'other'], '購物狂', NOW() - INTERVAL '1 day'),
('尖沙咀K11商場有間新開嘅甜品店，個芝士蛋糕好好食！', 'yautsimmong', ARRAY['food'], '甜品控', NOW() - INTERVAL '2 days'),
('油麻地廟街夜市嘅煲仔飯真係好香，每次去完都食到肚脹。', 'yautsimmong', ARRAY['food'], '夜市王', NOW() - INTERVAL '3 days'),
('有冇人知旺角邊度有好嘅波鞋店？想買對新波鞋。', 'yautsimmong', ARRAY['lifestyle'], '波鞋控', NOW() - INTERVAL '4 days'),
('佐敦有間新開嘅火鍋放題，$200有找食到飽，抵食！', 'yautsimmong', ARRAY['food'], '放題王', NOW() - INTERVAL '5 days'),

-- 深水埗帖子
('深水埗鴨寮街買電腦零件真係平，淘到寶。', 'shamshuipo', ARRAY['technology'], '電腦迷', NOW() - INTERVAL '1 day'),
('基隆街嘅布料市場好多靚布，啱晒DIY。', 'shamshuipo', ARRAY['lifestyle', 'other'], 'DIY達人', NOW() - INTERVAL '2 days'),
('有冇人知深水埗邊度有好嘅理髮店？想剪個靚頭。', 'shamshuipo', ARRAY['lifestyle'], '型男', NOW() - INTERVAL '3 days'),
('深水埗嘅公園晚上好多人打波，氣氛好好。', 'shamshuipo', ARRAY['sports'], '籃球迷', NOW() - INTERVAL '4 days'),
('北河街市場嘅豬紅粉好好食，每次去完都想再去。', 'shamshuipo', ARRAY['food'], '粉麵控', NOW() - INTERVAL '5 days'),

-- 九龍城帖子
('九龍城有間泰國餐廳好正，個綠咖喱辣到爆！', 'kowlooncity', ARRAY['food'], '辣椒王', NOW() - INTERVAL '1 day'),
('侯王道嘅馬拉糕好好食，每次去完都想再去。', 'kowlooncity', ARRAY['food'], '甜品控', NOW() - INTERVAL '2 days'),
('有冇人知九龍城邊度有好嘅補習社？DSE快到，好緊張。', 'kowlooncity', ARRAY['education'], '學生仔', NOW() - INTERVAL '3 days'),
('九龍城嘅單車徑好靚，啱晒周末去踩單車。', 'kowlooncity', ARRAY['sports', 'lifestyle'], '單車俠', NOW() - INTERVAL '4 days'),
('土瓜灣有間新開嘅咖啡店，個拉花好靚，啱晒打卡。', 'kowlooncity', ARRAY['food', 'lifestyle'], '咖啡控', NOW() - INTERVAL '5 days'),

-- 黃大仙帖子
('黃大仙廟前面嘅許願樹好靈驗，上次去完個願望成真咗。', 'wongtaisin', ARRAY['lifestyle', 'other'], '求神仔', NOW() - INTERVAL '1 day'),
('鑽石山荷里活廣場嘅美食廣場有間新嘅台灣小食，個珍珠奶茶好好飲。', 'wongtaisin', ARRAY['food'], '台式控', NOW() - INTERVAL '2 days'),
('有冇人知黃大仙邊度有好嘅籃球場？想約朋友打波。', 'wongtaisin', ARRAY['sports'], '籃球迷', NOW() - INTERVAL '3 days'),
('彩虹邨真係好靚，影相影到手軟。', 'wongtaisin', ARRAY['lifestyle'], '攝影師', NOW() - INTERVAL '4 days'),
('樂富廣場嘅戲院好舒服，新裝修過，好正！', 'wongtaisin', ARRAY['entertainment'], '戲迷', NOW() - INTERVAL '5 days'),

-- 觀塘帖子
('觀塘APM商場嘅美食廣場有間新嘅日本料理，個刺身新鮮到爆！', 'kwuntong', ARRAY['food'], '日本控', NOW() - INTERVAL '1 day'),
('有冇人知觀塘邊度有好嘅健身室？想練下肌。', 'kwuntong', ARRAY['sports'], '肌肉男', NOW() - INTERVAL '2 days'),
('觀塘海濱公園好靚，啱晒跑步。', 'kwuntong', ARRAY['sports', 'lifestyle'], '跑步仔', NOW() - INTERVAL '3 days'),
('牛頭角嘅工廈好多特色小店，周末可以去探索下。', 'kwuntong', ARRAY['lifestyle'], '探險家', NOW() - INTERVAL '4 days'),
('藍田有間新開嘅火鍋店，個湯底好正，推薦！', 'kwuntong', ARRAY['food'], '火鍋控', NOW() - INTERVAL '5 days'),

-- 葵青帖子
('葵涌廣場有間新開嘅韓國餐廳，個炸雞好好食！', 'kwaitsing', ARRAY['food'], '韓式控', NOW() - INTERVAL '1 day'),
('青衣城嘅戲院新裝修過，好舒服。', 'kwaitsing', ARRAY['entertainment'], '戲迷', NOW() - INTERVAL '2 days'),
('有冇人知葵芳邊度有好嘅美容院？想做facial。', 'kwaitsing', ARRAY['lifestyle'], '靚女', NOW() - INTERVAL '3 days'),
('葵涌運動場嘅跑道好好用，啱晒練跑。', 'kwaitsing', ARRAY['sports'], '田徑仔', NOW() - INTERVAL '4 days'),
('青衣海濱公園好靚，啱晒放狗。', 'kwaitsing', ARRAY['lifestyle'], '狗主', NOW() - INTERVAL '5 days'),

-- 荃灣帖子
('荃灣廣場有間新開嘅甜品店，個芒果班戟好好食！', 'tsuenwan', ARRAY['food'], '甜品控', NOW() - INTERVAL '1 day'),
('有冇人知荃灣邊度有好嘅髮型屋？想染頭髮。', 'tsuenwan', ARRAY['lifestyle'], '型男', NOW() - INTERVAL '2 days'),
('荃灣公園嘅健身設施好齊全，重免費添。', 'tsuenwan', ARRAY['sports'], '健身達人', NOW() - INTERVAL '3 days'),
('如心廣場嘅戲院好舒服，新裝修過，好正！', 'tsuenwan', ARRAY['entertainment'], '戲迷', NOW() - INTERVAL '4 days'),
('大窩口有間隱世小店賣嘅雞蛋仔好好食，香脆可口。', 'tsuenwan', ARRAY['food'], '小食控', NOW() - INTERVAL '5 days'),

-- 屯門帖子
('屯門市廣場有間新開嘅日本餐廳，個拉麵好好食！', 'tuenmun', ARRAY['food'], '拉麵控', NOW() - INTERVAL '1 day'),
('有冇人知屯門邊度有好嘅補習社？DSE快到，好緊張。', 'tuenmun', ARRAY['education'], '學生仔', NOW() - INTERVAL '2 days'),
('屯門公園嘅單車徑好靚，啱晒周末去踩單車。', 'tuenmun', ARRAY['sports', 'lifestyle'], '單車俠', NOW() - INTERVAL '3 days'),
('黃金海岸嘅沙灘好靚，啱晒放假去。', 'tuenmun', ARRAY['lifestyle'], '沙灘控', NOW() - INTERVAL '4 days'),
('兆康有間新開嘅火鍋店，個湯底好正，推薦！', 'tuenmun', ARRAY['food'], '火鍋控', NOW() - INTERVAL '5 days'),

-- 元朗帖子
('元朗廣場有間新開嘅韓國餐廳，個炸雞好好食！', 'yuenlong', ARRAY['food'], '韓式控', NOW() - INTERVAL '1 day'),
('有冇人知元朗邊度有好嘅美容院？想做facial。', 'yuenlong', ARRAY['lifestyle'], '靚女', NOW() - INTERVAL '2 days'),
('元朗公園嘅健身設施好齊全，重免費添。', 'yuenlong', ARRAY['sports'], '健身達人', NOW() - INTERVAL '3 days'),
('YOHO MALL嘅戲院好舒服，新裝修過，好正！', 'yuenlong', ARRAY['entertainment'], '戲迷', NOW() - INTERVAL '4 days'),
('十八鄉有間隱世小店賣嘅雞蛋仔好好食，香脆可口。', 'yuenlong', ARRAY['food'], '小食控', NOW() - INTERVAL '5 days'),

-- 北區帖子
('上水廣場有間新開嘅日本餐廳，個刺身新鮮到爆！', 'north', ARRAY['food'], '日本控', NOW() - INTERVAL '1 day'),
('有冇人知粉嶺邊度有好嘅健身室？想練下肌。', 'north', ARRAY['sports'], '肌肉男', NOW() - INTERVAL '2 days'),
('上水公園好靚，啱晒跑步。', 'north', ARRAY['sports', 'lifestyle'], '跑步仔', NOW() - INTERVAL '3 days'),
('粉嶺嘅工廈好多特色小店，周末可以去探索下。', 'north', ARRAY['lifestyle'], '探險家', NOW() - INTERVAL '4 days'),
('打鼓嶺有間新開嘅火鍋店，個湯底好正，推薦！', 'north', ARRAY['food'], '火鍋控', NOW() - INTERVAL '5 days'),

-- 大埔帖子
('大埔超級城有間新開嘅韓國餐廳，個炸雞好好食！', 'taipo', ARRAY['food'], '韓式控', NOW() - INTERVAL '1 day'),
('有冇人知大埔邊度有好嘅美容院？想做facial。', 'taipo', ARRAY['lifestyle'], '靚女', NOW() - INTERVAL '2 days'),
('大埔公園嘅健身設施好齊全，重免費添。', 'taipo', ARRAY['sports'], '健身達人', NOW() - INTERVAL '3 days'),
('大埔墟街市嘅海鮮好新鮮，價錢又平，抵食！', 'taipo', ARRAY['food'], '海鮮控', NOW() - INTERVAL '4 days'),
('大尾篤有間隱世小店賣嘅雞蛋仔好好食，香脆可口。', 'taipo', ARRAY['food'], '小食控', NOW() - INTERVAL '5 days'),

-- 沙田帖子
('沙田新城市廣場有間新開嘅日本餐廳，個拉麵好好食！', 'shatin', ARRAY['food'], '拉麵控', NOW() - INTERVAL '1 day'),
('有冇人知沙田邊度有好嘅補習社？DSE快到，好緊張。', 'shatin', ARRAY['education'], '學生仔', NOW() - INTERVAL '2 days'),
('沙田公園嘅單車徑好靚，啱晒周末去踩單車。', 'shatin', ARRAY['sports', 'lifestyle'], '單車俠', NOW() - INTERVAL '3 days'),
('石門嘅運動場好正，設施齊全。', 'shatin', ARRAY['sports'], '運動狂', NOW() - INTERVAL '4 days'),
('大圍有間新開嘅火鍋店，個湯底好正，推薦！', 'shatin', ARRAY['food'], '火鍋控', NOW() - INTERVAL '5 days'),

-- 西貢帖子
('西貢海鮮街嘅海鮮好新鮮，不過價錢貴咗好多。', 'saikung', ARRAY['food'], '海鮮控', NOW() - INTERVAL '1 day'),
('有冇人知西貢邊度有好嘅沙灘？想去游水。', 'saikung', ARRAY['sports', 'lifestyle'], '水魚仔', NOW() - INTERVAL '2 days'),
('西貢市中心嘅咖啡店好有格調，啱晒打卡。', 'saikung', ARRAY['food', 'lifestyle'], '咖啡控', NOW() - INTERVAL '3 days'),
('糧船灣嘅風景好靚，啱晒行山。', 'saikung', ARRAY['sports', 'lifestyle'], '行山客', NOW() - INTERVAL '4 days'),
('將軍澳有間新開嘅火鍋店，個湯底好正，推薦！', 'saikung', ARRAY['food'], '火鍋控', NOW() - INTERVAL '5 days'),

-- 離島帖子
('長洲嘅平安包好好食，每次去完都想再去。', 'islands', ARRAY['food', 'travel'], '小食控', NOW() - INTERVAL '1 day'),
('有冇人知大嶼山邊度有好嘅行山路線？想周末去行下。', 'islands', ARRAY['sports', 'lifestyle'], '行山客', NOW() - INTERVAL '2 days'),
('南丫島嘅海鮮好新鮮，價錢又平，抵食！', 'islands', ARRAY['food', 'travel'], '海鮮控', NOW() - INTERVAL '3 days'),
('坪洲嘅風景好靚，啱晒影相。', 'islands', ARRAY['lifestyle', 'travel'], '攝影師', NOW() - INTERVAL '4 days'),
('愉景灣有間新開嘅西餐廳，個牛扒好好食，推薦！', 'islands', ARRAY['food'], '西餐控', NOW() - INTERVAL '5 days');`}</pre>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">步驟 5: 驗證表已創建</h3>
            <p className="text-sm text-muted-foreground">
              在左側菜單中點擊 "表編輯器"，您應該能夠看到新創建的 profiles、posts 和 comments
              表，以及100個預設的香港口語風格帖子。
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-md">
            <h3 className="font-medium mb-2">注意事項：</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>確保您的 Supabase 項目已正確設置環境變量</li>
              <li>如果您已經有一些表，可能需要調整 SQL 腳本以避免衝突</li>
              <li>設置完成後，您需要刷新應用程序以使更改生效</li>
              <li>預設帖子使用了香港口語風格，覆蓋了所有18個地區和所有分類</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/">
            <Button variant="outline">返回首頁</Button>
          </Link>
          <div className="flex gap-2">
            <Link href="/env-check">
              <Button variant="outline">檢查環境變量</Button>
            </Link>
            <Button onClick={() => window.location.reload()}>刷新頁面</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
