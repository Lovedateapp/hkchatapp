#!/bin/bash

# 查找所有API路由文件
API_ROUTES=$(find app/api -name "route.ts" -o -name "route.js")

# 遍历每个文件
for file in $API_ROUTES; do
  echo "Processing $file..."
  
  # 检查文件是否已包含force-static
  if grep -q "export const dynamic" "$file"; then
    echo "  Already has dynamic export, skipping."
    continue
  fi
  
  # 在文件的import语句后添加force-static
  # 使用sed在第一个空行处添加export const dynamic
  sed -i '' -e '/^import.*$/,/^$/ {
    /^$/a\
export const dynamic = "force-static";\

  }' "$file"
  
  echo "  Added force-static to $file"
done

echo "Done!"
