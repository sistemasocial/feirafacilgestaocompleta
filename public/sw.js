// Service Worker para notificações push em background
// IMPORTANTE: Este arquivo roda em um contexto separado do app principal
// Versão do App - atualiza isso a cada deploy para forçar atualização
const APP_VERSION = 'v1.0.' + Date.now();

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker instalando... Versão:', APP_VERSION);
  // Força instalação imediata da nova versão
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker ativado - Versão:', APP_VERSION);
  
  // Limpa caches antigos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('workbox-') || cacheName.startsWith('pwa-')) {
            console.log('[SW] Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Garante que o SW assume controle imediatamente
      return self.clients.claim();
    }).then(() => {
      // Notifica todos os clientes para recarregar
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: APP_VERSION
          });
        });
      });
    })
  );
});

// Manter o service worker ativo - necessário para push notifications
self.addEventListener('fetch', (event) => {
  // Deixar passar todas as requisições normalmente
});

// Escutar mensagens push do Firebase (background)
self.addEventListener('push', (event) => {
  console.log('[SW] ===== PUSH RECEBIDO =====');
  console.log('[SW] Event data:', event.data);
  
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
    vibrate: [300, 100, 300],
    tag: notificationData.id || 'notification-' + Date.now(),
    requireInteraction: false,
    silent: false,
    data: notificationData,
    actions: []
  };

  console.log('[SW] Mostrando notificação:', {
    title: notificationTitle,
    options: notificationOptions
  });

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('[SW] ✓ Notificação mostrada com sucesso');
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
  
  // Comando para pular waiting e ativar imediatamente
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING recebido, ativando nova versão...');
    self.skipWaiting();
    return;
  }
  
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
