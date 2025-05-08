-- 確保電子郵件確認設置正確
UPDATE auth.config
SET email_confirm_required = true,
    enable_signup = true;

-- 確保電子郵件模板存在
INSERT INTO auth.email_templates (template_name, subject, content_html, content_text)
VALUES
  ('confirmation', 
   '確認您的電子郵件地址', 
   '<h2>確認您的電子郵件地址</h2>
    <p>請點擊下面的鏈接確認您的電子郵件地址：</p>
    <p><a href="{{ .ConfirmationURL }}">確認電子郵件</a></p>
    <p>如果您沒有請求此確認，請忽略此電子郵件。</p>', 
   '確認您的電子郵件地址\n\n請點擊下面的鏈接確認您的電子郵件地址：\n\n{{ .ConfirmationURL }}\n\n如果您沒有請求此確認，請忽略此電子郵件。')
ON CONFLICT (template_name) 
DO UPDATE SET
  subject = EXCLUDED.subject,
  content_html = EXCLUDED.content_html,
  content_text = EXCLUDED.content_text;
