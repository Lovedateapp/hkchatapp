import { createClient } from "@/lib/supabase"

// Check if a user is an admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  if (!userId) return false

  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", userId).single()

    if (error) {
      console.error("Error checking admin status:", error)
      return false
    }

    return data?.is_admin || false
  } catch (error) {
    console.error("Unexpected error checking admin status:", error)
    return false
  }
}

// Set a user as admin (only callable by existing admins)
export async function setUserAsAdmin(userId: string, isAdmin: boolean): Promise<boolean> {
  try {
    const supabase = createClient()

    // First check if the current user is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    }

    const currentUserIsAdmin = await isUserAdmin(session.user.id)

    if (!currentUserIsAdmin) {
      throw new Error("Only admins can set admin status")
    }

    // Update the target user's admin status
    const { error } = await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", userId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("Error setting admin status:", error)
    return false
  }
}
