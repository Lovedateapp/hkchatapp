import { createClient } from "@/lib/supabase"

// 检查浏览器是否支持推送通知
export function isPushNotificationSupported() {
  return "serviceWorker" in navigator && "PushManager" in window
}

// 请求通知权限
export async function requestNotificationPermission() {
  if (!isPushNotificationSupported()) {
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  } catch (error) {
    console.error("Error requesting notification permission:", error)
    return false
  }
}

// 注册服务工作线程
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.error("瀏覽器不支持 Service Worker")
    return false
  }

  try {
    // 使用絕對路徑註冊 service worker
    const registration = await navigator.serviceWorker.register("/service-worker.js", {
      scope: "/",
    })

    console.log("Service Worker 註冊成功:", registration)
    return registration
  } catch (error) {
    console.error("註冊 Service Worker 失敗:", error)
    return false
  }
}

// 订阅推送通知
export async function subscribeToPushNotifications(userId: string) {
  if (!isPushNotificationSupported()) {
    return null
  }

  try {
    const permission = await requestNotificationPermission()
    if (!permission) {
      return null
    }

    const registration = await registerServiceWorker()
    if (!registration) {
      return null
    }

    // 获取现有订阅或创建新订阅
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // 从服务器获取VAPID公钥
      const vapidPublicKey = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"

      // 将base64字符串转换为Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

      // 创建新订阅
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      })
    }

    // 将订阅信息保存到Supabase
    await saveSubscription(userId, subscription)

    return subscription
  } catch (error) {
    console.error("Error subscribing to push notifications:", error)
    return null
  }
}

// 将订阅信息保存到Supabase
async function saveSubscription(userId: string, subscription: PushSubscription) {
  const supabase = createClient()

  try {
    // 检查是否已存在订阅
    const { data, error } = await supabase.from("push_subscriptions").select("*").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    if (data) {
      // 更新现有订阅
      await supabase
        .from("push_subscriptions")
        .update({
          subscription: JSON.stringify(subscription),
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
    } else {
      // 创建新订阅
      await supabase.from("push_subscriptions").insert({
        user_id: userId,
        subscription: JSON.stringify(subscription),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error saving subscription to Supabase:", error)
  }
}

// 取消订阅推送通知
export async function unsubscribeFromPushNotifications(userId: string) {
  if (!isPushNotificationSupported()) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()

      // 从Supabase删除订阅
      const supabase = createClient()
      await supabase.from("push_subscriptions").delete().eq("user_id", userId)

      return true
    }

    return false
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error)
    return false
  }
}

// 发送推送通知
export async function sendPushNotification(userId: string, title: string, body: string, data: any = {}) {
  try {
    // 在实际应用中，这应该是一个服务器端函数
    // 这里我们模拟客户端调用
    const response = await fetch("/api/send-push-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        notification: {
          title,
          body,
          data,
        },
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to send push notification")
    }

    return true
  } catch (error) {
    console.error("Error sending push notification:", error)
    return false
  }
}

// 辅助函数：将base64字符串转换为Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
