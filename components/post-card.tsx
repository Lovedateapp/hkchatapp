"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, MoreHorizontal, Flag, MessageSquare } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { getDistrictName } from "@/lib/districts"
import { VectorAvatar } from "@/components/vector-avatar"
import { isUserVip } from "@/lib/check-in"
import { ReportDialog } from "@/components/report-dialog"
import { extractMediaLinks, MediaPreview, cleanPostContent } from "@/lib/media-helpers"

interface PostCardProps {
  post: any
  className?: string
}

export function PostCard({ post, className }: PostCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post?.like_count || 0)
  const [commentCount, setCommentCount] = useState(post?.comment_count || 0)
  const [user, setUser] = useState<any>(null)
  const [mediaLinks, setMediaLinks] = useState<{ images: string[]; videos: string[] }>({ images: [], videos: [] })
  const [cleanedContent, setCleanedContent] = useState("")
  const [likesTableInitialized, setLikesTableInitialized] = useState(false)
  const [viewCount, setViewCount] = useState(post?.view_count || 0)

  // 初始化點讚表 - 使用API而不是直接在客戶端創建
  useEffect(() => {
    const initLikesTable = async () => {
      try {
        // 檢查點讚表是否存在
        const { error: checkError } = await supabase.from("likes").select("id").limit(1)

        if (checkError && checkError.message.includes("does not exist")) {
          // 使用API初始化點讚表
          const response = await fetch("/api/init-likes-table", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error("Error initializing likes table:", errorData.error)
            return
          }
        }

        setLikesTableInitialized(true)
      } catch (error) {
        console.error("Error checking likes table:", error)
      }
    }

    initLikesTable()
  }, [supabase])

  // 检查用户是否已登录
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      }
    }

    checkUser()
  }, [supabase])

  // 检查用户是否已点赞
  useEffect(() => {
    const checkIfLiked = async () => {
      if (!post?.id || !user || !likesTableInitialized) return

      try {
        const { data, error } = await supabase
          .from("likes")
          .select("*")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error checking like status:", error)
          return
        }

        setIsLiked(!!data)
      } catch (error) {
        console.error("Error checking like status:", error)
      }
    }

    if (user && likesTableInitialized) {
      checkIfLiked()
    }
  }, [post?.id, user, supabase, likesTableInitialized])

  // 获取评论数
  useEffect(() => {
    const fetchCommentCount = async () => {
      if (!post?.id) return

      try {
        const { count, error } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id)

        if (error) {
          console.error("Error fetching comment count:", error)
          return // 不要中斷渲染，只是記錄錯誤
        }

        if (count !== null) {
          setCommentCount(count)

          // Only update the post if we successfully got the count
          try {
            await supabase.from("posts").update({ comment_count: count }).eq("id", post.id)
          } catch (updateError) {
            console.error("Error updating post comment count:", updateError)
            // Continue even if update fails
          }
        }
      } catch (error) {
        console.error("Error fetching comment count:", error)
        // Don't throw the error, just log it
      }
    }

    fetchCommentCount()
  }, [post?.id, supabase])

  // 提取媒體鏈接和清理內容
  useEffect(() => {
    if (post?.content) {
      const extracted = extractMediaLinks(post.content)
      setMediaLinks(extracted)
      setCleanedContent(cleanPostContent(post.content))
    }
  }, [post?.content])

  const handleMessage = async () => {
    if (!user) {
      toast({
        title: "請先登入",
        description: "您需要登入才能發送私信",
      })
      router.push("/login")
      return
    }

    // 檢查是否嘗試給自己發消息
    if (user.id === post.user_id) {
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
        description: "連續打卡7天並發布至少1篇貼文即可升級為VIP，解鎖私信功能",
      })
      router.push("/profile?tab=vip")
      return
    }

    // 直接導航到與該用戶的私信頁面
    router.push(`/messages/${post.user_id}`)
  }

  const handleShare = () => {
    // 使用剪貼板API而不是Web Share API
    try {
      navigator.clipboard
        .writeText(`${window.location.origin}/post/${post?.id}`)
        .then(() => {
          toast({
            title: "連結已複製",
            description: "貼文連結已複製到剪貼板",
          })
        })
        .catch((err) => {
          console.error("複製失敗:", err)
          toast({
            title: "複製失敗",
            description: "無法複製連結，請手動複製",
            variant: "destructive",
          })
        })
    } catch (error) {
      console.error("複製失敗:", error)
      toast({
        title: "複製失敗",
        description: "無法複製連結，請手動複製",
        variant: "destructive",
      })
    }
  }

  const formatDate = (date: string) => {
    if (!date) return "未知時間"

    try {
      const now = new Date()
      const postDate = new Date(date)
      const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60))

      if (diffInHours < 1) return "剛剛"
      if (diffInHours < 24) return `${diffInHours}小時前`
      if (diffInHours < 48) return "昨天"

      return postDate.toLocaleDateString("zh-HK")
    } catch (error) {
      return "未知時間"
    }
  }

  // 限制内容长度，超过则显示"查看更多"
  const maxContentLength = 280
  const [showFullContent, setShowFullContent] = useState(false)
  const content = cleanedContent || "內容不可用"
  const isContentLong = content.length > maxContentLength
  const displayContent = showFullContent || !isContentLong ? content : `${content.substring(0, maxContentLength)}...`

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <VectorAvatar seed={post?.anonymous_name || ""} />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-2 -bottom-2 h-6 w-6 rounded-full bg-background border shadow-sm hover:bg-muted"
                onClick={handleMessage}
              >
                <MessageSquare className="h-3 w-3 text-primary" />
                <span className="sr-only">發送私信</span>
              </Button>
            </div>
            <div>
              <CardTitle className="text-base">{post?.anonymous_name || "匿名用戶"}</CardTitle>
              <CardDescription className="text-xs">
                {getDistrictName(post?.district || "")} • {formatDate(post?.created_at || "")}
              </CardDescription>
            </div>
          </div>
          <div></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-line">
          <p className="text-sm">{displayContent}</p>
          {isContentLong && !showFullContent && (
            <Button
              variant="link"
              className="p-0 h-auto text-xs text-muted-foreground"
              onClick={() => setShowFullContent(true)}
            >
              查看更多
            </Button>
          )}

          {/* 媒體預覽 */}
          {(mediaLinks.images.length > 0 || mediaLinks.videos.length > 0) && (
            <div className="mt-3">
              <MediaPreview images={mediaLinks.images} videos={mediaLinks.videos} />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t flex justify-between">
        <div className="flex items-center gap-4">
          {/* View count - only logged in console, not shown to users */}
          <Link href={`/post/${post?.id || "#"}`}>
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">{commentCount}</span>
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMessage}>
            <MessageSquare className="h-4 w-4" />
          </Button>
          <ReportDialog
            postId={post?.id}
            postContent={post?.content}
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Flag className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleMessage}>私信作者</DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>複製連結</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <ReportDialog
                  postId={post?.id}
                  postContent={post?.content}
                  trigger={
                    <button className="w-full text-left cursor-default select-none text-destructive">舉報</button>
                  }
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  )
}
