"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ExternalLink, AlertTriangle, CheckCircle, Copy } from "lucide-react"

export default function EmailSetupGuidePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Supabase 電子郵件設置指南</h1>

      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>重要提示</AlertTitle>
        <AlertDescription>
          如果您收到密碼重置電子郵件但沒有重置鏈接，請按照本指南配置您的 Supabase 電子郵件模板。
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>步驟 1: 登入 Supabase 控制台</CardTitle>
            <CardDescription>訪問 Supabase 控制台並選擇您的項目</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                訪問{" "}
                <a
                  href="https://app.supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  Supabase 控制台 <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>登入您的帳戶</li>
              <li>選擇您的香港交友應用項目</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>步驟 2: 配置身份驗證設置</CardTitle>
            <CardDescription>確保您的 URL 配置正確</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                在左側菜單中，點擊 <strong>Authentication</strong>
              </li>
              <li>
                選擇 <strong>URL Configuration</strong> 標籤
              </li>
              <li>
                確保 <strong>Site URL</strong> 設置為您的應用程序 URL (例如: <code>https://your-app.vercel.app</code>)
              </li>
              <li>
                確保 <strong>Redirect URLs</strong> 包含以下路徑:
                <ul className="list-disc pl-5 mt-2">
                  <li>
                    <code>https://your-app.vercel.app/auth/callback</code>
                  </li>
                  <li>
                    <code>https://your-app.vercel.app/reset-password</code>
                  </li>
                </ul>
              </li>
              <li>
                點擊 <strong>Save</strong> 保存設置
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>步驟 3: 配置電子郵件模板</CardTitle>
            <CardDescription>確保密碼重置電子郵件包含正確的重置鏈接</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-4">
              <li>
                在左側菜單中，點擊 <strong>Authentication</strong>
              </li>
              <li>
                選擇 <strong>Email Templates</strong> 標籤
              </li>
              <li>
                點擊 <strong>Reset Password</strong> 模板
              </li>
              <li>
                確保模板中包含 <code>{"{{ .ConfirmationURL }}"}</code> 變量，這是生成重置鏈接的關鍵
              </li>
              <li>
                以下是一個示例模板，您可以複製並使用:
                <div className="bg-muted p-4 rounded-md mt-2 relative">
                  <pre className="text-xs whitespace-pre-wrap">
                    {`<h2>重置您的密碼</h2>
<p>您好，</p>
<p>我們收到了重置您密碼的請求。如果您沒有請求重置密碼，請忽略此電子郵件。</p>
<p>點擊下面的鏈接重置您的密碼:</p>
<p><a href="{'{{ .ConfirmationURL }}'}">重置密碼</a></p>
<p>或複製以下鏈接到您的瀏覽器:</p>
<p>{'{{ .ConfirmationURL }}'}</p>
<p>此鏈接將在 24 小時後過期。</p>
<p>謝謝,<br>香港交友應用團隊</p>`}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(`<h2>重置您的密碼</h2>
<p>您好，</p>
<p>我們收到了重置您密碼的請求。如果您沒有請求重置密碼，請忽略此電子郵件。</p>
<p>點擊下面的鏈接重置您的密碼:</p>
<p><a href="{{ .ConfirmationURL }}">重置密碼</a></p>
<p>或複製以下鏈接到您的瀏覽器:</p>
<p>{{ .ConfirmationURL }}</p>
<p>此鏈接將在 24 小時後過期。</p>
<p>謝謝,<br>香港交友應用團隊</p>`)
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </li>
              <li>
                點擊 <strong>Save</strong> 保存模板
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>步驟 4: 測試密碼重置</CardTitle>
            <CardDescription>確認您的設置正常工作</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2">
              <li>返回您的應用程序</li>
              <li>
                訪問{" "}
                <Link href="/forgot-password" className="text-primary hover:underline">
                  忘記密碼
                </Link>{" "}
                頁面
              </li>
              <li>輸入您的電子郵件地址並請求密碼重置</li>
              <li>檢查您的電子郵件，確認收到的郵件中包含可點擊的重置鏈接</li>
            </ol>
          </CardContent>
          <CardFooter>
            <Alert className="w-full">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>提示</AlertTitle>
              <AlertDescription>
                如果您仍然遇到問題，請確保您的電子郵件提供商沒有阻止或過濾這些郵件。檢查您的垃圾郵件文件夾。
              </AlertDescription>
            </Alert>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Button asChild>
          <Link href="/">返回首頁</Link>
        </Button>
      </div>
    </div>
  )
}
