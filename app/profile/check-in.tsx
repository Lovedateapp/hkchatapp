"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Calendar, CheckCircle2, XCircle, Trophy } from "lucide-react"
import { formatDistanceToNow, format, addDays, isToday } from "date-fns"
import { zhHK } from "date-fns/locale"
import { isUserVip } from "@/lib/check-in"
import Link from "next/link"

export function CheckInComponent() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [checkInHistory, setCheckInHistory] = useState<any[]>([])
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null)
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [consecutiveDays, setConsecutiveDays] = useState(0)
  const [isVip, setIsVip] = useState(false)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [hasPosted, setHasPosted] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          setLoading(false)
          return
        }

        setUser(userData.user)

        // 檢查打卡表是否存在
        const { error: tableCheckError } = await supabase.from("check_ins").select("id").limit(1)

        // 如果表不存在，創建表
        if (tableCheckError && tableCheckError.message.includes("does not exist")) {
          const { error: createError } = await supabase.rpc("execute_sql", {
            sql_query: `
              CREATE TABLE IF NOT EXISTS public.check_ins (
                id BIGSERIAL PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, check_in_date)
              );
              
              -- 創建索引
              CREATE INDEX IF NOT EXISTS check_ins_user_id_idx ON public.check_ins(user_id);
              CREATE INDEX IF NOT EXISTS check_ins_check_in_date_idx ON public.check_ins(check_in_date);
              
              -- 設置RLS策略
              ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
              
              -- 用戶只能查看自己的打卡記錄
              CREATE POLICY "Users can view their own check-ins" ON public.check_ins
                FOR SELECT
                USING (auth.uid() = user_id);
              
              -- 用戶只能為自己打卡
              CREATE POLICY "Users can insert their own check-ins" ON public.check_ins
                FOR INSERT
                WITH CHECK (auth.uid() = user_id);
            `,
          })

          if (createError) {
            console.error("Error creating check_ins table:", createError)
            toast({
              title: "系統錯誤",
              description: "無法創建打卡記錄，請稍後再試",
              variant: "destructive",
            })
            setLoading(false)
            return
          }
        }

        // 獲取用戶打卡歷史
        const { data: checkIns, error: checkInsError } = await supabase
          .from("check_ins")
          .select("*")
          .eq("user_id", userData.user.id)
          .order("check_in_date", { ascending: false })

        if (checkInsError) {
          console.error("Error fetching check-ins:", checkInsError)
          toast({
            title: "獲取打卡記錄失敗",
            description: checkInsError.message,
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        setCheckInHistory(checkIns || [])

        // 檢查今天是否已打卡
        const today = new Date().toISOString().split("T")[0]
        const todayCheckIn = checkIns?.find((ci) => ci.check_in_date === today)
        setCheckedInToday(!!todayCheckIn)

        // 獲取最後一次打卡日期
        if (checkIns && checkIns.length > 0) {
          setLastCheckIn(new Date(checkIns[0].check_in_date))
        }

        // 計算連續打卡天數
        let consecutive = 0
        if (checkIns && checkIns.length > 0) {
          // 按日期排序（從舊到新）
          const sortedCheckIns = [...checkIns].sort(
            (a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime(),
          )

          let currentDate = new Date(sortedCheckIns[0].check_in_date)
          consecutive = 1

          for (let i = 1; i < sortedCheckIns.length; i++) {
            const nextDate = new Date(sortedCheckIns[i].check_in_date)
            const expectedNextDate = addDays(currentDate, 1)

            if (nextDate.toISOString().split("T")[0] === expectedNextDate.toISOString().split("T")[0]) {
              consecutive++
              currentDate = nextDate
            } else {
              // 如果日期不連續，重新開始計數
              consecutive = 1
              currentDate = nextDate
            }
          }
        }
        setConsecutiveDays(consecutive)

        // 獲取用戶貼文數量
        const { data: posts, error: postsError } = await supabase
          .from("posts")
          .select("id")
          .eq("user_id", userData.user.id)

        if (postsError) {
          console.error("Error fetching user posts:", postsError)
        } else {
          setUserPosts(posts || [])
          setHasPosted(posts && posts.length > 0)
        }

        // 檢查是否為VIP
        const vipStatus = await isUserVip(userData.user.id)
        setIsVip(vipStatus)
      } catch (error: any) {
        console.error("Error fetching user data:", error)
        toast({
          title: "獲取用戶數據失敗",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [supabase])

  const handleCheckIn = async () => {
    if (!user) {
      toast({
        title: "請先登入",
        description: "您需要登入才能打卡",
      })
      return
    }

    if (checkedInToday) {
      toast({
        title: "今天已經打卡",
        description: "您今天已經打卡了，明天再來吧！",
      })
      return
    }

    setCheckingIn(true)
    try {
      const today = new Date().toISOString().split("T")[0]

      const { error } = await supabase.from("check_ins").insert({
        user_id: user.id,
        check_in_date: today,
      })

      if (error) {
        if (error.code === "23505") {
          // 唯一約束衝突
          toast({
            title: "今天已經打卡",
            description: "您今天已經打卡了，明天再來吧！",
          })
          setCheckedInToday(true)
        } else {
          throw error
        }
      } else {
        toast({
          title: "打卡成功",
          description: "恭喜您完成今日打卡！",
        })

        // 更新打卡歷史
        const newCheckIn = {
          id: Date.now(),
          user_id: user.id,
          check_in_date: today,
          created_at: new Date().toISOString(),
        }

        setCheckInHistory([newCheckIn, ...checkInHistory])
        setCheckedInToday(true)
        setLastCheckIn(new Date())

        // 更新連續打卡天數
        const yesterday = addDays(new Date(), -1).toISOString().split("T")[0]
        const hasYesterdayCheckIn = checkInHistory.some((ci) => ci.check_in_date === yesterday)

        if (hasYesterdayCheckIn) {
          setConsecutiveDays(consecutiveDays + 1)
        } else {
          setConsecutiveDays(1)
        }

        // 檢查是否為VIP
        const vipStatus = await isUserVip(user.id)
        setIsVip(vipStatus)
      }
    } catch (error: any) {
      console.error("Error checking in:", error)
      toast({
        title: "打卡失敗",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setCheckingIn(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "yyyy年MM月dd日", { locale: zhHK })
    } catch (error) {
      return dateString
    }
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: zhHK,
      })
    } catch (error) {
      return dateString
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>每日打卡</CardTitle>
          <CardDescription>
            連續打卡7天並發布至少1篇貼文即可免費成為VIP用戶。VIP用戶才可以私信別人及找尋附近的人。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <p className="text-muted-foreground mb-4">請先登入以開始打卡</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>每日打卡</CardTitle>
            <CardDescription>
              連續打卡7天並發布至少1篇貼文即可免費成為VIP用戶。VIP用戶才可以私信別人及找尋附近的人。
            </CardDescription>
          </div>
          {isVip && (
            <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-medium">VIP用戶</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center py-2">
          <div className="text-4xl font-bold mb-2">{consecutiveDays}</div>
          <p className="text-muted-foreground">連續打卡天數</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <div className="text-lg font-medium mb-1">{checkInHistory.length}</div>
            <p className="text-sm text-muted-foreground">總打卡次數</p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <div className="text-lg font-medium mb-1">{userPosts.length}</div>
            <p className="text-sm text-muted-foreground">已發布貼文</p>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">VIP要求</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {consecutiveDays >= 7 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm">連續打卡7天 ({consecutiveDays}/7)</span>
            </div>
            <div className="flex items-center gap-2">
              {hasPosted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm">發布至少1篇貼文 ({userPosts.length}/1)</span>
            </div>
          </div>
        </div>

        {!hasPosted && (
          <div className="text-center">
            <Link href="/create-post">
              <Button variant="outline" size="sm">
                發布貼文
              </Button>
            </Link>
          </div>
        )}

        <div className="flex justify-center">
          <Button onClick={handleCheckIn} disabled={checkedInToday || checkingIn} className="w-full">
            {checkingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                打卡中...
              </>
            ) : checkedInToday ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                今日已打卡
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                立即打卡
              </>
            )}
          </Button>
        </div>

        {lastCheckIn && (
          <p className="text-xs text-center text-muted-foreground">
            上次打卡: {formatDate(lastCheckIn.toISOString())} ({formatTimeAgo(lastCheckIn.toISOString())})
          </p>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="w-full">
          <h3 className="text-sm font-medium mb-2">最近打卡記錄</h3>
          {checkInHistory.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {checkInHistory.slice(0, 5).map((checkIn) => (
                <div key={checkIn.id} className="flex justify-between items-center text-sm">
                  <span>{formatDate(checkIn.check_in_date)}</span>
                  <span className="text-xs text-muted-foreground">
                    {isToday(new Date(checkIn.check_in_date)) ? "今天" : formatTimeAgo(checkIn.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">暫無打卡記錄</p>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
