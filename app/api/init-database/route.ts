import { createClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = createClient()

    // Check if execute_sql function exists
    const { data: functionExists, error: checkError } = await supabase.rpc("check_function_exists", {
      function_name: "execute_sql",
    })

    if (checkError) {
      // If we can't check, try to create the function directly
      await supabase.rpc("create_execute_sql_function")
    } else if (!functionExists) {
      // Function doesn't exist, create it
      await supabase.rpc("create_execute_sql_function")
    }

    // Initialize database tables
    await supabase.rpc("initialize_database_tables")

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
