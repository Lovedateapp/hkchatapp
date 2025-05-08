"use client"

import { Button } from "@/components/ui/button"
import { Flag } from "lucide-react"
import { ReportDialog } from "@/components/report-dialog"

interface ReportButtonProps {
  postId: number
  commentId?: number
  postContent?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ReportButton({ postId, commentId, postContent, variant = "ghost", size = "icon" }: ReportButtonProps) {
  return (
    <ReportDialog
      trigger={
        <Button variant={variant} size={size} className="text-muted-foreground" aria-label="舉報">
          <Flag className="h-4 w-4" />
        </Button>
      }
      postId={postId}
      commentId={commentId}
      postContent={postContent}
    />
  )
}
