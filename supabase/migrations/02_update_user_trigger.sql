-- 更新用戶觸發器函數，正確處理性別和地區信息
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, gender, district)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'gender', 
    NEW.raw_user_meta_data->>'district'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    gender = EXCLUDED.gender,
    district = EXCLUDED.district,
    updated_at = now();
  RETURN NEW;
END;
$$;
