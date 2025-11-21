import { supabase } from "@/integrations/supabase/client";

// IMPORTANTE: Substitua com suas credenciais reais do Firebase
// Acesse: https://console.firebase.google.com
// 1. Vá em Configurações do Projeto → Geral
// 2. Em "Seus apps", selecione o app Web
// 3. Copie as credenciais abaixo
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAJOp6dgp46kcmUb2e9DbPUMaXyWlQ13JY",
  authDomain: "feira-facil-1d3bf.firebaseapp.com",
  projectId: "feira-facil-1d3bf",
  storageBucket: "feira-facil-1d3bf.firebasestorage.app",
  messagingSenderId: "1099183570340",
  appId: "1:1099183570340:web:d07edf2922e2fbbcd5d531"
};

// VAPID Key (Web Push Certificate)
// Acesse: Firebase Console → Configurações do Projeto → Cloud Messaging
// Em "Web Push certificates", clique em "Gerar par de chaves"
const VAPID_KEY = "BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // Substitua pela sua chave

export const initializeFCM = async (userId: string) => {
  try {
    console.log('[FCM] Iniciando inicialização para userId:', userId);
    
    // Verificar suporte a notificações
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('[FCM] Push notifications não suportadas neste navegador');
      return null;
    }

    // Verificar se Firebase está configurado
    if (FIREBASE_CONFIG.apiKey.includes('XXX') || VAPID_KEY.includes('xxx')) {
      console.warn('[FCM] ⚠️ Firebase não configurado! Edite src/lib/fcmService.ts com suas credenciais');
      return null;
    }

    // Solicitar permissão
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    console.log('[FCM] Permissão de notificação:', permission);
    
    if (permission !== 'granted') {
      console.log('[FCM] Permissão de notificação negada pelo usuário');
      return null;
    }

    // Importar Firebase
    const { initializeApp } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');

    // Inicializar Firebase App
    const app = initializeApp(FIREBASE_CONFIG);
    console.log('[FCM] Firebase App inicializado');

    // Obter Messaging
    const messaging = getMessaging(app);
    console.log('[FCM] Firebase Messaging obtido');

    // Registrar Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    console.log('[FCM] Service Worker registrado e pronto');

    // Obter token FCM
    console.log('[FCM] Obtendo token FCM...');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('[FCM] ✓ Token FCM obtido:', token.substring(0, 30) + '...');
      
      // Salvar token no banco de dados
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
        console.error('[FCM] Erro ao salvar token no banco:', error);
      } else {
        console.log('[FCM] ✓ Token salvo no banco de dados');
      }

      return token;
    } else {
      console.log('[FCM] Nenhum token foi retornado');
      return null;
    }
  } catch (error) {
    console.error('[FCM] ✗ Erro ao inicializar FCM:', error);
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
