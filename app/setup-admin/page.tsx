"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Shield } from "lucide-react"

export default function SetupAdminPage() {
  const [userId, setUserId] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSetupAdmin = async () => {
    if (!userId.trim()) {
      toast({
        title: "請輸入用戶 ID",
        description: "用戶 ID 不能為空",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 檢查用戶是否存在
      const { data: userData, error: userError } = await supabase.from("users").select("id").eq("id", userId).single()

      if (userError) {
        if (userError.code === "PGRST116") {
          // 用戶不存在，嘗試從auth.users獲取
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)

          if (authError || !authUser) {
            toast({
              title: "用戶不存在",
              description: "請確保輸入了正確的用戶 ID",
              variant: "destructive",
            })
            setError("用戶不存在，請確保輸入了正確的用戶 ID")
            return
          }

          // 用戶存在於auth但不在users表中，創建用戶記錄
          const { error: insertError } = await supabase.from("users").insert({
            id: userId,
            anonymous_id: `Admin_${Math.random().toString(36).substring(2, 8)}`,
            created_at: new Date().toISOString(),
          })

          if (insertError) {
            console.error("創建用戶記錄失敗:", insertError)
            setError(`創建用戶記錄失敗: ${insertError.message}`)
          }
        } else {
          toast({
            title: "檢查用戶失敗",
            description: userError.message,
            variant: "destructive",
          })
          setError(`檢查用戶失敗: ${userError.message}`)
          return
        }
      }

      // 使用API路由來設置管理員，避免RLS問題
      const response = await fetch("/api/setup-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "設置管理員失敗")
      }

      toast({
        title: "設置成功",
        description: "用戶已被設置為管理員",
      })
      setSuccess(true)
    } catch (error) {
      console.error("設置管理員失敗:", error)
      const errorMessage = error instanceof Error ? error.message : "未知錯誤"
      toast({
        title: "設置管理員失敗",
        description: errorMessage,
        variant: "destructive",
      })
      setError(`設置管理員失敗: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGetCurrentUserId = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        toast({
          title: "已獲取當前用戶 ID",
          description: "您可以將自己設置為管理員",
        })
      } else {
        toast({
          title: "未登錄",
          description: "請先登錄後再嘗試",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("獲取用戶 ID 失敗:", error)
      toast({
        title: "獲取用戶 ID 失敗",
        description: error instanceof Error ? error.message : "未知錯誤",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-xl text-center">設置管理員</CardTitle>
          <CardDescription className="text-center">設置第一個管理員用戶，以便訪問管理員控制面板</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="bg-green-50 p-4 rounded-md text-green-800">
              <p className="font-medium">設置成功！</p>
              <p className="text-sm mt-1">用戶已被設置為管理員，現在可以訪問管理員控制面板。</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="userId">用戶 ID</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="輸入用戶 ID"
                />
                <p className="text-sm text-muted-foreground">
                  輸入要設置為管理員的用戶 ID。這通常是一個 UUID 格式的字符串。
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={handleGetCurrentUserId}>
                使用當前用戶 ID
              </Button>

              {error && <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm">{error}</div>}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            返回首頁
          </Button>
          {!success && (
            <Button onClick={handleSetupAdmin} disabled={loading || !userId.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  處理中...
                </>
              ) : (
                "設置為管理員"
              )}
            </Button>
          )}
          {success && <Button onClick={() => (window.location.href = "/admin")}>前往管理員面板</Button>}
        </CardFooter>
      </Card>
    </div>
  )
}
