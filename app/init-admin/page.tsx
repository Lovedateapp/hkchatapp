"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Shield } from "lucide-react"

export default function InitAdminPage() {
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error("獲取用戶信息失敗:", userError)
          setDebugInfo(JSON.stringify(userError, null, 2))
          return
        }

        if (user) {
          setUserId(user.id)
          setDebugInfo(`已獲取用戶ID: ${user.id}`)
        } else {
          setDebugInfo("未獲取到用戶信息")
        }
      } catch (error) {
        console.error("獲取用戶信息時出錯:", error)
        setDebugInfo(JSON.stringify(error, null, 2))
      }
    }

    getUser()
  }, [])

  const handleInitAdmin = async () => {
    if (!userId) {
      toast({
        title: "未登入",
        description: "請先登入",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setDebugInfo(`開始設置管理員，用戶ID: ${userId}`)

    try {
      // 直接使用execute_sql RPC函數
      const { error: sqlError } = await supabase.rpc("execute_sql", {
        sql: `
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
          VALUES ('${userId}')
          ON CONFLICT (user_id) DO NOTHING;
        `,
      })

      if (sqlError) {
        throw new Error(`執行SQL失敗: ${sqlError.message}`)
      }

      setDebugInfo(`管理員設置成功，用戶ID: ${userId}`)
      setSuccess(true)

      toast({
        title: "初始化管理員成功",
        description: "您現在是管理員",
      })
    } catch (error) {
      console.error("初始化管理員失敗:", error)
      setDebugInfo(JSON.stringify(error, null, 2))

      toast({
        title: "初始化管理員失敗",
        description: error instanceof Error ? error.message : "未知錯誤",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            初始化管理員
          </CardTitle>
          <CardDescription>將當前登入用戶設置為管理員</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-4">
              <p className="text-green-600 font-medium">管理員設置成功！</p>
              <p className="text-sm text-muted-foreground mt-2">您現在可以訪問管理員控制面板</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">此操作將把當前登入的用戶設置為系統管理員。管理員可以管理用戶、報告和VIP設置。</p>

              {userId ? (
                <div className="p-2 bg-gray-50 rounded text-sm">
                  <p>
                    當前用戶ID: <span className="font-mono text-xs">{userId}</span>
                  </p>
                </div>
              ) : (
                <p className="text-red-500 text-sm">未檢測到登入用戶</p>
              )}
            </div>
          )}

          {debugInfo && (
            <div className="mt-4 p-2 bg-gray-50 border border-gray-200 rounded text-xs overflow-auto max-h-32">
              <pre>{debugInfo}</pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          {success ? (
            <Button onClick={() => (window.location.href = "/admin")}>前往管理員面板</Button>
          ) : (
            <Button onClick={handleInitAdmin} disabled={loading || !userId}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  處理中
                </>
              ) : (
                "設置為管理員"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
