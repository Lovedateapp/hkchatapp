import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 執行 SQL 來修復 VIP 狀態
    await supabase.rpc("execute_sql", {
      sql_query: `
        -- 確保 vip_expires_at 欄位存在
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMP WITH TIME ZONE;

        -- 將 is_vip 設置為 true，如果 vip_expires_at 有效
        UPDATE public.users
        SET is_vip = true
        WHERE vip_expires_at IS NOT NULL AND vip_expires_at > NOW();

        -- 將 is_vip 設置為 false，如果 vip_expires_at 已過期
        UPDATE public.users
        SET is_vip = false
        WHERE vip_expires_at IS NULL OR vip_expires_at <= NOW();

        -- 同步 vip_until 和 vip_expires_at
        UPDATE public.users
        SET vip_until = vip_expires_at
        WHERE vip_expires_at IS NOT NULL AND (vip_until IS NULL OR vip_until <> vip_expires_at);

        UPDATE public.users
        SET vip_expires_at = vip_until
        WHERE vip_until IS NOT NULL AND (vip_expires_at IS NULL OR vip_expires_at <> vip_until);
      `,
    })

    return NextResponse.json({ success: true, message: "VIP 狀態已修復" })
  } catch (error) {
    console.error("修復 VIP 狀態時出錯:", error)
    return NextResponse.json({ success: false, message: "修復 VIP 狀態時出錯", error }, { status: 500 })
  }
}
