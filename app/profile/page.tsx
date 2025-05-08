"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar } from "@/components/ui/avatar"
import { Loader2, LogOut, Settings, MessageCircle, ThumbsUp } from "lucide-react"
import { districts } from "@/lib/districts"
import { VectorAvatar } from "@/components/vector-avatar"
import { generateMultipleUsernames } from "@/lib/username-generator"
import { CheckInComponent } from "./check-in"
import { getDistrictName } from "@/lib/districts"
import { formatDistanceToNow } from "date-fns"
import { zhHK } from "date-fns/locale"
import Link from "next/link"

export default function Profile() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState({
    gender: "",
    district: "",
  })
  const [randomUsernames, setRandomUsernames] = useState<string[]>([])
  const [authError, setAuthError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("profile")
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // 使用 getSession 而不是 getUser
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error fetching session:", sessionError.message)
          setAuthError(sessionError.message)
          setLoading(false)
          return
        }

        if (!session) {
          // 用户未登录，重定向到登录页面
          router.push("/login")
          return
        }

        setUser(session.user)

        // 從 users 表獲取資料，而不是 profiles 表
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (userError) {
          console.error("Error fetching user data:", userError.message)

          // 如果用戶記錄不存在，則創建一個
          if (userError.code === "PGRST116") {
            const { error: insertError } = await supabase
              .from("users")
              .insert({
                id: session.user.id,
                email: session.user.email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()

            if (insertError) {
              console.error("Error creating user record:", insertError.message)
            }
          }
        }

        if (userData) {
          setProfile({
            gender: userData.gender || "",
            district: userData.district || "",
          })
        }

        // 生成一些随机用户名示例
        setRandomUsernames(generateMultipleUsernames(5))
      } catch (error: any) {
        console.error("Unexpected error:", error)
        setAuthError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()

    // 从URL参数获取活动标签
    const tabFromUrl = new URLSearchParams(window.location.search).get("tab")
    if (tabFromUrl && ["profile", "security", "vip", "posts"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [router, supabase])

  // 獲取用戶的貼文
  const fetchUserPosts = async () => {
    if (!user) return

    setLoadingPosts(true)
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setUserPosts(data || [])
    } catch (error: any) {
      console.error("獲取用戶貼文失敗:", error)
      toast({
        title: "獲取貼文失敗",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingPosts(false)
    }
  }

  // 當用戶切換到"我的貼文"標籤時獲取貼文
  useEffect(() => {
    if (activeTab === "posts" && user) {
      fetchUserPosts()
    }
  }, [activeTab, user])

  const handleUpdateProfile = async () => {
    if (!user) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from("users")
        .update({
          gender: profile.gender,
          district: profile.district,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "個人資料已更新",
        description: "您的個人資料已成功更新，變更已儲存",
      })
    } catch (error: any) {
      toast({
        title: "更新失敗",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "已登出",
        description: "您已成功登出",
      })
      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "登出失敗",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // 更新URL参数但不刷新页面
    const url = new URL(window.location.href)
    url.searchParams.set("tab", value)
    window.history.pushState({}, "", url)
  }

  const formatDate = (date: string) => {
    if (!date) return "未知時間"

    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: zhHK,
      })
    } catch (error) {
      return "未知時間"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (authError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>認證錯誤</CardTitle>
            <CardDescription>無法獲取您的個人資料</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">{authError}</p>
            <p className="text-sm text-muted-foreground">請嘗試重新登入或稍後再試</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={() => router.push("/login")}>
              重新登入
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
              返回首頁
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>請先登入</CardTitle>
            <CardDescription>您需要登入才能查看個人資料</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={() => router.push("/login")}>
              登入
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
              返回首頁
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="max-w-3xl mx-auto">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">個人資料</TabsTrigger>
          <TabsTrigger value="security">安全設置</TabsTrigger>
          <TabsTrigger value="vip">VIP打卡</TabsTrigger>
          <TabsTrigger value="posts">我的貼文</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 bg-primary text-primary-foreground">
                  <span className="text-xl font-medium">{user?.email?.charAt(0).toUpperCase() || "U"}</span>
                </Avatar>
                <div>
                  <CardTitle>個人資料</CardTitle>
                  <CardDescription>更新您的個人資料信息</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>電子郵件</Label>
                <p className="text-sm p-2 border rounded-md bg-muted">{user?.email}</p>
              </div>

              <div className="space-y-2">
                <Label>性別</Label>
                <RadioGroup value={profile.gender} onValueChange={(value) => setProfile({ ...profile, gender: value })}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">男</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">女</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">其他</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">地區</Label>
                <Select value={profile.district} onValueChange={(value) => setProfile({ ...profile, district: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇地區" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district.value} value={district.value}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>隨機用戶名示例</Label>
                <div className="flex flex-wrap gap-2">
                  {randomUsernames.map((username, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                      <VectorAvatar seed={username} size="sm" />
                      <span className="text-sm">{username}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">每次發帖都會隨機生成一個新的用戶名，保護您的隱私</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" onClick={handleUpdateProfile} disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    更新中...
                  </>
                ) : (
                  "更新個人資料"
                )}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                登出
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>安全設置</CardTitle>
              <CardDescription>管理您的密碼和帳戶安全設置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">更改密碼</p>
                    <p className="text-xs text-muted-foreground">定期更改密碼以保護您的帳戶安全</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      // 顯示加載中的提示
                      toast({
                        title: "正在處理您的請求",
                        description: "請稍候...",
                      })

                      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      })

                      if (error) throw error

                      toast({
                        title: "請求已收到",
                        description:
                          "我們已收到更改密碼請求，很快將發送更改EMAIL。請留意EMAIL，如果沒有收到，請查看垃圾郵件箱。",
                      })
                    } catch (error: any) {
                      console.error("重置密碼失敗:", error)
                      toast({
                        title: "重置密碼失敗",
                        description: error.message || "發送重置郵件時出錯",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  更改
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vip" className="mt-6">
          <CheckInComponent />
        </TabsContent>

        <TabsContent value="posts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>我的貼文</CardTitle>
              <CardDescription>查看您發布的所有貼文</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">您還沒有發布任何貼文</p>
                  <Button className="mt-4" onClick={() => router.push("/create-post")}>
                    發布新貼文
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <Card key={post.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <VectorAvatar seed={post.anonymous_name || ""} size="sm" />
                          <div>
                            <p className="font-medium">{post.anonymous_name || "匿名用戶"}</p>
                            <p className="text-xs text-muted-foreground">
                              {getDistrictName(post.district)} • {formatDate(post.created_at)}
                            </p>
                          </div>
                        </div>
                        <p className="line-clamp-3 mb-3">{post.content}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{post.like_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MessageCircle className="h-4 w-4" />
                              <span>{post.comment_count || 0}</span>
                            </div>
                          </div>
                          <Link href={`/post/${post.id}`} passHref>
                            <Button variant="outline" size="sm">
                              查看詳情
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => router.push("/create-post")}>
                發布新貼文
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
