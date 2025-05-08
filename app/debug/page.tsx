"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function DebugPage() {
  const [loading, setLoading] = useState(true)
  const [envVars, setEnvVars] = useState<{ [key: string]: string | undefined }>({})
  const [supabaseStatus, setSupabaseStatus] = useState<"loading" | "connected" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // 检查环境变量
    const vars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
    setEnvVars(vars)

    // 测试Supabase连接
    const testSupabase = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("posts").select("count").limit(1)

        if (error) {
          throw error
        }

        setSupabaseStatus("connected")
      } catch (err: any) {
        console.error("Supabase connection error:", err)
        setSupabaseStatus("error")
        setErrorMessage(err.message || "未知錯誤")
      } finally {
        setLoading(false)
      }
    }

    testSupabase()
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>調試頁面</CardTitle>
          <CardDescription>檢查應用程序的配置和連接狀態</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">環境變量</h3>
            <div className="bg-muted p-4 rounded-md overflow-auto">
              <pre className="text-sm">
                {Object.entries(envVars).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {value ? `${value.substring(0, 5)}...` : "未設置"}
                  </div>
                ))}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Supabase 連接</h3>
            <div className="bg-muted p-4 rounded-md">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>測試連接中...</span>
                </div>
              ) : supabaseStatus === "connected" ? (
                <div className="text-green-500">連接成功</div>
              ) : (
                <div>
                  <div className="text-destructive mb-2">連接失敗</div>
                  {errorMessage && <div className="text-sm">{errorMessage}</div>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRefresh}>刷新頁面</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
