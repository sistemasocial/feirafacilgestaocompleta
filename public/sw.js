// Service Worker para notificações push em background
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  event.waitUntil(self.clients.claim());
});

// Escutar mensagens push
self.addEventListener('push', (event) => {
  console.log('Push recebido:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Nova notificação', body: event.data.text() };
    }
  }

  const title = data.title || 'FeiraFácil';
  const options = {
    body: data.message || data.body || 'Você tem uma nova notificação',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    tag: data.id || 'notification',
    requireInteraction: false,
    silent: false,
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Tocar som quando notificação aparecer
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Se já existe uma janela aberta, focar nela
      for (let client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Caso contrário, abrir uma nova janela
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});

// Escutar mensagens do cliente
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, message, id } = event.data;
    
    const options = {
      body: message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: id || 'notification',
      requireInteraction: false,
      silent: false,
      data: event.data
    };

    await self.registration.showNotification(title, options);
  }
});
