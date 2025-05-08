"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"

export default function InitViewCountPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInitViewCount = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/init-view-count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "初始化瀏覽量失敗")
      }

      setSuccess(true)
    } catch (err: any) {
      console.error("Error initializing view count:", err)
      setError(err.message || "初始化瀏覽量時出錯")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 pb-20">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>初始化帖子瀏覽量</CardTitle>
          <CardDescription>為所有現有帖子添加瀏覽量計數</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            此操作將為所有現有帖子添加瀏覽量計數。初始瀏覽量將基於點讚數和評論數進行估算。
          </p>
          {success && (
            <div className="bg-green-50 p-4 rounded-md flex items-center gap-2 text-green-700 mb-4">
              <CheckCircle className="h-5 w-5" />
              <span>瀏覽量初始化成功！</span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 p-4 rounded-md flex items-center gap-2 text-red-700 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleInitViewCount} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {loading ? "初始化中..." : "初始化瀏覽量"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
