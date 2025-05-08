import { districts } from "@/lib/districts"

// 为静态导出生成所有可能的地区路径
export function generateStaticParams() {
  return districts.map((district) => ({
    slug: district.value,
  }))
}
