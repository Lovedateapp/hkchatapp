// 帮助用户配置Google OAuth的指南
export const googleAuthSetupGuide = `
# Google OAuth 配置指南

## 1. 创建 Google Cloud 项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 在左侧菜单中，导航到 "APIs & Services" > "Credentials"

## 2. 配置 OAuth 同意屏幕
1. 点击 "OAuth consent screen"
2. 选择用户类型（External 或 Internal）
3. 填写应用名称、用户支持电子邮件等必填信息
4. 添加授权域名（例如 yourapp.vercel.app）
5. 保存并继续

## 3. 创建 OAuth 客户端 ID
1. 点击 "Credentials" > "Create Credentials" > "OAuth client ID"
2. 选择应用类型为 "Web application"
3. 添加名称（例如 "My App OAuth Client"）
4. 添加授权的 JavaScript 来源：
   - 开发环境: http://localhost:3000
   - 生产环境: https://yourapp.vercel.app
5. 添加授权的重定向 URI：
   - 开发环境: http://localhost:3000/auth/callback
   - 生产环境: https://yourapp.vercel.app/auth/callback
6. 点击 "Create"

## 4. 获取客户端 ID 和密钥
创建后，您将获得：
- Client ID
- Client Secret

## 5. 在 Supabase 中配置
1. 登录 Supabase 控制台
2. 导航到 Authentication > Providers
3. 找到 Google 并启用
4. 输入您的 Client ID 和 Client Secret
5. 保存更改

## 6. 在应用中使用
确保您的应用中使用的重定向 URL 与您在 Google Cloud Console 中配置的完全匹配。
`

// 检查并修复常见的 Google OAuth 错误
export function checkGoogleOAuthSetup() {
  // 检查环境变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      isValid: false,
      error: "缺少 Supabase 环境变量",
      solution: "请确保已设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 环境变量。",
    }
  }

  // 检查重定向 URI
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")
  const expectedRedirectUri = `${appUrl}/auth/callback`

  return {
    isValid: true,
    redirectUri: expectedRedirectUri,
    message: `请确保在 Google Cloud Console 中添加了以下重定向 URI: ${expectedRedirectUri}`,
  }
}
