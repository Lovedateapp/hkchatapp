import { createClient } from "@/lib/supabase"

export async function ensureMessagesTable() {
  const supabase = createClient()

  try {
    // 檢查 public.messages 表是否存在
    const { error: checkError } = await supabase.from("messages").select("id").limit(1)

    if (checkError && checkError.message.includes("does not exist")) {
      console.log("Creating messages table...")

      // 使用 SQL 直接創建表
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
          CREATE POLICY "Receivers can update read status" ON public.messages
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
        console.error("Error creating messages table:", createError)
        return { success: false, error: createError }
      }

      return { success: true, created: true }
    }

    return { success: true, created: false }
  } catch (error) {
    console.error("Error ensuring messages table:", error)
    return { success: false, error }
  }
}

export async function ensureAllTables() {
  await ensureMessagesTable()
  // 可以添加其他表的初始化
}
