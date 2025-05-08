-- Create the likes table if it doesn't exist
DO $$
BEGIN
  -- Create the likes table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.likes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
  );

  -- Create indexes if they don't exist
  CREATE INDEX IF NOT EXISTS likes_user_id_idx ON public.likes(user_id);
  CREATE INDEX IF NOT EXISTS likes_post_id_idx ON public.likes(post_id);

  -- Enable RLS
  ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

  -- Create policies if they don't exist
  BEGIN
    CREATE POLICY "Anyone can view likes" ON public.likes
      FOR SELECT
      USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;

  BEGIN
    CREATE POLICY "Authenticated users can insert likes" ON public.likes
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;

  BEGIN
    CREATE POLICY "Users can delete their own likes" ON public.likes
      FOR DELETE
      USING (auth.uid() = user_id);
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- Create a function to create notifications for private messages
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a notification for the recipient
  INSERT INTO public.notifications (
    user_id,
    type,
    content,
    related_user_id,
    related_id,
    read,
    created_at
  ) VALUES (
    NEW.recipient_id,
    'message',
    '您收到了一條新私信',
    NEW.sender_id,
    NEW.id,
    false,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DO $$
BEGIN
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS on_message_created ON public.messages;
  
  -- Create the trigger
  CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist yet, do nothing
    NULL;
END $$;
