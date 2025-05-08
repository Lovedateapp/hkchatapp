import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin", {
      user_uuid: user.id,
    })

    if (adminError || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Execute SQL to add view_count column if it doesn't exist
    const { error: alterError } = await supabase.rpc("execute_sql", {
      sql_query: `
        ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
        CREATE INDEX IF NOT EXISTS posts_view_count_idx ON public.posts (view_count);
      `,
    })

    if (alterError) {
      console.error("Error adding view_count column:", alterError)
      return NextResponse.json({ error: alterError.message }, { status: 500 })
    }

    // Initialize view_count for existing posts based on like_count and comment_count
    const { error: updateError } = await supabase.rpc("execute_sql", {
      sql_query: `
        UPDATE public.posts 
        SET view_count = (like_count * 3) + (comment_count * 5) 
        WHERE view_count = 0 OR view_count IS NULL;
      `,
    })

    if (updateError) {
      console.error("Error initializing view_count:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "View count initialized successfully" })
  } catch (error: any) {
    console.error("Error in init-view-count:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
