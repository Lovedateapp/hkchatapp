import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import webpush from "web-push"

// 配置Web Push
const vapidKeys = {
  publicKey: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U",
  privateKey: "UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTWKs-ls",
}

webpush.setVapidDetails("mailto:example@yourdomain.com", vapidKeys.publicKey, vapidKeys.privateKey)

// 此API路由应该由定时任务触发，例如使用Vercel Cron Jobs
export async function GET() {
  try {
    const supabase = createClient()

    // 获取7天未登录的用户
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: inactiveUsers, error } = await supabase
      .from("user_activity")
      .select("user_id, last_active")
      .lt("last_active", sevenDaysAgo.toISOString())

    if (error) {
      console.error("Error fetching inactive users:", error)
      return NextResponse.json({ error: "Failed to fetch inactive users" }, { status: 500 })
    }

    if (!inactiveUsers || inactiveUsers.length === 0) {
      return NextResponse.json({ message: "No inactive users found" })
    }

    // 获取这些用户的推送订阅
    const userIds = inactiveUsers.map((user) => user.user_id)

    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id, subscription")
      .in("user_id", userIds)

    if (subError) {
      console.error("Error fetching subscriptions:", subError)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: "No subscriptions found for inactive users" })
    }

    // 发送提醒通知
    const results = await Promise.allSettled(
      subscriptions.map(async (item) => {
        const subscription = JSON.parse(item.subscription)
        const notification = {
          title: "好久不見！",
          body: "我們想念您！回來看看有什麼新鮮事吧",
          data: {
            type: "reminder",
            url: "/",
          },
        }

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
    console.error("Error checking inactive users:", error)
    return NextResponse.json({ error: error.message || "Failed to check inactive users" }, { status: 500 })
  }
}
