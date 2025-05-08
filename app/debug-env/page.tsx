"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertTriangle, Copy, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function DebugEnvPage() {
  const [loading, setLoading] = useState(true)
  const [envInfo, setEnvInfo] = useState<{ [key: string]: string }>({})
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // 收集环境变量信息 - 只收集NEXT_PUBLIC前缀的变量
    const info: { [key: string]: string } = {
      NODE_ENV: process.env.NODE_ENV || "未知",
      浏览器: typeof window !== "undefined" ? window.navigator.userAgent : "未知",
      平台: typeof navigator !== "undefined" && navigator.platform ? navigator.platform : "未知",
      窗口尺寸: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "未知",
      当前URL: typeof window !== "undefined" ? window.location.href : "未知",
    }

    // 检查Supabase环境变量是否存在，但不显示具体值
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      info["NEXT_PUBLIC_SUPABASE_URL"] = "已设置"
    } else {
      info["NEXT_PUBLIC_SUPABASE_URL"] = "未设置"
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      info["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = "已设置"
    } else {
      info["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = "未设置"
    }

    setEnvInfo(info)
    setLoading(false)
  }, [])

  const handleCopyEnvSetup = () => {
    const envSetupText = `
# 在Vercel项目设置中添加以下环境变量:

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-app-url.vercel.app
  `.trim()

    navigator.clipboard
      .writeText(envSetupText)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
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

  const missingEnvVars = Object.entries(envInfo).filter(
    ([key, value]) => key.startsWith("NEXT_PUBLIC_") && value === "未设置",
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>环境变量调试</CardTitle>
          <CardDescription>查看当前环境变量和系统信息</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {missingEnvVars.length > 0 && (
                <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertTitle>缺少必要的环境变量</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">以下环境变量未设置，这可能导致应用程序无法正常工作：</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {missingEnvVars.map(([key]) => (
                        <li key={key}>{key}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-muted p-4 rounded-md overflow-auto">
                <pre className="text-sm">
                  {Object.entries(envInfo).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {value}
                    </div>
                  ))}
                </pre>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">如何设置环境变量</h3>
                <p className="text-sm text-muted-foreground">
                  您需要在Vercel项目设置中添加以下环境变量。这些变量对于应用程序的正常运行至关重要。
                </p>

                <div className="space-y-2">
                  <div className="p-3 border rounded-md">
                    <p className="font-medium">NEXT_PUBLIC_SUPABASE_URL</p>
                    <p className="text-xs text-muted-foreground">
                      您的Supabase项目URL，格式为：https://your-project-id.supabase.co
                    </p>
                  </div>

                  <div className="p-3 border rounded-md">
                    <p className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
                    <p className="text-xs text-muted-foreground">您的Supabase匿名密钥，可以在Supabase项目设置中找到</p>
                  </div>

                  <div className="p-3 border rounded-md">
                    <p className="font-medium">NEXT_PUBLIC_APP_URL</p>
                    <p className="text-xs text-muted-foreground">您的应用URL，例如：https://your-app.vercel.app</p>
                  </div>
                </div>

                <Button className="flex items-center gap-2" onClick={handleCopyEnvSetup}>
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  复制环境变量设置说明
                </Button>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  注意：此页面仅显示环境变量的状态，不会显示具体值以保护敏感信息。
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.location.reload()}>
            刷新页面
          </Button>
          <Link href="/env-check">
            <Button>环境变量检查工具</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
