"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Shield } from "lucide-react"

export default function SimpleAdminSetupPage() {
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
    setDebugInfo(`開始設置管理員，用戶ID: ${userId}`)

    try {
      // 直接訪問API端點
      const response = await fetch(`/api/simple-admin-setup?userId=${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "設置管理員失敗")
      }

      setDebugInfo(JSON.stringify(data, null, 2))
      setSuccess(true)

      toast({
        title: "管理員設置成功",
        description: "您現在是管理員",
      })
    } catch (error) {
      console.error("設置管理員失敗:", error)
      setDebugInfo(JSON.stringify(error, null, 2))

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
            簡單管理員設置
          </CardTitle>
          <CardDescription>使用API端點設置管理員</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-4">
              <p className="text-green-600 font-medium">管理員設置成功！</p>
              <p className="text-sm text-muted-foreground mt-2">您現在可以訪問管理員控制面板</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">此操作將使用API端點設置管理員，繞過RLS限制。</p>

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
