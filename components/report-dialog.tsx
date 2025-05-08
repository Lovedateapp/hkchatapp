"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cleanPostContent } from "@/lib/media-helpers"

interface ReportDialogProps {
  trigger: React.ReactNode
  postId: number
  commentId?: number
  postContent?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ReportDialog({
  trigger,
  postId,
  commentId,
  postContent,
  open: controlledOpen,
  onOpenChange,
}: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined
  const isOpen = isControlled ? controlledOpen : open
  const setIsOpen = isControlled ? onOpenChange : setOpen

  const cleanedContent = postContent ? cleanPostContent(postContent) : ""

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "請輸入舉報原因",
        description: "舉報原因不能為空",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // 獲取當前用戶
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "請先登入",
          description: "您需要登入才能舉報內容",
          variant: "destructive",
        })
        return
      }

      // 檢查報告表是否存在
      const { error: checkError } = await supabase.from("reports").select("id").limit(1)

      if (checkError && checkError.message.includes("does not exist")) {
        // 創建報告表
        const { error: createError } = await supabase.rpc("execute_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS public.reports (
              id BIGSERIAL PRIMARY KEY,
              reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
              comment_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE,
              reason TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'pending',
              post_content TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW(),
              CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
            );

            -- 創建索引
            CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON public.reports(reporter_id);
            CREATE INDEX IF NOT EXISTS reports_post_id_idx ON public.reports(post_id);
            CREATE INDEX IF NOT EXISTS reports_comment_id_idx ON public.reports(comment_id);
            CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);

            -- 設置RLS策略
            ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

            -- 用戶可以查看自己的舉報
            CREATE POLICY "Users can view their own reports" ON public.reports
              FOR SELECT
              USING (auth.uid() = reporter_id);

            -- 管理員可以查看所有舉報
            CREATE POLICY "Admins can view all reports" ON public.reports
              FOR SELECT
              USING (
                EXISTS (
                  SELECT 1 FROM public.admins
                  WHERE user_id = auth.uid()
                )
              );

            -- 用戶可以創建舉報
            CREATE POLICY "Users can create reports" ON public.reports
              FOR INSERT
              WITH CHECK (auth.uid() = reporter_id);

            -- 管理員可以更新舉報狀態
            CREATE POLICY "Admins can update reports" ON public.reports
              FOR UPDATE
              USING (
                EXISTS (
                  SELECT 1 FROM public.admins
                  WHERE user_id = auth.uid()
                )
              );
          `,
        })

        if (createError) {
          console.error("Error creating reports table:", createError)
          toast({
            title: "舉報失敗",
            description: "系統錯誤，請稍後再試",
            variant: "destructive",
          })
          return
        }
      }

      // 創建舉報記錄
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        post_id: postId,
        comment_id: commentId,
        reason: reason,
        status: "pending",
        post_content: cleanedContent || postContent,
      })

      if (error) throw error

      toast({
        title: "舉報成功",
        description: "感謝您的舉報，我們會盡快處理",
      })

      // 重置表單並關閉對話框
      setReason("")
      setIsOpen(false)
    } catch (error) {
      console.error("舉報失敗:", error)
      toast({
        title: "舉報失敗",
        description: "請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>舉報內容</DialogTitle>
          <DialogDescription>請描述您舉報的原因，我們會盡快處理</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {cleanedContent && cleanedContent.length > 0 && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium mb-1">舉報的內容:</p>
              <p className="text-muted-foreground">
                {cleanedContent.length > 100 ? `${cleanedContent.substring(0, 100)}...` : cleanedContent}
              </p>
            </div>
          )}
          <div className="grid gap-2">
            <Textarea
              id="reason"
              placeholder="請輸入舉報原因..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "提交中..." : "提交舉報"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
