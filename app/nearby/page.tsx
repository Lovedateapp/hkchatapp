"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, MapPin, Users, Calendar } from "lucide-react"
import { VectorAvatar } from "@/components/vector-avatar"
import { getDistrictName } from "@/lib/districts"
import { isUserVip } from "@/lib/check-in"

export default function NearbyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [locationLoading, setLocationLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isVip, setIsVip] = useState(false)
  const [activeTab, setActiveTab] = useState("people")

  // 检查用户是否已登录
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)

        // 检查用户是否是VIP
        const userIsVip = await isUserVip(session.user.id)
        setIsVip(userIsVip)
      }
      setLoading(false)
    }

    checkSession()

    // 檢查用戶是否是 VIP
    const checkVipStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        const userIsVip = await isUserVip(user.id)

        if (!userIsVip) {
          toast({
            title: "需要 VIP 權限",
            description: "附近功能僅對 VIP 用戶開放",
            variant: "destructive",
          })
          router.push("/profile?tab=vip")
          return
        }
      } catch (error) {
        console.error("檢查 VIP 狀態時出錯:", error)
      }
    }

    checkVipStatus()
  }, [supabase, router])

  // 获取用户位置
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "位置服務不可用",
        description: "您的瀏覽器不支持位置服務",
        variant: "destructive",
      })
      return
    }

    setLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        fetchNearbyUsers(position.coords.latitude, position.coords.longitude)
      },
      (error) => {
        console.error("Error getting location:", error)
        toast({
          title: "無法獲取位置",
          description: "請確保您已授權位置權限",
          variant: "destructive",
        })
        setLocationLoading(false)
      },
    )
  }

  // 获取附近用户
  const fetchNearbyUsers = async (latitude: number, longitude: number) => {
    try {
      // 使用 Supabase 函數獲取附近的 VIP 用戶
      const { data, error } = await supabase.rpc("find_nearby_vip", {
        lat: latitude,
        lon: longitude,
        radius: 30, // 30公里範圍內
      })

      if (error) {
        throw error
      }

      // 獲取用戶詳細信息
      if (data && data.length > 0) {
        const userIds = data.map((user) => user.id)

        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, username, district")
          .in("id", userIds)

        if (usersError) {
          throw usersError
        }

        // 合併距離信息和用戶信息
        const nearbyUsersWithDetails = data.map((nearbyUser) => {
          const userDetails = usersData?.find((u) => u.id === nearbyUser.id) || {}
          return {
            ...nearbyUser,
            ...userDetails,
            lastActive: nearbyUser.created_at, // 使用最後活動時間
          }
        })

        setNearbyUsers(nearbyUsersWithDetails)
      } else {
        setNearbyUsers([])
      }
    } catch (error) {
      console.error("Error fetching nearby users:", error)
      toast({
        title: "獲取附近用戶失敗",
        description: "請稍後再試",
        variant: "destructive",
      })
    } finally {
      setLocationLoading(false)
    }
  }

  // 格式化最后活跃时间
  const formatLastActive = (lastActive: string) => {
    const now = new Date()
    const lastActiveDate = new Date(lastActive)
    const diffInMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "剛剛"
    if (diffInMinutes < 60) return `${diffInMinutes}分鐘前`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}小時前`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}天前`
  }

  // 处理私信
  const handleMessage = async (userId: string, username: string) => {
    if (!user) {
      toast({
        title: "請先登入",
        description: "您需要登入才能發送私信",
      })
      router.push("/login")
      return
    }

    // 檢查是否嘗試給自己發消息
    if (user.id === userId) {
      toast({
        title: "無法給自己發送私信",
        description: "您不能給自己發送私信",
        variant: "destructive",
      })
      return
    }

    const userIsVip = await isUserVip(user.id)

    if (!userIsVip) {
      toast({
        title: "需要VIP權限",
        description: "連續打卡7天即可升級為VIP，解鎖私信功能",
      })
      router.push("/profile?tab=vip")
      return
    }

    // 直接導航到與該用戶的私信頁面
    router.push(`/messages/${userId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>請先登入</CardTitle>
            <CardDescription>您需要登入才能使用附近功能</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/login")}>登入</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!isVip) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>VIP專屬功能</CardTitle>
            <CardDescription>附近功能僅對VIP用戶開放</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-6">
              <MapPin className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-center text-muted-foreground mb-4">連續打卡7天即可升級為VIP用戶，解鎖附近功能</p>
            <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <p className="text-sm">每日打卡，獲取VIP特權</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/profile?tab=vip")}>前往打卡</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="max-w-3xl mx-auto mb-6">
        <CardHeader>
          <CardTitle>附近的人</CardTitle>
          <CardDescription>查找30公里範圍內的用戶</CardDescription>
        </CardHeader>
        <CardContent>
          {!userLocation ? (
            <div className="flex flex-col items-center justify-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-4">請啟用位置服務以查看附近的人</p>
              <Button onClick={getUserLocation} disabled={locationLoading}>
                {locationLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    獲取位置中...
                  </>
                ) : (
                  "獲取我的位置"
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-primary mr-2" />
                  <p className="text-sm">
                    已找到 <span className="font-medium">{nearbyUsers.length}</span> 位附近的用戶
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={getUserLocation} disabled={locationLoading}>
                  {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "刷新"}
                </Button>
              </div>

              <Tabs defaultValue="people" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="people">附近的人</TabsTrigger>
                  <TabsTrigger value="posts">附近的貼文</TabsTrigger>
                </TabsList>

                <TabsContent value="people">
                  {nearbyUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-center text-muted-foreground">附近暫無其他用戶</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {nearbyUsers.map((nearbyUser) => (
                        <div
                          key={nearbyUser.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <VectorAvatar seed={nearbyUser.username || nearbyUser.anonymous_id} />
                            <div>
                              <p className="font-medium">{nearbyUser.username || "匿名用戶"}</p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>
                                  {getDistrictName(nearbyUser.district)} • {nearbyUser.distance.toFixed(1)}公里
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                最後活躍：{formatLastActive(nearbyUser.lastActive)}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleMessage(nearbyUser.id, nearbyUser.username)}>
                            私信
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="posts">
                  <div className="flex flex-col items-center justify-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-center text-muted-foreground">附近貼文功能即將推出，敬請期待</p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
