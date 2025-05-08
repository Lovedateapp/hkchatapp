"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, Check } from "lucide-react"

export default function ResetPassword() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hashPresent, setHashPresent] = useState(false)

  useEffect(() => {
    // 檢查URL中是否有hash參數（表示從重置密碼郵件中點擊）
    const hash = window.location.hash
    setHashPresent(!!hash)
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "密碼不匹配",
        description: "請確保兩次輸入的密碼相同",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "密碼太短",
        description: "密碼必須至少包含6個字符",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        throw error
      }

      setSuccess(true)
      toast({
        title: "密碼已重置",
        description: "您的密碼已成功更新",
      })

      // 3秒後重定向到登錄頁面
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error: any) {
      console.error("Reset password error:", error)
      toast({
        title: "重置密碼失敗",
        description: error.message || "重置密碼時發生錯誤",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!hashPresent) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen py-8 px-4 pb-20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">重置密碼</CardTitle>
            <CardDescription className="text-center">請使用重置密碼郵件中的鏈接訪問此頁面</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">如果您尚未收到重置密碼郵件，請前往忘記密碼頁面重新發送</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/forgot-password">
              <Button>前往忘記密碼頁面</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen py-8 px-4 pb-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">重置密碼</CardTitle>
          <CardDescription className="text-center">
            {success ? "您的密碼已成功重置" : "請輸入您的新密碼"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                您的密碼已成功重置。您將在幾秒鐘內被重定向到登錄頁面。
              </p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">新密碼</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">確認密碼</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    處理中
                  </>
                ) : (
                  "重置密碼"
                )}
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
