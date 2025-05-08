// 服務工作線程基本設置
self.addEventListener("install", (event) => {
  console.log("Service Worker 安裝中...")
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("Service Worker 已激活")
  return self.clients.claim()
})

// 處理推送通知
self.addEventListener("push", (event) => {
  console.log("收到推送消息", event)

  if (!event.data) {
    console.log("沒有數據")
    return
  }

  try {
    const data = event.data.json()
    console.log("推送數據:", data)

    const title = data.title || "香港匿名交友"
    const options = {
      body: data.body || "您有一條新消息",
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      data: data.data || {},
      vibrate: [100, 50, 100],
      timestamp: Date.now(),
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch (error) {
    console.error("處理推送消息時出錯:", error)
  }
})

// 處理通知點擊
self.addEventListener("notificationclick", (event) => {
  console.log("通知被點擊", event)

  event.notification.close()

  const urlToOpen = event.notification.data.url || "/"

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        // 檢查是否已經有打開的窗口
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i]
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus()
          }
        }
        // 如果沒有打開的窗口，則打開新窗口
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      }),
  )
})

console.log("Service Worker 已加載")
