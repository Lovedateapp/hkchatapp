import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import webpush from "web-push"

// 配置Web Push
// 注意：在实际应用中，这些密钥应该存储在环境变量中
const vapidKeys = {
  publicKey: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U",
  privateKey: "UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTWKs-ls",
}

webpush.setVapidDetails("mailto:example@yourdomain.com", vapidKeys.publicKey, vapidKeys.privateKey)

export async function POST(request: Request) {
  try {
    const { userId, notification } = await request.json()

    if (!userId || !notification) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // 从Supabase获取用户的推送订阅
    const supabase = createClient()
    const { data, error } = await supabase.from("push_subscriptions").select("subscription").eq("user_id", userId)

    if (error) {
      console.error("Error fetching subscriptions:", error)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No subscription found for user" }, { status: 404 })
    }

    // 发送推送通知
    const results = await Promise.allSettled(
      data.map(async (item) => {
        const subscription = JSON.parse(item.subscription)
        return webpush.sendNotification(subscription, JSON.stringify(notification))
      }),
    )

    // 检查结果
    const successful = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    return NextResponse.json({
      success: true,
      sent: successful,
      failed: failed,
    })
  } catch (error: any) {
    console.error("Error sending push notification:", error)
    return NextResponse.json({ error: error.message || "Failed to send push notification" }, { status: 500 })
  }
}
