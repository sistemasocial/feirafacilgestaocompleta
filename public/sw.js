// Service Worker para notificações push em background
// IMPORTANTE: Este arquivo roda em um contexto separado do app principal

// Variável global para manter estado
let isActive = true;

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker instalando...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker ativado e pronto para receber push');
  event.waitUntil(self.clients.claim());
  isActive = true;
});

// Manter o service worker ativo para receber push em background
self.addEventListener('fetch', (event) => {
  // Deixar passar todas as requisições normalmente
  // Mas manter SW ativo
});

// Escutar mensagens push do Firebase (background e foreground)
self.addEventListener('push', (event) => {
  console.log('[SW] ===== PUSH RECEBIDO (BACKGROUND) =====');
  console.log('[SW] Timestamp:', new Date().toISOString());
  console.log('[SW] SW está ativo:', isActive);
  
  let notificationTitle = 'FeiraFácil';
  let notificationBody = 'Você tem uma nova notificação';
  let notificationData = {};
  
  // Processar dados do push
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW] Payload completo:', JSON.stringify(payload, null, 2));
      
      // Firebase envia em diferentes formatos dependendo se tem notification e data
      if (payload.notification) {
        // Formato padrão do Firebase
        notificationTitle = payload.notification.title || notificationTitle;
        notificationBody = payload.notification.body || notificationBody;
        notificationData = payload.data || {};
      } else if (payload.data) {
        // Apenas data payload
        notificationTitle = payload.data.title || notificationTitle;
        notificationBody = payload.data.message || payload.data.body || notificationBody;
        notificationData = payload.data;
      } else {
        // Fallback
        notificationTitle = payload.title || notificationTitle;
        notificationBody = payload.message || payload.body || notificationBody;
        notificationData = payload;
      }
    } catch (e) {
      console.error('[SW] Erro ao parsear payload:', e);
      notificationBody = event.data.text();
    }
  }

  const notificationOptions = {
    body: notificationBody,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: notificationData.id || 'notification-' + Date.now(),
    requireInteraction: false,
    silent: false, // CRÍTICO: permite som do sistema
    renotify: true, // CRÍTICO: força som mesmo se notificação com mesmo tag existe
    data: notificationData,
    actions: [],
    timestamp: Date.now()
  };

  console.log('[SW] Mostrando notificação:', {
    title: notificationTitle,
    options: notificationOptions
  });

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('[SW] ✓ Notificação mostrada com sucesso em background');
      })
      .catch((error) => {
        console.error('[SW] ✗ Erro ao mostrar notificação:', error);
      })
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
      renotify: true, // Força som
      data: event.data
    };

    console.log('[SW] Mostrando notificação local:', title);
    await self.registration.showNotification(title, options);
  }
});
