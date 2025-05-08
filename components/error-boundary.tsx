"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [errorInfo, setErrorInfo] = useState<string>("")

  useEffect(() => {
    // 捕获全局错误
    const errorHandler = (event: ErrorEvent) => {
      console.error("Caught global error:", event)
      setHasError(true)
      setError(event.error || new Error(event.message))
      setErrorInfo(event.message || "未知错误")
    }

    // 捕获未处理的Promise错误
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error("Caught unhandled rejection:", event)
      setHasError(true)
      setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)))
      setErrorInfo(String(event.reason) || "未处理的Promise错误")
    }

    window.addEventListener("error", errorHandler)
    window.addEventListener("unhandledrejection", rejectionHandler)

    return () => {
      window.removeEventListener("error", errorHandler)
      window.removeEventListener("unhandledrejection", rejectionHandler)
    }
  }, [])

  if (hasError) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl text-center">出現錯誤</CardTitle>
            <CardDescription className="text-center">應用程序遇到了一個問題</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-[200px] text-sm">
              <p className="font-mono">{error?.toString() || errorInfo || "未知錯誤"}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.reload()}>重新加載頁面</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
