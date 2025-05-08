"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function ClientAdminSetupPage() {
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

  const handleSetupAdmin = async () => {
    if (!userId) {
      toast({
        title: "未登入",
        description: "請先登入",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setDebugInfo("開始設置管理員...")

    try {
      // 步驟1：檢查admins表是否存在
      setDebugInfo("步驟1：檢查admins表是否存在...")
      const { error: tableCheckError } = await supabase.from("admins").select("id").limit(1)

      if (
        tableCheckError &&
        tableCheckError.message.includes("relation") &&
        tableCheckError.message.includes("does not exist")
      ) {
        // 表不存在，創建表
        setDebugInfo("admins表不存在，創建表...")
        const { error: createTableError } = await supabase.rpc("execute_sql", {
          sql: `
            CREATE TABLE IF NOT EXISTS public.admins (
              id SERIAL PRIMARY KEY,
              user_id UUID NOT NULL REFERENCES auth.users(id),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              UNIQUE(user_id)
            );
            
            -- 啟用RLS
            ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
          `,
        })

        if (createTableError) {
          throw new Error(`創建表失敗: ${createTableError.message}`)
        }

        setDebugInfo("admins表創建成功")
      } else {
        setDebugInfo("admins表已存在")
      }

      // 步驟2：設置RLS策略
      setDebugInfo("步驟2：設置RLS策略...")
      const { error: policyError } = await supabase.rpc("execute_sql", {
        sql: `
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
        `,
      })

      if (policyError) {
        throw new Error(`設置RLS策略失敗: ${policyError.message}`)
      }

      setDebugInfo("RLS策略設置成功")

      // 步驟3：插入管理員記錄
      setDebugInfo("步驟3：插入管理員記錄...")
      const { error: insertError } = await supabase.rpc("execute_sql", {
        sql: `
          INSERT INTO public.admins (user_id)
          VALUES ('${userId}')
          ON CONFLICT (user_id) DO NOTHING;
        `,
      })

      if (insertError) {
        throw new Error(`插入管理員記錄失敗: ${insertError.message}`)
      }

      setDebugInfo("管理員記錄插入成功")
      setSuccess(true)

      toast({
        title: "管理員設置成功",
        description: "您現在是管理員",
      })
    } catch (error) {
      console.error("設置管理員失敗:", error)
      setDebugInfo(`設置管理員失敗: ${error instanceof Error ? error.message : "未知錯誤"}`)

      toast({
        title: "設置管理員失敗",
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
            客戶端管理員設置
          </CardTitle>
          <CardDescription>使用客戶端分步設置管理員</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-4">
              <p className="text-green-600 font-medium">管理員設置成功！</p>
              <p className="text-sm text-muted-foreground mt-2">您現在可以訪問管理員控制面板</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">此操作將分步設置管理員，包括創建表、設置RLS策略和插入管理員記錄。</p>

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
            <Button onClick={handleSetupAdmin} disabled={loading || !userId}>
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
