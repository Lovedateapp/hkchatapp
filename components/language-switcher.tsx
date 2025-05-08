"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { type Language, languageNames, getCurrentLanguage, setLanguage } from "@/lib/i18n"

export function LanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getCurrentLanguage())

  useEffect(() => {
    // 初始化当前语言
    setCurrentLanguage(getCurrentLanguage())

    // 监听语言变更事件
    const handleLanguageChange = () => {
      setCurrentLanguage(getCurrentLanguage())
    }

    window.addEventListener("languageChange", handleLanguageChange)

    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  const handleLanguageChange = (language: Language) => {
    setLanguage(language)
    setCurrentLanguage(language)

    // 刷新页面以应用新语言
    // 在实际应用中，您可能希望使用更复杂的状态管理来避免刷新
    window.location.reload()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">切換語言</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.entries(languageNames) as [Language, string][]).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code)}
            className={currentLanguage === code ? "bg-accent" : ""}
          >
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
