import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = "force-static";

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "用戶ID不能為空" }, { status: 400 })
    }

    // 使用服務角色客戶端
    const supabase = createClient()

    // 使用execute_sql RPC函數執行SQL
    const { error: sqlError } = await supabase.rpc("execute_sql", {
      sql: `
        -- 確保admins表存在
        CREATE TABLE IF NOT EXISTS public.admins (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(user_id)
        );
        
        -- 啟用RLS
        ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
        
        -- 刪除所有現有策略
        DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
        DROP POLICY IF EXISTS "Admins can insert new admins" ON public.admins;
        DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;
        DROP POLICY IF EXISTS "Authenticated users can view admins" ON public.admins;
        DROP POLICY IF EXISTS "Service role can manage admins" ON public.admins;
        
        -- 創建新策略
        CREATE POLICY "Authenticated users can view admins" ON public.admins
          FOR SELECT USING (auth.role() = 'authenticated');
        
        CREATE POLICY "Service role can manage admins" ON public.admins
          USING (auth.role() = 'service_role');
          
        -- 插入管理員記錄
        INSERT INTO public.admins (user_id)
        VALUES ('${userId}')
        ON CONFLICT (user_id) DO NOTHING;
      `,
    })

    if (sqlError) {
      console.error("執行SQL失敗:", sqlError)
      return NextResponse.json({ error: `執行SQL失敗: ${sqlError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "管理員設置成功" }, { status: 200 })
  } catch (error) {
    console.error("設置管理員時出錯:", error)
    return NextResponse.json({ error: "設置管理員時出錯" }, { status: 500 })
  }
}
