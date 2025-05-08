-- Function to create a report
CREATE OR REPLACE FUNCTION public.create_report(
  p_post_id INTEGER,
  p_reporter_id UUID,
  p_reason TEXT,
  p_post_content TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Ensure the reports table exists
  CREATE TABLE IF NOT EXISTS public.reports (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL,
    reporter_id UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    post_content TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  
  -- Insert the report
  INSERT INTO public.reports (
    post_id,
    reporter_id,
    reason,
    post_content,
    created_at
  ) VALUES (
    p_post_id,
    p_reporter_id,
    p_reason,
    p_post_content,
    now()
  );
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_report(INTEGER, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_report(INTEGER, UUID, TEXT, TEXT) TO service_role;

-- Function to create a user record
CREATE OR REPLACE FUNCTION public.create_user_record(
  user_id UUID,
  user_email TEXT,
  user_gender TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Ensure the users table exists
  CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    username TEXT,
    district TEXT,
    gender TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    avatar_url TEXT,
    is_vip BOOLEAN DEFAULT false,
    vip_until TIMESTAMP WITH TIME ZONE,
    check_in_streak INTEGER DEFAULT 0,
    last_check_in DATE
  );
  
  -- Insert the user record
  INSERT INTO public.users (
    id,
    email,
    gender,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_email,
    user_gender,
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user_record(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_record(UUID, TEXT, TEXT) TO service_role;
