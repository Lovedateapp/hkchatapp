import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { BottomNav } from "@/components/bottom-nav"
import { Analytics } from "@/components/analytics"
import { ErrorBoundary } from "@/components/error-boundary"
import { cn } from "@/lib/utils"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HKchat",
  description: "香港專屬社交平台，分享生活，結交朋友",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-HK" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary>
            <div className="relative flex min-h-screen flex-col">
              <Suspense fallback={<div className="h-14 border-b"></div>}>
                <Navbar />
              </Suspense>
              <div className="flex-1">{children}</div>
              <Suspense fallback={<div className="h-16 border-t"></div>}>
                <BottomNav className="hidden" />
              </Suspense>
            </div>
            <Toaster />
            <Analytics />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
