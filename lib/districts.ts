// 香港的18個行政區
export const districts = [
  { value: "central_western", name: "中西區" },
  { value: "wan_chai", name: "灣仔區" },
  { value: "eastern", name: "東區" },
  { value: "southern", name: "南區" },
  { value: "yau_tsim_mong", name: "油尖旺區" },
  { value: "sham_shui_po", name: "深水埗區" },
  { value: "kowloon_city", name: "九龍城區" },
  { value: "wong_tai_sin", name: "黃大仙區" },
  { value: "kwun_tong", name: "觀塘區" },
  { value: "kwai_tsing", name: "葵青區" },
  { value: "tsuen_wan", name: "荃灣區" },
  { value: "tuen_mun", name: "屯門區" },
  { value: "yuen_long", name: "元朗區" },
  { value: "north", name: "北區" },
  { value: "tai_po", name: "大埔區" },
  { value: "sha_tin", name: "沙田區" },
  { value: "sai_kung", name: "西貢區" },
  { value: "islands", name: "離島區" },
]

export function getDistrictName(value: string): string {
  const district = districts.find((d) => d.value === value)
  return district ? district.name : value
}
