// Service Worker mínimo para habilitar la instalación PWA en Android TV
// No cachea nada — la app requiere conexión para funcionar en tiempo real

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})
