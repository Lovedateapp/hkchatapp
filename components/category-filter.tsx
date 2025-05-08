"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { categories } from "@/lib/categories"

export function CategoryFilter() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null)
      router.push("/")
    } else {
      setSelectedCategory(category)
      router.push(`/category/${category}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">分類</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors",
                selectedCategory === category.value
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : "hover:bg-muted",
              )}
              onClick={() => handleCategoryClick(category.value)}
            >
              #{category.label}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
