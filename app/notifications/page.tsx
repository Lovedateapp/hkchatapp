"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VectorAvatar } from "@/components/vector-avatar"
import { Bell, MessageCircle, ThumbsUp, User, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// 創建一個全局狀態存儲通知已讀狀態
export const notificationState = {
  unreadCount: 0,
  markAllAsRead: () => {
    notificationState.unreadCount = 0
    // 如果有事件監聽器，可以在這裡觸發
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("notifications-updated"))
    }
  },
  updateUnreadCount: (count: number) => {
    notificationState.unreadCount = count
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("notifications-updated"))
    }
  },
}

export default function NotificationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)

      if (data.user) {
        // 獲取真實通知數據
        await fetchNotifications(data.user.id)
      }
    }

    getUser()
  }, [supabase])

  // 獲取用戶通知
  const fetchNotifications = async (userId: string) => {
    try {
      // 從數據庫獲取通知
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error

      // 如果沒有通知，使用空數組
      const notificationsData = data || []
      setNotifications(notificationsData)

      // 計算未讀通知數量
      const unreadCount = notificationsData.filter((n) => !n.read).length
      notificationState.updateUnreadCount(unreadCount)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      // 使用空數組
      setNotifications([])
      notificationState.updateUnreadCount(0)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      // 將所有通知標記為已讀
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (error) throw error

      // 更新本地通知狀態
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        read: true,
      }))

      setNotifications(updatedNotifications)

      // 更新全局通知狀態
      notificationState.markAllAsRead()

      toast({
        title: "已全部標為已讀",
        description: "所有通知已標為已讀",
      })
    } catch (error) {
      console.error("Error marking notifications as read:", error)
      toast({
        title: "操作失敗",
        description: "無法標記通知為已讀",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <ThumbsUp className="h-4 w-4" />
      case "comment":
        return <MessageCircle className="h-4 w-4" />
      case "follow":
        return <User className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      // 標記為已讀
      try {
        const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notification.id)

        if (error) throw error

        // 更新本地通知
        const updatedNotifications = notifications.map((n) => (n.id === notification.id ? { ...n, read: true } : n))

        setNotifications(updatedNotifications)

        // 更新未讀計數
        const newUnreadCount = notificationState.unreadCount - 1
        notificationState.updateUnreadCount(Math.max(0, newUnreadCount))
      } catch (error) {
        console.error("Error marking notification as read:", error)
      }
    }

    // 導航到相關內容
    if (notification.related_type === "post" && notification.related_id) {
      router.push(`/post/${notification.related_id}`)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>通知</CardTitle>
            <CardDescription>登入後即可查看通知</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground mb-4">請先登入以查看您的通知</p>
            <Button onClick={() => router.push("/login")}>登入</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>通知</CardTitle>
            <CardDescription>查看您的最新通知</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={notifications.every((n) => n.read)}>
            全部標為已讀
          </Button>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${notification.read ? "bg-background" : "bg-muted"}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <VectorAvatar seed={notification.sender_id || "system"} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {getNotificationIcon(notification.type)}
                        <p className="text-xs">{notification.content}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && <div className="h-2 w-2 rounded-full bg-primary"></div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-10">
              <p className="text-muted-foreground">暫無通知</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
