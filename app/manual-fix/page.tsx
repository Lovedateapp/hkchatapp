"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Database, Copy } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ManualFixPage() {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("step1")

  const sqlScripts = {
    step1: `-- 步驟 1: 修復 users 表結構
DO $$
BEGIN
  -- 檢查 users 表是否存在
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    -- 創建 users 表
    CREATE TABLE public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- 設置 RLS 策略
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view all users" 
      ON public.users FOR SELECT 
      USING (true);
      
    CREATE POLICY "Users can update their own profile" 
      ON public.users FOR UPDATE 
      USING (auth.uid() = id);
      
    CREATE POLICY "Users can insert their own profile" 
      ON public.users FOR INSERT 
      WITH CHECK (auth.uid() = id);
  END IF;
  
  -- 確保 users 表有所有必要的列
  BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email') THEN
      ALTER TABLE public.users ADD COLUMN email TEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding email column: %', SQLERRM;
  END;
  
  BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'district') THEN
      ALTER TABLE public.users ADD COLUMN district TEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding district column: %', SQLERRM;
  END;
  
  BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'gender') THEN
      ALTER TABLE public.users ADD COLUMN gender TEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding gender column: %', SQLERRM;
  END;
  
  BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at') THEN
      ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding updated_at column: %', SQLERRM;
  END;
  
  BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url') THEN
      ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding avatar_url column: %', SQLERRM;
  END;
END $$;

-- 為現有用戶創建記錄
INSERT INTO public.users (id, created_at)
SELECT id, NOW()
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 授予必要的權限
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;`,

    step2: `-- 步驟 2: 添加 VIP 相關列
DO $$
BEGIN
  BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'check_in_streak') THEN
      ALTER TABLE public.users ADD COLUMN check_in_streak INTEGER DEFAULT 0;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding check_in_streak column: %', SQLERRM;
  END;
  
  BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_check_in') THEN
      ALTER TABLE public.users ADD COLUMN last_check_in DATE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding last_check_in column: %', SQLERRM;
  END;
  
  BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_vip') THEN
      ALTER TABLE public.users ADD COLUMN is_vip BOOLEAN DEFAULT false;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding is_vip column: %', SQLERRM;
  END;
  
  BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'vip_until') THEN
      ALTER TABLE public.users ADD COLUMN vip_until TIMESTAMP WITH TIME ZONE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding vip_until column: %', SQLERRM;
  END;
END $$;`,

    step3: `-- 步驟 3: 創建 notifications 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE TABLE public.notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      related_id TEXT,
      related_type TEXT,
      sender_id UUID,
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- 設置 RLS 策略
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "用戶可以查看自己的通知" 
      ON public.notifications FOR SELECT 
      USING (auth.uid() = user_id);
      
    CREATE POLICY "用戶可以更新自己的通知" 
      ON public.notifications FOR UPDATE 
      USING (auth.uid() = user_id);
      
    CREATE POLICY "用戶可以插入通知" 
      ON public.notifications FOR INSERT 
      WITH CHECK (true);
  ELSE
    -- 確保 notifications 表有所有必要的列
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'sender_id') THEN
        ALTER TABLE public.notifications ADD COLUMN sender_id UUID;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding sender_id column: %', SQLERRM;
    END;
  END IF;
END $$;

-- 授予必要的權限
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;`,

    step4: `-- 步驟 4: 創建 comments 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
    CREATE TABLE public.comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      username TEXT,
      is_author BOOLEAN DEFAULT false,
      anonymous_name TEXT,
      avatar_seed TEXT
    );
    
    -- 設置 RLS 策略
    ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Everyone can view comments" 
      ON public.comments FOR SELECT 
      USING (true);
      
    CREATE POLICY "Authenticated users can insert comments" 
      ON public.comments FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated');
      
    CREATE POLICY "Users can update their own comments" 
      ON public.comments FOR UPDATE 
      USING (auth.uid() = user_id);
  ELSE
    -- 確保 comments 表有所有必要的列
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'is_author') THEN
        ALTER TABLE public.comments ADD COLUMN is_author BOOLEAN DEFAULT false;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding is_author column: %', SQLERRM;
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'anonymous_name') THEN
        ALTER TABLE public.comments ADD COLUMN anonymous_name TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding anonymous_name column: %', SQLERRM;
    END;
    
    BEGIN
      IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'avatar_seed') THEN
        ALTER TABLE public.comments ADD COLUMN avatar_seed TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding avatar_seed column: %', SQLERRM;
    END;
  END IF;
END $$;

-- 授予必要的權限
GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;`,

    step5: `-- 步驟 5: 創建打卡函數
CREATE OR REPLACE FUNCTION public.check_in(user_id uuid)
RETURNS JSONB AS $$
DECLARE
  last_check_in_date DATE;
  current_streak INTEGER;
  result JSONB;
BEGIN
  -- 獲取用戶上次打卡日期和當前連續打卡天數
  SELECT u.last_check_in, u.check_in_streak INTO last_check_in_date, current_streak
  FROM public.users u
  WHERE u.id = user_id;
  
  -- 如果今天已經打卡，返回錯誤
  IF last_check_in_date = CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '今天已經打卡過了',
      'streak', current_streak
    );
  END IF;
  
  -- 更新用戶的打卡記錄
  IF last_check_in_date IS NULL OR last_check_in_date < CURRENT_DATE - INTERVAL '1 day' THEN
    -- 如果是第一次打卡或者中斷了連續打卡，重置連續打卡天數
    UPDATE public.users
    SET 
      check_in_streak = 1,
      last_check_in = CURRENT_DATE
    WHERE id = user_id;
    
    current_streak := 1;
  ELSIF last_check_in_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- 如果是連續打卡，增加連續打卡天數
    UPDATE public.users
    SET 
      check_in_streak = check_in_streak + 1,
      last_check_in = CURRENT_DATE
    WHERE id = user_id;
    
    current_streak := current_streak + 1;
    
    -- 如果連續打卡達到7天，給予VIP
    IF current_streak >= 7 THEN
      UPDATE public.users
      SET 
        is_vip = true,
        vip_until = CURRENT_DATE + INTERVAL '30 days'
      WHERE id = user_id AND (is_vip = false OR vip_until IS NULL OR vip_until < CURRENT_DATE);
    END IF;
  END IF;
  
  -- 返回成功結果
  RETURN jsonb_build_object(
    'success', true,
    'message', '打卡成功',
    'streak', current_streak
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予必要的權限
GRANT EXECUTE ON FUNCTION public.check_in(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_in(uuid) TO service_role;`,

    step6: `-- 步驟 6: 創建報告表
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reports') THEN
    CREATE TABLE public.reports (
      id SERIAL PRIMARY KEY,
      reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
      post_id INTEGER NOT NULL,
      post_content TEXT,
      poster_id UUID,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- 設置 RLS 策略
    ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
    
    -- 只有管理員可以查看所有報告
    CREATE POLICY "Only admins can view all reports" 
      ON public.reports FOR SELECT 
      USING (auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true));
      
    -- 用戶可以查看自己提交的報告
    CREATE POLICY "Users can view their own reports" 
      ON public.reports FOR SELECT 
      USING (auth.uid() = reporter_id);
      
    -- 用戶可以提交報告
    CREATE POLICY "Users can submit reports" 
      ON public.reports FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  
  -- 確保 users 表有 is_admin 列
  BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_admin') THEN
      ALTER TABLE public.users ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding is_admin column: %', SQLERRM;
  END;
END $$;

-- 授予必要的權限
GRANT ALL ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;`,
  }

  const handleCopy = (script) => {
    navigator.clipboard.writeText(script)
    setCopied(true)
    toast({
      title: "已複製到剪貼板",
      description: "您現在可以將此 SQL 腳本粘貼到 Supabase SQL 編輯器中",
    })

    setTimeout(() => {
      setCopied(false)
    }, 3000)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            分步手動修復數據庫
          </CardTitle>
          <CardDescription>我們將修復過程分成多個步驟，請按順序執行每個步驟</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <AlertTitle>手動修復說明</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>登錄到您的 Supabase 帳戶</li>
                <li>進入您的項目</li>
                <li>點擊左側菜單中的 "SQL 編輯器"</li>
                <li>創建一個新的查詢</li>
                <li>複製下面的 SQL 腳本並粘貼到編輯器中</li>
                <li>點擊 "運行" 按鈕執行腳本</li>
                <li>按順序執行每個步驟，確保前一個步驟成功後再執行下一個步驟</li>
              </ol>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="step1" className="mt-6" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
              <TabsTrigger value="step1">步驟 1</TabsTrigger>
              <TabsTrigger value="step2">步驟 2</TabsTrigger>
              <TabsTrigger value="step3">步驟 3</TabsTrigger>
              <TabsTrigger value="step4">步驟 4</TabsTrigger>
              <TabsTrigger value="step5">步驟 5</TabsTrigger>
              <TabsTrigger value="step6">步驟 6</TabsTrigger>
            </TabsList>

            {Object.entries(sqlScripts).map(([key, script]) => (
              <TabsContent key={key} value={key} className="relative">
                <div className="bg-gray-50 p-3 rounded-md mb-3">
                  {key === "step1" && "修復 users 表基本結構"}
                  {key === "step2" && "添加 VIP 相關列"}
                  {key === "step3" && "創建 notifications 表"}
                  {key === "step4" && "創建 comments 表"}
                  {key === "step5" && "創建打卡函數"}
                  {key === "step6" && "創建報告功能"}
                </div>
                <div className="relative">
                  <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm max-h-80">{script}</pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(script)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => handleCopy(sqlScripts[activeTab])}>
            複製當前步驟的 SQL 腳本
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
