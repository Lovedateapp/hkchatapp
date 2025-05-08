"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Filter, Loader2, Database, AlertTriangle, Flame, ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { PostCard } from "@/components/post-card"
import { DistrictFilter } from "@/components/district-filter"
import { CategoryFilter } from "@/components/category-filter"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageParam = searchParams.get("page")
  const currentPage = pageParam ? Number.parseInt(pageParam) : 1
  const postsPerPage = 10

  const [posts, setPosts] = useState<any[]>([])
  const [hotPosts, setHotPosts] = useState<any[]>([])
  const [districtPosts, setDistrictPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hotLoading, setHotLoading] = useState(true)
  const [districtLoading, setDistrictLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbSetupNeeded, setDbSetupNeeded] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userDistrict, setUserDistrict] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [initializationComplete, setInitializationComplete] = useState(false)
  const [totalPosts, setTotalPosts] = useState(0)
  const [totalHotPosts, setTotalHotPosts] = useState(0)
  const [totalDistrictPosts, setTotalDistrictPosts] = useState(0)

  // 初始化 Supabase 客户端
  useEffect(() => {
    try {
      // 创建 Supabase 客户端
      const supabase = createClient()
      console.log("Supabase client initialized successfully")
      setInitializationComplete(true)
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error)
      setError("初始化數據庫連接失敗。請檢查您的環境變量設置。")
      setInitializationComplete(true) // Still mark as complete to avoid infinite loading
    }
  }, [])

  // 获取当前用户
  useEffect(() => {
    if (!initializationComplete) return

    const getUser = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error fetching session:", error.message)
          return
        }

        if (session) {
          setUser(session.user)

          // 获取用户地区
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("district")
            .eq("id", session.user.id)
            .single()

          if (userError && userError.code !== "PGRST116") {
            console.error("Error fetching user data:", userError.message)
          }

          if (userData && userData.district) {
            setUserDistrict(userData.district)
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err)
      }
    }

    getUser()
  }, [initializationComplete])

  // 获取最新帖子
  useEffect(() => {
    if (!initializationComplete) return

    const fetchPosts = async () => {
      try {
        setLoading(true)
        console.log("Fetching posts...")

        const supabase = createClient()

        // 獲取總帖子數
        const { count: totalCount, error: countError } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })

        if (countError) throw countError

        if (totalCount !== null) {
          setTotalPosts(totalCount)
        }

        // 計算分頁偏移量
        const from = (currentPage - 1) * postsPerPage
        const to = from + postsPerPage - 1

        // 獲取當前頁的帖子
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, to)

        console.log("Posts query completed", { data: data?.length, error })

        if (error) {
          // 检查是否是表不存在的错误
          if (error.message.includes("relation") && error.message.includes("does not exist")) {
            setDbSetupNeeded(true)
            console.error("Database tables not set up:", error)
          } else {
            console.error("Error fetching posts:", error)
          }
          throw error
        }

        if (!data || data.length === 0) {
          console.log("No posts found")
        }

        setPosts(data || [])
      } catch (err: any) {
        console.error("Error in fetchPosts:", err)
        setError(err.message || "获取帖子时出错")
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [initializationComplete, currentPage, postsPerPage])

  // 获取热门帖子
  useEffect(() => {
    if (!initializationComplete) return

    const fetchHotPosts = async () => {
      try {
        setHotLoading(true)

        // 获取30天内的帖子
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const supabase = createClient()

        // 獲取總熱門帖子數
        const { count: totalCount, error: countError } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo.toISOString())

        if (countError) throw countError

        if (totalCount !== null) {
          setTotalHotPosts(totalCount)
        }

        // 計算分頁偏移量
        const from = (currentPage - 1) * postsPerPage
        const to = from + postsPerPage - 1

        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("view_count", { ascending: false })
          .order("comment_count", { ascending: false })
          .range(from, to)

        if (error) throw error

        setHotPosts(data || [])
      } catch (err: any) {
        console.error("Error fetching hot posts:", err)
      } finally {
        setHotLoading(false)
      }
    }

    fetchHotPosts()
  }, [initializationComplete, currentPage, postsPerPage])

  // 获取同区帖子
  useEffect(() => {
    if (!initializationComplete || !userDistrict) return

    const fetchDistrictPosts = async () => {
      try {
        setDistrictLoading(true)

        const supabase = createClient()

        // 獲取總同區帖子數
        const { count: totalCount, error: countError } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("district", userDistrict)

        if (countError) throw countError

        if (totalCount !== null) {
          setTotalDistrictPosts(totalCount)
        }

        // 計算分頁偏移量
        const from = (currentPage - 1) * postsPerPage
        const to = from + postsPerPage - 1

        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("district", userDistrict)
          .order("created_at", { ascending: false })
          .range(from, to)

        if (error) throw error

        setDistrictPosts(data || [])
      } catch (err: any) {
        console.error("Error fetching district posts:", err)
      } finally {
        setDistrictLoading(false)
      }
    }

    fetchDistrictPosts()
  }, [initializationComplete, userDistrict, currentPage, postsPerPage])

  // 處理頁面變更
  const handlePageChange = (page: number) => {
    router.push(`/?page=${page}`)
  }

  // 如果还在初始化
  if (!initializationComplete) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">正在加載應用程序...</p>
        </div>
      </div>
    )
  }

  // 如果需要设置数据库
  if (dbSetupNeeded) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Database className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-xl text-center">需要設置數據庫</CardTitle>
            <CardDescription className="text-center">您的 Supabase 數據庫尚未設置所需的表</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground mb-4">請按照設置指南創建所需的數據庫表和預設帖子</p>
            <Link href="/setup-database" className="block w-full">
              <Button className="w-full">查看設置指南</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 如果出现错误
  if (error && !dbSetupNeeded) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl text-center">載入失敗</CardTitle>
            <CardDescription className="text-center">獲取帖子時出現錯誤</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md overflow-auto">
              <p className="text-sm font-mono">{error}</p>
            </div>
            <p className="text-center text-muted-foreground">這可能是由於環境變量配置錯誤或數據庫連接問題導致的</p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button onClick={() => window.location.reload()}>重試</Button>
            <Link href="/debug-env">
              <Button variant="outline">檢查環境變量</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // 渲染分頁控制
  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / postsPerPage)
    if (totalPages <= 1) return null

    return (
      <div className="flex justify-center items-center mt-6 space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // 顯示當前頁附近的頁碼
            let pageToShow
            if (totalPages <= 5) {
              pageToShow = i + 1
            } else if (currentPage <= 3) {
              pageToShow = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageToShow = totalPages - 4 + i
            } else {
              pageToShow = currentPage - 2 + i
            }

            return (
              <Button
                key={pageToShow}
                variant={currentPage === pageToShow ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageToShow)}
                className="w-8 h-8 p-0"
              >
                {pageToShow}
              </Button>
            )
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="mx-1">...</span>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)} className="w-8 h-8 p-0">
                {totalPages}
              </Button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <Tabs defaultValue="latest" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="latest">最新</TabsTrigger>
            <TabsTrigger value="hot">最熱</TabsTrigger>
            <TabsTrigger value="district">同區</TabsTrigger>
          </TabsList>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <Filter className="h-4 w-4 mr-2" />
                篩選
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>篩選選項</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-6">
                <CategoryFilter />
                <DistrictFilter />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <TabsContent value="latest" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Loading State */}
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {/* Posts */}
              {!loading && !error && posts.length > 0 ? (
                <>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                  {renderPagination(totalPosts)}
                </>
              ) : !loading && !error ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <p className="text-muted-foreground mb-4">暫無貼文</p>
                    <Link href="/create-post">
                      <Button>發布第一篇貼文</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <div className="space-y-6 hidden md:block">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>歡迎來到 HKchat</CardTitle>
                  <CardDescription>在這裡分享你的想法，結交新朋友</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link href="/create-post" className="w-full">
                    <Button className="w-full">發布貼文</Button>
                  </Link>
                </CardFooter>
              </Card>

              <CategoryFilter />
              <DistrictFilter />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hot" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Loading State */}
              {hotLoading && (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {/* Hot Posts */}
              {!hotLoading && hotPosts.length > 0 ? (
                <>
                  {hotPosts.map((post) => (
                    <div key={post.id} className="relative">
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10">
                        <Flame className="h-4 w-4" />
                      </div>
                      <PostCard post={post} />
                    </div>
                  ))}
                  {renderPagination(totalHotPosts)}
                </>
              ) : !hotLoading ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <p className="text-muted-foreground mb-4">暫無熱門貼文</p>
                    <Link href="/create-post">
                      <Button>發布貼文</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <div className="space-y-6 hidden md:block">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>熱門貼文</CardTitle>
                  <CardDescription>30天內最受歡迎的貼文</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">熱門貼文根據瀏覽量和評論數綜合排序</p>
                </CardContent>
              </Card>

              <CategoryFilter />
              <DistrictFilter />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="district" className="mt-0">
          {user && userDistrict ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Loading State */}
                {districtLoading && (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Posts */}
                {!districtLoading && districtPosts.length > 0 ? (
                  <>
                    {districtPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                    {renderPagination(totalDistrictPosts)}
                  </>
                ) : !districtLoading ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <p className="text-muted-foreground mb-4">暫無同區貼文</p>
                      <Link href="/create-post">
                        <Button>發布第一篇貼文</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              <div className="space-y-6 hidden md:block">
                <CategoryFilter />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-4">
                {user ? "請先設置您的地區以查看同區貼文" : "請先登入並設置您的地區以查看同區貼文"}
              </p>
              {user ? (
                <Button onClick={() => router.push("/profile")}>設置地區</Button>
              ) : (
                <Button onClick={() => router.push("/login")}>登入</Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
