"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { PostCard } from "@/components/post-card"
import { getCategoryLabel } from "@/lib/categories"

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const categorySlug = params.slug
  const categoryLabel = getCategoryLabel(categorySlug)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .contains("categories", [categorySlug])
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error

        setPosts(data || [])
      } catch (err: any) {
        console.error("Error fetching posts by category:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [categorySlug])

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">#{categoryLabel}</h1>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-4">載入失敗: {error}</p>
              <Button onClick={() => window.location.reload()}>重試</Button>
            </CardContent>
          </Card>
        ) : posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-4">暫無 #{categoryLabel} 分類的貼文</p>
              <Link href="/create-post">
                <Button>發布貼文</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
