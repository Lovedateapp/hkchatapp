import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = "force-static";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "用戶ID不能為空" }, { status: 400 })
    }

    // 使用服務角色客戶端
    const supabase = createClient()

    // 檢查用戶是否是管理員
    const { data, error } = await supabase.from("admins").select("id").eq("user_id", userId).single()

    if (error && error.code !== "PGRST116") {
      console.error("檢查管理員狀態失敗:", error)
      return NextResponse.json({ error: `檢查管理員狀態失敗: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ isAdmin: !!data }, { status: 200 })
  } catch (error) {
    console.error("檢查管理員狀態時出錯:", error)
    return NextResponse.json({ error: "檢查管理員狀態時出錯" }, { status: 500 })
  }
}
