"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

// 存储用户访问页面的计数和上次弹出广告的时间
interface AdState {
  pageVisits: number
  lastPopupTime: number
  popupCount: number
}

// 广告横幅组件 - 所有用户都会看到
export function AdMobBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full h-[90px] bg-muted rounded-md flex items-center justify-center ${className}`}>
      <p className="text-sm text-muted-foreground">AdMob 橫幅廣告</p>
    </div>
  )
}

// 弹出广告组件 - 所有用户都会看到
export function PopupAd() {
  const [showAd, setShowAd] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkAndShowAd = () => {
      try {
        // 从localStorage获取广告状态
        const storedState = localStorage.getItem("adState")
        const adState: AdState = storedState
          ? JSON.parse(storedState)
          : { pageVisits: 0, lastPopupTime: 0, popupCount: 0 }

        // 增加页面访问计数
        adState.pageVisits += 1

        const now = Date.now()
        const twoHoursInMs = 2 * 60 * 60 * 1000

        // 检查是否需要重置2小时计数器
        if (now - adState.lastPopupTime > twoHoursInMs) {
          adState.popupCount = 0
        }

        // 如果访问了5个页面且2小时内弹出次数少于2次，则显示广告
        if (adState.pageVisits >= 5 && adState.popupCount < 2) {
          setShowAd(true)
          adState.pageVisits = 0
          adState.lastPopupTime = now
          adState.popupCount += 1
        }

        // 保存状态
        localStorage.setItem("adState", JSON.stringify(adState))
      } catch (error) {
        console.error("Error checking ad state:", error)
      }
    }

    // 仅在客户端运行
    if (typeof window !== "undefined") {
      checkAndShowAd()
    }
  }, [pathname])

  if (!showAd) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">廣告</h3>
        <div className="h-[250px] bg-muted rounded-md flex items-center justify-center mb-4">
          <p className="text-muted-foreground">Google 彈出廣告</p>
        </div>
        <button className="w-full py-2 bg-primary text-primary-foreground rounded-md" onClick={() => setShowAd(false)}>
          關閉
        </button>
      </div>
    </div>
  )
}
