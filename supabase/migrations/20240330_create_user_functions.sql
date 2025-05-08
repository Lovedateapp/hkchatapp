-- Create a function to create user records
CREATE OR REPLACE FUNCTION public.create_user_record(
  user_id UUID,
  user_email TEXT,
  user_gender TEXT
)
RETURNS void AS $$
BEGIN
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
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set permissions
ALTER FUNCTION public.create_user_record(UUID, TEXT, TEXT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.create_user_record TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_record TO service_role;
