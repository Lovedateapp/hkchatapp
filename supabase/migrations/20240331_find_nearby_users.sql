-- 創建查找附近 VIP 用戶的函數
CREATE OR REPLACE FUNCTION public.find_nearby_vip(
  lat double precision,
  lon double precision,
  radius double precision
) RETURNS TABLE (
  id uuid,
  anonymous_id text,
  vip_expires_at timestamptz,
  streak_days integer,
  distance double precision,
  created_at timestamptz
) AS $$
BEGIN
  -- 目前我們沒有實際的地理位置數據，所以返回所有 VIP 用戶並隨機分配距離
  RETURN QUERY
  SELECT 
    u.id,
    u.anonymous_id,
    u.vip_expires_at,
    u.streak_days,
    -- 生成 0-radius 範圍內的隨機距離
    radius * random() AS distance,
    u.created_at
  FROM 
    public.users u
  WHERE 
    u.vip_expires_at > NOW()
  ORDER BY 
    random()
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 確保用戶表有 location 欄位
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE public.users ADD COLUMN location geography(POINT, 4326);
  END IF;
END $$;
