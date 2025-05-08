"use client"

import { useMemo } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface VectorAvatarProps {
  seed: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function VectorAvatar({ seed, size = "md", className }: VectorAvatarProps) {
  // 根據種子生成一致的頭像
  const avatarData = useMemo(() => {
    // 使用種子生成一個偽隨機數
    const hashCode = (str: string) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i)
        hash = hash & hash // 轉換為32位整數
      }
      return Math.abs(hash)
    }

    const hash = hashCode(seed)

    // 背景顏色 - 40種不同顏色
    const bgColors = [
      "bg-red-400",
      "bg-red-500",
      "bg-red-600",
      "bg-pink-400",
      "bg-pink-500",
      "bg-pink-600",
      "bg-purple-400",
      "bg-purple-500",
      "bg-purple-600",
      "bg-indigo-400",
      "bg-indigo-500",
      "bg-indigo-600",
      "bg-blue-400",
      "bg-blue-500",
      "bg-blue-600",
      "bg-cyan-400",
      "bg-cyan-500",
      "bg-cyan-600",
      "bg-teal-400",
      "bg-teal-500",
      "bg-teal-600",
      "bg-green-400",
      "bg-green-500",
      "bg-green-600",
      "bg-yellow-400",
      "bg-yellow-500",
      "bg-yellow-600",
      "bg-orange-400",
      "bg-orange-500",
      "bg-orange-600",
      "bg-amber-500",
      "bg-lime-500",
      "bg-emerald-500",
      "bg-sky-500",
      "bg-violet-500",
      "bg-fuchsia-500",
      "bg-rose-500",
      "bg-slate-500",
      "bg-zinc-500",
      "bg-stone-500",
    ]

    const bgColor = bgColors[hash % bgColors.length]

    // 返回第一個字符作為頭像文本
    const text = seed.charAt(0).toUpperCase()

    // 表情符號列表 - 30種不同表情
    const emojis = [
      "😊",
      "😂",
      "😍",
      "🥰",
      "😎",
      "🤩",
      "🥳",
      "😇",
      "🤔",
      "🙃",
      "😋",
      "😜",
      "🤪",
      "😝",
      "🤑",
      "🤗",
      "🤭",
      "🤫",
      "🤐",
      "😏",
      "😻",
      "😼",
      "😽",
      "🙀",
      "😿",
      "😾",
      "🙈",
      "🙉",
      "🙊",
      "🐵",
    ]
    const emoji = emojis[hash % emojis.length]

    // 決定是否使用表情或文字
    const useEmoji = hash % 3 === 0 // 33%幾率使用表情

    return {
      bgColor,
      text,
      emoji,
      useEmoji,
    }
  }, [seed])

  // 根據尺寸確定類名
  const sizeClass = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  }[size]

  return (
    <Avatar className={`${sizeClass} ${avatarData.bgColor} text-white flex items-center justify-center ${className}`}>
      <AvatarFallback className={`${avatarData.bgColor} text-white font-bold`}>
        {avatarData.useEmoji ? avatarData.emoji : avatarData.text}
      </AvatarFallback>
    </Avatar>
  )
}
