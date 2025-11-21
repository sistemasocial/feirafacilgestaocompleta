import { supabase } from "@/integrations/supabase/client";

// Configuração do Firebase (substitua com suas credenciais)
const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const initializeFCM = async (userId: string) => {
  try {
    // Verificar suporte a notificações
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Push notifications não suportadas');
      return null;
    }

    // Solicitar permissão
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permissão de notificação negada');
      return null;
    }

    // Importar Firebase
    const { initializeApp } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');

    // Inicializar Firebase
    const app = initializeApp(FIREBASE_CONFIG);
    const messaging = getMessaging(app);

    // Registrar service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registrado');

    // Obter token FCM
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY', // Gere em Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('Token FCM obtido:', token);
      
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
        console.error('Erro ao salvar token:', error);
      } else {
        console.log('Token FCM salvo com sucesso');
      }

      return token;
    }

    return null;
  } catch (error) {
    console.error('Erro ao inicializar FCM:', error);
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
