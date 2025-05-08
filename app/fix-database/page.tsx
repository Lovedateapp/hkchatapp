"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Database, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function FixDatabasePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleFixDatabase = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/fix-database")
      const data = await response.json()

      setResult(data)

      if (data.success) {
        toast({
          title: "修復成功",
          description: data.message,
        })
      } else {
        toast({
          title: "修復失敗",
          description: data.error || "未知錯誤",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "修復過程中發生錯誤",
      })

      toast({
        title: "修復失敗",
        description: error.message || "修復過程中發生錯誤",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            數據庫修復工具
          </CardTitle>
          <CardDescription>此工具將修復數據庫結構問題，包括缺失的表和列</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">點擊下方按鈕開始修復數據庫。此過程將：</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5 mb-4">
            <li>檢查並創建缺失的表</li>
            <li>添加缺失的列</li>
            <li>創建必要的函數和觸發器</li>
            <li>為現有用戶創建記錄</li>
          </ul>

          {result && (
            <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle>{result.success ? "修復成功" : "修復失敗"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleFixDatabase} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                修復中...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                修復數據庫
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
