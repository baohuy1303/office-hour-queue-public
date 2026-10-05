// A tiny service worker. Its only job is to show the "You're up" notification (Android
// requires a service worker for notifications) and to bring the page forward when tapped.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windows) => (windows.length > 0 ? windows[0].focus() : self.clients.openWindow('/'))),
  )
})
