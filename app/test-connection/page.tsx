"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle, Database, Table, Key } from "lucide-react"

export default function TestConnectionPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"pending" | "success" | "error">("pending")
  const [tablesStatus, setTablesStatus] = useState<Record<string, boolean>>({})
  const [functionsStatus, setFunctionsStatus] = useState<Record<string, boolean>>({})

  const expectedTables = ["users", "posts", "comments", "hk_lexicon", "check_ins", "reports", "admins"]
  const expectedFunctions = [
    "generate_hk_name",
    "generate_avatar_seed",
    "update_comment_count",
    "find_nearby_vip",
    "has_checked_in_today",
    "is_user_vip",
    "is_admin",
  ]

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    setConnectionStatus("pending")
    setTablesStatus({})
    setFunctionsStatus({})

    try {
      const supabase = createClient()

      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from("users")
        .select("count()", { count: "exact", head: true })

      if (connectionError) {
        throw new Error(`Connection error: ${connectionError.message}`)
      }

      setConnectionStatus("success")

      // Check tables
      const tableStatuses: Record<string, boolean> = {}

      for (const table of expectedTables) {
        try {
          const { error } = await supabase.from(table).select("count()", { count: "exact", head: true })
          tableStatuses[table] = !error
        } catch (e) {
          tableStatuses[table] = false
        }
      }

      setTablesStatus(tableStatuses)

      // Check functions (this is a bit trickier as we can't directly query functions)
      // We'll use a simple approach to check if they exist
      const functionStatuses: Record<string, boolean> = {}

      // For generate_hk_name
      try {
        const { data, error } = await supabase.rpc("generate_hk_name")
        functionStatuses["generate_hk_name"] = !error && data
      } catch (e) {
        functionStatuses["generate_hk_name"] = false
      }

      // For is_user_vip
      try {
        const { data: session } = await supabase.auth.getSession()
        if (session?.session?.user?.id) {
          const { data, error } = await supabase.rpc("is_user_vip", { user_uuid: session.session.user.id })
          functionStatuses["is_user_vip"] = !error
        } else {
          functionStatuses["is_user_vip"] = false
        }
      } catch (e) {
        functionStatuses["is_user_vip"] = false
      }

      // For is_admin
      try {
        const { data: session } = await supabase.auth.getSession()
        if (session?.session?.user?.id) {
          const { data, error } = await supabase.rpc("is_admin", { user_uuid: session.session.user.id })
          functionStatuses["is_admin"] = !error
        } else {
          functionStatuses["is_admin"] = false
        }
      } catch (e) {
        functionStatuses["is_admin"] = false
      }

      // For other functions, we'll just mark them as "unknown" for now
      for (const func of expectedFunctions) {
        if (!functionStatuses[func]) {
          functionStatuses[func] = false
        }
      }

      setFunctionsStatus(functionStatuses)
    } catch (e) {
      console.error("Connection test error:", e)
      setConnectionStatus("error")
      setError(e instanceof Error ? e.message : String(e))
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
            Supabase 連接測試
          </CardTitle>
          <CardDescription>測試與新 Supabase 數據庫的連接狀態</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">正在測試數據庫連接...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">數據庫連接</p>
                    <p className="text-sm text-muted-foreground">基本連接測試</p>
                  </div>
                </div>
                {connectionStatus === "success" ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : connectionStatus === "error" ? (
                  <XCircle className="h-6 w-6 text-red-500" />
                ) : (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                )}
              </div>

              {error && (
                <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {connectionStatus === "success" && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Table className="h-5 w-5" />
                      數據表狀態
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {expectedTables.map((table) => (
                        <div key={table} className="flex items-center justify-between p-3 border rounded-lg">
                          <p className="font-medium">{table}</p>
                          {tablesStatus[table] === undefined ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : tablesStatus[table] ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      函數狀態
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {expectedFunctions.map((func) => (
                        <div key={func} className="flex items-center justify-between p-3 border rounded-lg">
                          <p className="font-medium">{func}</p>
                          {functionsStatus[func] === undefined ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : functionsStatus[func] ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={testConnection} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                測試中...
              </>
            ) : (
              "重新測試連接"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
