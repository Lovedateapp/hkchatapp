import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const error = requestUrl.searchParams.get("error")

    // 如果有错误，重定向到错误页面
    if (error) {
      console.error("Google OAuth error:", error)
      return NextResponse.redirect(new URL("/login?error=google_oauth", request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", request.url))
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // 使用code交换会话
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError)
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, request.url))
    }

    // 成功登录，重定向到首页
    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("Unexpected error in Google callback:", error)
    return NextResponse.redirect(new URL("/login?error=unexpected", request.url))
  }
}
