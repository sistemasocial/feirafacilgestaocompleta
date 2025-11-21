import { supabase } from "@/integrations/supabase/client";

// Carregar configuração do Firebase do localStorage
const getFirebaseConfig = () => {
  try {
    const saved = localStorage.getItem('firebase_config');
    if (saved) {
      const config = JSON.parse(saved);
      console.log('Firebase config carregada do localStorage');
      return {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId
      };
    }
  } catch (error) {
    console.error('Erro ao carregar config do Firebase:', error);
  }
  
  // Configuração padrão (será substituída pela do localStorage)
  return {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
};

const getVapidKey = () => {
  try {
    const saved = localStorage.getItem('firebase_config');
    if (saved) {
      const config = JSON.parse(saved);
      return config.vapidKey || 'YOUR_VAPID_KEY';
    }
  } catch (error) {
    console.error('Erro ao carregar VAPID key:', error);
  }
  return 'YOUR_VAPID_KEY';
};

export const initializeFCM = async (userId: string) => {
  try {
    console.log('[FCM] Iniciando inicialização...');
    
    // Verificar suporte a notificações
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('[FCM] Push notifications não suportadas');
      return null;
    }

    // Verificar se já tem token salvo
    const existingToken = localStorage.getItem('fcm_token');
    if (existingToken) {
      console.log('[FCM] Token já existe:', existingToken.substring(0, 20) + '...');
      return existingToken;
    }

    // Solicitar permissão
    const permission = await Notification.requestPermission();
    console.log('[FCM] Permissão:', permission);
    
    if (permission !== 'granted') {
      console.log('[FCM] Permissão de notificação negada');
      return null;
    }

    // Carregar configuração do Firebase
    const firebaseConfig = getFirebaseConfig();
    const vapidKey = getVapidKey();
    
    console.log('[FCM] Config carregada:', { 
      projectId: firebaseConfig.projectId,
      hasVapidKey: vapidKey !== 'YOUR_VAPID_KEY'
    });

    // Verificar se a configuração está válida
    if (firebaseConfig.apiKey === 'YOUR_FIREBASE_API_KEY' || vapidKey === 'YOUR_VAPID_KEY') {
      console.warn('[FCM] Firebase não configurado! Configure em "Notificações Push"');
      return null;
    }

    // Importar Firebase
    const { initializeApp } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');

    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    console.log('[FCM] Firebase inicializado');

    // Registrar service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('[FCM] Service Worker registrado');

    // Obter token FCM
    console.log('[FCM] Obtendo token...');
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('[FCM] Token FCM obtido:', token.substring(0, 20) + '...');
      
      // Salvar no localStorage
      localStorage.setItem('fcm_token', token);
      
      // Salvar token no banco
      const { error } = await supabase
        .from('fcm_tokens')
        .upsert({
          user_id: userId,
          token,
          device_info: navigator.userAgent,
        }, {
          onConflict: 'user_id,token'
        });

      if (error) {
        console.error('[FCM] Erro ao salvar token:', error);
      } else {
        console.log('[FCM] Token FCM salvo com sucesso no banco');
      }

      return token;
    }

    console.log('[FCM] Nenhum token obtido');
    return null;
  } catch (error) {
    console.error('[FCM] Erro ao inicializar FCM:', error);
    return null;
  }
};

export const removeFCMToken = async (userId: string, token: string) => {
  try {
    const { error } = await supabase
      .from('fcm_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    if (error) {
      console.error('Erro ao remover token:', error);
    }
  } catch (error) {
    console.error('Erro ao remover token FCM:', error);
  }
};
