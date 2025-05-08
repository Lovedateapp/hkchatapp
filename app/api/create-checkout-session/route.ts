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
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment?status=success&plan=${priceId === "price_monthly_vip" ? "monthly" : "yearly"}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment?status=error`,
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    })

    return NextResponse.json({ sessionId: checkoutSession.id })
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 })
  }
}
