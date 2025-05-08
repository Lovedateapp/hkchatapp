"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function DebugLoading() {
  const [checking, setChecking] = useState(true)
  const [results, setResults] = useState<{
    supabaseConnection: boolean
    authSession: boolean
    postsTable: boolean
    usersTable: boolean
    profilesTable: boolean
    error?: string
  }>({
    supabaseConnection: false,
    authSession: false,
    postsTable: false,
    usersTable: false,
    profilesTable: false,
  })

  useEffect(() => {
    const runDiagnostics = async () => {
      setChecking(true)
      const diagnosticResults = {
        supabaseConnection: false,
        authSession: false,
        postsTable: false,
        usersTable: false,
        profilesTable: false,
        error: undefined as string | undefined,
      }

      try {
        // Test Supabase connection
        const supabase = createClient()
        diagnosticResults.supabaseConnection = true

        // Test auth session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        diagnosticResults.authSession = !sessionError

        // Test posts table
        const { error: postsError } = await supabase.from("posts").select("count").limit(1)
        diagnosticResults.postsTable = !postsError

        // Test users table
        const { error: usersError } = await supabase.from("users").select("count").limit(1)
        diagnosticResults.usersTable = !usersError

        // We don't have a profiles table in our schema, so let's check for admins table instead
        const { error: adminsError } = await supabase.from("admins").select("count").limit(1)
        diagnosticResults.profilesTable = !adminsError
      } catch (error) {
        diagnosticResults.error = error instanceof Error ? error.message : "Unknown error occurred"
      } finally {
        setResults(diagnosticResults)
        setChecking(false)
      }
    }

    runDiagnostics()
  }, [])

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl text-center">應用程序診斷</CardTitle>
          <CardDescription className="text-center">檢查應用程序的各個組件是否正常工作</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checking ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span>Supabase 連接</span>
                </div>
                <div className="flex items-center">
                  {results.supabaseConnection ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span>{results.supabaseConnection ? "正常" : "失敗"}</span>
                </div>

                <div className="flex items-center">
                  <span>認證會話</span>
                </div>
                <div className="flex items-center">
                  {results.authSession ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span>{results.authSession ? "正常" : "失敗"}</span>
                </div>

                <div className="flex items-center">
                  <span>帖子表</span>
                </div>
                <div className="flex items-center">
                  {results.postsTable ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span>{results.postsTable ? "正常" : "不存在或無法訪問"}</span>
                </div>

                <div className="flex items-center">
                  <span>用戶表</span>
                </div>
                <div className="flex items-center">
                  {results.usersTable ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span>{results.usersTable ? "正常" : "不存在或無法訪問"}</span>
                </div>

                <div className="flex items-center">
                  <span>管理員表</span>
                </div>
                <div className="flex items-center">
                  {results.profilesTable ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span>{results.profilesTable ? "正常" : "不存在或無法訪問"}</span>
                </div>
              </div>

              {results.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                  <p className="text-red-800 font-medium">錯誤信息：</p>
                  <p className="text-red-600 text-sm mt-1">{results.error}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
                <p className="text-blue-800">診斷結果：</p>
                <p className="text-blue-600 text-sm mt-1">
                  {results.supabaseConnection &&
                  results.authSession &&
                  results.postsTable &&
                  results.usersTable &&
                  results.profilesTable
                    ? "所有組件都正常工作。如果您仍然遇到問題，請嘗試清除瀏覽器緩存或使用隱私模式。"
                    : "檢測到一些問題。請確保您的 Supabase 環境變量正確設置，並且數據庫表已正確創建。"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button onClick={handleRetry} disabled={checking}>
            {checking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                檢查中...
              </>
            ) : (
              "重新檢查"
            )}
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            返回首頁
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
