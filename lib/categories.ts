export const categories = [
  { value: "閒聊", label: "閒聊" },
  { value: "交友", label: "交友" },
  { value: "美食", label: "美食" },
  { value: "旅遊", label: "旅遊" },
  { value: "電影", label: "電影" },
  { value: "音樂", label: "音樂" },
  { value: "遊戲", label: "遊戲" },
  { value: "運動", label: "運動" },
  { value: "寵物", label: "寵物" },
  { value: "工作", label: "工作" },
  { value: "學習", label: "學習" },
  { value: "科技", label: "科技" },
  { value: "時尚", label: "時尚" },
  { value: "健康", label: "健康" },
  { value: "情感", label: "情感" },
  { value: "求助", label: "求助" },
  { value: "其他", label: "其他" },
]

export function getCategoryLabel(value: string): string {
  const category = categories.find((c) => c.value === value)
  return category ? category.label : value
}
