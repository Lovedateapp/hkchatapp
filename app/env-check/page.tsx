"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase"

export default function EnvCheckPage() {
  const [loading, setLoading] = useState(true)
  const [envStatus, setEnvStatus] = useState<{ [key: string]: boolean }>({})
  const [supabaseStatus, setSupabaseStatus] = useState<"loading" | "success" | "error">("loading")
  const [supabaseError, setSupabaseError] = useState<string | null>(null)

  useEffect(() => {
    // 检查环境变量
    const checkEnv = () => {
      const status: { [key: string]: boolean } = {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      }

      setEnvStatus(status)
    }

    // 测试Supabase连接
    const testSupabase = async () => {
      try {
        const supabase = createClient()

        // 尝试简单查询
        const { data, error } = await supabase.from("posts").select("count").limit(1)

        if (error) {
          console.error("Supabase test error:", error)
          setSupabaseStatus("error")
          setSupabaseError(error.message)
        } else {
          console.log("Supabase test successful:", data)
          setSupabaseStatus("success")
        }
      } catch (error: any) {
        console.error("Supabase test exception:", error)
        setSupabaseStatus("error")
        setSupabaseError(error.message || "未知错误")
      }
    }

    checkEnv()
    testSupabase()
    setLoading(false)
  }, [])

  const handleFixEnv = () => {
    // 复制环境变量设置说明到剪贴板
    const envSetupText = `
# 在Vercel项目设置中添加以下环境变量:

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_APP_URL=https://your-app-url.vercel.app
    `.trim()

    navigator.clipboard
      .writeText(envSetupText)
      .then(() => {
        toast({
          title: "已复制到剪贴板",
          description: "环境变量设置说明已复制到剪贴板",
        })
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
        toast({
          title: "复制失败",
          description: "请手动复制环境变量设置说明",
          variant: "destructive",
        })
      })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>环境变量检查</CardTitle>
          <CardDescription>检查应用所需的环境变量是否正确设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">环境变量状态</h3>
                <div className="space-y-2">
                  {Object.entries(envStatus).map(([key, isSet]) => (
                    <div key={key} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center">
                        {isSet ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                        )}
                        <span>{key}</span>
                      </div>
                      <span className={isSet ? "text-green-500" : "text-yellow-500"}>
                        {isSet ? "已设置" : "未设置"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Supabase 连接测试</h3>
                <div className="p-4 border rounded-md">
                  {supabaseStatus === "loading" ? (
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span>测试中...</span>
                    </div>
                  ) : supabaseStatus === "success" ? (
                    <div className="flex items-center text-green-500">
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      <span>连接成功</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center text-red-500">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        <span>连接失败</span>
                      </div>
                      {supabaseError && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-md text-sm text-red-800 dark:text-red-200">
                          {supabaseError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <AlertTitle>如何设置环境变量</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>您需要在Vercel项目设置中添加以下环境变量:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>NEXT_PUBLIC_SUPABASE_URL - Supabase项目URL</li>
                    <li>NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase匿名密钥</li>
                    <li>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Stripe公钥</li>
                    <li>STRIPE_SECRET_KEY - Stripe密钥</li>
                    <li>NEXT_PUBLIC_APP_URL - 您的应用URL</li>
                  </ul>
                  <Button size="sm" onClick={handleFixEnv}>
                    复制设置说明
                  </Button>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.location.reload()}>
            重新检查
          </Button>
          <Button onClick={() => window.history.back()}>返回</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
