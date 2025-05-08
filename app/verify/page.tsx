"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle, Mail, Loader2 } from "lucide-react"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    const getSession = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          return
        }

        if (data.session) {
          // 如果用户已登录且已验证，重定向到首页
          if (data.session.user.email_confirmed_at) {
            router.push("/")
            return
          }

          // 如果用户已登录但未验证，显示验证页面
          setEmail(data.session.user.email)
        }
      } catch (error) {
        console.error("Unexpected error:", error)
      } finally {
        setLoading(false)
      }
    }

    getSession()
  }, [router])

  const handleResendVerification = async () => {
    if (!email) return

    try {
      setResendLoading(true)
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) throw error

      toast({
        title: "驗證郵件已重新發送",
        description: `請檢查您的郵箱 ${email}`,
      })
    } catch (error: any) {
      console.error("Error resending verification:", error)
      toast({
        title: "發送失敗",
        description: error.message || "無法重新發送驗證郵件",
        variant: "destructive",
      })
    } finally {
      setResendLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-xl text-center">請驗證您的電子郵件</CardTitle>
          <CardDescription className="text-center">我們已向 {email || "您的郵箱"} 發送了一封驗證郵件</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">請按照以下步驟完成驗證：</p>
            <ol className="text-sm text-muted-foreground space-y-1 pl-5 list-decimal">
              <li>打開您的電子郵件</li>
              <li>點擊郵件中的驗證鏈接</li>
              <li>驗證成功後，返回此頁面並刷新</li>
            </ol>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            如果您沒有收到郵件，請檢查垃圾郵件文件夾或點擊下方按鈕重新發送
          </p>
          <div className="flex justify-center">
            <Button onClick={handleResendVerification} disabled={resendLoading}>
              {resendLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  發送中...
                </>
              ) : (
                "重新發送驗證郵件"
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="w-full flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/login">返回登入</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/email-verification-guide">驗證問題幫助</Link>
            </Button>
          </div>
          <Button variant="ghost" className="w-full" onClick={() => window.location.reload()}>
            <CheckCircle className="mr-2 h-4 w-4" />
            我已完成驗證
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
