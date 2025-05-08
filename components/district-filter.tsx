"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { districts } from "@/lib/districts"

export function DistrictFilter() {
  const router = useRouter()
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredDistricts = districts.filter(
    (district) =>
      district.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      district.value.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleDistrictClick = (district: string) => {
    if (selectedDistrict === district) {
      setSelectedDistrict(null)
      router.push("/")
    } else {
      setSelectedDistrict(district)
      router.push(`/district/${district}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">地區</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋地區..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filteredDistricts.map((district) => (
            <Badge
              key={district.value}
              variant={selectedDistrict === district.value ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors",
                selectedDistrict === district.value
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : "hover:bg-muted",
              )}
              onClick={() => handleDistrictClick(district.value)}
            >
              {district.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
