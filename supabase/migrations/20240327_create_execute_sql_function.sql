-- 創建一個執行 SQL 的函數
-- 注意：這個函數需要管理員權限才能執行
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
