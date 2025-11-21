// Este arquivo configura o listener de mensagens do Firebase quando o app está em foreground
import { getMessaging, onMessage } from "firebase/messaging";
import { initializeApp } from "firebase/app";

let messagingInstance: any = null;

export const setupForegroundMessaging = () => {
  try {
    // Carregar configuração do Firebase do localStorage
    const saved = localStorage.getItem('firebase_config');
    if (!saved) {
      console.log('[Messaging] Firebase config não encontrada');
      return;
    }

    const config = JSON.parse(saved);
    
    // Verificar se está configurado
    if (config.apiKey === 'YOUR_FIREBASE_API_KEY') {
      console.log('[Messaging] Firebase não configurado');
      return;
    }

    // Inicializar Firebase apenas uma vez
    if (!messagingInstance) {
      const firebaseConfig = {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId
      };

      const app = initializeApp(firebaseConfig, 'foreground-messaging');
      messagingInstance = getMessaging(app);
      
      console.log('[Messaging] Firebase messaging inicializado');
    }

    // Escutar mensagens quando o app está aberto
    onMessage(messagingInstance, (payload) => {
      console.log('[Messaging] Mensagem recebida em foreground:', payload);
      
      const notificationTitle = payload.notification?.title || 'FeiraFácil';
      const notificationBody = payload.notification?.body || 'Nova notificação';
      
      // Mostrar notificação mesmo com app aberto
      if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(notificationTitle, {
            body: notificationBody,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: payload.messageId || 'notification-' + Date.now(),
            data: payload.data
          });
        });
      }
    });
  } catch (error) {
    console.error('[Messaging] Erro ao configurar messaging:', error);
  }
};
