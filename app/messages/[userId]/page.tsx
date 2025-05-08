"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Send } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { VectorAvatar } from "@/components/vector-avatar"
import { isUserVip } from "@/lib/check-in"
import { extractMediaLinks, MediaPreview } from "@/lib/media-helpers"
import { generateHKUsername } from "@/lib/username-generator"

// 为静态导出生成示例用户ID
export function generateStaticParams() {
  // 在静态导出模式下，我们提供一些示例ID
  // 实际部署时，这些ID将被替换为真实的用户ID
  return [
    { userId: "00000000-0000-0000-0000-000000000001" },
    { userId: "00000000-0000-0000-0000-000000000002" },
    { userId: "00000000-0000-0000-0000-000000000003" },
    { userId: "00000000-0000-0000-0000-000000000004" },
    { userId: "00000000-0000-0000-0000-000000000005" },
  ]
}

// 創建消息表的函數
async function createMessagesTable(supabase: any) {
  try {
    const { error } = await supabase.rpc("execute_sql", {
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
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = 'messages' AND policyname = 'Users can view their own messages'
          ) THEN
            CREATE POLICY "Users can view their own messages" ON public.messages
              FOR SELECT
              USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = 'messages' AND policyname = 'Users can insert messages'
          ) THEN
            CREATE POLICY "Users can insert messages" ON public.messages
              FOR INSERT
              WITH CHECK (auth.uid() = sender_id);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = 'messages' AND policyname = 'Receivers can update read status'
          ) THEN
            CREATE POLICY "Receivers can update read status" ON public.messages
              FOR UPDATE
              USING (auth.uid() = receiver_id)
              WITH CHECK (auth.uid() = receiver_id);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = 'messages' AND policyname = 'Users can delete their own messages'
          ) THEN
            CREATE POLICY "Users can delete their own messages" ON public.messages
              FOR DELETE
              USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
          END IF;
        END
        $$;
      `,
    })

    if (error) throw error
    console.log("Messages table created successfully")
    return true
  } catch (error) {
    console.error("Error creating messages table:", error)
    return false
  }
}

// 創建通知
async function createNotification(supabase: any, userId: string, senderId: string, content: string) {
  try {
    // 檢查通知表是否存在
    const { error: checkError } = await supabase.from("notifications").select("id").limit(1)

    if (checkError && checkError.message.includes("does not exist")) {
      // 創建通知表
      const { error: createError } = await supabase.rpc("execute_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            related_id UUID,
            related_type TEXT,
            sender_id UUID,
            read BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
          );

          -- 設置行級安全策略
          ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

          -- 創建通知的安全策略
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'notifications' AND policyname = '用戶可以查看自己的通知'
            ) THEN
              CREATE POLICY "用戶可以查看自己的通知" ON public.notifications
                FOR SELECT USING (auth.uid() = user_id);
            END IF;

            IF NOT EXISTS (
              SELECT 1 FROM pg_policies
              WHERE tablename = 'notifications' AND policyname = '用戶可以更新自己的通知'
            ) THEN
              CREATE POLICY "用戶可以更新自己的通知" ON public.notifications
                FOR UPDATE USING (auth.uid() = user_id);
            END IF;
          END
          $$;

          -- 授予必要的權限
          GRANT ALL ON public.notifications TO authenticated;
          GRANT ALL ON public.notifications TO service_role;
        `,
      })

      if (createError) {
        console.error("Error creating notifications table:", createError)
        return false
      }
    }

    // 創建通知
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type: "message",
      content: content,
      related_id: senderId,
      related_type: "user",
      sender_id: senderId,
      read: false,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error creating notification:", error)
      return false
    }

    // 觸發通知更新事件
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("notifications-updated"))
    }

    return true
  } catch (error) {
    console.error("Error creating notification:", error)
    return false
  }
}

export default function ChatPage({ params }: { params: { userId: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [otherUserName, setOtherUserName] = useState("匿名用戶")
  const [isVip, setIsVip] = useState(false)
  const [canSendMessage, setCanSendMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messageMediaLinks, setMessageMediaLinks] = useState<{ [key: string]: { images: string[]; videos: string[] } }>(
    {},
  )

  // 檢查是否有 messages 表
  useEffect(() => {
    const checkMessagesTable = async () => {
      try {
        const { error } = await supabase.from("messages").select("id").limit(1)

        if (error && error.message.includes("relation") && error.message.includes("does not exist")) {
          // 創建 messages 表
          await createMessagesTable(supabase)
        }
      } catch (error) {
        console.error("Error checking messages table:", error)
      }
    }

    checkMessagesTable()
  }, [supabase])

  // 獲取當前用戶和對方用戶信息
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)

        // 獲取當前用戶
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          toast({
            title: "請先登入",
            description: "您需要登入才能查看私信",
          })
          router.push("/login")
          return
        }

        setCurrentUser(userData.user)

        // 檢查是否嘗試給自己發消息
        if (userData.user.id === params.userId) {
          toast({
            title: "無法給自己發送私信",
            description: "您不能給自己發送私信",
            variant: "destructive",
          })
          router.push("/messages")
          return
        }

        // 獲取對方用戶信息 - 只選擇存在的列
        const { data: otherUserData, error: otherUserError } = await supabase
          .from("users")
          .select("id, avatar_url, is_vip")
          .eq("id", params.userId)
          .single()

        if (otherUserError) {
          if (otherUserError.code === "PGRST116") {
            // 用戶不存在
            toast({
              title: "用戶不存在",
              description: "找不到該用戶",
              variant: "destructive",
            })
            router.push("/messages")
            return
          }
          throw otherUserError
        }

        // 從 posts 表獲取用戶的匿名名稱和頭像種子
        const { data: postData } = await supabase
          .from("posts")
          .select("anonymous_name, avatar_seed")
          .eq("user_id", params.userId)
          .order("created_at", { ascending: false })
          .limit(1)

        // 如果找不到帖子，生成一個隨機用戶名
        let userName = "匿名用戶"
        let avatarSeed = ""

        if (postData && postData.length > 0) {
          if (postData[0].anonymous_name) {
            userName = postData[0].anonymous_name
          }
          if (postData[0].avatar_seed) {
            avatarSeed = postData[0].avatar_seed
          } else {
            avatarSeed = userName
          }
        } else {
          userName = generateHKUsername()
          avatarSeed = userName
        }

        setOtherUserName(userName)

        // 合併用戶數據
        const mergedUserData = {
          ...otherUserData,
          avatar_seed: avatarSeed,
        }

        setOtherUser(mergedUserData)

        // 修改 VIP 提示邏輯
        // 檢查當前用戶是否是VIP
        const currentUserIsVip = await isUserVip(userData.user.id)
        setIsVip(currentUserIsVip)

        // 檢查是否可以發送消息
        // VIP用戶可以發送消息給任何人
        // 非VIP用戶只能回覆已有對話
        const { data: existingMessages, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${userData.user.id},receiver_id.eq.${userData.user.id}`)
          .or(`sender_id.eq.${params.userId},receiver_id.eq.${params.userId}`)
          .limit(1)

        if (messagesError) {
          // 如果是表不存在的錯誤，創建表
          if (messagesError.message.includes("relation") && messagesError.message.includes("does not exist")) {
            await createMessagesTable(supabase)
          } else {
            throw messagesError
          }
        }

        // VIP用戶可以發送消息給任何人
        // 非VIP用戶只能回覆已有對話或回覆VIP用戶
        const canSend =
          currentUserIsVip ||
          (existingMessages && existingMessages.length > 0) ||
          (mergedUserData && mergedUserData.is_vip)

        setCanSendMessage(canSend)

        // 如果不能發送消息，顯示提示
        if (!canSend && !currentUserIsVip) {
          toast({
            title: "無法發送私信",
            description: "您需要VIP權限才能發起私信對話",
          })
        }

        // 獲取消息
        await fetchMessages()
      } catch (error: any) {
        console.error("Error fetching users:", error)
        toast({
          title: "載入失敗",
          description: error.message || "獲取用戶信息時出現錯誤",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [router, supabase, params.userId])

  // 獲取消息
  const fetchMessages = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userData.user.id},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${userData.user.id})`,
        )
        .order("created_at", { ascending: true })

      if (error) {
        // 如果是表不存在的錯誤，創建表
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          const tableCreated = await createMessagesTable(supabase)
          if (tableCreated) {
            toast({
              title: "消息系統已初始化",
              description: "請再次嘗試發送消息",
            })
          } else {
            toast({
              title: "初始化失敗",
              description: "無法創建消息表，請聯繫管理員",
              variant: "destructive",
            })
          }
          return []
        }
        throw error
      }

      // 提取消息中的媒體鏈接
      const mediaMap: { [key: string]: { images: string[]; videos: string[] } } = {}
      data?.forEach((message) => {
        if (message.content) {
          mediaMap[message.id] = extractMediaLinks(message.content)
        }
      })
      setMessageMediaLinks(mediaMap)

      setMessages(data || [])

      // 標記消息為已讀
      if (data && data.length > 0) {
        const unreadMessages = data.filter((msg) => msg.receiver_id === userData.user.id && !msg.read)

        if (unreadMessages.length > 0) {
          await supabase
            .from("messages")
            .update({ read: true })
            .in(
              "id",
              unreadMessages.map((msg) => msg.id),
            )

          // 更新未讀消息計數
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("unread-messages-updated"))
          }
        }
      }

      return data || []
    } catch (error: any) {
      console.error("Error fetching messages:", error)
      toast({
        title: "載入失敗",
        description: error.message || "獲取消息時出現錯誤",
        variant: "destructive",
      })
      return []
    }
  }

  // 發送消息
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return
    if (!currentUser || !otherUser) return

    if (!canSendMessage && !isVip) {
      toast({
        title: "無法發送私信",
        description: "您需要VIP權限才能發起私信對話",
        variant: "destructive",
      })
      return
    }

    setSending(true)

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUser.id,
          receiver_id: otherUser.id,
          content: newMessage,
          read: false,
        })
        .select()

      if (error) throw error

      // 提取新消息中的媒體鏈接
      if (data && data[0]) {
        const newMessageMedia = extractMediaLinks(newMessage)
        setMessageMediaLinks({
          ...messageMediaLinks,
          [data[0].id]: newMessageMedia,
        })

        // 創建通知
        await createNotification(
          supabase,
          otherUser.id,
          currentUser.id,
          `您收到了一條新私信: ${newMessage.substring(0, 30)}${newMessage.length > 30 ? "..." : ""}`,
        )
      }

      // 更新消息列表
      const updatedMessages = await fetchMessages()
      setMessages(updatedMessages)
      setNewMessage("")

      // 滾動到底部
      scrollToBottom()
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast({
        title: "發送失敗",
        description: error.message || "發送消息時出現錯誤",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  // 滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // 監聽新消息
  useEffect(() => {
    scrollToBottom()

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `or(sender_id=eq.${currentUser?.id},receiver_id=eq.${currentUser?.id})`,
        },
        async (payload) => {
          // 如果是當前對話的消息，更新消息列表
          if (
            (payload.new.sender_id === currentUser?.id && payload.new.receiver_id === params.userId) ||
            (payload.new.sender_id === params.userId && payload.new.receiver_id === currentUser?.id)
          ) {
            const updatedMessages = await fetchMessages()
            setMessages(updatedMessages)
            scrollToBottom()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [messages, currentUser, params.userId, supabase])

  // 格式化時間
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("zh-HK", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("zh-HK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // 分組消息按日期
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: any[] }[] = []

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at).toLocaleDateString("zh-HK")
      const existingGroup = groups.find((group) => group.date === messageDate)

      if (existingGroup) {
        existingGroup.messages.push(message)
      } else {
        groups.push({
          date: messageDate,
          messages: [message],
        })
      }
    })

    return groups
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Button variant="ghost" className="mb-4" onClick={() => router.push("/messages")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <VectorAvatar seed={otherUser?.avatar_seed || ""} size="md" />
            <CardTitle className="text-lg">{otherUserName}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[60vh] overflow-y-auto p-4">
            {groupMessagesByDate().map((group, groupIndex) => (
              <div key={groupIndex} className="mb-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                    {formatDate(group.date)}
                  </div>
                </div>

                {group.messages.map((message) => {
                  const isCurrentUser = message.sender_id === currentUser?.id

                  return (
                    <div key={message.id} className={`flex mb-4 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      <div className={`flex gap-2 max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                        {!isCurrentUser && (
                          <VectorAvatar seed={otherUser?.avatar_seed || ""} size="sm" className="mt-1" />
                        )}
                        <div>
                          <div
                            className={`p-3 rounded-lg ${
                              isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <p className="whitespace-pre-line text-sm">{message.content}</p>

                            {/* 顯示消息中的媒體 */}
                            {messageMediaLinks[message.id] &&
                              (messageMediaLinks[message.id].images.length > 0 ||
                                messageMediaLinks[message.id].videos.length > 0) && (
                                <div className="mt-2">
                                  <MediaPreview
                                    images={messageMediaLinks[message.id].images}
                                    videos={messageMediaLinks[message.id].videos}
                                  />
                                </div>
                              )}
                          </div>
                          <p className={`text-xs text-muted-foreground mt-1 ${isCurrentUser ? "text-right" : ""}`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 修改表單部分，只在非VIP且不能發送消息時顯示提示 */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder={isVip || canSendMessage ? "輸入消息..." : "您需要VIP權限才能發起私信對話"}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending || (!isVip && !canSendMessage)}
              />
              <Button type="submit" disabled={sending || !newMessage.trim() || (!isVip && !canSendMessage)}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            {!isVip && !canSendMessage && (
              <p className="text-xs text-muted-foreground mt-2">連續打卡7天即可升級為VIP，解鎖私信功能</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
