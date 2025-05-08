"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle } from "lucide-react"

export default function FixVipStatusPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFixVipStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/fix-vip-status")
      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        toast({
          title: "成功",
          description: "VIP 狀態已成功修復",
        })
      } else {
        setError(data.message || "修復 VIP 狀態失敗")
        toast({
          title: "失敗",
          description: "修復 VIP 狀態失敗",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("修復 VIP 狀態時出錯:", err)
      setError("修復 VIP 狀態時出錯")
      toast({
        title: "錯誤",
        description: "修復 VIP 狀態時出錯",
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
          <CardTitle>修復 VIP 狀態</CardTitle>
          <CardDescription>此工具將修復所有用戶的 VIP 狀態</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">此工具將執行以下操作：</p>
          <ul className="text-sm space-y-2 mb-4">
            <li>• 確保 vip_expires_at 欄位存在</li>
            <li>• 根據 vip_expires_at 更新 is_vip 欄位</li>
            <li>• 確保 vip_expires_at 欄位存在</li>
            <li>• 根據 vip_expires_at 更新 is_vip 欄位</li>
            <li>• 同步 vip_until 和 vip_expires_at 欄位</li>
          </ul>
          {success && (
            <div className="bg-green-50 p-3 rounded-md border border-green-100 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-700">VIP 狀態已成功修復</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 p-3 rounded-md border border-red-100">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleFixVipStatus} disabled={loading || success}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                修復中...
              </>
            ) : success ? (
              "已修復"
            ) : (
              "修復 VIP 狀態"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
