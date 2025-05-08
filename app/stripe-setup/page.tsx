"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Copy, ExternalLink, CheckCircle2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function StripeSetupPage() {
  const [activeTab, setActiveTab] = useState("setup")
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied({ ...copied, [key]: true })
        setTimeout(() => setCopied({ ...copied, [key]: false }), 2000)

        toast({
          title: "已复制到剪贴板",
          description: "内容已成功复制到剪贴板",
        })
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
        toast({
          title: "复制失败",
          description: "请手动复制内容",
          variant: "destructive",
        })
      })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <CardTitle>Stripe 集成设置指南</CardTitle>
          </div>
          <CardDescription>了解如何设置Stripe支付集成，以便在您的应用中处理VIP会员订阅</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="setup">基本设置</TabsTrigger>
              <TabsTrigger value="env">环境变量</TabsTrigger>
              <TabsTrigger value="api">API集成</TabsTrigger>
              <TabsTrigger value="test">测试支付</TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-4">
              <h3 className="text-lg font-medium">Stripe账户设置</h3>
              <ol className="list-decimal list-inside space-y-3">
                <li>
                  <div className="inline-block">
                    访问{" "}
                    <a
                      href="https://dashboard.stripe.com/register"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center"
                    >
                      Stripe注册页面 <ExternalLink className="h-3 w-3 ml-1" />
                    </a>{" "}
                    并创建一个账户
                  </div>
                </li>
                <li>完成账户验证流程</li>
                <li>在Stripe仪表板中，切换到测试模式（右上角）</li>
                <li>
                  <div className="inline-block">
                    在{" "}
                    <a
                      href="https://dashboard.stripe.com/test/apikeys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center"
                    >
                      API密钥页面 <ExternalLink className="h-3 w-3 ml-1" />
                    </a>{" "}
                    获取您的API密钥
                  </div>
                </li>
                <li>创建产品和价格计划，对应您的VIP会员方案</li>
              </ol>

              <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <AlertTitle>重要提示</AlertTitle>
                <AlertDescription>
                  在开发和测试阶段，请确保使用Stripe的测试模式。测试模式下，您可以使用测试卡号进行支付测试，而不会产生实际费用。
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="env" className="space-y-4">
              <h3 className="text-lg font-medium">环境变量设置</h3>
              <p className="text-sm text-muted-foreground mb-4">您需要在Vercel项目设置中添加以下环境变量:</p>

              <div className="space-y-3">
                <div className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleCopy("pk_test_your_publishable_key", "pk_key")}
                    >
                      {copied["pk_key"] ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Stripe可公开的API密钥，以"pk_test_"开头（测试模式）或"pk_live_"开头（生产模式）
                  </p>
                </div>

                <div className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">STRIPE_SECRET_KEY</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleCopy("sk_test_your_secret_key", "sk_key")}
                    >
                      {copied["sk_key"] ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Stripe私密API密钥，以"sk_test_"开头（测试模式）或"sk_live_"开头（生产模式）
                  </p>
                </div>

                <div className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">NEXT_PUBLIC_APP_URL</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleCopy("https://your-app-domain.vercel.app", "app_url")}
                    >
                      {copied["app_url"] ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    您的应用URL，用于Stripe回调和重定向。在开发环境中可以设置为"http://localhost:3000"
                  </p>
                </div>
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <AlertTitle>如何在Vercel中设置环境变量</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>1. 登录您的Vercel账户并打开项目</p>
                  <p>2. 点击"Settings"标签，然后选择"Environment Variables"</p>
                  <p>3. 添加上述环境变量及其值</p>
                  <p>4. 点击"Save"保存更改</p>
                  <p>5. 重新部署您的应用以应用新的环境变量</p>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <h3 className="text-lg font-medium">API集成</h3>
              <p className="text-sm text-muted-foreground mb-4">以下是创建Stripe结账会话的API路由示例:</p>

              <div className="bg-muted p-4 rounded-md overflow-auto">
                <pre className="text-sm">
                  <code>
                    {`// app/api/create-checkout-session/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import Stripe from "stripe"

// 初始化Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    const { priceId, userId, userEmail } = await request.json()
    
    // 验证用户是否已登录
    const supabase = createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // 创建Stripe结账会话
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/payment?status=success&plan=\${priceId === "price_monthly_vip" ? "monthly" : "yearly"}\`,
      cancel_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/payment?status=error\`,
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    })
    
    return NextResponse.json({ sessionId: checkoutSession.id })
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}`}
                  </code>
                </pre>
              </div>

              <p className="text-sm text-muted-foreground mt-4">客户端调用示例:</p>

              <div className="bg-muted p-4 rounded-md overflow-auto">
                <pre className="text-sm">
                  <code>
                    {`// 客户端代码
import { loadStripe } from "@stripe/stripe-js"

// 初始化Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

// 处理结账
const handleCheckout = async (priceId: string) => {
  try {
    // 调用API创建结账会话
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
    console.error("Error:", error)
    // 处理错误
  }
}`}
                  </code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <h3 className="text-lg font-medium">测试支付</h3>
              <p className="text-sm text-muted-foreground mb-4">在测试模式下，您可以使用以下测试卡号进行支付测试:</p>

              <div className="space-y-3">
                <div className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">成功支付</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleCopy("4242 4242 4242 4242", "success_card")}
                    >
                      {copied["success_card"] ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm">卡号: 4242 4242 4242 4242</p>
                  <p className="text-xs text-muted-foreground">
                    有效期: 任何未来日期 | CVC: 任何3位数 | 邮编: 任何5位数
                  </p>
                </div>

                <div className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">需要验证</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleCopy("4000 0025 0000 3155", "auth_card")}
                    >
                      {copied["auth_card"] ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm">卡号: 4000 0025 0000 3155</p>
                  <p className="text-xs text-muted-foreground">需要3D Secure验证</p>
                </div>

                <div className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">支付失败</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleCopy("4000 0000 0000 0002", "decline_card")}
                    >
                      {copied["decline_card"] ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm">卡号: 4000 0000 0000 0002</p>
                  <p className="text-xs text-muted-foreground">模拟支付被拒绝</p>
                </div>
              </div>

              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <AlertTitle>测试流程</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>1. 在您的应用中，导航到VIP会员订阅页面</p>
                  <p>2. 选择一个会员方案并点击"订阅"按钮</p>
                  <p>3. 在Stripe结账页面，使用上述测试卡号</p>
                  <p>4. 完成支付流程，验证成功/失败处理</p>
                  <p>5. 检查Stripe仪表板中的支付记录</p>
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            返回
          </Button>
          <Link href="/env-check">
            <Button>检查环境变量</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
