"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, Image, Video } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase"
import { generateHKUsername } from "@/lib/username-generator"
import { districts } from "@/lib/districts"
import { categories } from "@/lib/categories"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AspectRatio } from "@/components/ui/aspect-ratio"

export default function CreatePostPage() {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [district, setDistrict] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [anonymousName, setAnonymousName] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        toast({
          title: "請先登入",
          description: "您需要登入才能發布貼文",
        })
        router.push("/login")
        return
      }

      setUser(data.user)

      // 生成匿名用戶名
      const username = generateHKUsername()
      setAnonymousName(username)

      // 獲取用戶默認地區
      try {
        const { data: userData, error } = await supabase
          .from("users")
          .select("district")
          .eq("id", data.user.id)
          .single()

        if (!error && userData && userData.district) {
          setDistrict(userData.district)
        }
      } catch (error) {
        console.error("Error fetching user district:", error)
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: "內容不能為空",
        description: "請輸入貼文內容",
        variant: "destructive",
      })
      return
    }

    if (!district) {
      toast({
        title: "請選擇地區",
        description: "請選擇您所在的地區",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // 處理內容中的媒體鏈接 - 使用隱藏標記
      let finalContent = content

      // 如果有圖片URL，添加到內容末尾（使用特殊標記）
      if (imageUrl) {
        finalContent += `\n\n<!-- IMAGE_URL: ${imageUrl} -->`
      }

      // 如果有視頻URL，添加到內容末尾（使用特殊標記）
      if (videoUrl) {
        finalContent += `\n\n<!-- VIDEO_URL: ${videoUrl} -->`
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({
          content: finalContent,
          user_id: user.id,
          district,
          categories: selectedCategories.length > 0 ? selectedCategories : null,
          anonymous_name: anonymousName,
          avatar_seed: anonymousName,
        })
        .select()

      if (error) throw error

      toast({
        title: "發布成功",
        description: "您的貼文已成功發布",
      })

      // 跳轉到貼文詳情頁
      if (data && data[0]) {
        router.push(`/post/${data[0].id}`)
      } else {
        router.push("/")
      }
    } catch (error: any) {
      console.error("Error creating post:", error)
      toast({
        title: "發布失敗",
        description: error.message || "發布貼文時出現錯誤",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddImage = () => {
    if (imageUrl) {
      // 檢查URL是否為有效的圖片URL
      const isValidImageUrl = /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl)

      if (!isValidImageUrl) {
        toast({
          title: "無效的圖片URL",
          description: "請輸入有效的圖片URL（.jpg, .jpeg, .png, .gif, .webp）",
          variant: "destructive",
        })
        return
      }

      setImagePreview(imageUrl)
      setIsImageDialogOpen(false)
    }
  }

  const handleAddVideo = () => {
    if (videoUrl) {
      // 檢查URL是否為有效的視頻URL
      const isYouTube = /(?:youtube\.com\/watch\?v=|youtu\.be\/)/i.test(videoUrl)
      const isFacebook = /facebook\.com\/.*\/videos\//i.test(videoUrl)
      const isTikTok = /tiktok\.com\/@.*\/video\//i.test(videoUrl)
      const isInstagram = /instagram\.com\/(?:p|reel)\//i.test(videoUrl)
      const isTwitter = /(?:twitter\.com|x\.com)\/[^/]+\/status\//i.test(videoUrl)

      if (!isYouTube && !isFacebook && !isTikTok && !isInstagram && !isTwitter) {
        toast({
          title: "無效的視頻URL",
          description: "請輸入有效的YouTube、Facebook、TikTok、Instagram或X.com視頻URL",
          variant: "destructive",
        })
        return
      }

      setIsVideoDialogOpen(false)
    }
  }

  const toggleCategory = (categoryValue: string) => {
    if (selectedCategories.includes(categoryValue)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== categoryValue))
    } else {
      if (selectedCategories.length < 3) {
        setSelectedCategories([...selectedCategories, categoryValue])
      } else {
        toast({
          title: "最多選擇3個標籤",
          description: "請最多選擇3個分類標籤",
        })
      }
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>發布新貼文</CardTitle>
          <CardDescription>分享你的想法，結交新朋友</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">內容</Label>
              <Textarea
                id="content"
                placeholder="分享你的想法..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px]"
                required
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Image className="h-4 w-4 mr-2" />
                    添加圖片
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加圖片</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="image-url">圖片URL</Label>
                      <Input
                        id="image-url"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">支持的格式: .jpg, .jpeg, .png, .gif, .webp</p>
                    </div>
                    {imageUrl && (
                      <div className="border rounded-md overflow-hidden">
                        <img
                          src={imageUrl || "/placeholder.svg"}
                          alt="預覽"
                          className="w-full h-auto object-contain"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=400"
                          }}
                        />
                      </div>
                    )}
                    <Button type="button" onClick={handleAddImage} className="w-full">
                      確認添加
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Video className="h-4 w-4 mr-2" />
                    添加視頻
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加視頻</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="video-url">視頻URL</Label>
                      <Input
                        id="video-url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        支持YouTube、Facebook、TikTok、Instagram和X.com視頻鏈接
                      </p>
                    </div>
                    <Button type="button" onClick={handleAddVideo} className="w-full">
                      確認添加
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {imageUrl && (
                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
                  <Image className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">已添加圖片</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1"
                    onClick={() => {
                      setImageUrl("")
                      setImagePreview("")
                    }}
                  >
                    &times;
                  </Button>
                </div>
              )}

              {videoUrl && (
                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
                  <Video className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">已添加視頻</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1"
                    onClick={() => setVideoUrl("")}
                  >
                    &times;
                  </Button>
                </div>
              )}
            </div>

            {imagePreview && (
              <div className="border rounded-md overflow-hidden">
                <AspectRatio ratio={16 / 9} className="bg-muted">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="預覽圖片"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=400"
                    }}
                  />
                </AspectRatio>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="district">地區</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇地區" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories">分類標籤 (最多選3個)</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {categories.map((category) => (
                  <Button
                    key={category.value}
                    type="button"
                    variant={selectedCategories.includes(category.value) ? "default" : "outline"}
                    size="sm"
                    className="h-auto py-1 px-2 text-xs"
                    onClick={() => toggleCategory(category.value)}
                  >
                    #{category.label}
                  </Button>
                ))}
              </div>
              {selectedCategories.length > 0 && (
                <p className="text-xs text-muted-foreground">{`已選擇 ${selectedCategories.length}/3 個標籤`}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="anonymous-name">匿名用戶名</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="anonymous-name"
                  value={anonymousName}
                  onChange={(e) => setAnonymousName(e.target.value)}
                  disabled
                  className="bg-muted"
                />
                <Button type="button" variant="outline" onClick={() => setAnonymousName(generateHKUsername())}>
                  重新生成
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              發布貼文
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
