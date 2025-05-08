"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import Link from "next/link"

interface StatusItem {
  name: string
  status: "checking" | "success" | "error" | "warning"
  message?: string
}

export default function DatabaseStatusPage() {
  const [statuses, setStatuses] = useState<StatusItem[]>([
    { name: "連接到 Supabase", status: "checking" },
    { name: "execute_sql 函數", status: "checking" },
    { name: "users 表", status: "checking" },
    { name: "reports 表", status: "checking" },
    { name: "create_report 函數", status: "checking" },
    { name: "create_user_record 函數", status: "checking" },
  ])
  const [isChecking, setIsChecking] = useState(true)

  const checkDatabaseStatus = async () => {
    setIsChecking(true)
    const supabase = createClient()
    const newStatuses = [...statuses]

    // 檢查 Supabase 連接
    try {
      const { data, error } = await supabase.from("users").select("count").limit(1)
      if (error) throw error
      newStatuses[0] = { name: "連接到 Supabase", status: "success" }
    } catch (error) {
      console.error("Supabase connection error:", error)
      newStatuses[0] = {
        name: "連接到 Supabase",
        status: "error",
        message: error instanceof Error ? error.message : "連接失敗",
      }
    }

    // 檢查 execute_sql 函數
    try {
      const { data, error } = await supabase.rpc("check_function_exists", { function_name: "execute_sql" })
      if (error) throw error

      if (data === true) {
        newStatuses[1] = { name: "execute_sql 函數", status: "success" }
      } else {
        newStatuses[1] = {
          name: "execute_sql 函數",
          status: "warning",
          message: "函數不存在，需要創建",
        }
      }
    } catch (error) {
      console.error("Check execute_sql function error:", error)
      newStatuses[1] = {
        name: "execute_sql 函數",
        status: "error",
        message: error instanceof Error ? error.message : "檢查失敗",
      }
    }

    // 檢查 users 表
    try {
      const { data, error } = await supabase.from("users").select("count")
      if (error) throw error
      newStatuses[2] = { name: "users 表", status: "success" }
    } catch (error) {
      console.error("Check users table error:", error)
      newStatuses[2] = {
        name: "users 表",
        status: "error",
        message: error instanceof Error ? error.message : "表不存在或無法訪問",
      }
    }

    // 檢查 reports 表
    try {
      const { data, error } = await supabase.from("reports").select("count")
      if (error) throw error
      newStatuses[3] = { name: "reports 表", status: "success" }
    } catch (error) {
      console.error("Check reports table error:", error)
      newStatuses[3] = {
        name: "reports 表",
        status: "error",
        message: error instanceof Error ? error.message : "表不存在或無法訪問",
      }
    }

    // 檢查 create_report 函數
    try {
      const { data, error } = await supabase.rpc("check_function_exists", { function_name: "create_report" })
      if (error) throw error

      if (data === true) {
        newStatuses[4] = { name: "create_report 函數", status: "success" }
      } else {
        newStatuses[4] = {
          name: "create_report 函數",
          status: "warning",
          message: "函數不存在，需要創建",
        }
      }
    } catch (error) {
      console.error("Check create_report function error:", error)
      newStatuses[4] = {
        name: "create_report 函數",
        status: "error",
        message: error instanceof Error ? error.message : "檢查失敗",
      }
    }

    // 檢查 create_user_record 函數
    try {
      const { data, error } = await supabase.rpc("check_function_exists", { function_name: "create_user_record" })
      if (error) throw error

      if (data === true) {
        newStatuses[5] = { name: "create_user_record 函數", status: "success" }
      } else {
        newStatuses[5] = {
          name: "create_user_record 函數",
          status: "warning",
          message: "函數不存在，需要創建",
        }
      }
    } catch (error) {
      console.error("Check create_user_record function error:", error)
      newStatuses[5] = {
        name: "create_user_record 函數",
        status: "error",
        message: error instanceof Error ? error.message : "檢查失敗",
      }
    }

    setStatuses(newStatuses)
    setIsChecking(false)
  }

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "checking":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      default:
        return null
    }
  }

  const fixDatabase = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/init-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (result.success) {
        // 等待一下，確保數據庫更改生效
        await new Promise((resolve) => setTimeout(resolve, 2000))
        // 重新檢查狀態
        await checkDatabaseStatus()
      } else {
        throw new Error(result.error || "修復失敗")
      }
    } catch (error) {
      console.error("Fix database error:", error)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">數據庫狀態檢查</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>數據庫組件狀態</CardTitle>
          <CardDescription>檢查應用程序所需的數據庫組件是否正確配置</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statuses.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  {getStatusIcon(item.status)}
                  <span>{item.name}</span>
                </div>
                {item.message && <span className="text-sm text-muted-foreground">{item.message}</span>}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={checkDatabaseStatus}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            重新檢查
          </Button>

          <Button
            onClick={fixDatabase}
            disabled={isChecking || statuses.every((s) => s.status === "success")}
            className="flex items-center gap-2"
          >
            {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            修復數據庫問題
          </Button>
        </CardFooter>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>常見問題</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>註冊失敗</AlertTitle>
              <AlertDescription>
                如果註冊過程中出現錯誤，可能是因為數據庫函數或表格缺失。使用上面的「修復數據庫問題」按鈕嘗試解決。
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertTitle>舉報功能失敗</AlertTitle>
              <AlertDescription>
                如果舉報功能無法使用，可能是因為 reports 表缺少必要的列。使用上面的「修復數據庫問題」按鈕嘗試解決。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>其他工具</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <h3 className="font-medium">電子郵件問題</h3>
              <p className="text-sm text-muted-foreground">
                如果您在接收密碼重置電子郵件時遇到問題，請查看我們的電子郵件設置指南。
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/email-setup-guide">查看電子郵件設置指南</Link>
              </Button>
            </div>

            <div className="grid gap-2">
              <h3 className="font-medium">完整數據庫重置</h3>
              <p className="text-sm text-muted-foreground">如果您需要完全重置數據庫，請使用我們的數據庫重置工具。</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/reset-database">數據庫重置工具</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Button asChild>
          <Link href="/">返回首頁</Link>
        </Button>
      </div>
    </div>
  )
}
