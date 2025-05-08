"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase"
import Link from "next/link"

export default function DebugAuthPage() {
  const [loading, setLoading] = useState(true)
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()

        // 獲取會話信息
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        // 獲取用戶信息
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        setAuthStatus({
          session: sessionData.session,
          user: userData.user,
        })
      } catch (err: any) {
        console.error("Auth check error:", err)
        setError(err.message || "檢查認證狀態時出錯")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const testAuthSetup = async () => {
    setTestResult(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // 測試創建臨時用戶
      const testEmail = `test_${Date.now()}@example.com`
      const testPassword = "password123"

      // 嘗試註冊
      const { error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      })

      if (signUpError) {
        throw signUpError
      }

      setTestResult({
        success: true,
        message: "認證系統工作正常！成功創建測試用戶。",
      })
    } catch (err: any) {
      console.error("Auth test error:", err)
      setTestResult({
        success: false,
        message: `認證測試失敗: ${err.message || "未知錯誤"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>認證系統診斷</CardTitle>
          <CardDescription>檢查認證系統的狀態和配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">認證狀態</h3>
                {error ? (
                  <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertTitle>認證錯誤</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="bg-muted p-4 rounded-md overflow-auto">
                    <pre className="text-sm">{JSON.stringify(authStatus, null, 2)}</pre>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">認證系統測試</h3>
                <Button onClick={testAuthSetup} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      測試中...
                    </>
                  ) : (
                    "測試認證系統"
                  )}
                </Button>

                {testResult && (
                  <Alert
                    className={
                      testResult.success
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    }
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    <AlertTitle>{testResult.success ? "測試成功" : "測試失敗"}</AlertTitle>
                    <AlertDescription>{testResult.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <AlertTitle>解決認證問題的建議</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>1. 確保您的 Supabase 項目已正確設置環境變量</p>
                  <p>2. 檢查 Supabase 控制台中的認證設置</p>
                  <p>3. 運行 SQL 腳本修復權限問題</p>
                  <p>4. 確保您的應用程序使用最新版本的 Supabase 客戶端庫</p>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.location.reload()}>
            刷新頁面
          </Button>
          <Link href="/">
            <Button>返回首頁</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
