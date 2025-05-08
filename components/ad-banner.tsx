"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export function AdBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [isVip, setIsVip] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkVipStatus = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // 实际项目中，这里应该从数据库中获取用户的VIP状态
          setIsVip(false) // 默认非VIP
        }
      } catch (error) {
        console.error("Error checking VIP status:", error)
      } finally {
        setLoading(false)
      }
    }

    checkVipStatus()
  }, [supabase])

  if (dismissed || isVip || loading) {
    return null
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-pink-500/10 to-cyan-500/10 border-dashed">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6 rounded-full opacity-70 hover:opacity-100"
        onClick={() => setDismissed(true)}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">關閉廣告</span>
      </Button>
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          <span className="font-semibold">廣告位置</span> - 升級到VIP會員，享受無廣告體驗
        </p>
        <Link href="/profile?tab=vip">
          <Button variant="outline" size="sm">
            升級VIP
          </Button>
        </Link>
      </div>
    </Card>
  )
}
