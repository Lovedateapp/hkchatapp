"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageLightboxProps {
  src: string
  alt?: string
  isOpen: boolean
  onClose: () => void
}

export function ImageLightbox({ src, alt = "圖片", isOpen, onClose }: ImageLightboxProps) {
  const [loaded, setLoaded] = useState(false)

  // Close on escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // Prevent body scrolling when lightbox is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-full max-h-full">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70 rounded-full"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">關閉</span>
        </Button>

        <div className={cn("relative transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}>
          <img
            src={src || "/placeholder.svg"}
            alt={alt}
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
            onLoad={() => setLoaded(true)}
          />
        </div>

        {!loaded && (
          <div className="flex items-center justify-center h-20 w-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    </div>
  )
}
