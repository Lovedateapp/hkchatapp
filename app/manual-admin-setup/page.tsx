"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Clipboard, Shield } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function ManualAdminSetupPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }

    getUser()
  }, [])

  const sqlCommand = `
-- 確保admins表存在
CREATE TABLE IF NOT EXISTS public.admins (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- 啟用RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 刪除所有現有策略
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;
DROP POLICY IF EXISTS "Authenticated users can view admins" ON public.admins;
DROP POLICY IF EXISTS "Service role can manage admins" ON public.admins;

-- 創建新策略
CREATE POLICY "Authenticated users can view admins" ON public.admins
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage admins" ON public.admins
  USING (auth.role() = 'service_role');
  
-- 插入管理員記錄
INSERT INTO public.admins (user_id)
VALUES ('${userId || "您的用戶ID"}')
ON CONFLICT (user_id) DO NOTHING;
  `

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCommand)
    setCopied(true)
    toast({
      title: "已複製到剪貼板",
      description: "您可以將此SQL命令粘貼到Supabase SQL編輯器中執行",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            手動設置管理員
          </CardTitle>
          <CardDescription>使用Supabase SQL編輯器直接設置管理員</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm">請按照以下步驟操作：</p>
            <ol className="list-decimal list-inside text-sm space-y-2">
              <li>登錄到您的Supabase控制台</li>
              <li>點擊左側菜單中的"SQL編輯器"</li>
              <li>創建一個新的查詢</li>
              <li>複製下面的SQL命令並粘貼到編輯器中</li>
              <li>執行SQL命令</li>
            </ol>
          </div>

          {userId ? (
            <div className="p-2 bg-gray-50 rounded text-sm">
              <p>
                當前用戶ID: <span className="font-mono text-xs">{userId}</span>
              </p>
            </div>
          ) : (
            <p className="text-red-500 text-sm">未檢測到登入用戶</p>
          )}

          <div className="relative">
            <pre className="p-4 bg-gray-900 text-gray-100 rounded-md text-xs overflow-auto max-h-80">{sqlCommand}</pre>
            <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={copyToClipboard}>
              <Clipboard className="h-4 w-4 mr-1" />
              {copied ? "已複製" : "複製"}
            </Button>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>注意：</strong> 執行此SQL命令將直接修改您的數據庫。請確保您了解這些操作的影響。
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            返回
          </Button>
          <Button onClick={copyToClipboard}>
            <Clipboard className="h-4 w-4 mr-2" />
            複製SQL命令
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
