"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CreditCard, CheckCircle, AlertTriangle } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"

// 替换为您的Stripe公钥
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_TYooMQauvdEDq54NiTphI7jx")

function PaymentContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "error">("idle")
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly" | null>(null)
  const supabase = createClient()

  // 使用useSearchParams获取URL参数
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")

  // 从URL参数获取计划和支付状态
  useEffect(() => {
    const plan = searchParams.get("plan")
    if (plan === "monthly" || plan === "yearly") {
      setSelectedPlan(plan)
    }

    const status = searchParams.get("status")
    if (status === "success") {
      setPaymentStatus("success")
    } else if (status === "error") {
      setPaymentStatus("error")
    }
  }, [searchParams])

  // 检查用户是否已登录
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      } else {
        router.push("/login")
      }
    }

    checkSession()
  }, [router, supabase])

  // 处理Stripe结账
  const handleCheckout = async (priceId: string) => {
    if (!user) {
      toast({
        title: "請先登入",
        description: "您需要登入才能訂閱VIP會員",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setLoading(true)

    try {
      // 这里应该调用您的后端API创建Stripe结账会话
      // 为了演示，我们使用一个模拟的API端点
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { sessionId } = await response.json()

      // 重定向到Stripe结账页面
      const stripe = await stripePromise
      const { error } = await stripe!.redirectToCheckout({ sessionId })

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error)
      toast({
        title: "支付失敗",
        description: error.message || "創建支付會話時出錯",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 模拟支付成功
  const simulateSuccessfulPayment = (plan: "monthly" | "yearly") => {
    setLoading(true)

    // 模拟API调用延迟
    setTimeout(() => {
      // 更新URL参数以显示成功状态
      const url = new URL(window.location.href)
      url.searchParams.set("status", "success")
      url.searchParams.set("plan", plan)
      window.history.pushState({}, "", url)

      setPaymentStatus("success")
      setSelectedPlan(plan)
      setLoading(false)

      toast({
        title: "支付成功",
        description: `您已成功訂閱${plan === "monthly" ? "月費" : "年費"}VIP會員`,
      })
    }, 2000)
  }

  // 显示支付成功页面
  if (paymentStatus === "success") {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-xl text-center">支付成功</CardTitle>
            <CardDescription className="text-center">
              您已成功訂閱{selectedPlan === "monthly" ? "月費" : "年費"}VIP會員
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">感謝您的支持！您現在可以享受VIP會員的所有特權。</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/")}>返回首頁</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // 显示支付错误页面
  if (paymentStatus === "error") {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-xl text-center">支付失敗</CardTitle>
            <CardDescription className="text-center">處理您的支付時出現問題</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">請稍後再試，或聯繫客服尋求幫助。</p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.delete("status")
                window.history.pushState({}, "", url)
                setPaymentStatus("idle")
              }}
            >
              重試
            </Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              返回首頁
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-center">選擇VIP會員方案</CardTitle>
          <CardDescription className="text-center">升級到VIP會員，享受更多特權</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">月費VIP會員</CardTitle>
                <CardDescription>
                  <span className="text-xl font-bold">$38</span>
                  <span className="text-xs"> / 月</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• 無限瀏覽帖子</p>
                <p>• 無限發帖</p>
                <p>• 回覆不限</p>
                <p>• 無限私信</p>
                <p>• 無廣告</p>
                <p>• 專屬徽章</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => simulateSuccessfulPayment("monthly")} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      處理中...
                    </>
                  ) : (
                    "立即訂閱"
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">年費VIP會員</CardTitle>
                <CardDescription>
                  <span className="text-xl font-bold">$288</span>
                  <span className="text-xs"> / 年</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• 無限瀏覽帖子</p>
                <p>• 無限發帖</p>
                <p>• 回覆不限</p>
                <p>• 無限私信</p>
                <p>• 無廣告</p>
                <p>• 專屬徽章</p>
                <p>• 優先客服支持</p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => simulateSuccessfulPayment("yearly")}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      處理中...
                    </>
                  ) : (
                    "立即訂閱"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="flex items-center justify-center">
            <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">支持Stripe安全支付</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  )
}
