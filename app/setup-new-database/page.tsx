"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Database, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export default function SetupNewDatabasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message])
  }

  const setupDatabase = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    setLogs([])

    try {
      const supabase = createClient()

      addLog("開始設置數據庫...")

      // 1. 檢查 PostGIS 擴展
      addLog("檢查 PostGIS 擴展...")
      const { error: postgisError } = await supabase.rpc("check_postgis_extension")

      if (postgisError) {
        addLog("⚠️ PostGIS 擴展可能未啟用，嘗試創建...")
        // 我們無法直接從客戶端創建擴展，但可以嘗試運行 SQL 查詢
        // 這可能需要管理員權限
        const { error: createExtError } = await supabase.rpc("create_postgis_extension")
        if (createExtError) {
          addLog("❌ 無法創建 PostGIS 擴展。請在 Supabase 控制台中手動啟用。")
          throw new Error("無法創建 PostGIS 擴展：" + createExtError.message)
        } else {
          addLog("✅ PostGIS 擴展已啟用")
        }
      } else {
        addLog("✅ PostGIS 擴展已啟用")
      }

      // 2. 創建基本表結構
      addLog("創建基本表結構...")

      // 檢查 users 表是否存在
      const { data: usersTableExists, error: usersCheckError } = await supabase
        .from("users")
        .select("count(*)", { count: "exact", head: true })

      if (usersCheckError) {
        addLog("創建 users 表...")
        // 表不存在，創建它
        const { error: createUsersError } = await supabase.rpc("create_users_table")
        if (createUsersError) {
          addLog("❌ 無法創建 users 表")
          throw new Error("無法創建 users 表：" + createUsersError.message)
        } else {
          addLog("✅ users 表已創建")
        }
      } else {
        addLog("✅ users 表已存在")
      }

      // 檢查 posts 表是否存在
      const { data: postsTableExists, error: postsCheckError } = await supabase
        .from("posts")
        .select("count(*)", { count: "exact", head: true })

      if (postsCheckError) {
        addLog("創建 posts 表...")
        // 表不存在，創建它
        const { error: createPostsError } = await supabase.rpc("create_posts_table")
        if (createPostsError) {
          addLog("❌ 無法創建 posts 表")
          throw new Error("無法創建 posts 表：" + createPostsError.message)
        } else {
          addLog("✅ posts 表已創建")
        }
      } else {
        addLog("✅ posts 表已存在")
      }

      // 檢查其他表...
      // 這裡可以繼續檢查其他表

      // 3. 創建詞庫
      addLog("檢查詞庫...")
      const { data: lexiconCount, error: lexiconCheckError } = await supabase
        .from("hk_lexicon")
        .select("count(*)", { count: "exact", head: true })

      if (!lexiconCheckError && (!lexiconCount || lexiconCount.count === 0)) {
        addLog("詞庫為空，填充詞庫數據...")
        const { error: fillLexiconError } = await supabase.rpc("fill_lexicon_data")
        if (fillLexiconError) {
          addLog("⚠️ 填充詞庫時出錯，但將繼續設置")
          console.error("填充詞庫錯誤:", fillLexiconError)
        } else {
          addLog("✅ 詞庫已填充")
        }
      } else if (!lexiconCheckError) {
        addLog(`✅ 詞庫已存在，包含 ${lexiconCount.count} 條記錄`)
      }

      // 4. 檢查函數
      addLog("檢查數據庫函數...")

      // 檢查 generate_hk_name 函數
      const { data: nameGenResult, error: nameGenError } = await supabase.rpc("generate_hk_name")

      if (nameGenError) {
        addLog("❌ generate_hk_name 函數不可用")
        console.error("函數錯誤:", nameGenError)
      } else {
        addLog(`✅ generate_hk_name 函數正常，生成的名稱: ${nameGenResult}`)
      }

      // 5. 創建測試用戶（如果需要）
      const { data: userCount, error: userCountError } = await supabase
        .from("users")
        .select("count(*)", { count: "exact", head: true })

      if (!userCountError && (!userCount || userCount.count === 0)) {
        addLog("數據庫中沒有用戶，您可能需要註冊一個新用戶")
      } else if (!userCountError) {
        addLog(`✅ 數據庫中已有 ${userCount.count} 個用戶`)
      }

      // 6. 完成設置
      addLog("數據庫設置完成！")
      setSuccess(true)
    } catch (e) {
      console.error("Setup error:", e)
      setError(e instanceof Error ? e.message : String(e))
      addLog(`❌ 設置過程中出錯: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            設置新 Supabase 數據庫
          </CardTitle>
          <CardDescription>此頁面將幫助您設置新的 Supabase 數據庫結構</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!loading && !success && !error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>重要提示</AlertTitle>
              <AlertDescription>
                此操作將嘗試在您的新 Supabase 項目中設置所需的表和函數。請確保您已經創建了一個新的 Supabase
                項目，並更新了環境變量。
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>設置錯誤</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert
              variant="success"
              className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
            >
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-400">設置成功</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                數據庫已成功設置！您現在可以使用應用程序了。
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
          <Button onClick={setupDatabase} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                設置中...
              </>
            ) : (
              "開始設置數據庫"
            )}
          </Button>

          {success && (
            <Button variant="outline" className="w-full" onClick={() => router.push("/test-connection")}>
              測試連接
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
