"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Loader2 } from "lucide-react"

interface DbStatusCheckerProps {
  children: React.ReactNode
  tableName: string
  redirectTo?: string
}

export function DbStatusChecker({ children, tableName, redirectTo = "/setup-database" }: DbStatusCheckerProps) {
  const [loading, setLoading] = useState(true)
  const [tableExists, setTableExists] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkTable = async () => {
      try {
        const { error } = await supabase.from(tableName).select("count").limit(1)

        if (error) {
          if (error.message.includes("relation") && error.message.includes("does not exist")) {
            setTableExists(false)
          }
        }
      } catch (err) {
        console.error(`Error checking ${tableName} table:`, err)
        setTableExists(false)
      } finally {
        setLoading(false)
      }
    }

    checkTable()
  }, [supabase, tableName])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!tableExists) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Database className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-xl text-center">需要設置數據庫</CardTitle>
          <CardDescription className="text-center">數據庫表 "{tableName}" 不存在</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">請按照設置指南創建所需的數據庫表</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href={redirectTo}>
            <Button>查看設置指南</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return <>{children}</>
}
