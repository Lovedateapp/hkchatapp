"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Eye, EyeOff, Loader2, AlertTriangle, Mail } from "lucide-react"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  // 檢查用戶是否已登錄
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Session check error:", error)
          setError(error.message)
          return
        }

        if (session) {
          setIsLoggedIn(true)
          router.push("/")
        }
      } catch (err) {
        console.error("Unexpected error during session check:", err)
        setError(err instanceof Error ? err.message : "登錄檢查時出現未知錯誤")
      }
    }

    checkSession()
  }, [router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      const supabase = createClient()

      // 使用更簡單的登錄方法
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // 登錄成功
      toast({
        title: "登入成功",
        description: "歡迎回來！",
      })

      // 使用 replace 而不是 push，確保用戶不能返回登錄頁
      router.replace("/")
    } catch (error: any) {
      console.error("Login error:", error)

      // 顯示詳細錯誤信息
      setError(error.message || "登錄失敗，請稍後再試")
      setDebugInfo(JSON.stringify(error, null, 2))

      // 顯示友好的錯誤消息
      let errorMessage = "登錄失敗，請稍後再試"

      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "電子郵件或密碼不正確"
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "請先驗證您的電子郵件"
      } else if (error.message.includes("Database error")) {
        errorMessage = "數據庫錯誤，請聯繫管理員或嘗試重新註冊"
      }

      toast({
        title: "登入失敗",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 如果用戶已登錄，顯示加載狀態
  if (isLoggedIn) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen py-8 px-4 pb-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">歡迎回來</CardTitle>
          <CardDescription className="text-center">登入您的帳戶繼續使用香港匿名交友平台</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mr-2 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">電子郵件</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">密碼</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  忘記密碼？
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">{showPassword ? "隱藏密碼" : "顯示密碼"}</span>
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登入中
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  使用電子郵件登入
                </>
              )}
            </Button>
          </form>

          {debugInfo && (
            <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-xs overflow-auto max-h-32">
              <pre>{debugInfo}</pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            還沒有帳戶？{" "}
            <Link href="/register" className="text-primary hover:underline">
              註冊
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
