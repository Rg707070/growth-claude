const timers = new Map()

self.addEventListener('message', (event) => {
  const { type, id, delay, title, body, url, tag } = event.data ?? {}
  if (type === 'SCHEDULE') {
    if (timers.has(id)) clearTimeout(timers.get(id))
    if (typeof delay !== 'number' || delay < 0) return
    const timer = setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/apple-icon.png',
        badge: '/growth-emblem.png',
        tag: tag ?? id,
        data: { url: url ?? '/' },
        requireInteraction: false,
      })
      timers.delete(id)
    }, delay)
    timers.set(id, timer)
  } else if (type === 'CLEAR') {
    if (timers.has(id)) clearTimeout(timers.get(id))
    timers.delete(id)
  } else if (type === 'CLEAR_ALL') {
    timers.forEach((t) => clearTimeout(t))
    timers.clear()
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          void client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()))
