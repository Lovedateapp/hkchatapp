import { createClient } from "@/lib/supabase"

// Function to generate a random Hong Kong style username
export async function generateHKUsername(): Promise<string> {
  try {
    const supabase = createClient()

    // Get random terms from each category
    const categories = ["地點", "食物", "稱謂", "動詞", "形容詞", "符號", "數字", "潮語"]
    const randomTerms: Record<string, string> = {}

    for (const category of categories) {
      const { data, error } = await supabase
        .from("hk_lexicon")
        .select("term")
        .eq("category", category)
        .order("RANDOM()")
        .limit(1)
        .single()

      if (error) {
        console.error(`Error fetching ${category}:`, error)
        continue
      }

      if (data) {
        randomTerms[category] = data.term
      }
    }

    // Generate username patterns - expanded for more combinations
    const patterns = [
      // Pattern 1: 地點 + 食物 (e.g., 旺角蛋撻)
      () => `${randomTerms["地點"] || "香港"}${randomTerms["食物"] || "美食"}`,

      // Pattern 2: 形容詞 + 稱謂 (e.g., 好正師奶)
      () => `${randomTerms["形容詞"] || "靚"}${randomTerms["稱謂"] || "巴打"}`,

      // Pattern 3: 潮語 + 符號 (e.g., GG★)
      () => `${randomTerms["潮語"] || "係咁先"}${randomTerms["符號"] || "★"}`,

      // Pattern 4: 動詞 + 數字 (e.g., OT2024)
      () => `${randomTerms["動詞"] || "食嘢"}${randomTerms["數字"] || "888"}`,

      // Pattern 5: 符號 + 地點 + 數字 (e.g., ★旺角007)
      () => `${randomTerms["符號"] || "★"}${randomTerms["地點"] || "香港"}${randomTerms["數字"] || "123"}`,

      // Pattern 6: Just use a random slang term
      () => randomTerms["潮語"] || "HK人",

      // Pattern 7: Emoji + 稱謂 (e.g., 😎大佬)
      () => `${getRandomEmoji()}${randomTerms["稱謂"] || "大佬"}`,

      // Pattern 8: 數字 + 地點 + 符號 (e.g., 852中環✨)
      () => `${randomTerms["數字"] || "852"}${randomTerms["地點"] || "中環"}${randomTerms["符號"] || "✨"}`,

      // Pattern 9: 形容詞 + 食物 + 符號 (e.g., 好味蛋撻👍)
      () => `${randomTerms["形容詞"] || "好味"}${randomTerms["食物"] || "蛋撻"}${getRandomEmoji()}`,

      // Pattern 10: 符號 + 潮語 + 符號 (e.g., ✨勁正✨)
      () => `${randomTerms["符號"] || "✨"}${randomTerms["潮語"] || "勁正"}${randomTerms["符號"] || "✨"}`,

      // Pattern 11: 數字 + 稱謂 + 數字 (e.g., 7大佬7)
      () =>
        `${randomTerms["數字"]?.substring(0, 1) || "7"}${randomTerms["稱謂"] || "大佬"}${randomTerms["數字"]?.substring(0, 1) || "7"}`,

      // Pattern 12: 動詞 + 地點 (e.g., 食嘢旺角)
      () => `${randomTerms["動詞"] || "食嘢"}${randomTerms["地點"] || "旺角"}`,
    ]

    // Select a random pattern
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)]
    let username = randomPattern()

    // Ensure username length is between 2-8 characters
    if (username.length > 8) {
      username = username.substring(0, 8)
    } else if (username.length < 2) {
      username += randomTerms["符號"] || "★"
    }

    return username
  } catch (error) {
    console.error("Error generating username:", error)
    // Fallback to enhanced username generation if database fails
    return enhancedFallbackUsernameGeneration()
  }
}

// Enhanced fallback function with more diverse characters
function enhancedFallbackUsernameGeneration(): string {
  // Chinese prefixes
  const prefixes = [
    "大",
    "小",
    "超",
    "神",
    "潮",
    "金",
    "銀",
    "鑽",
    "霸",
    "叻",
    "靚",
    "勁",
    "型",
    "酷",
    "萌",
    "猛",
    "強",
    "快",
    "慢",
    "高",
    "低",
    "肥",
    "瘦",
    "長",
    "短",
    "闊",
    "窄",
    "深",
    "淺",
    "硬",
    "軟",
    "香",
    "臭",
    "甜",
    "苦",
    "辣",
    "鹹",
    "酸",
    "澀",
    "爽",
  ]

  // Mix of Chinese, English, and special characters
  const middles = [
    "L",
    "B",
    "D",
    "波",
    "爆",
    "仔",
    "女",
    "神",
    "王",
    "咪",
    "A",
    "C",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "貓",
    "狗",
    "龍",
    "虎",
    "兔",
    "蛇",
    "馬",
    "羊",
    "猴",
    "雞",
    "豬",
    "牛",
    "鼠",
  ]

  // Mix of Chinese, English, and special characters
  const suffixes = [
    "事",
    "王",
    "神",
    "俠",
    "人",
    "咖",
    "后",
    "手",
    "霸",
    "星",
    "er",
    "or",
    "ar",
    "ist",
    "ian",
    "師",
    "長",
    "客",
    "生",
    "手",
    "家",
    "者",
    "員",
    "士",
    "姐",
    "哥",
    "弟",
    "妹",
    "叔",
    "姨",
  ]

  // Emojis
  const emojis = [
    "😀",
    "😎",
    "🔥",
    "💯",
    "👍",
    "👑",
    "💪",
    "🌟",
    "✨",
    "💖",
    "🎮",
    "🎯",
    "🏆",
    "🍜",
    "🍣",
    "🍦",
    "🍩",
    "🍰",
    "🍺",
    "☕",
  ]

  // Numbers
  const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

  // Symbols
  const symbols = ["★", "☆", "♥", "♦", "♣", "♠", "✓", "✗", "→", "←", "↑", "↓", "♪", "♫", "☀", "☁", "☂", "☃", "☄", "☮"]

  // Randomly decide the username pattern
  const patternType = Math.floor(Math.random() * 20)
  let username = ""

  switch (patternType) {
    case 0: // prefix + middle + suffix
      username =
        prefixes[Math.floor(Math.random() * prefixes.length)] +
        middles[Math.floor(Math.random() * middles.length)] +
        suffixes[Math.floor(Math.random() * suffixes.length)]
      break
    case 1: // emoji + prefix + middle
      username =
        emojis[Math.floor(Math.random() * emojis.length)] +
        prefixes[Math.floor(Math.random() * prefixes.length)] +
        middles[Math.floor(Math.random() * middles.length)]
      break
    case 2: // prefix + number + suffix
      username =
        prefixes[Math.floor(Math.random() * prefixes.length)] +
        numbers[Math.floor(Math.random() * numbers.length)] +
        suffixes[Math.floor(Math.random() * suffixes.length)]
      break
    case 3: // symbol + middle + symbol
      username =
        symbols[Math.floor(Math.random() * symbols.length)] +
        middles[Math.floor(Math.random() * middles.length)] +
        symbols[Math.floor(Math.random() * symbols.length)]
      break
    case 4: // number + prefix + emoji
      username =
        numbers[Math.floor(Math.random() * numbers.length)] +
        prefixes[Math.floor(Math.random() * prefixes.length)] +
        emojis[Math.floor(Math.random() * emojis.length)]
      break
    case 5: // middle + suffix + number
      username =
        middles[Math.floor(Math.random() * middles.length)] +
        suffixes[Math.floor(Math.random() * suffixes.length)] +
        numbers[Math.floor(Math.random() * numbers.length)]
      break
    case 6: // emoji + middle + emoji
      username =
        emojis[Math.floor(Math.random() * emojis.length)] +
        middles[Math.floor(Math.random() * middles.length)] +
        emojis[Math.floor(Math.random() * emojis.length)]
      break
    case 7: // symbol + prefix + number
      username =
        symbols[Math.floor(Math.random() * symbols.length)] +
        prefixes[Math.floor(Math.random() * prefixes.length)] +
        numbers[Math.floor(Math.random() * numbers.length)]
      break
    case 8: // prefix + emoji + suffix
      username =
        prefixes[Math.floor(Math.random() * prefixes.length)] +
        emojis[Math.floor(Math.random() * emojis.length)] +
        suffixes[Math.floor(Math.random() * suffixes.length)]
      break
    case 9: // number + symbol + middle
      username =
        numbers[Math.floor(Math.random() * numbers.length)] +
        symbols[Math.floor(Math.random() * symbols.length)] +
        middles[Math.floor(Math.random() * middles.length)]
      break
    case 10: // prefix + middle + emoji
      username =
        prefixes[Math.floor(Math.random() * prefixes.length)] +
        middles[Math.floor(Math.random() * middles.length)] +
        emojis[Math.floor(Math.random() * emojis.length)]
      break
    case 11: // symbol + suffix + symbol
      username =
        symbols[Math.floor(Math.random() * symbols.length)] +
        suffixes[Math.floor(Math.random() * suffixes.length)] +
        symbols[Math.floor(Math.random() * symbols.length)]
      break
    case 12: // emoji + number + prefix
      username =
        emojis[Math.floor(Math.random() * emojis.length)] +
        numbers[Math.floor(Math.random() * numbers.length)] +
        prefixes[Math.floor(Math.random() * prefixes.length)]
      break
    case 13: // middle + symbol + middle
      username =
        middles[Math.floor(Math.random() * middles.length)] +
        symbols[Math.floor(Math.random() * symbols.length)] +
        middles[Math.floor(Math.random() * middles.length)]
      break
    case 14: // number + emoji + number
      username =
        numbers[Math.floor(Math.random() * numbers.length)] +
        emojis[Math.floor(Math.random() * emojis.length)] +
        numbers[Math.floor(Math.random() * numbers.length)]
      break
    case 15: // suffix + prefix + suffix
      username =
        suffixes[Math.floor(Math.random() * suffixes.length)] +
        prefixes[Math.floor(Math.random() * prefixes.length)] +
        suffixes[Math.floor(Math.random() * suffixes.length)]
      break
    case 16: // symbol + number + symbol + number
      username =
        symbols[Math.floor(Math.random() * symbols.length)] +
        numbers[Math.floor(Math.random() * numbers.length)] +
        symbols[Math.floor(Math.random() * symbols.length)] +
        numbers[Math.floor(Math.random() * numbers.length)]
      break
    case 17: // prefix + suffix + emoji
      username =
        prefixes[Math.floor(Math.random() * prefixes.length)] +
        suffixes[Math.floor(Math.random() * suffixes.length)] +
        emojis[Math.floor(Math.random() * emojis.length)]
      break
    case 18: // middle + number + middle + number
      username =
        middles[Math.floor(Math.random() * middles.length)] +
        numbers[Math.floor(Math.random() * numbers.length)] +
        middles[Math.floor(Math.random() * middles.length)] +
        numbers[Math.floor(Math.random() * numbers.length)]
      break
    case 19: // emoji + symbol + emoji + symbol
      username =
        emojis[Math.floor(Math.random() * emojis.length)] +
        symbols[Math.floor(Math.random() * symbols.length)] +
        emojis[Math.floor(Math.random() * emojis.length)] +
        symbols[Math.floor(Math.random() * symbols.length)]
      break
  }

  // Ensure username length is between 2-8 characters
  if (username.length > 8) {
    username = username.substring(0, 8)
  } else if (username.length < 2) {
    username += symbols[Math.floor(Math.random() * symbols.length)]
  }

  return username
}

// Helper function to get a random emoji
function getRandomEmoji(): string {
  const emojis = [
    "😀",
    "😎",
    "🔥",
    "💯",
    "👍",
    "👑",
    "💪",
    "🌟",
    "✨",
    "💖",
    "🎮",
    "🎯",
    "🏆",
    "🍜",
    "🍣",
    "🍦",
    "🍩",
    "🍰",
    "🍺",
    "☕",
    "😊",
    "😂",
    "😍",
    "🥰",
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
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🐔",
    "🐧",
    "🐦",
    "🐤",
    "🐣",
    "🦆",
    "🦅",
    "🦉",
    "🦇",
    "🐺",
  ]
  return emojis[Math.floor(Math.random() * emojis.length)]
}

// Generate a batch of random usernames
export async function generateMultipleUsernames(count: number): Promise<string[]> {
  const usernames: string[] = []
  for (let i = 0; i < count; i++) {
    usernames.push(await generateHKUsername())
  }
  return usernames
}
