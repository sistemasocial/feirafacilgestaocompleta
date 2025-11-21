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
  // Não faz nada, apenas mantém o SW ativo
});

// Escutar mensagens push do Firebase
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('[SW] Dados do push:', data);
    } catch (e) {
      console.log('[SW] Erro ao parsear push data, usando texto simples');
      data = { title: 'Nova notificação', body: event.data.text() };
    }
  }

  // Extrair dados da notificação Firebase
  const notification = data.notification || {};
  const title = notification.title || data.title || 'FeiraFácil';
  const body = notification.body || data.message || data.body || 'Você tem uma nova notificação';
  
  const options = {
    body: body,
    icon: notification.icon || '/pwa-192x192.png',
    badge: notification.badge || '/pwa-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.id || 'notification-' + Date.now(),
    requireInteraction: false,
    silent: false,
    data: data.data || data,
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  console.log('[SW] Mostrando notificação:', title, options);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[SW] Notificação exibida com sucesso'))
      .catch(err => console.error('[SW] Erro ao exibir notificação:', err))
  );
});

// Lidar com cliques nas notificações
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);
  
  event.notification.close();

  // Se clicou em fechar, apenas fecha
  if (event.action === 'close') {
    return;
  }

  // Abrir ou focar no app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      console.log('[SW] Janelas abertas:', clientList.length);
      
      // Se já existe uma janela aberta, focar nela
      for (let client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          console.log('[SW] Focando janela existente');
          return client.focus();
        }
      }
      
      // Caso contrário, abrir uma nova janela
      if (clients.openWindow) {
        console.log('[SW] Abrindo nova janela');
        return clients.openWindow('/dashboard');
      }
    })
  );
});

// Escutar mensagens do cliente
self.addEventListener('message', async (event) => {
  console.log('[SW] Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, message, id } = event.data;
    
    const options = {
      body: message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: id || 'notification-' + Date.now(),
      requireInteraction: false,
      silent: false,
      data: event.data,
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Fechar' }
      ]
    };

    console.log('[SW] Exibindo notificação via mensagem:', title);
    await self.registration.showNotification(title, options);
  }
  
  // Responder ao cliente que o SW está ativo
  if (event.data && event.data.type === 'PING') {
    event.ports[0].postMessage({ type: 'PONG' });
  }
});
