"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { Shield, Users, Flag, Crown, Loader2 } from "lucide-react"

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("users")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true)

        // 獲取當前用戶
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          window.location.href = "/login"
          return
        }

        setCurrentUserId(user.id)
        setDebugInfo(null)

        // 直接檢查管理員狀態
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (adminError && adminError.code !== "PGRST116") {
          console.error("檢查管理員狀態失敗:", adminError)
          setDebugInfo(JSON.stringify(adminError, null, 2))
          toast({
            title: "檢查管理員狀態失敗",
            description: adminError.message,
            variant: "destructive",
          })
          return
        }

        // 如果沒有找到管理員記錄
        if (!adminData) {
          toast({
            title: "權限不足",
            description: "您沒有管理員權限",
            variant: "destructive",
          })
          return
        }

        // 如果成功找到管理員記錄，則設置為管理員
        setIsAdmin(true)
        fetchData()
      } catch (error) {
        console.error("檢查管理員狀態時出錯:", error)
        setDebugInfo(JSON.stringify(error, null, 2))
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // 獲取所有用戶
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (usersError) {
        console.error("獲取用戶數據失敗:", usersError)
        setDebugInfo(JSON.stringify(usersError, null, 2))
        toast({
          title: "獲取用戶數據失敗",
          description: usersError.message,
          variant: "destructive",
        })
      } else {
        setUsers(usersData || [])
      }

      // 獲取所有報告
      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select(`
          *,
          reporter:reporter_id(id, anonymous_id)
        `)
        .order("created_at", { ascending: false })

      if (reportsError) {
        console.error("獲取報告數據失敗:", reportsError)
        setDebugInfo(JSON.stringify(reportsError, null, 2))
        toast({
          title: "獲取報告數據失敗",
          description: reportsError.message,
          variant: "destructive",
        })
      } else {
        setReports(reportsData || [])
      }
    } catch (error) {
      console.error("獲取數據時出錯:", error)
      setDebugInfo(JSON.stringify(error, null, 2))
      toast({
        title: "獲取數據失敗",
        description: "請稍後再試",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 修改 handleGrantVIP 函數，確保同時更新 is_vip 和 vip_expires_at 欄位
  const handleGrantVIP = async (userId) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          is_vip: true,
          vip_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        })
        .eq("id", userId)

      if (error) throw error

      toast({
        title: "成功授予 VIP",
        description: "用戶已獲得 30 天 VIP 權限",
      })
      fetchData()
    } catch (error) {
      console.error("授予 VIP 失敗:", error)
      setDebugInfo(JSON.stringify(error, null, 2))
      toast({
        title: "授予 VIP 失敗",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // 修改 handleRevokeVIP 函數，確保同時更新 is_vip 和 vip_expires_at 欄位
  const handleRevokeVIP = async (userId) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          is_vip: false,
          vip_expires_at: null,
        })
        .eq("id", userId)

      if (error) throw error

      toast({
        title: "成功撤銷 VIP",
        description: "用戶的 VIP 權限已被撤銷",
      })
      fetchData()
    } catch (error) {
      console.error("撤銷 VIP 失敗:", error)
      setDebugInfo(JSON.stringify(error, null, 2))
      toast({
        title: "撤銷 VIP 失敗",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSetAdmin = async (userId, isAdmin) => {
    try {
      if (isAdmin) {
        // 添加管理員
        const { error } = await supabase
          .from("admins")
          .insert({
            user_id: userId,
          })
          .select()

        if (error) throw error
      } else {
        // 移除管理員
        const { error } = await supabase.from("admins").delete().eq("user_id", userId)

        if (error) throw error
      }

      toast({
        title: isAdmin ? "成功設置為管理員" : "已移除管理員權限",
        description: isAdmin ? "用戶現在擁有管理員權限" : "用戶的管理員權限已被移除",
      })
      fetchData()
    } catch (error) {
      console.error("設置管理員狀態失敗:", error)
      setDebugInfo(JSON.stringify(error, null, 2))
      toast({
        title: "設置管理員狀態失敗",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleReportAction = async (reportId, status) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({
          status,
        })
        .eq("id", reportId)

      if (error) throw error

      toast({
        title: "報告狀態已更新",
        description: `報告已標記為 ${status}`,
      })
      fetchData()
    } catch (error) {
      console.error("更新報告狀態失敗:", error)
      setDebugInfo(JSON.stringify(error, null, 2))
      toast({
        title: "更新報告狀態失敗",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // 使用 anonymous_id 代替 username 進行搜索
  const filteredUsers = users.filter(
    (user) =>
      user.anonymous_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredReports = reports.filter(
    (report) =>
      report.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter?.anonymous_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>權限不足</CardTitle>
            <CardDescription>您沒有管理員權限</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">只有管理員才能訪問此頁面</p>
            {debugInfo && (
              <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-xs overflow-auto max-h-32">
                <pre>{debugInfo}</pre>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => (window.location.href = "/")} className="w-full">
              返回首頁
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            管理員控制面板
          </CardTitle>
          <CardDescription>管理用戶、報告和 VIP 設置</CardDescription>
        </CardHeader>
      </Card>

      <div className="mb-6">
        <Input
          placeholder="搜索用戶或報告..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="users" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="users" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            用戶管理
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1">
            <Flag className="h-4 w-4" />
            報告管理
          </TabsTrigger>
          <TabsTrigger value="vip" className="flex items-center gap-1">
            <Crown className="h-4 w-4" />
            VIP 設置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>用戶列表</CardTitle>
              <CardDescription>管理所有註冊用戶</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用戶ID</TableHead>
                      <TableHead>匿名ID</TableHead>
                      <TableHead>註冊日期</TableHead>
                      <TableHead>VIP 狀態</TableHead>
                      <TableHead>連續打卡</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          沒有找到用戶
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}...</TableCell>
                          <TableCell>{user.anonymous_id || "未設置"}</TableCell>
                          <TableCell>
                            {user.created_at ? format(new Date(user.created_at), "yyyy-MM-dd") : "未知"}
                          </TableCell>
                          <TableCell>
                            {user.vip_expires_at && new Date(user.vip_expires_at) > new Date() ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                VIP 到 {format(new Date(user.vip_expires_at), "yyyy-MM-dd")}
                              </Badge>
                            ) : (
                              <Badge variant="outline">普通用戶</Badge>
                            )}
                          </TableCell>
                          <TableCell>{user.streak_days || 0} 天</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                                詳情
                              </Button>
                              {user.vip_expires_at && new Date(user.vip_expires_at) > new Date() ? (
                                <Button variant="destructive" size="sm" onClick={() => handleRevokeVIP(user.id)}>
                                  撤銷 VIP
                                </Button>
                              ) : (
                                <Button variant="default" size="sm" onClick={() => handleGrantVIP(user.id)}>
                                  授予 VIP
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {selectedUser && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>用戶詳情</CardTitle>
                <CardDescription>用戶 ID: {selectedUser.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">用戶 ID</Label>
                    <div className="mt-1 text-sm font-mono">{selectedUser.id}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">匿名 ID</Label>
                    <div className="mt-1 text-sm">{selectedUser.anonymous_id || "未設置"}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">地區</Label>
                    <div className="mt-1 text-sm">{selectedUser.district || "未設置"}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">註冊日期</Label>
                    <div className="mt-1 text-sm">
                      {selectedUser.created_at
                        ? format(new Date(selectedUser.created_at), "yyyy-MM-dd HH:mm:ss")
                        : "未知"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">VIP 狀態</Label>
                    <div className="mt-1 text-sm">
                      {selectedUser.vip_expires_at && new Date(selectedUser.vip_expires_at) > new Date() ? "是" : "否"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">VIP 到期日</Label>
                    <div className="mt-1 text-sm">
                      {selectedUser.vip_expires_at ? format(new Date(selectedUser.vip_expires_at), "yyyy-MM-dd") : "無"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">連續打卡天數</Label>
                    <div className="mt-1 text-sm">{selectedUser.streak_days || 0} 天</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">位置</Label>
                    <div className="mt-1 text-sm">{selectedUser.location ? "已設置" : "未設置"}</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  關閉
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      // 檢查用戶是否已經是管理員
                      const { data, error } = await supabase
                        .from("admins")
                        .select("id")
                        .eq("user_id", selectedUser.id)
                        .single()

                      const isCurrentlyAdmin = !!data

                      if (isCurrentlyAdmin) {
                        // 防止移除自己的管理員權限
                        if (selectedUser.id === currentUserId) {
                          toast({
                            title: "操作被拒絕",
                            description: "您不能移除自己的管理員權限",
                            variant: "destructive",
                          })
                          return
                        }
                        handleSetAdmin(selectedUser.id, false)
                      } else {
                        handleSetAdmin(selectedUser.id, true)
                      }
                      setSelectedUser(null)
                    } catch (error) {
                      console.error("檢查管理員狀態失敗:", error)
                      toast({
                        title: "操作失敗",
                        description: "無法檢查管理員狀態",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  {async () => {
                    try {
                      const { data } = await supabase
                        .from("admins")
                        .select("id")
                        .eq("user_id", selectedUser.id)
                        .single()
                        .then((res) => ({ data: res.data }))
                        .catch(() => ({ data: null }))

                      return data ? "移除管理員" : "設為管理員"
                    } catch {
                      return "設置管理員"
                    }
                  }}
                </Button>
                {selectedUser.vip_expires_at && new Date(selectedUser.vip_expires_at) > new Date() ? (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleRevokeVIP(selectedUser.id)
                      setSelectedUser(null)
                    }}
                  >
                    撤銷 VIP
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={() => {
                      handleGrantVIP(selectedUser.id)
                      setSelectedUser(null)
                    }}
                  >
                    授予 VIP
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>報告列表</CardTitle>
              <CardDescription>管理用戶提交的報告</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>報告者</TableHead>
                      <TableHead>原因</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>提交日期</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          沒有找到報告
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>{report.reporter?.anonymous_id || "未知用戶"}</TableCell>
                          <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                          <TableCell>
                            {report.status === "pending" && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                待處理
                              </Badge>
                            )}
                            {report.status === "resolved" && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">已解決</Badge>
                            )}
                            {report.status === "rejected" && (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-200">已拒絕</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {report.created_at ? format(new Date(report.created_at), "yyyy-MM-dd") : "未知"}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                              詳情
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {selectedReport && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>報告詳情</CardTitle>
                <CardDescription>報告 ID: {selectedReport.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">報告者</Label>
                    <div className="mt-1 text-sm">{selectedReport.reporter?.anonymous_id || "未知用戶"}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">貼文 ID</Label>
                    <div className="mt-1 text-sm">{selectedReport.post_id || "未知"}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">評論 ID</Label>
                    <div className="mt-1 text-sm">{selectedReport.comment_id || "無"}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">報告原因</Label>
                    <div className="mt-1 text-sm p-3 bg-gray-50 rounded-md">{selectedReport.reason}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">狀態</Label>
                    <div className="mt-1 text-sm">
                      {selectedReport.status === "pending" && "待處理"}
                      {selectedReport.status === "resolved" && "已解決"}
                      {selectedReport.status === "rejected" && "已拒絕"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">提交日期</Label>
                    <div className="mt-1 text-sm">
                      {selectedReport.created_at
                        ? format(new Date(selectedReport.created_at), "yyyy-MM-dd HH:mm:ss")
                        : "未知"}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                  關閉
                </Button>
                {selectedReport.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleReportAction(selectedReport.id, "rejected")
                        setSelectedReport(null)
                      }}
                    >
                      拒絕
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => {
                        handleReportAction(selectedReport.id, "resolved")
                        setSelectedReport(null)
                      }}
                    >
                      解決
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vip">
          <Card>
            <CardHeader>
              <CardTitle>VIP 設置</CardTitle>
              <CardDescription>管理 VIP 用戶和設置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">VIP 用戶列表</h3>
                  <div className="mt-4 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>用戶ID</TableHead>
                          <TableHead>匿名ID</TableHead>
                          <TableHead>VIP 到期日</TableHead>
                          <TableHead>連續打卡天數</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.filter((user) => user.vip_expires_at && new Date(user.vip_expires_at) > new Date())
                          .length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              沒有 VIP 用戶
                            </TableCell>
                          </TableRow>
                        ) : (
                          users
                            .filter((user) => user.vip_expires_at && new Date(user.vip_expires_at) > new Date())
                            .map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}...</TableCell>
                                <TableCell>{user.anonymous_id || "未設置"}</TableCell>
                                <TableCell>
                                  {user.vip_expires_at ? format(new Date(user.vip_expires_at), "yyyy-MM-dd") : "永久"}
                                </TableCell>
                                <TableCell>{user.streak_days || 0} 天</TableCell>
                                <TableCell>
                                  <Button variant="destructive" size="sm" onClick={() => handleRevokeVIP(user.id)}>
                                    撤銷 VIP
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium">VIP 規則設置</h3>
                  <p className="text-sm text-gray-500 mt-1">當前規則: 連續打卡 7 天獲得 30 天 VIP 權限</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {debugInfo && (
        <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-xs overflow-auto max-h-32">
          <pre>{debugInfo}</pre>
        </div>
      )}
    </div>
  )
}
