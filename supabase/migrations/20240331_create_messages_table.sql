-- 創建消息表的函數
CREATE OR REPLACE FUNCTION create_messages_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 檢查表是否已存在
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'messages'
  ) THEN
    -- 創建消息表
    CREATE TABLE public.messages (
      id BIGSERIAL PRIMARY KEY,
      sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 創建索引
    CREATE INDEX messages_sender_id_idx ON public.messages(sender_id);
    CREATE INDEX messages_receiver_id_idx ON public.messages(receiver_id);
    CREATE INDEX messages_created_at_idx ON public.messages(created_at);

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

    -- 只允許發送者更新自己的消息
    CREATE POLICY "Users can update their own messages" ON public.messages
      FOR UPDATE
      USING (auth.uid() = sender_id);

    -- 只允許發送者和接收者刪除消息
    CREATE POLICY "Users can delete their own messages" ON public.messages
      FOR DELETE
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
  END IF;
END;
$$;
