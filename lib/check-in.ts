import { createClient } from "@/lib/supabase"

export type CheckInStatus = {
  lastCheckIn: string | null
  streak: number
  isVip: boolean
  vipExpiresAt?: string | null
}

export async function checkIn(): Promise<any> {
  try {
    const supabase = createClient()

    // 獲取當前用戶
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        message: "請先登入",
      }
    }

    // 確保 check_ins 表存在
    await supabase.rpc("execute_sql", {
      sql_query: `
        -- 確保 check_ins 表存在
        CREATE TABLE IF NOT EXISTS public.check_ins (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) NOT NULL,
          check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(user_id, check_in_date)
        );
        
        -- 確保 check_ins 表有正確的權限
        ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
        
        -- 確保 check_ins 表有正確的 RLS 策略
        DROP POLICY IF EXISTS "Users can view their own check-ins" ON public.check_ins;
        CREATE POLICY "Users can view their own check-ins" ON public.check_ins
          FOR SELECT USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert their own check-ins" ON public.check_ins;
        CREATE POLICY "Users can insert their own check-ins" ON public.check_ins
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      `,
    })

    // 檢查用戶表是否存在必要的列
    await supabase.rpc("execute_sql", {
      sql_query: `
        -- 確保 users 表存在
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY REFERENCES auth.users(id),
          email TEXT,
          username TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          last_check_in DATE,
          check_in_streak INTEGER DEFAULT 0,
          is_vip BOOLEAN DEFAULT false,
          vip_until TIMESTAMP WITH TIME ZONE,
          is_admin BOOLEAN DEFAULT false,
          gender TEXT,
          district TEXT
        );
        
        -- 添加缺失的列
        DO $$
        BEGIN
          BEGIN
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_check_in DATE;
          EXCEPTION WHEN OTHERS THEN
            -- 忽略錯誤
          END;
          
          BEGIN
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS check_in_streak INTEGER DEFAULT 0;
          EXCEPTION WHEN OTHERS THEN
            -- 忽略錯誤
          END;
          
          BEGIN
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
          EXCEPTION WHEN OTHERS THEN
            -- 忽略錯誤
          END;
          
          BEGIN
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vip_until TIMESTAMP WITH TIME ZONE;
          EXCEPTION WHEN OTHERS THEN
            -- 忽略錯誤
          END;
          
          BEGIN
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMP WITH TIME ZONE;
          EXCEPTION WHEN OTHERS THEN
            -- 忽略錯誤
          END;
        END $$;
      `,
    })

    // 獲取用戶資料
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("last_check_in, check_in_streak, is_vip, vip_expires_at")
      .eq("id", user.id)
      .single()

    if (userError) {
      // 如果用戶記錄不存在，則創建一個
      if (userError.code === "PGRST116") {
        await supabase.from("users").insert({
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } else {
        return {
          success: false,
          message: "獲取用戶資料失敗: " + userError.message,
        }
      }
    }

    // 檢查是否已經打卡
    const today = new Date().toISOString().split("T")[0]
    if (userData?.last_check_in === today) {
      return {
        success: false,
        message: "今天已經打卡過了",
        streak: userData.check_in_streak || 0,
      }
    }

    // 計算新的連續打卡天數
    let newStreak = 1
    if (userData?.last_check_in) {
      const lastCheckIn = new Date(userData.last_check_in)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      if (lastCheckIn.toISOString().split("T")[0] === yesterday.toISOString().split("T")[0]) {
        newStreak = (userData.check_in_streak || 0) + 1
      }
    }

    // 更新打卡記錄
    const { error: updateError } = await supabase
      .from("users")
      .update({
        last_check_in: today,
        check_in_streak: newStreak,
      })
      .eq("id", user.id)

    if (updateError) {
      return {
        success: false,
        message: "更新打卡記錄失敗: " + updateError.message,
      }
    }

    // 添加打卡記錄到 check_ins 表
    const { error: checkInError } = await supabase.from("check_ins").insert({
      user_id: user.id,
      check_in_date: today,
      created_at: new Date().toISOString(),
    })

    if (checkInError) {
      console.error("添加打卡記錄失敗:", checkInError)
      // 繼續執行，不影響主要功能
    }

    // 如果連續打卡達到7天，檢查是否有發帖，然後給予VIP
    if (newStreak >= 7) {
      // 檢查用戶是否有發過帖子
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)

      if (postsError) {
        console.error("檢查用戶帖子時出錯:", postsError)
        return {
          success: true,
          message: `打卡成功！您已連續打卡${newStreak}天`,
          streak: newStreak,
        }
      }

      // 如果用戶沒有發過帖子，提示需要發帖
      if (!postsData || postsData.length === 0) {
        return {
          success: true,
          message: "連續打卡7天達成！發布一篇帖子即可升級為VIP",
          streak: newStreak,
        }
      }

      // 用戶已發帖且連續打卡7天，給予VIP
      const vipUntil = new Date()
      vipUntil.setDate(vipUntil.getDate() + 30)

      await supabase
        .from("users")
        .update({
          is_vip: true,
          vip_expires_at: vipUntil.toISOString(),
        })
        .eq("id", user.id)

      return {
        success: true,
        message: "恭喜您！連續打卡7天並發布過帖子，已獲得30天VIP特權！",
        streak: newStreak,
        isVip: true,
        vipExpiresAt: vipUntil.toISOString(),
      }
    }

    return {
      success: true,
      message: `打卡成功！您已連續打卡${newStreak}天`,
      streak: newStreak,
    }
  } catch (error: any) {
    console.error("打卡時出錯:", error)
    return {
      success: false,
      message: "打卡時出錯: " + error.message,
    }
  }
}

export async function getCheckInStatus(): Promise<CheckInStatus> {
  try {
    const supabase = createClient()

    // 獲取當前用戶
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        lastCheckIn: null,
        streak: 0,
        isVip: false,
      }
    }

    // 獲取用戶資料
    const { data, error } = await supabase
      .from("users")
      .select("last_check_in, check_in_streak, is_vip, vip_until, vip_expires_at")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("獲取打卡狀態失敗:", error)
      return {
        lastCheckIn: null,
        streak: 0,
        isVip: false,
      }
    }

    // 檢查VIP狀態 - 同時檢查 is_vip 和 vip_expires_at
    let isVip = false

    // 檢查 is_vip 欄位
    if (data.is_vip === true) {
      isVip = true
    }

    // 檢查 vip_expires_at 欄位 (管理員面板使用的欄位)
    if (data.vip_expires_at && new Date(data.vip_expires_at) > new Date()) {
      isVip = true
    }

    // 檢查 vip_until 欄位
    if (data.vip_until && new Date(data.vip_until) > new Date()) {
      isVip = true
    }

    return {
      lastCheckIn: data.last_check_in,
      streak: data.check_in_streak || 0,
      isVip,
      vipExpiresAt: data.vip_expires_at || data.vip_until,
    }
  } catch (error) {
    console.error("獲取打卡狀態時出錯:", error)
    return {
      lastCheckIn: null,
      streak: 0,
      isVip: false,
    }
  }
}

// 檢查用戶是否是 VIP
export async function isUserVip(userId?: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // 如果沒有提供用戶 ID，則獲取當前用戶
    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false
      userId = user.id
    }

    // 獲取用戶 VIP 狀態
    const { data, error } = await supabase.from("users").select("is_vip, vip_until").eq("id", userId).single()

    if (error) {
      console.error("Error checking VIP status:", error)
      return false
    }

    // 檢查 VIP 是否有效
    if (data?.is_vip && data?.vip_until) {
      const vipUntil = new Date(data.vip_until)
      return vipUntil > new Date()
    }

    return false
  } catch (error) {
    console.error("Error checking VIP status:", error)
    return false
  }
}
