"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Mail, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

export default function EmailVerificationGuidePage() {
  const [activeTab, setActiveTab] = useState("guide")
  const [resendLoading, setResendLoading] = useState(false)
  const [email, setEmail] = useState("")

  const handleResendVerification = async () => {
    try {
      setResendLoading(true)
      const supabase = createClient()

      // 獲取當前用戶
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "請先登入",
          description: "您需要登入才能重新發送驗證郵件",
          variant: "destructive",
        })
        return
      }

      setEmail(user.email || "")

      // 重新發送驗證郵件
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      })

      if (error) {
        throw error
      }

      toast({
        title: "驗證郵件已發送",
        description: `驗證郵件已發送至 ${user.email}`,
      })
    } catch (error: any) {
      console.error("重新發送驗證郵件失敗:", error)
      toast({
        title: "發送失敗",
        description: error.message || "無法發送驗證郵件，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">電子郵件驗證指南</CardTitle>
          <CardDescription>解決電子郵件驗證問題的步驟</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="guide" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="guide">問題指南</TabsTrigger>
              <TabsTrigger value="resend">重新發送驗證</TabsTrigger>
              <TabsTrigger value="troubleshoot">故障排除</TabsTrigger>
            </TabsList>

            <TabsContent value="guide">
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>為什麼需要驗證電子郵件？</AlertTitle>
                  <AlertDescription>
                    電子郵件驗證可以確保您提供的電子郵件地址是有效的，並且您是該電子郵件地址的擁有者。這有助於保護您的帳戶安全。
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">常見問題</h3>

                  <div className="space-y-2">
                    <h4 className="font-medium">1. 沒有收到驗證郵件</h4>
                    <p className="text-muted-foreground">
                      請檢查您的垃圾郵件或垃圾郵件文件夾。有時驗證郵件可能會被誤標為垃圾郵件。
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">2. 驗證鏈接已過期</h4>
                    <p className="text-muted-foreground">
                      驗證鏈接通常在 24 小時後過期。如果您的鏈接已過期，請使用「重新發送驗證」選項。
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">3. 電子郵件地址輸入錯誤</h4>
                    <p className="text-muted-foreground">
                      如果您在註冊時輸入了錯誤的電子郵件地址，您需要創建一個新帳戶或聯繫管理員尋求幫助。
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="resend">
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertTitle>重新發送驗證郵件</AlertTitle>
                  <AlertDescription>
                    如果您沒有收到驗證郵件或驗證鏈接已過期，您可以請求重新發送驗證郵件。
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <Mail className="h-12 w-12 text-primary" />
                  <p className="text-center">點擊下面的按鈕重新發送驗證郵件至您的電子郵件地址</p>
                  <Button onClick={handleResendVerification} disabled={resendLoading}>
                    {resendLoading ? "發送中..." : "重新發送驗證郵件"}
                  </Button>

                  {email && <p className="text-sm text-muted-foreground">驗證郵件將發送至: {email}</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="troubleshoot">
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>常見問題排除</AlertTitle>
                  <AlertDescription>如果您仍然無法驗證您的電子郵件，請嘗試以下步驟。</AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">1. 檢查您的電子郵件過濾器</h4>
                    <p className="text-muted-foreground">
                      確保您的電子郵件提供商沒有阻止來自我們的郵件。將我們的域名添加到您的安全發件人列表中。
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">2. 使用不同的電子郵件提供商</h4>
                    <p className="text-muted-foreground">
                      某些電子郵件提供商可能會更嚴格地過濾郵件。嘗試使用 Gmail、Outlook 或 Yahoo 等主流電子郵件服務。
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">3. 清除瀏覽器緩存和 Cookie</h4>
                    <p className="text-muted-foreground">
                      有時，瀏覽器緩存和 Cookie 可能會導致問題。嘗試清除它們，然後重新登入。
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">4. 聯繫支持團隊</h4>
                    <p className="text-muted-foreground">
                      如果您嘗試了所有方法仍然無法解決問題，請聯繫我們的支持團隊尋求幫助。
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/login">返回登入</Link>
          </Button>
          <Button asChild>
            <Link href="/register">創建新帳戶</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
