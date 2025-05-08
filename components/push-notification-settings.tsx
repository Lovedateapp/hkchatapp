"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  isPushNotificationSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/push-notifications"

interface PushNotificationSettingsProps {
  userId: string
}

export function PushNotificationSettings({ userId }: PushNotificationSettingsProps) {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const checkNotificationStatus = async () => {
      // 检查浏览器是否支持推送通知
      const isSupported = isPushNotificationSupported()
      setSupported(isSupported)

      if (isSupported) {
        // 检查通知权限
        const permission = Notification.permission

        // 检查是否已订阅
        if (permission === "granted") {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          setEnabled(!!subscription)
        }
      }

      setLoading(false)
    }

    checkNotificationStatus()
  }, [])

  const handleToggle = async (checked: boolean) => {
    if (!supported) return

    setUpdating(true)

    try {
      if (checked) {
        // 启用推送通知
        const subscription = await subscribeToPushNotifications(userId)

        if (subscription) {
          setEnabled(true)
          toast({
            title: "推送通知已啟用",
            description: "您將收到新消息和通知的推送提醒",
          })
        } else {
          toast({
            title: "無法啟用推送通知",
            description: "請確保您已授予通知權限",
            variant: "destructive",
          })
        }
      } else {
        // 禁用推送通知
        const success = await unsubscribeFromPushNotifications(userId)

        if (success) {
          setEnabled(false)
          toast({
            title: "推送通知已禁用",
            description: "您將不再收到推送通知",
          })
        } else {
          toast({
            title: "無法禁用推送通知",
            description: "請稍後再試",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error toggling push notifications:", error)
      toast({
        title: "操作失敗",
        description: "更改推送通知設置時出錯",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>推送通知</CardTitle>
          <CardDescription>接收重要更新和消息的通知</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <BellOff className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">推送通知不可用</p>
                <p className="text-sm text-muted-foreground">您的瀏覽器不支持推送通知</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>推送通知</CardTitle>
        <CardDescription>接收重要更新和消息的通知</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">所有通知</p>
              <p className="text-sm text-muted-foreground">接收所有通知的推送提醒</p>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={updating}
            aria-label="Toggle all notifications"
          />
        </div>

        {enabled && (
          <>
            <div className="flex items-center justify-between py-2 pl-7">
              <div>
                <p className="font-medium">私信通知</p>
                <p className="text-sm text-muted-foreground">當您收到新私信時收到通知</p>
              </div>
              <Switch defaultChecked aria-label="Toggle message notifications" />
            </div>

            <div className="flex items-center justify-between py-2 pl-7">
              <div>
                <p className="font-medium">互動通知</p>
                <p className="text-sm text-muted-foreground">當有人對您的貼文點讚或評論時收到通知</p>
              </div>
              <Switch defaultChecked aria-label="Toggle interaction notifications" />
            </div>

            <div className="flex items-center justify-between py-2 pl-7">
              <div>
                <p className="font-medium">提醒通知</p>
                <p className="text-sm text-muted-foreground">當您7天未登錄時收到提醒</p>
              </div>
              <Switch defaultChecked aria-label="Toggle reminder notifications" />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">您可以隨時在瀏覽器設置中更改通知權限</CardFooter>
    </Card>
  )
}
