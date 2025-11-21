// Service Worker para notificações push em background
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker ativado');
  event.waitUntil(self.clients.claim());
});

// Manter o service worker ativo
self.addEventListener('fetch', (event) => {
  // Necessário para manter o SW ativo
});

// Escutar mensagens push do Firebase
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);
  
  let data = {};
  let notificationTitle = 'FeiraFácil';
  let notificationBody = 'Você tem uma nova notificação';
  
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW] Payload:', payload);
      
      // Firebase pode enviar em diferentes formatos
      if (payload.notification) {
        notificationTitle = payload.notification.title || notificationTitle;
        notificationBody = payload.notification.body || notificationBody;
        data = payload.data || {};
      } else {
        notificationTitle = payload.title || notificationTitle;
        notificationBody = payload.message || payload.body || notificationBody;
        data = payload;
      }
    } catch (e) {
      console.error('[SW] Erro ao parsear payload:', e);
      notificationBody = event.data.text();
    }
  }

  const options = {
    body: notificationBody,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    tag: data.id || 'notification-' + Date.now(),
    requireInteraction: false,
    silent: false,
    data: data,
    actions: []
  };

  console.log('[SW] Mostrando notificação:', notificationTitle, options);

  event.waitUntil(
    self.registration.showNotification(notificationTitle, options)
  );
});

// Quando o usuário clica na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Se já existe uma janela aberta, focar nela
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Caso contrário, abrir uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Escutar mensagens do cliente para mostrar notificações locais
self.addEventListener('message', async (event) => {
  console.log('[SW] Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, message, id } = event.data;
    
    const options = {
      body: message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      tag: id || 'notification-' + Date.now(),
      requireInteraction: false,
      silent: false,
      data: event.data
    };

    console.log('[SW] Mostrando notificação local:', title);
    await self.registration.showNotification(title, options);
  }
});
