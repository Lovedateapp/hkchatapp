// 香港風格的隨機用戶名生成器
export function generateHKUsername(): string {
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
    "勁",
    "爆",
    "型",
    "靚",
    "醒",
    "扮",
    "激",
    "正",
    "索",
    "冧",
    "酷",
    "萌",
    "乖",
    "甜",
    "辣",
    "狂",
    "飛",
    "跳",
    "笑",
    "哭",
  ]

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
    "J",
    "K",
    "豬",
    "貓",
    "龍",
    "虎",
    "鬼",
    "馬",
    "牛",
    "雞",
    "狗",
    "兔",
    "蛇",
    "羊",
    "猴",
    "雞",
    "鼠",
    "魚",
    "蝦",
    "蟹",
  ]

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
    "獲",
    "爺",
    "姐",
    "哥",
    "姑",
    "叔",
    "嫂",
    "爸",
    "媽",
    "仔",
    "妹",
    "弟",
    "姨",
    "叔",
    "公",
    "婆",
    "爵",
    "帝",
    "后",
    "主",
  ]

  // 特殊組合用戶名
  const specialUsernames = [
    "大L獲",
    "講呢D",
    "唔識唔好講",
    "食屎啦你",
    "收皮啦",
    "咁都得",
    "唔好搞我",
    "廢青",
    "黃屍",
    "藍絲",
    "手足",
    "老細",
    "師奶",
    "港女",
    "港男",
    "MK妹",
    "MK仔",
    "毒男",
    "宅女",
    "巴打",
    "絲打",
    "on9",
    "on99",
    "柒頭",
    "戇鳩",
    "好心",
    "唔該",
    "多謝",
    "收嗲",
    "發夢",
    "發噏瘋",
    "冇眼睇",
    "冇得救",
    "好L煩",
    "好L正",
    "好L靚",
    "好L型",
    "好L勁",
    "好L叻",
    "好L醒",
    "好L扮",
    "好L激",
    "好L索",
    "😂",
    "🤣",
    "😅",
    "😆",
    "😁",
    "😄",
    "😃",
    "😀",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
  ]

  // 英文名字
  const englishNames = [
    "Andy",
    "Billy",
    "Candy",
    "Danny",
    "Eddy",
    "Fanny",
    "Gary",
    "Harry",
    "Ivy",
    "Jimmy",
    "Kenny",
    "Larry",
    "Mandy",
    "Nancy",
    "Oscar",
    "Penny",
    "Queenie",
    "Ricky",
    "Sandy",
    "Tommy",
    "Vicky",
    "Wendy",
    "Xander",
    "Yanny",
    "Zoe",
  ]

  // 數字
  const numbers = ["007", "123", "456", "789", "666", "888", "999", "101", "404", "520", "1314"]

  // 隨機決定用戶名類型
  const randomType = Math.random()

  // 25%幾率使用特殊用戶名
  if (randomType < 0.25) {
    return specialUsernames[Math.floor(Math.random() * specialUsernames.length)]
  }

  // 20%幾率使用2-3字用戶名
  if (randomType < 0.45) {
    const twoCharPrefixes = ["大", "小", "老", "阿", "細", "肥", "瘦", "靚", "醜", "傻", "乖", "甜", "辣", "狂", "飛"]
    const twoCharSuffixes = [
      "佬",
      "妹",
      "哥",
      "姐",
      "叔",
      "嫂",
      "爺",
      "媽",
      "爸",
      "仔",
      "女",
      "豬",
      "貓",
      "狗",
      "龍",
      "虎",
      "鬼",
      "馬",
      "牛",
      "雞",
    ]

    // 50%機率使用2字，50%機率使用3字
    if (Math.random() < 0.5) {
      return (
        twoCharPrefixes[Math.floor(Math.random() * twoCharPrefixes.length)] +
        twoCharSuffixes[Math.floor(Math.random() * twoCharSuffixes.length)]
      )
    } else {
      return (
        twoCharPrefixes[Math.floor(Math.random() * twoCharPrefixes.length)] +
        middles[Math.floor(Math.random() * middles.length)] +
        twoCharSuffixes[Math.floor(Math.random() * twoCharSuffixes.length)]
      )
    }
  }

  // 20%幾率使用英文+數字組合
  if (randomType < 0.65) {
    const engName = englishNames[Math.floor(Math.random() * englishNames.length)]

    // 50%機率加數字
    if (Math.random() < 0.5) {
      return engName + numbers[Math.floor(Math.random() * numbers.length)]
    }
    return engName
  }

  // 15%幾率使用香港地區縮寫+數字
  if (randomType < 0.8) {
    const hkDistricts = ["HK", "MK", "CWB", "TST", "SSP", "YL", "TW", "KT", "TM", "ST"]
    return (
      hkDistricts[Math.floor(Math.random() * hkDistricts.length)] + numbers[Math.floor(Math.random() * numbers.length)]
    )
  }

  // 10%幾率使用表情符號+文字
  if (randomType < 0.9) {
    const emojis = [
      "😂",
      "🤣",
      "😅",
      "😆",
      "😁",
      "😄",
      "😃",
      "😀",
      "😊",
      "😇",
      "🙂",
      "🙃",
      "😉",
      "😌",
      "😍",
      "🥰",
      "😘",
    ]
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]

    // 隨機選擇是前置還是後置表情符號
    if (Math.random() < 0.5) {
      return (
        emoji +
        prefixes[Math.floor(Math.random() * prefixes.length)] +
        suffixes[Math.floor(Math.random() * suffixes.length)]
      )
    } else {
      return (
        prefixes[Math.floor(Math.random() * prefixes.length)] +
        suffixes[Math.floor(Math.random() * suffixes.length)] +
        emoji
      )
    }
  }

  // 默認使用三字組合
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const middle = middles[Math.floor(Math.random() * middles.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]

  return `${prefix}${middle}${suffix}`
}

// 生成一批隨機用戶名
export function generateMultipleUsernames(count: number): string[] {
  const usernames: string[] = []
  for (let i = 0; i < count; i++) {
    usernames.push(generateHKUsername())
  }
  return usernames
}
