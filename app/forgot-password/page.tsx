"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPassword() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState("")

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      setSubmitted(true)
      setFeedbackMessage(`重置密碼郵件已發送至 ${email}`)
      toast({
        title: "郵件已發送",
        description: `重置密碼郵件已發送至 ${email}`,
      })
    } catch (error: any) {
      console.error("Reset password error:", error)
      setFeedbackMessage("發送重置密碼郵件時發生錯誤，請稍後再試")
      toast({
        title: "發送失敗",
        description: error.message || "發送重置密碼郵件時發生錯誤",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen py-8 px-4 pb-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">忘記密碼</CardTitle>
          <CardDescription className="text-center">
            {submitted ? "請檢查您的電子郵件" : "輸入您的電子郵件以接收重置密碼鏈接"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-center text-sm text-muted-foreground mb-2">{feedbackMessage}</p>
              <p className="text-center text-sm text-muted-foreground">請檢查您的收件箱並點擊郵件中的鏈接重置密碼。</p>
              <p className="text-center text-sm text-muted-foreground mt-2">
                如果您沒有收到郵件，請檢查垃圾郵件文件夾。
              </p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">電子郵件</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full relative" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    發送中...
                  </>
                ) : (
                  "發送重置密碼郵件"
                )}
                <span className="sr-only">發送重置密碼郵件</span>
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-primary hover:underline flex items-center">
            <ArrowLeft className="mr-1 h-3 w-3" />
            返回登入
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
