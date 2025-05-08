"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, ArrowLeft, Loader2, MessageSquare, Flag } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { VectorAvatar } from "@/components/vector-avatar"
import { getDistrictName } from "@/lib/districts"
import { formatDistanceToNow } from "date-fns"
import { zhHK } from "date-fns/locale"
import { isUserVip } from "@/lib/check-in"
import { generateHKUsername } from "@/lib/username-generator"
import { ReportDialog } from "@/components/report-dialog"
import { extractMediaLinks, MediaPreview, cleanPostContent } from "@/lib/media-helpers"

// 为静态导出生成示例帖子ID
export function generateStaticParams() {
  // 在静态导出模式下，我们提供一些示例ID
  // 实际部署时，这些ID将被替换为真实的帖子ID
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" },
    { id: "10" },
    { id: "20" },
    { id: "30" },
    { id: "40" },
    { id: "50" },
  ]
}

export default function PostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentUsername, setCommentUsername] = useState("")
  const [userCommentMap, setUserCommentMap] = useState<{ [key: string]: string }>({})
  const [mediaLinks, setMediaLinks] = useState<{ images: string[]; videos: string[] }>({ images: [], videos: [] })
  const [commentMediaLinks, setCommentMediaLinks] = useState<{ [key: string]: { images: string[]; videos: string[] } }>(
    {},
  )
  const [isUserVipStatus, setIsUserVipStatus] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [cleanedContent, setCleanedContent] = useState("")
  const [likesTableInitialized, setLikesTableInitialized] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 初始化點讚表
        try {
          // 檢查點讚表是否存在
          const { error: checkError } = await supabase.from("likes").select("id").limit(1)

          if (checkError && checkError.message.includes("does not exist")) {
            // 創建點讚表
            const { error } = await supabase.rpc("execute_sql", {
              sql_query: `
                CREATE TABLE IF NOT EXISTS public.likes (
                  id BIGSERIAL PRIMARY KEY,
                  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
                  created_at TIMESTAMPTZ DEFAULT NOW(),
                  UNIQUE(user_id, post_id)
                );

                -- 創建索引
                CREATE INDEX IF NOT EXISTS likes_user_id_idx ON public.likes(user_id);
                CREATE INDEX IF NOT EXISTS likes_post_id_idx ON public.likes(post_id);

                -- 設置RLS策略
                ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

                -- 任何人都可以查看點讚
                CREATE POLICY "Anyone can view likes" ON public.likes
                  FOR SELECT
                  USING (true);

                -- 已登錄用戶可以點讚
                CREATE POLICY "Authenticated users can insert likes" ON public.likes
                  FOR INSERT
                  WITH CHECK (auth.uid() = user_id);

                -- 用戶只能刪除自己的點讚
                CREATE POLICY "Users can delete their own likes" ON public.likes
                  FOR DELETE
                  USING (auth.uid() = user_id);
              `,
            })

            if (error) {
              console.error("Error creating likes table:", error)
            }
          }

          setLikesTableInitialized(true)
        } catch (error) {
          console.error("Error initializing likes table:", error)
        }

        // Get current user
        const { data: userData } = await supabase.auth.getUser()
        setCurrentUser(userData.user)

        // Check if user is VIP
        if (userData.user) {
          const userVipStatus = await isUserVip(userData.user.id)
          setIsUserVipStatus(userVipStatus)
        }

        // Get post
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select("*")
          .eq("id", params.id)
          .single()

        if (postError) throw postError
        setPost(postData)
        setLikeCount(postData.like_count || 0)

        // Increment view count
        try {
          await supabase
            .from("posts")
            .update({
              view_count: (post?.view_count || 0) + 1,
            })
            .eq("id", params.id)
        } catch (error) {
          console.error("Error updating view count:", error)
          // Continue even if update fails
        }

        // 清理帖子內容
        if (postData.content) {
          const extracted = extractMediaLinks(postData.content)
          setMediaLinks(extracted)
          setCleanedContent(cleanPostContent(postData.content))
        }

        // 檢查用戶是否已點讚
        if (userData.user && likesTableInitialized) {
          const { data: likeData, error: likeError } = await supabase
            .from("likes")
            .select("*")
            .eq("post_id", params.id)
            .eq("user_id", userData.user.id)
            .single()

          if (likeError && likeError.code !== "PGRST116") {
            console.error("Error checking like status:", likeError)
          }

          setIsLiked(!!likeData)
        }

        // Get comments
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select("*")
          .eq("post_id", params.id)
          .order("created_at", { ascending: true })

        if (commentsError) throw commentsError
        setComments(commentsData || [])

        // 提取評論中的媒體鏈接
        const commentMediaMap: { [key: string]: { images: string[]; videos: string[] } } = {}
        commentsData?.forEach((comment) => {
          if (comment.content) {
            commentMediaMap[comment.id] = extractMediaLinks(comment.content)
          }
        })
        setCommentMediaLinks(commentMediaMap)

        // 建立用戶ID到評論用戶名的映射
        const userMap: { [key: string]: string } = {}
        commentsData?.forEach((comment) => {
          if (comment && comment.user_id && comment.anonymous_name) {
            userMap[comment.user_id] = comment.anonymous_name
          }
        })
        setUserCommentMap(userMap)

        // 如果當前用戶已經在這個貼文評論過，使用相同的用戶名
        if (userData.user && userMap[userData.user.id]) {
          setCommentUsername(userMap[userData.user.id])
        } else {
          // 否則生成新的隨機用戶名
          setCommentUsername(generateHKUsername())
        }
      } catch (error: any) {
        toast({
          title: "錯誤",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, supabase])

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setCommentLoading(true)
    try {
      if (!currentUser) {
        router.push("/login")
        return
      }

      // 檢查用戶是否是帖子作者
      const isAuthor = currentUser.id === post.user_id

      // 使用一致的用戶名 - 如果是作者使用帖子用戶名，否則使用之前評論的用戶名或新生成的
      const username = isAuthor ? post.anonymous_name : userCommentMap[currentUser.id] || commentUsername

      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: params.id,
          user_id: currentUser.id,
          content: newComment,
          anonymous_name: username,
          avatar_seed: username,
          is_author: isAuthor,
        })
        .select()

      if (error) throw error

      // 提取新評論中的媒體鏈接
      const newCommentMedia = extractMediaLinks(newComment)
      setCommentMediaLinks({
        ...commentMediaLinks,
        [data[0].id]: newCommentMedia,
      })

      // 更新評論列表
      setComments(comments && Array.isArray(comments) ? [...comments, data[0]] : [data[0]])
      setNewComment("")

      // 如果這是用戶第一次評論，更新用戶名映射
      if (!userCommentMap[currentUser.id]) {
        setUserCommentMap({
          ...userCommentMap,
          [currentUser.id]: username,
        })
      }

      // 更新評論計數
      await supabase
        .from("posts")
        .update({ comment_count: (comments && Array.isArray(comments) ? comments.length : 0) + 1 })
        .eq("id", params.id)
    } catch (error: any) {
      toast({
        title: "評論失敗",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setCommentLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      // 使用剪貼板API而不是Web Share API
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "連結已複製",
        description: "貼文連結已複製到剪貼板",
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

  const handleMessage = async (userId: string) => {
    if (!currentUser) {
      toast({
        title: "請先登入",
        description: "您需要登入才能發送私信",
      })
      router.push("/login")
      return
    }

    // 檢查是否嘗試給自己發消息
    if (currentUser.id === userId) {
      toast({
        title: "無法給自己發送私信",
        description: "您不能給自己發送私信",
        variant: "destructive",
      })
      return
    }

    if (!isUserVipStatus) {
      toast({
        title: "需要VIP權限",
        description: "連續打卡7天並發布至少1篇貼文即可升級為VIP，解鎖私信功能",
      })
      router.push("/profile?tab=vip")
      return
    }

    // 直接導航到與該用戶的私信頁面
    router.push(`/messages/${userId}`)
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

  if (!post) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-xl font-medium mb-4">找不到貼文</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首頁
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 pb-20">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回
      </Button>

      <Card className="max-w-3xl mx-auto">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <VectorAvatar seed={post.anonymous_name || ""} size="lg" />
            <div>
              <h2 className="text-xl font-bold">{post.anonymous_name || "匿名用戶"}</h2>
              <p className="text-sm text-muted-foreground">
                {getDistrictName(post.district)} • {formatDate(post.created_at)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {post.categories &&
              Array.isArray(post.categories) &&
              post.categories.map((category: string) => (
                <Badge key={category} variant="outline">
                  #{category}
                </Badge>
              ))}
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-base">{cleanedContent}</p>

          {/* 顯示貼文中的媒體 */}
          {(mediaLinks.images.length > 0 || mediaLinks.videos.length > 0) && (
            <div className="mt-4">
              <MediaPreview images={mediaLinks.images} videos={mediaLinks.videos} />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-4 w-4 mr-1" />
              <span>{comments && Array.isArray(comments) ? comments.length : 0}</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleMessage(post.user_id)}>
              <MessageSquare className="h-4 w-4 mr-1" />
              私信
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setReportDialogOpen(true)}>
              <Flag className="h-4 w-4 mr-1" />
              舉報
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card className="max-w-3xl mx-auto mt-4">
        <CardHeader>
          <h3 className="text-lg font-bold">評論 ({comments && Array.isArray(comments) ? comments.length : 0})</h3>
        </CardHeader>
        <CardContent>
          {comments && Array.isArray(comments) && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="relative">
                    <VectorAvatar
                      seed={comment.anonymous_name || comment.username || ""}
                      size="sm"
                      className="shrink-0"
                    />
                    {/* 添加私信按鈕 - 只對VIP用戶顯示，且不是自己的評論 */}
                    {isUserVipStatus && currentUser?.id !== comment.user_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-2 -bottom-2 h-6 w-6 rounded-full bg-background border shadow-sm hover:bg-muted"
                        onClick={() => handleMessage(comment.user_id)}
                      >
                        <MessageSquare className="h-3 w-3 text-primary" />
                        <span className="sr-only">發送私信</span>
                      </Button>
                    )}
                  </div>

                  <div className="bg-muted p-3 rounded-lg w-full">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{comment.anonymous_name || comment.username || "匿名用戶"}</p>
                      {comment.is_author && (
                        <Badge variant="outline" className="text-xs">
                          樓主
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-line">{comment.content}</p>

                    {/* 顯示評論中的媒體 */}
                    {commentMediaLinks[comment.id] &&
                      (commentMediaLinks[comment.id].images.length > 0 ||
                        commentMediaLinks[comment.id].videos.length > 0) && (
                        <div className="mt-2">
                          <MediaPreview
                            images={commentMediaLinks[comment.id].images}
                            videos={commentMediaLinks[comment.id].videos}
                          />
                        </div>
                      )}

                    <p className="text-xs text-muted-foreground mt-1">{formatDate(comment.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">暫無評論，成為第一個評論的人吧！</p>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <form onSubmit={handleAddComment} className="w-full flex gap-2">
            <Input
              placeholder={currentUser ? "添加評論..." : "請先登入再評論"}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!currentUser || commentLoading}
            />
            <Button type="submit" disabled={commentLoading || !currentUser}>
              {commentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "發送"}
            </Button>
          </form>
        </CardFooter>
      </Card>

      <ReportDialog
        postId={Number(params.id)}
        postContent={post.content}
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
      />
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
