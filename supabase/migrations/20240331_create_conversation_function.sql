-- 創建獲取最近對話的函數
CREATE OR REPLACE FUNCTION get_recent_conversations(user_id_param UUID)
RETURNS TABLE (
  other_user_id UUID,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 檢查消息表是否存在
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'messages'
  ) THEN
    -- 如果表不存在，返回空結果
    RETURN;
  END IF;

  -- 返回最近對話
  RETURN QUERY
  WITH conversation_partners AS (
    -- 找出所有與該用戶有過對話的用戶
    SELECT DISTINCT
      CASE
        WHEN sender_id = user_id_param THEN receiver_id
        ELSE sender_id
      END AS other_user_id
    FROM public.messages
    WHERE sender_id = user_id_param OR receiver_id = user_id_param
  ),
  last_messages AS (
    -- 獲取每個對話的最後一條消息
    SELECT
      cp.other_user_id,
      (
        SELECT content
        FROM public.messages m
        WHERE (m.sender_id = user_id_param AND m.receiver_id = cp.other_user_id)
           OR (m.sender_id = cp.other_user_id AND m.receiver_id = user_id_param)
        ORDER BY created_at DESC
        LIMIT 1
      ) AS last_message,
      (
        SELECT created_at
        FROM public.messages m
        WHERE (m.sender_id = user_id_param AND m.receiver_id = cp.other_user_id)
           OR (m.sender_id = cp.other_user_id AND m.receiver_id = user_id_param)
        ORDER BY created_at DESC
        LIMIT 1
      ) AS last_message_time,
      (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.sender_id = cp.other_user_id
          AND m.receiver_id = user_id_param
          AND m.read = FALSE
      ) AS unread_count
    FROM conversation_partners cp
  )
  SELECT
    other_user_id,
    last_message,
    last_message_time,
    unread_count
  FROM last_messages
  WHERE last_message IS NOT NULL
  ORDER BY last_message_time DESC;
END;
$$;
