import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = "force-static";

export async function POST() {
  try {
    const supabase = createClient()

    // Check if the messages table exists
    const { error: checkError } = await supabase.from("messages").select("id").limit(1)

    if (checkError && checkError.message.includes("does not exist")) {
      // Create the messages table
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

      if (error) {
        console.error("Error creating messages table:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Messages table created successfully" })
    }

    return NextResponse.json({ success: true, message: "Messages table already exists" })
  } catch (error: any) {
    console.error("Error initializing messages table:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
