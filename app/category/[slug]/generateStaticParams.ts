import { categories } from "@/lib/categories"

// 为静态导出生成所有可能的分类路径
export function generateStaticParams() {
  return categories.map((category) => ({
    slug: category.value,
  }))
}
