"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 在開發環境中記錄錯誤到控制台
    console.error(error)
  }, [error])

  return (
    <div className="container flex items-center justify-center min-h-[80vh] px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle>發生錯誤</CardTitle>
          </div>
          <CardDescription>應用程序遇到了一個問題</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            很抱歉，應用程序遇到了一個意外錯誤。我們已經記錄了這個問題，並正在努力解決。
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="bg-red-50 p-3 rounded-md border border-red-100 text-xs font-mono overflow-auto max-h-32">
              {error.message}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            返回首頁
          </Button>
          <Button
            onClick={() => {
              if (typeof reset === "function") {
                reset()
              } else {
                window.location.reload()
              }
            }}
          >
            重試
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
