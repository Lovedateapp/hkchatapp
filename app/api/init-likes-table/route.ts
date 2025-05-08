import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if the likes table exists
    const { error: checkError } = await supabase.from("likes").select("id").limit(1)

    // If the table doesn't exist, create it
    if (checkError && checkError.message.includes("does not exist")) {
      // Create the likes table with a transaction to avoid race conditions
      const { error } = await supabase.rpc("execute_sql", {
        sql_query: `
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
        `,
      })

      if (error) {
        console.error("Error creating likes table:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in init-likes-table route:", error)
    return NextResponse.json({ error: "Failed to initialize likes table" }, { status: 500 })
  }
}
