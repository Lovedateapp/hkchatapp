"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, MessageSquare } from "lucide-react"
import Link from "next/link"
import { VectorAvatar } from "@/components/vector-avatar"
import { formatDistanceToNow } from "date-fns"
import { zhHK } from "date-fns/locale"

export default function MessagesPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [initializingTable, setInitializingTable] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // 獲取當前用戶
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setCurrentUser(data.user)
    }

    fetchUser()
  }, [supabase])

  // 獲取對話列表
  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser) return

      try {
        setLoading(true)

        // 檢查消息表是否存在
        const { error: tableCheckError } = await supabase.from("messages").select("id").limit(1)

        // 如果表不存在，嘗試創建
        if (tableCheckError && tableCheckError.message.includes("does not exist")) {
          try {
            // 創建消息表
            const { error: createError } = await supabase.rpc("execute_sql", {
              sql_query: `
                CREATE TABLE IF NOT EXISTS public.messages (
                  id BIGSERIAL PRIMARY KEY,
                  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                  content TEXT NOT NULL,
                  read BOOLEAN DEFAULT FALSE,
                  created_at TIMESTAMPTZ DEFAULT NOW(),
                  updated_at TIMESTAMPTZ DEFAULT NOW()
                );

                -- 創建索引
                CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
                CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages(receiver_id);
                CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

                -- 設置RLS策略
                ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

                -- 只允許發送者和接收者查看消息
                CREATE POLICY "Users can view their own messages" ON public.messages
                  FOR SELECT
                  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

                -- 任何已登錄用戶都可以發送消息
                CREATE POLICY "Users can insert messages" ON public.messages
                  FOR INSERT
                  WITH CHECK (auth.uid() = sender_id);

                -- 接收者可以將消息標記為已讀
                CREATE POLICY "Users can update read status" ON public.messages
                  FOR UPDATE
                  USING (auth.uid() = receiver_id)
                  WITH CHECK (auth.uid() = receiver_id);

                -- 只允許發送者和接收者刪除消息
                CREATE POLICY "Users can delete their own messages" ON public.messages
                  FOR DELETE
                  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
              `,
            })

            if (createError) {
              throw new Error(`創建消息表失敗: ${createError.message}`)
            }
          } catch (err: any) {
            console.error("Error creating messages table:", err)
            setError(`創建消息表失敗: ${err.message}`)
            setLoading(false)
            return
          }
        }

        // 直接從消息表獲取對話
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching messages:", error)
          setError(`獲取消息失敗: ${error.message}`)
          setLoading(false)
          return
        }

        // 處理消息數據，生成對話列表
        const conversationMap = new Map()

        if (data && Array.isArray(data)) {
          for (const message of data) {
            const otherUserId = message.sender_id === currentUser.id ? message.receiver_id : message.sender_id

            if (!conversationMap.has(otherUserId)) {
              conversationMap.set(otherUserId, {
                other_user_id: otherUserId,
                last_message: message.content,
                last_message_time: message.created_at,
                unread_count: message.sender_id !== currentUser.id && !message.read ? 1 : 0,
              })
            } else if (!message.read && message.sender_id !== currentUser.id) {
              // 增加未讀消息計數
              const conv = conversationMap.get(otherUserId)
              conv.unread_count += 1
              conversationMap.set(otherUserId, conv)
            }
          }
        }

        // 轉換為數組
        const conversationList = Array.from(conversationMap.values())

        // 獲取對話用戶信息
        const conversationsWithUsers = await Promise.all(
          conversationList.map(async (conv) => {
            try {
              // 先從 posts 表獲取匿名名稱
              const { data: postData, error: postError } = await supabase
                .from("posts")
                .select("anonymous_name, avatar_seed")
                .eq("user_id", conv.other_user_id)
                .order("created_at", { ascending: false })
                .limit(1)

              if (postError) throw postError

              if (postData && postData.length > 0) {
                return {
                  ...conv,
                  otherUser: {
                    anonymous_name: postData[0].anonymous_name,
                    avatar_seed: postData[0].avatar_seed || postData[0].anonymous_name,
                  },
                }
              }

              // 如果沒有找到帖子，使用默認值
              return {
                ...conv,
                otherUser: {
                  anonymous_name: "用戶" + conv.other_user_id.substring(0, 4),
                  avatar_seed: "user" + conv.other_user_id.substring(0, 8),
                },
              }
            } catch (error) {
              console.error("Error fetching user data:", error)
              return {
                ...conv,
                otherUser: {
                  anonymous_name: "用戶",
                  avatar_seed: "unknown",
                },
              }
            }
          }),
        )

        setConversations(conversationsWithUsers)
      } catch (error: any) {
        console.error("Error fetching conversations:", error)
        setError(`獲取對話列表失敗: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchConversations()
    } else {
      setLoading(false)
    }
  }, [currentUser, supabase])

  // 格式化時間
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: zhHK,
      })
    } catch (error) {
      return "未知時間"
    }
  }

  // 如果用戶未登錄
  if (!loading && !currentUser) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>私信</CardTitle>
            <CardDescription>登入後即可查看您的私信</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/login">
              <Button>登入</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>私信</CardTitle>
          <CardDescription>與其他用戶的私信對話</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">{error}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                重試
              </Button>
            </div>
          ) : conversations.length > 0 ? (
            <div className="space-y-4">
              {conversations.map((conv) => (
                <Link href={`/messages/${conv.other_user_id}`} key={conv.other_user_id}>
                  <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors">
                    <VectorAvatar
                      seed={conv.otherUser?.avatar_seed || conv.otherUser?.anonymous_name || ""}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{conv.otherUser?.anonymous_name || "用戶"}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(conv.last_message_time)}</p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">還沒有私信對話</p>
              <p className="text-xs text-muted-foreground mt-2">瀏覽貼文並點擊發送私信按鈕，開始與其他用戶交流</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
