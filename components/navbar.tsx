"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { PenSquare, User, Home, Menu, X, MessageCircle, Bell, MapPin } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { toast } from "@/components/ui/use-toast"
import { notificationState } from "@/app/notifications/page"
import { t } from "@/translations/common"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(notificationState.unreadCount)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [authError, setAuthError] = useState<string | null>(null)

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

    return () => {
      window.removeEventListener("notifications-updated", handleNotificationsUpdated)
      window.removeEventListener("unread-messages-updated", handleMessagesUpdated as EventListener)
    }
  }, [])

  // 獲取未讀消息計數
  const fetchUnreadMessagesCount = async () => {
    if (!user) return

    try {
      const supabase = createClient()
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

  useEffect(() => {
    // 创建一个新的 Supabase 客户端实例
    let isMounted = true
    const supabase = createClient()

    const getUser = async () => {
      try {
        setLoading(true)
        setAuthError(null)

        // 使用 getSession 而不是 getUser
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error fetching session:", error.message)
          if (isMounted) {
            setAuthError(error.message)
            setUser(null)
          }
        } else if (session) {
          if (isMounted) {
            setUser(session.user)
            // 獲取未讀消息計數
            fetchUnreadMessagesCount()
          }
        } else {
          // 没有会话，用户未登录
          if (isMounted) {
            setUser(null)
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err)
        if (isMounted) {
          setAuthError(err instanceof Error ? err.message : "Unknown error")
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getUser()

    // 设置认证状态变化监听器
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event)
      if (isMounted) {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchUnreadMessagesCount()
        } else {
          setUnreadMessages(0)
        }
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  // 在所有页面显示导航栏，包括登录和注册页面

  const isActive = (path: string) => pathname === path

  // 在navItems数组中添加附近功能
  const navItems = [
    { href: "/", label: t("latest"), icon: Home },
    { href: "/create-post", label: t("post"), icon: PenSquare },
    { href: "/nearby", label: t("nearby"), icon: MapPin },
    { href: "/messages", label: t("message"), icon: MessageCircle, badge: unreadMessages > 0 ? unreadMessages : null },
    {
      href: "/notifications",
      label: t("notification"),
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : null,
    },
  ]

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast({
        title: t("logout"),
        description: "您已成功登出",
      })
      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "登出失敗",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // If there's an auth error, still render the navbar but with a fallback state
  if (authError) {
    console.warn("Auth error in navbar:", authError)
    // Continue rendering with user as null
  }

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-transparent bg-clip-text">
              {t("welcome")}
            </span>
          </Link>
          <nav className="flex items-center space-x-2 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md transition-colors",
                  isActive(item.href)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
                {item.badge && (
                  <Badge className="ml-1 px-1 py-0 h-4 min-w-4 text-[10px] bg-primary">{item.badge}</Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">打開菜單</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
              <span className="font-bold text-lg bg-gradient-to-r from-pink-500 to-cyan-500 text-transparent bg-clip-text">
                {t("welcome")}
              </span>
            </Link>
            <div className="mt-6 flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center py-2 text-base",
                    isActive(item.href) ? "text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                  {item.badge && (
                    <Badge className="ml-2 px-1 py-0 h-4 min-w-4 text-[10px] bg-primary">{item.badge}</Badge>
                  )}
                </Link>
              ))}
              {user && (
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center py-2 text-base",
                    isActive("/profile") ? "text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  <User className="h-5 w-5 mr-3" />
                  {t("profile")}
                </Link>
              )}
              {user && (
                <Button
                  variant="ghost"
                  className="justify-start px-2 text-base font-normal text-muted-foreground"
                  onClick={handleSignOut}
                >
                  <X className="h-5 w-5 mr-3" />
                  {t("logout")}
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex items-center justify-end">
          {/* Hide language switcher */}
          <div className="hidden">
            <LanguageSwitcher />
          </div>
          <ThemeToggle />
          {!loading && (
            <>
              {user ? (
                <Link href="/profile" className="ml-2">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                      <span className="text-xs font-medium">{user.email?.charAt(0).toUpperCase() || "U"}</span>
                    </Avatar>
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center space-x-1">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      {t("login")}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">{t("register")}</Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
