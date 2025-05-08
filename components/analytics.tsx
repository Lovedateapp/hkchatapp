"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { Suspense } from "react"

function AnalyticsContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    try {
      // 这里可以添加您的分析代码，例如 Google Analytics
      const url = `${pathname}${searchParams ? `?${searchParams}` : ""}`
      console.log(`Page view: ${url}`)
    } catch (error) {
      console.error("Analytics error:", error)
    }
  }, [pathname, searchParams])

  return null
}

export function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  )
}
