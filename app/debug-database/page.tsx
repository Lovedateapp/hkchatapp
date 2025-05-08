"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function DebugDatabase() {
  const [loading, setLoading] = useState(true)
  const [tables, setTables] = useState<any[]>([])
  const [sqlQuery, setSqlQuery] = useState("")
  const [queryResult, setQueryResult] = useState<any>(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<{ [key: string]: boolean }>({})
  const supabase = createClient()

  // 檢查數據庫表
  useEffect(() => {
    const checkDatabase = async () => {
      setLoading(true)
      const status: { [key: string]: boolean } = {}

      try {
        // 檢查 users 表
        const { error: usersError } = await supabase.from("users").select("count").limit(1)
        status.users = !usersError

        // 檢查 posts 表
        const { error: postsError } = await supabase.from("posts").select("count").limit(1)
        status.posts = !postsError

        // 檢查 comments 表
        const { error: commentsError } = await supabase.from("comments").select("count").limit(1)
        status.comments = !commentsError

        // 檢查 notifications 表
        const { error: notificationsError } = await supabase.from("notifications").select("count").limit(1)
        status.notifications = !notificationsError

        // 檢查 reports 表
        const { error: reportsError } = await supabase.from("reports").select("count").limit(1)
        status.reports = !reportsError

        // 檢查 check_ins 表
        const { error: checkInsError } = await supabase.from("check_ins").select("count").limit(1)
        status.check_ins = !checkInsError

        setDbStatus(status)

        // 獲取所有表
        const { data, error } = await supabase.rpc("get_tables")
        if (!error && data) {
          setTables(data)
        }
      } catch (error) {
        console.error("Error checking database:", error)
      } finally {
        setLoading(false)
      }
    }

    checkDatabase()
  }, [supabase])

  // 執行 SQL 查詢
  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "請輸入 SQL 查詢",
        variant: "destructive",
      })
      return
    }

    setQueryLoading(true)
    try {
      const { data, error } = await supabase.rpc("execute_sql", { sql_query: sqlQuery })

      if (error) throw error

      setQueryResult(data)
      toast({
        title: "查詢執行成功",
      })
    } catch (error: any) {
      console.error("SQL query error:", error)
      setQueryResult({ error: error.message || "查詢執行失敗" })
      toast({
        title: "查詢執行失敗",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setQueryLoading(false)
    }
  }

  // 執行修復腳本
  const runFixScript = async () => {
    setQueryLoading(true)
    try {
      // 從文件中獲取 SQL 腳本
      const response = await fetch("/api/get-fix-script")
      if (!response.ok) {
        throw new Error("無法獲取修復腳本")
      }

      const { script } = await response.json()

      // 執行腳本
      const { data, error } = await supabase.rpc("execute_sql", { sql_query: script })

      if (error) throw error

      toast({
        title: "數據庫修復成功",
        description: "所有表和列已更新",
      })

      // 重新加載頁面以顯示更新後的狀態
      window.location.reload()
    } catch (error: any) {
      console.error("Fix script error:", error)
      toast({
        title: "修復失敗",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setQueryLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">數據庫診斷工具</CardTitle>
          <CardDescription>檢查和修復數據庫問題</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(dbStatus).map(([table, exists]) => (
              <Card key={table} className={exists ? "border-green-200" : "border-red-200"}>
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base capitalize">{table.replace("_", " ")}</CardTitle>
                    {exists ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm text-muted-foreground">{exists ? "表存在且可訪問" : "表不存在或無法訪問"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={runFixScript} disabled={queryLoading} className="w-full">
            {queryLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                修復中...
              </>
            ) : (
              "修復數據庫結構"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="query">
        <TabsList className="mb-4">
          <TabsTrigger value="query">SQL 查詢</TabsTrigger>
          <TabsTrigger value="tables">數據表</TabsTrigger>
        </TabsList>

        <TabsContent value="query">
          <Card>
            <CardHeader>
              <CardTitle>執行 SQL 查詢</CardTitle>
              <CardDescription>輸入 SQL 查詢來檢查或修改數據庫</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="SELECT * FROM users LIMIT 10;"
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="font-mono min-h-[200px]"
              />

              {queryResult && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">查詢結果</h3>
                  <div className="bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
                    <pre className="text-sm font-mono">
                      {queryResult.error ? (
                        <span className="text-red-500">{queryResult.error}</span>
                      ) : (
                        JSON.stringify(queryResult, null, 2)
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={executeQuery} disabled={queryLoading}>
                {queryLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    執行中...
                  </>
                ) : (
                  "執行查詢"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>數據表列表</CardTitle>
              <CardDescription>所有可用的數據表</CardDescription>
            </CardHeader>
            <CardContent>
              {tables.length > 0 ? (
                <div className="grid gap-2">
                  {tables.map((table, index) => (
                    <div key={index} className="p-3 bg-muted rounded-md">
                      <p className="font-medium">{table.table_name}</p>
                      <p className="text-sm text-muted-foreground">Schema: {table.table_schema}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">無法獲取表列表</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 text-center">
        <Link href="/">
          <Button variant="outline">返回首頁</Button>
        </Link>
      </div>
    </div>
  )
}
