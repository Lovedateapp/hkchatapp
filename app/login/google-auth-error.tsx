"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, CheckCircle2, ExternalLink } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { googleAuthSetupGuide, checkGoogleOAuthSetup } from "@/lib/google-auth-helper"
import Link from "next/link"

export default function GoogleAuthError() {
  const [copied, setCopied] = useState(false)
  const [setupInfo, setSetupInfo] = useState<any>(null)

  useEffect(() => {
    setSetupInfo(checkGoogleOAuthSetup())
  }, [])

  const handleCopyRedirectUri = () => {
    if (!setupInfo?.redirectUri) return

    navigator.clipboard
      .writeText(setupInfo.redirectUri)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast({
          title: "已複製到剪貼板",
          description: "重定向 URI 已複製到剪貼板",
        })
      })
      .catch((err) => {
        console.error("複製失敗:", err)
        toast({
          title: "複製失敗",
          description: "請手動複製重定向 URI",
          variant: "destructive",
        })
      })
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Google 登入設置問題</CardTitle>
        <CardDescription>解決 Google OAuth 重定向 URI 不匹配錯誤</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <AlertTitle>錯誤: redirect_uri_mismatch</AlertTitle>
          <AlertDescription>
            您的 Google OAuth 設置中的重定向 URI 與應用程序使用的不匹配。這是一個常見的配置問題，可以通過更新 Google
            Cloud Console 中的設置來解決。
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="solution" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="solution">快速解決方案</TabsTrigger>
            <TabsTrigger value="guide">完整設置指南</TabsTrigger>
          </TabsList>

          <TabsContent value="solution" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">解決步驟</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  登入{" "}
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center"
                  >
                    Google Cloud Console <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>選擇您的項目</li>
                <li>導航到 "APIs & Services" &gt; "Credentials"</li>
                <li>找到並編輯您的 OAuth 客戶端 ID</li>
                <li>在 "Authorized redirect URIs" 部分，添加以下 URI:</li>
              </ol>

              {setupInfo?.redirectUri && (
                <div className="flex items-center mt-2 p-3 bg-muted rounded-md">
                  <code className="text-sm flex-1 overflow-x-auto">{setupInfo.redirectUri}</code>
                  <Button variant="ghost" size="sm" className="ml-2" onClick={handleCopyRedirectUri}>
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}

              <p className="text-sm text-muted-foreground mt-4">
                添加後，點擊 "Save" 並等待幾分鐘讓更改生效，然後再次嘗試登入。
              </p>
            </div>
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
                <pre className="text-sm whitespace-pre-wrap">{googleAuthSetupGuide}</pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.history.back()}>
          返回
        </Button>
        <Link href="/login">
          <Button>返回登入頁面</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
