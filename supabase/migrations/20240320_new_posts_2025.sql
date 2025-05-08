-- 插入35篇新帖子，使用香港口语和潮语，2025年话题
INSERT INTO public.posts (content, district, categories, random_username, likes, created_at)
VALUES
-- 中西區帖子
('2025年嘅AI眼鏡真係勁，戴住出街可以即刻知道對面個靚仔係咩星座，仲可以幫你計埋匹配率，科技真係日新月異！', 'central', ARRAY['technology', 'lifestyle'], '科技迷', 3, NOW() - INTERVAL '1 day'),
('有冇人試過中環新開嘅元宇宙餐廳？入去要戴VR眼鏡食飯，啲菜單係3D嘅，仲可以同其他枱嘅客互動，好似喺太空食飯咁，超正！', 'central', ARRAY['food', 'technology'], '美食達人', 5, NOW() - INTERVAL '2 days'),
('2025年嘅新iPhone 17真係勁，電池可以用成三日，仲可以投影出3D畫面，唔使屏幕都得，直接喺枱面投影，超方便！', 'central', ARRAY['technology'], '果粉', 4, NOW() - INTERVAL '3 days'),

-- 灣仔帖子
('灣仔新開咗間元宇宙KTV，唔使真係唱，AI直接幫你調聲，唱到好似專業歌手咁，仲可以揀唔同場景，好似真係開演唱會咁，超正！', 'wanchai', ARRAY['entertainment', 'technology'], '唱K王', 2, NOW() - INTERVAL '1 day'),
('灣仔電腦城最近好多AI電腦，唔使打字，直接同佢講嘢就得，仲可以幫你寫報告，做簡報，真係懶人福音！', 'wanchai', ARRAY['technology'], '電腦迷', 1, NOW() - INTERVAL '2 days'),
('琼華中心嘅茶餐廳開始用機械人送餐，個機械人仲識講嘢，成日同客人講笑，好得意！', 'wanchai', ARRAY['food', 'technology'], '食神', 3, NOW() - INTERVAL '3 days'),

-- 東區帖子
('太古城中心新開咗間VR健身室，戴住VR眼鏡做運動，可以喺唔同場景跑步，好似真係喺海邊跑步咁，超正！', 'eastern', ARRAY['sports', 'technology'], '健身達人', 4, NOW() - INTERVAL '1 day'),
('筲箕灣新開咗間無人超市，入去用App掃碼，揀完嘢直接行出去就自動畀錢，唔使排隊，超方便！', 'eastern', ARRAY['lifestyle', 'technology'], '便利控', 2, NOW() - INTERVAL '2 days'),
('柴灣工業區有間新嘅3D打印餐廳，啲食物全部都係3D打印出嚟，個造型超特別，仲要好好食，大家可以去試下！', 'eastern', ARRAY['food', 'technology'], '美食家', 5, NOW() - INTERVAL '3 days'),

-- 南區帖子
('赤柱沙灘開始用AI監察系統，可以預測邊度會有鯊魚出沒，仲可以監察水質，游水更加安全！', 'southern', ARRAY['technology', 'lifestyle'], '游泳健將', 3, NOW() - INTERVAL '1 day'),
('石澳新開咗間無人機餐廳，啲餐點係用無人機送上嚟，仲可以喺半空中整cocktail，超正！', 'southern', ARRAY['food', 'technology'], '科技控', 4, NOW() - INTERVAL '2 days'),
('海洋公園推出咗新嘅AR體驗，可以同虛擬嘅海洋生物互動，仲可以喺太平洋底行走，超真實！', 'southern', ARRAY['entertainment', 'technology'], '海洋迷', 2, NOW() - INTERVAL '3 days'),

-- 油尖旺帖子
('旺角新開咗間元宇宙商場，入去要戴VR眼鏡，可以試衫唔使除衫，直接喺虛擬試身室試，超方便！', 'yautsimmong', ARRAY['lifestyle', 'technology'], '購物狂', 5, NOW() - INTERVAL '1 day'),
('尖沙咀K11商場有間新嘅AI美容院，機械人幫你做facial，仲會根據你嘅膚質調整療程，效果一流！', 'yautsimmong', ARRAY['lifestyle', 'technology'], '美容控', 3, NOW() - INTERVAL '2 days'),
('油麻地廟街夜市開始用AR技術，用手機掃一掃就可以睇到啲嘢嘅來源同評價，仲可以直接網上落單，好方便！', 'yautsimmong', ARRAY['lifestyle', 'technology'], '夜市王', 1, NOW() - INTERVAL '3 days'),

-- 深水埗帖子
('深水埗鴨寮街開始有AI修理店，啲機械人可以即刻幫你整電腦，仲識得講嘢同你解釋問題，超正！', 'shamshuipo', ARRAY['technology'], '電腦迷', 2, NOW() - INTERVAL '1 day'),
('基隆街嘅布料市場開始用AR技術，用手機掃一掃就可以睇到啲布料做成衫嘅效果，超方便！', 'shamshuipo', ARRAY['lifestyle', 'technology'], 'DIY達人', 4, NOW() - INTERVAL '2 days'),
('深水埗有間新嘅3D打印服裝店，可以即場打印衫褲，仲可以自己設計，好正！', 'shamshuipo', ARRAY['lifestyle', 'technology'], '時尚達人', 3, NOW() - INTERVAL '3 days'),

-- 九龍城帖子
('九龍城新開咗間無人機餐廳，啲餐點係用無人機送上嚟，仲可以喺半空中整cocktail，超正！', 'kowlooncity', ARRAY['food', 'technology'], '美食家', 5, NOW() - INTERVAL '1 day'),
('侯王道有間新嘅AR咖啡店，啲咖啡杯上面嘅圖案會郁，仲可以同佢互動，超得意！', 'kowlooncity', ARRAY['food', 'technology'], '咖啡控', 2, NOW() - INTERVAL '2 days'),
('九龍城嘅單車徑開始用AI監察系統，可以預測邊度會塞車，仲可以建議最佳路線，超方便！', 'kowlooncity', ARRAY['sports', 'technology'], '單車俠', 1, NOW() - INTERVAL '3 days'),

-- 黃大仙帖子
('黃大仙廟前面開始用AR技術，用手機掃一掃就可以睇到啲神仙嘅故事，仲可以喺虛擬世界入面參拜，超正！', 'wongtaisin', ARRAY['lifestyle', 'technology'], '求神仔', 3, NOW() - INTERVAL '1 day'),
('鑽石山荷里活廣場嘅戲院開始用4D技術，唔單止有震動座位，仲有氣味同溫度變化，睇戲更加過癮！', 'wongtaisin', ARRAY['entertainment', 'technology'], '戲迷', 4, NOW() - INTERVAL '2 days'),
('彩虹邨開始用AI管理系統，可以自動檢測漏水同維修問題，住得更加安心！', 'wongtaisin', ARRAY['lifestyle', 'technology'], '邨民', 2, NOW() - INTERVAL '3 days'),

-- 觀塘帖子
('觀塘APM商場嘅美食廣場開始用機械人送餐，啲機械人仲識講嘢，成日同客人講笑，好得意！', 'kwuntong', ARRAY['food', 'technology'], '美食家', 5, NOW() - INTERVAL '1 day'),
('觀塘海濱公園開始用AR技術，用手機掃一掃就可以睇到啲植物嘅資料，仲可以喺虛擬世界入面種花，超正！', 'kwuntong', ARRAY['lifestyle', 'technology'], '植物控', 3, NOW() - INTERVAL '2 days'),
('牛頭角嘅工廈開始用AI管理系統，可以自動檢測火警同維修問題，做嘢更加安心！', 'kwuntong', ARRAY['work', 'technology'], '打工仔', 1, NOW() - INTERVAL '3 days'),

-- 葵青帖子
('葵涌廣場嘅戲院開始用4D技術，唔單止有震動座位，仲有氣味同溫度變化，睇戲更加過癮！', 'kwaitsing', ARRAY['entertainment', 'technology'], '戲迷', 4, NOW() - INTERVAL '1 day'),
('青衣城嘅美食廣場開始用機械人送餐，啲機械人仲識講嘢，成日同客人講笑，好得意！', 'kwaitsing', ARRAY['food', 'technology'], '美食家', 2, NOW() - INTERVAL '2 days'),
('葵涌運動場開始用AI教練，可以即場分析你嘅動作，仲會俾你建議，訓練更有效！', 'kwaitsing', ARRAY['sports', 'technology'], '運動健將', 3, NOW() - INTERVAL '3 days'),

-- 荃灣帖子
('荃灣廣場嘅美食廣場開始用機械人送餐，啲機械人仲識講嘢，成日同客人講笑，好得意！', 'tsuenwan', ARRAY['food', 'technology'], '美食家', 5, NOW() - INTERVAL '1 day'),
('荃灣公園開始用AR技術，用手機掃一掃就可以睇到啲植物嘅資料，仲可以喺虛擬世界入面種花，超正！', 'tsuenwan', ARRAY['lifestyle', 'technology'], '植物控', 2, NOW() - INTERVAL '2 days'),
('如心廣場嘅戲院開始用4D技術，唔單止有震動座位，仲有氣味同溫度變化，睇戲更加過癮！', 'tsuenwan', ARRAY['entertainment', 'technology'], '戲迷', 1, NOW() - INTERVAL '3 days');
