"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Shield, ArrowRight, Check, Copy } from "lucide-react"
import Link from "next/link"

export default function AdminGuidePage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true)

        // 獲取當前用戶
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          window.location.href = "/login"
          return
        }

        setCurrentUserId(user.id)

        // 特殊處理：如果是指定的用戶ID，直接設置為管理員
        if (user.id === "8054649d-d34c-4218-9d07-f94cca7c6d21") {
          // 設置指定用戶為管理員
          await supabase.rpc("execute_sql", {
            sql_query: `
              -- 設置指定用戶為管理員
              INSERT INTO public.users (id, email, is_admin, created_at, updated_at)
              VALUES ('8054649d-d34c-4218-9d07-f94cca7c6d21', '${user.email || "admin@example.com"}', true, NOW(), NOW())
              ON CONFLICT (id) 
              DO UPDATE SET is_admin = true, updated_at = NOW();
            `,
          })

          setIsAdmin(true)
          return
        }

        // 獲取用戶資料
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("is_admin")
          .eq("id", user.id)
          .single()

        if (userError) {
          console.error("獲取用戶資料失敗:", userError)
          setDebugInfo(JSON.stringify(userError, null, 2))

          // 如果用戶記錄不存在，則創建一個
          if (userError.code === "PGRST116") {
            await supabase.from("users").insert({
              id: user.id,
              email: user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_admin: false,
            })
          }

          return
        }

        setIsAdmin(userData?.is_admin || false)
      } catch (error) {
        console.error("檢查管理員狀態時出錯:", error)
        setDebugInfo(JSON.stringify(error, null, 2))
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [])

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "已複製到剪貼板",
      description: "SQL 命令已複製到剪貼板",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            管理員設置指南
          </CardTitle>
          <CardDescription>如何設置和使用管理員權限</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">您的狀態</h3>
            <div className="p-4 rounded-md border">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isAdmin ? "bg-green-500" : "bg-red-500"}`}></div>
                <p className="font-medium">{isAdmin ? "您已擁有管理員權限" : "您沒有管理員權限"}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">用戶 ID: {currentUserId}</p>
            </div>
          </div>

          {isAdmin ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-1 mt-0.5">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">您已是管理員</p>
                  <p className="text-sm text-green-700 mt-1">您可以訪問管理員控制面板，管理用戶、報告和 VIP 設置。</p>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <Link href="/admin">
                  <Button className="flex items-center gap-2">
                    前往管理員頁面
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <p className="font-medium text-amber-800">您需要管理員權限</p>
                <p className="text-sm text-amber-700 mt-1">要成為管理員，您需要在 Supabase 中執行以下 SQL 命令：</p>
              </div>

              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                  {`-- 設置用戶為管理員
INSERT INTO public.users (id, email, is_admin, created_at, updated_at)
VALUES ('${currentUserId}', 'your-email@example.com', true, NOW(), NOW())
ON CONFLICT (id) 
DO UPDATE SET is_admin = true, updated_at = NOW();`}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700"
                  onClick={() =>
                    handleCopyToClipboard(`-- 設置用戶為管理員
INSERT INTO public.users (id, email, is_admin, created_at, updated_at)
VALUES ('${currentUserId}', 'your-email@example.com', true, NOW(), NOW())
ON CONFLICT (id) 
DO UPDATE SET is_admin = true, updated_at = NOW();`)
                  }
                >
                  <Copy className="h-4 w-4 text-gray-300" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">執行此命令後，請刷新此頁面以檢查您的管理員狀態。</p>
            </div>
          )}

          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-2">如何設置特定用戶為管理員</h3>
            <p className="text-sm text-muted-foreground mb-3">如果您想設置特定用戶為管理員，請使用以下 SQL 命令：</p>

            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                {`-- 設置特定用戶為管理員
INSERT INTO public.users (id, email, is_admin, created_at, updated_at)
VALUES ('8054649d-d34c-4218-9d07-f94cca7c6d21', 'admin@example.com', true, NOW(), NOW())
ON CONFLICT (id) 
DO UPDATE SET is_admin = true, updated_at = NOW();`}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700"
                onClick={() =>
                  handleCopyToClipboard(`-- 設置特定用戶為管理員
INSERT INTO public.users (id, email, is_admin, created_at, updated_at)
VALUES ('8054649d-d34c-4218-9d07-f94cca7c6d21', 'admin@example.com', true, NOW(), NOW())
ON CONFLICT (id) 
DO UPDATE SET is_admin = true, updated_at = NOW();`)
                }
              >
                <Copy className="h-4 w-4 text-gray-300" />
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-2">管理員功能</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>管理所有用戶資料</li>
              <li>設置或撤銷用戶的 VIP 權限</li>
              <li>處理用戶提交的報告</li>
              <li>設置其他用戶為管理員</li>
              <li>查看系統統計數據</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            返回首頁
          </Button>
          {isAdmin && (
            <Link href="/admin">
              <Button className="flex items-center gap-2">
                前往管理員頁面
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>

      {debugInfo && (
        <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-xs overflow-auto max-h-32 max-w-3xl mx-auto">
          <pre>{debugInfo}</pre>
        </div>
      )}
    </div>
  )
}
