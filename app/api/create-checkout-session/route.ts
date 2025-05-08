import { NextResponse } from "next/server"

export const dynamic = "force-static";

// 在静态导出模式下，禁用Stripe支付功能
export async function POST(request: Request) {
  // 返回模拟响应
  return NextResponse.json(
    {
      message: "Stripe payments are disabled in static export mode",
      mockSessionId: "mock_session_" + Date.now()
    },
    { status: 200 }
  )
}
