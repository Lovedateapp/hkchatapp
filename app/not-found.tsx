import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl text-center">頁面不存在</CardTitle>
          <CardDescription className="text-center">您訪問的頁面不存在或已被移除</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link href="/">
            <Button>返回首頁</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
