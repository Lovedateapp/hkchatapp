"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, MapPin, PenSquare, MessageCircle, User, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { notificationState } from "@/app/notifications/page"
import { createClient } from "@/lib/supabase"

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const [unreadNotifications, setUnreadNotifications] = useState(notificationState.unreadCount)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    // 监听通知状态变化
    const handleNotificationsUpdated = () => {
      setUnreadNotifications(notificationState.unreadCount)
    }

    window.addEventListener("notifications-updated", handleNotificationsUpdated)

    // 監聽未讀消息計數變化
    const handleMessagesUpdated = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.count === "number") {
        setUnreadMessages(event.detail.count)
      } else {
        // 如果沒有提供計數，則刷新計數
        fetchUnreadMessagesCount()
      }
    }

    window.addEventListener("unread-messages-updated", handleMessagesUpdated as EventListener)

    // 初始化時獲取未讀消息計數
    fetchUnreadMessagesCount()

    return () => {
      window.removeEventListener("notifications-updated", handleNotificationsUpdated)
      window.removeEventListener("unread-messages-updated", handleMessagesUpdated as EventListener)
    }
  }, [])

  // 獲取未讀消息計數
  const fetchUnreadMessagesCount = async () => {
    try {
      const supabase = createClient()

      // 檢查用戶是否已登入
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("read", false)

      if (!error && count !== null) {
        setUnreadMessages(count)
      }
    } catch (error) {
      console.error("Error fetching unread messages count:", error)
    }
  }

  const isActive = (path: string) => pathname === path

  const navItems = [
    { href: "/", label: "首頁", icon: Home },
    { href: "/nearby", label: "附近", icon: MapPin },
    { href: "/create-post", label: "發布", icon: PenSquare },
    { href: "/messages", label: "私信", icon: MessageCircle, badge: unreadMessages > 0 ? unreadMessages : null },
    { href: "/profile", label: "我的", icon: User },
  ]

  // Add debug link if we're in a development environment or if there's a URL parameter
  const showDebug =
    typeof window !== "undefined" &&
    (window.location.search.includes("debug=true") ||
      window.location.hostname === "localhost" ||
      window.location.hostname.includes("vercel.app"))

  return (
    <div className={cn("w-full bg-background border-t fixed bottom-0 left-0 z-50", className)}>
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              isActive(item.href) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <div className="relative">
              <item.icon className="h-5 w-5 mb-1" />
              {item.badge && (
                <Badge className="absolute -top-2 -right-2 px-1 py-0 h-4 min-w-4 text-[10px] bg-primary">
                  {item.badge}
                </Badge>
              )}
            </div>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}

        {showDebug && (
          <Link
            href="/debug-loading"
            className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              isActive("/debug-loading") ? "text-primary" : "text-muted-foreground",
            )}
          >
            <div className="relative">
              <AlertCircle className="h-5 w-5 mb-1" />
            </div>
            <span className="text-xs">診斷</span>
          </Link>
        )}
      </div>
    </div>
  )
}
