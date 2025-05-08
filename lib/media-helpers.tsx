"use client"

import { useState } from "react"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { ImageLightbox } from "@/components/image-lightbox"

// 提取媒體鏈接
export function extractMediaLinks(content: string): { images: string[]; videos: string[] } {
  const images: string[] = []
  const videos: string[] = []

  // 提取圖片URL
  const imageRegex = /<!-- IMAGE_URL: (https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)) -->/gi
  let imageMatch
  while ((imageMatch = imageRegex.exec(content)) !== null) {
    images.push(imageMatch[1])
  }

  // 提取視頻URL
  const videoRegex = /<!-- VIDEO_URL: (https?:\/\/[^\s]+) -->/gi
  let videoMatch
  while ((videoMatch = videoRegex.exec(content)) !== null) {
    videos.push(videoMatch[1])
  }

  // 如果沒有特殊標記，嘗試直接提取URL
  if (images.length === 0 && videos.length === 0) {
    // 圖片URL
    const imgUrlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi
    let imgMatch
    while ((imgMatch = imgUrlRegex.exec(content)) !== null) {
      images.push(imgMatch[1])
    }

    // 視頻URL
    const videoUrlRegex =
      /(https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|facebook\.com\/.*\/videos\/|tiktok\.com\/@.*\/video\/|instagram\.com\/(?:p|reel)\/|(?:twitter|x)\.com\/[^/]+\/status\/)[^\s]+)/gi
    let vidMatch
    while ((vidMatch = videoUrlRegex.exec(content)) !== null) {
      videos.push(vidMatch[1])
    }
  }

  return { images, videos }
}

// 清理帖子內容，移除媒體URL
export function cleanPostContent(content: string): string {
  // 移除特殊標記的媒體URL
  let cleaned = content.replace(/<!-- IMAGE_URL: https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp) -->/gi, "")
  cleaned = cleaned.replace(/<!-- VIDEO_URL: https?:\/\/[^\s]+ -->/gi, "")

  // 移除普通媒體URL
  cleaned = cleaned.replace(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi, "")
  cleaned = cleaned.replace(
    /(https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|facebook\.com\/.*\/videos\/|tiktok\.com\/@.*\/video\/|instagram\.com\/(?:p|reel)\/|(?:twitter|x)\.com\/[^/]+\/status\/)[^\s]+)/gi,
    "",
  )

  // 移除多餘的空行
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n")

  return cleaned.trim()
}

// 媒體預覽組件
export function MediaPreview({ images, videos }: { images: string[]; videos: string[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState("")

  const openLightbox = (imageUrl: string) => {
    setCurrentImage(imageUrl)
    setLightboxOpen(true)
  }

  return (
    <div className="space-y-2">
      {images.map((url, index) => (
        <div
          key={`img-${index}`}
          className="border rounded-md overflow-hidden cursor-pointer"
          onClick={() => openLightbox(url)}
        >
          <AspectRatio ratio={16 / 9} className="bg-muted">
            <img
              src={url || "/placeholder.svg"}
              alt={`圖片 ${index + 1}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=400"
              }}
            />
          </AspectRatio>
        </div>
      ))}

      {videos.map((url, index) => {
        // YouTube
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          const videoId = url.includes("youtube.com/watch?v=")
            ? new URL(url).searchParams.get("v")
            : url.split("/").pop()

          return (
            <div key={`vid-${index}`} className="border rounded-md overflow-hidden">
              <AspectRatio ratio={16 / 9}>
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={`YouTube 視頻 ${index + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </AspectRatio>
            </div>
          )
        }

        // Twitter/X
        if (url.includes("twitter.com") || url.includes("x.com")) {
          return (
            <div key={`vid-${index}`} className="border rounded-md p-4 bg-muted">
              <p className="text-sm text-center">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  在 X 上查看視頻
                </a>
              </p>
            </div>
          )
        }

        // 其他視頻平台
        return (
          <div key={`vid-${index}`} className="border rounded-md p-4 bg-muted">
            <p className="text-sm text-center">
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                查看視頻
              </a>
            </p>
          </div>
        )
      })}

      {/* 圖片燈箱 */}
      <ImageLightbox
        src={currentImage || "/placeholder.svg"}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  )
}
