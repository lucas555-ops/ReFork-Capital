const CACHE_NAME = 'reforkcapital-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Cache addAll error:', err))
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch события - стратегия Cache First
self.addEventListener('fetch', event => {
  // Пропускаем non-GET запросы
  if (event.request.method !== 'GET') {
    return;
  }

  // Пропускаем chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем из кеша, если есть
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // Не кешируем, если нет ответа или это не успешный ответ
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Кешируем только успешные GET запросы
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Возвращаем offline страницу если нужно
        return caches.match('/');
      })
  );
});

// Background Sync для офлайн-функционала
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Здесь можно добавить логику синхронизации
      Promise.resolve()
    );
  }
});

// Push notifications (опционально)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Новое уведомление от ReFork Capital',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'reforkcapital-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ReFork Capital', options)
  );
});

// Обработка кликов на уведомлении
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
