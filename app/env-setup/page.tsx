"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Copy, CheckCircle2, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function EnvSetupPage() {
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    // 從環境變量中獲取當前值（如果有）
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
    }
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    }
  }, [])

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied({ ...copied, [key]: true })
        setTimeout(() => setCopied({ ...copied, [key]: false }), 2000)

        toast({
          title: "已複製到剪貼板",
          description: "內容已成功複製到剪貼板",
        })
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
        toast({
          title: "複製失敗",
          description: "請手動複製內容",
          variant: "destructive",
        })
      })
  }

  const testConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      toast({
        title: "請填寫 Supabase URL 和 API Key",
        variant: "destructive",
      })
      return
    }

    try {
      // 使用提供的 URL 和 Key 創建臨時 Supabase 客戶端
      const { createClient } = await import("@supabase/supabase-js")
      const supabase = createClient(supabaseUrl, supabaseKey)

      // 嘗試一個簡單的查詢
      const { error } = await supabase.from("profiles").select("count", { count: "exact", head: true })

      if (error) {
        if (error.message.includes("does not exist")) {
          setTestResult({
            success: true,
            message: "連接成功，但 profiles 表不存在。請運行初始化 SQL 腳本。",
          })
        } else {
          throw error
        }
      } else {
        setTestResult({
          success: true,
          message: "連接成功！Supabase 配置正確。",
        })
      }
    } catch (error: any) {
      console.error("Connection test error:", error)
      setTestResult({
        success: false,
        message: `連接失敗: ${error.message || "未知錯誤"}`,
      })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Supabase 環境設置</CardTitle>
          <CardDescription>設置您的新 Supabase 項目環境變量</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supabaseUrl">Supabase URL</Label>
              <div className="flex gap-2">
                <Input
                  id="supabaseUrl"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project-id.supabase.co"
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => handleCopy(supabaseUrl, "url")} className="shrink-0">
                  {copied["url"] ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">在 Supabase 項目設置中的 API 部分找到</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supabaseKey">Supabase Anon Key</Label>
              <div className="flex gap-2">
                <Input
                  id="supabaseKey"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="flex-1"
                  type="password"
                />
                <Button variant="outline" onClick={() => handleCopy(supabaseKey, "key")} className="shrink-0">
                  {copied["key"] ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">在 Supabase 項目設置中的 API 部分找到 (anon public)</p>
            </div>

            <Button onClick={testConnection} className="mt-4">
              測試連接
            </Button>

            {testResult && (
              <div
                className={`p-4 rounded-md ${testResult.success ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}
              >
                {testResult.message}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">如何設置 Supabase 環境變量</h3>
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                <div className="inline-block">
                  訪問{" "}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center"
                  >
                    Supabase 控制台 <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </li>
              <li>選擇或創建您的項目</li>
              <li>在左側菜單中，點擊 "項目設置" &gt; "API"</li>
              <li>複製 "Project URL" 和 "anon public" API key</li>
              <li>
                將這些值添加到您的 Vercel 環境變量中：
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                </ul>
              </li>
              <li>重新部署您的應用</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">初始化數據庫</h3>
            <p className="text-sm">
              創建新項目後，您需要運行初始化 SQL 腳本來設置必要的表和權限。您可以在 Supabase 控制台的 SQL 編輯器中運行{" "}
              <code>supabase/migrations/01_initial_setup.sql</code> 腳本。
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  handleCopy(
                    `-- 請在 Supabase SQL 編輯器中運行此腳本

-- 創建 profiles 表
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  gender TEXT,
  district TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 創建 posts 表
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
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
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  username TEXT NOT NULL,
  is_author BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 創建一個簡單的觸發器函數
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 創建觸發器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 設置 RLS 策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 創建 profiles 的安全策略
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

-- 創建 posts 的安全策略
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

-- 創建 comments 的安全策略
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

-- 授予必要的權限
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.posts TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.comments TO postgres, anon, authenticated, service_role;`,
                    "sql",
                  )
                }
              >
                複製 SQL 腳本
              </Button>
              <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">
                  打開 SQL 編輯器 <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/">
            <Button variant="outline">返回首頁</Button>
          </Link>
          <Link href="/debug">
            <Button>檢查環境變量</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
