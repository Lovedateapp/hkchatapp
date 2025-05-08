// 为静态导出生成示例帖子ID
export function generateStaticParams() {
  // 在静态导出模式下，我们提供一些示例ID
  // 实际部署时，这些ID将被替换为真实的帖子ID
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" },
    { id: "10" },
    { id: "20" },
    { id: "30" },
    { id: "40" },
    { id: "50" },
  ]
}
