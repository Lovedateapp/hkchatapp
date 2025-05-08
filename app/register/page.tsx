"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { Eye, EyeOff, Loader2, Mail } from "lucide-react"
import { HumanVerification } from "@/components/human-verification"

export default function Register() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [gender, setGender] = useState("")
  const [loading, setLoading] = useState(false)
  const [isHumanVerified, setIsHumanVerified] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "請填寫電子郵件和密碼",
        variant: "destructive",
      })
      return
    }

    if (!gender) {
      toast({
        title: "請選擇性別",
        variant: "destructive",
      })
      return
    }

    if (!isHumanVerified) {
      toast({
        title: "請完成人機驗證",
        description: "為了確保您不是機器人，請完成驗證",
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
    setDebugInfo(null)

    try {
      // 簡化註冊流程，只使用 Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            gender,
          },
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: "註冊成功",
        description: "請檢查您的電子郵件以驗證您的帳戶",
      })

      // 註冊成功後，將用戶重定向到驗證頁面
      router.push("/verify")
    } catch (error: any) {
      console.error("Registration error:", error)
      setDebugInfo(JSON.stringify(error, null, 2))
      toast({
        title: "註冊失敗",
        description: error.message || "註冊過程中發生錯誤",
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
          <CardTitle className="text-2xl text-center">創建帳戶</CardTitle>
          <CardDescription className="text-center">加入香港匿名交友平台，開始您的社交之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
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
              <Label htmlFor="password">密碼（最少6位數）</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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

            {/* 性別選項 */}
            <div className="space-y-2">
              <Label>性別</Label>
              <RadioGroup value={gender} onValueChange={setGender} required>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">男</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">女</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">其他</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>人機驗證</Label>
              <HumanVerification onVerified={() => setIsHumanVerified(true)} />
              {isHumanVerified && <div className="text-sm text-green-600 mt-1">✓ 驗證成功</div>}
            </div>

            <Button type="submit" className="w-full" disabled={loading || !isHumanVerified}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  處理中
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  使用電子郵件註冊
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
            已有帳戶？{" "}
            <Link href="/login" className="text-primary hover:underline">
              登入
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
