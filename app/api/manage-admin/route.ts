import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, isAdmin } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "用戶ID不能為空" }, { status: 400 })
    }

    // 使用服務角色客戶端
    const supabase = createClient()

    // 獲取當前用戶
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授權" }, { status: 401 })
    }

    // 檢查當前用戶是否是管理員
    const { data: currentUserAdmin, error: checkError } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!currentUserAdmin) {
      return NextResponse.json({ error: "只有管理員可以管理其他管理員" }, { status: 403 })
    }

    // 防止移除自己的管理員權限
    if (!isAdmin && userId === session.user.id) {
      return NextResponse.json({ error: "您不能移除自己的管理員權限" }, { status: 400 })
    }

    if (isAdmin) {
      // 添加管理員
      const { error: insertError } = await supabase
        .from("admins")
        .insert({
          user_id: userId,
        })
        .select()

      if (insertError) {
        if (insertError.code === "23505") {
          return NextResponse.json({ message: "用戶已經是管理員" }, { status: 200 })
        }

        console.error("添加管理員失敗:", insertError)
        return NextResponse.json({ error: `添加管理員失敗: ${insertError.message}` }, { status: 500 })
      }
    } else {
      // 移除管理員
      const { error: deleteError } = await supabase.from("admins").delete().eq("user_id", userId)

      if (deleteError) {
        console.error("移除管理員失敗:", deleteError)
        return NextResponse.json({ error: `移除管理員失敗: ${deleteError.message}` }, { status: 500 })
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: isAdmin ? "管理員設置成功" : "管理員移除成功",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("管理管理員時出錯:", error)
    return NextResponse.json({ error: "管理管理員時出錯" }, { status: 500 })
  }
}
