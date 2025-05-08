-- Function to check if another function exists
CREATE OR REPLACE FUNCTION public.check_function_exists(function_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  func_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = function_name
  ) INTO func_exists;
  
  RETURN func_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create the execute_sql function
CREATE OR REPLACE FUNCTION public.create_execute_sql_function()
RETURNS BOOLEAN AS $$
BEGIN
  -- Create the execute_sql function if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'execute_sql'
  ) THEN
    EXECUTE $EXEC$
      CREATE OR REPLACE FUNCTION public.execute_sql(sql_query text)
      RETURNS void AS $INNER$
      BEGIN
        EXECUTE sql_query;
      END;
      $INNER$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Set function permissions
      GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
      GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role;
    $EXEC$;
  END IF;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize database tables
CREATE OR REPLACE FUNCTION public.initialize_database_tables()
RETURNS BOOLEAN AS $$
BEGIN
  -- Create users table if it doesn't exist
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
  
  -- Set RLS policies for users table
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can view all users" ON public.users;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
  
  -- Create new policies
  CREATE POLICY "Users can view all users" 
    ON public.users FOR SELECT 
    USING (true);
    
  CREATE POLICY "Users can update their own profile" 
    ON public.users FOR UPDATE 
    USING (auth.uid() = id);
    
  CREATE POLICY "Users can insert their own profile" 
    ON public.users FOR INSERT 
    WITH CHECK (auth.uid() = id);
  
  -- Create reports table if it doesn't exist
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
  
  -- Set RLS policies for reports table
  ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
  DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;
  DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
  
  -- Create new policies
  CREATE POLICY "Users can view their own reports" 
    ON public.reports FOR SELECT 
    USING (auth.uid() = reporter_id);
    
  CREATE POLICY "Users can insert their own reports" 
    ON public.reports FOR INSERT 
    WITH CHECK (auth.uid() = reporter_id);
  
  CREATE POLICY "Admins can view all reports" 
    ON public.reports FOR SELECT 
    USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()) = true);
  
  -- Grant permissions
  GRANT ALL ON public.users TO authenticated;
  GRANT ALL ON public.users TO service_role;
  GRANT ALL ON public.reports TO authenticated;
  GRANT ALL ON public.reports TO service_role;
  GRANT USAGE, SELECT ON SEQUENCE reports_id_seq TO authenticated;
  GRANT USAGE, SELECT ON SEQUENCE reports_id_seq TO service_role;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION public.check_function_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_function_exists(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_execute_sql_function() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_execute_sql_function() TO service_role;
GRANT EXECUTE ON FUNCTION public.initialize_database_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_database_tables() TO service_role;
