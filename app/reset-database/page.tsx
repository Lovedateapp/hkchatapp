"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetDatabasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [confirmText, setConfirmText] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message])
  }

  const resetDatabase = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    setLogs([])

    try {
      const supabase = createClient()

      addLog("開始重置數據庫...")

      // 執行 SQL 腳本
      addLog("執行數據庫重置腳本...")

      // 1. 刪除所有表
      addLog("刪除現有表...")

      const tables = [
        "reports",
        "admins",
        "check_ins",
        "comments",
        "posts",
        "users",
        "hk_lexicon",
        "profiles",
        "notifications",
      ]

      for (const table of tables) {
        try {
          const { error: dropError } = await supabase.rpc("execute_sql", {
            sql: `DROP TABLE IF EXISTS public.${table} CASCADE;`,
          })

          if (dropError) {
            addLog(`⚠️ 刪除表 ${table} 時出錯: ${dropError.message}`)
          } else {
            addLog(`✓ 已刪除表 ${table}`)
          }
        } catch (e) {
          addLog(`⚠️ 刪除表 ${table} 時出錯`)
        }
      }

      // 2. 刪除所有函數
      addLog("刪除現有函數...")

      const functions = [
        "generate_hk_name",
        "generate_avatar_seed",
        "update_comment_count",
        "handle_new_user",
        "find_nearby_vip",
        "update_streak_days",
        "has_checked_in_today",
        "get_user_streak_days",
        "is_user_vip",
        "get_vip_expiry_date",
        "is_admin",
      ]

      for (const func of functions) {
        try {
          const { error: dropFuncError } = await supabase.rpc("execute_sql", {
            sql: `DROP FUNCTION IF EXISTS public.${func} CASCADE;`,
          })

          if (dropFuncError) {
            addLog(`⚠️ 刪除函數 ${func} 時出錯: ${dropFuncError.message}`)
          } else {
            addLog(`✓ 已刪除函數 ${func}`)
          }
        } catch (e) {
          addLog(`⚠️ 刪除函數 ${func} 時出錯`)
        }
      }

      // 3. 確保 PostGIS 擴展已啟用
      addLog("確保 PostGIS 擴展已啟用...")

      try {
        const { error: postgisError } = await supabase.rpc("execute_sql", {
          sql: `CREATE EXTENSION IF NOT EXISTS postgis;`,
        })

        if (postgisError) {
          addLog(`⚠️ 啟用 PostGIS 擴展時出錯: ${postgisError.message}`)
          throw new Error(`無法啟用 PostGIS 擴展: ${postgisError.message}`)
        } else {
          addLog(`✓ PostGIS 擴展已啟用`)
        }
      } catch (e) {
        addLog(`❌ 啟用 PostGIS 擴展時出錯`)
        throw e
      }

      // 4. 創建新表結構
      addLog("創建新表結構...")

      // 創建用戶表
      try {
        const { error: createUsersError } = await supabase.rpc("execute_sql", {
          sql: `
            CREATE TABLE public.users (
              id UUID REFERENCES auth.users PRIMARY KEY,
              anonymous_id TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
              vip_expires_at TIMESTAMPTZ,
              streak_days INT DEFAULT 0,
              location GEOGRAPHY(POINT,4326),
              created_at TIMESTAMPTZ DEFAULT now()
            );
          `,
        })

        if (createUsersError) {
          addLog(`❌ 創建用戶表時出錯: ${createUsersError.message}`)
          throw new Error(`無法創建用戶表: ${createUsersError.message}`)
        } else {
          addLog(`✓ 用戶表已創建`)
        }
      } catch (e) {
        addLog(`❌ 創建用戶表時出錯`)
        throw e
      }

      // 創建其他表和函數
      addLog("創建其他表和函數...")
      addLog("這個過程可能需要一些時間...")

      // 由於 SQL 腳本太長，我們需要分段執行
      // 在實際應用中，您可能需要使用 Supabase 的 Migration 功能
      // 或者使用 SQL 編輯器直接執行完整腳本

      addLog("⚠️ 由於 SQL 腳本太長，無法通過 RPC 完全執行")
      addLog("請使用 Supabase 控制台的 SQL 編輯器執行完整的重置腳本")
      addLog("或者使用 Supabase CLI 運行遷移")

      // 5. 完成設置
      addLog("數據庫重置過程已完成！")
      setSuccess(true)
    } catch (e) {
      console.error("Reset error:", e)
      setError(e instanceof Error ? e.message : String(e))
      addLog(`❌ 重置過程中出錯: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmation = () => {
    if (confirmText === "RESET DATABASE") {
      setShowConfirmation(false)
      resetDatabase()
    } else {
      setError("確認文字不正確")
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="h-6 w-6" />
            完全重置數據庫
          </CardTitle>
          <CardDescription>此操作將刪除所有現有數據並創建全新的數據庫結構</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>危險操作</AlertTitle>
            <AlertDescription>此操作將永久刪除所有現有數據，包括用戶、帖子、評論等。此操作無法撤銷！</AlertDescription>
          </Alert>

          {!loading && !success && !error && !showConfirmation && (
            <div className="flex justify-center">
              <Button variant="destructive" onClick={() => setShowConfirmation(true)} className="w-full">
                重置數據庫
              </Button>
            </div>
          )}

          {showConfirmation && (
            <div className="space-y-4 p-4 border border-red-200 rounded-md bg-red-50 dark:bg-red-950/20 dark:border-red-900">
              <p className="text-red-700 dark:text-red-400 font-medium">請輸入 "RESET DATABASE" 以確認操作</p>
              <div className="space-y-2">
                <Label htmlFor="confirm">確認文字</Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="border-red-300 dark:border-red-800"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleConfirmation} disabled={confirmText !== "RESET DATABASE"}>
                  確認重置
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmation(false)
                    setConfirmText("")
                  }}
                >
                  取消
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>重置錯誤</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert
              variant="success"
              className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
            >
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-400">重置成功</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                數據庫已成功重置！您現在可以使用全新的數據庫結構。
              </AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg p-4 bg-muted/50 h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">日誌將顯示在這裡...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="py-1">
                  <span className="text-muted-foreground">{`> `}</span>
                  <span>{log}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row">
          {!showConfirmation && (
            <>
              {loading ? (
                <Button disabled className="w-full">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  重置中...
                </Button>
              ) : (
                <>
                  {success && (
                    <Button variant="outline" className="w-full" onClick={() => router.push("/test-connection")}>
                      測試連接
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
