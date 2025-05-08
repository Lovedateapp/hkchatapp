// 支持的语言
export type Language = "zh-HK" | "zh-CN" | "en"

// 语言名称映射
export const languageNames: Record<Language, string> = {
  "zh-HK": "繁體中文",
  "zh-CN": "简体中文",
  en: "English",
}

// 默认语言
export const defaultLanguage: Language = "zh-HK"

// 获取当前语言
export function getCurrentLanguage(): Language {
  if (typeof window === "undefined") {
    return defaultLanguage
  }

  const savedLanguage = localStorage.getItem("language") as Language
  if (savedLanguage && Object.keys(languageNames).includes(savedLanguage)) {
    return savedLanguage
  }

  return defaultLanguage
}

// 设置语言
export function setLanguage(language: Language): void {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem("language", language)

  // 触发语言变更事件
  window.dispatchEvent(new Event("languageChange"))
}

// 翻译函数类型
export type TranslationFunction = (key: string, params?: Record<string, string>) => string

// 创建翻译函数
export function createTranslation(translations: Record<string, Record<string, string>>): TranslationFunction {
  return (key: string, params?: Record<string, string>): string => {
    const language = getCurrentLanguage()
    const translation = translations[language]?.[key] || translations[defaultLanguage]?.[key] || key

    if (params) {
      return Object.entries(params).reduce(
        (acc, [paramKey, paramValue]) => acc.replace(new RegExp(`{{${paramKey}}}`, "g"), paramValue),
        translation,
      )
    }

    return translation
  }
}
