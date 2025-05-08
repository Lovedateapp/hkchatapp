import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 使用服務角色執行SQL
    const { error } = await supabase.rpc("execute_sql", {
      sql_query: `
        -- 刪除所有現有策略
        DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
        DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
        DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
        DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
        DROP POLICY IF EXISTS "Service role can manage reports" ON public.reports;

        -- 創建新的策略
        -- 允許已認證用戶創建報告
        CREATE POLICY "Users can create reports" ON public.reports
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        -- 允許用戶查看自己的報告
        CREATE POLICY "Users can view their own reports" ON public.reports
          FOR SELECT USING (auth.uid() = reporter_id);

        -- 允許服務角色完全管理報告
        CREATE POLICY "Service role can manage reports" ON public.reports
          USING (auth.role() = 'service_role');

        -- 允許管理員查看所有報告
        CREATE POLICY "Admins can view all reports" ON public.reports
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.admins
              WHERE user_id = auth.uid()
            )
          );

        -- 允許管理員更新報告
        CREATE POLICY "Admins can update reports" ON public.reports
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM public.admins
              WHERE user_id = auth.uid()
            )
          );
      `,
    })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "報告表策略已成功修復",
    })
  } catch (error) {
    console.error("修復報告表策略失敗:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "修復報告表策略失敗",
      },
      { status: 500 },
    )
  }
}
