import { supabase } from "@/integrations/supabase/client";

// Credenciais do Firebase (projeto feira-facil-brasil)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCuAWCSOBeJUaiEVFUXO4sFUsZTT-Izhhc",
  authDomain: "feira-facil-brasil.firebaseapp.com",
  projectId: "feira-facil-brasil",
  storageBucket: "feira-facil-brasil.firebasestorage.app",
  messagingSenderId: "990861940740",
  appId: "1:990861940740:web:2ae5ada5ab497c3b4a3d51"
};

// VAPID Key do projeto feira-facil-brasil
const VAPID_KEY = "BOc69NhyrPzDM_FEjVGxHBKThZh_kQClRfnuSSU8aZ-Zhp27hzWK2REaMDvzWMJA3d_ReFfvZkc9vjpZunawRFE";

export const initializeFCM = async (userId: string) => {
  try {
    console.log('[FCM] ===== INICIANDO FCM =====');
    console.log('[FCM] User ID:', userId);
    console.log('[FCM] Timestamp:', new Date().toISOString());
    
    // Verificar suporte a notificações
    if (!('Notification' in window)) {
      console.log('[FCM] ✗ Notification API não suportada');
      return null;
    }
    
    if (!('serviceWorker' in navigator)) {
      console.log('[FCM] ✗ Service Worker não suportado');
      return null;
    }
    
    console.log('[FCM] ✓ APIs suportadas');

    // Verificar se Firebase está configurado
    if (FIREBASE_CONFIG.apiKey.includes('XXX') || VAPID_KEY.includes('xxx')) {
      console.warn('[FCM] ⚠️ Firebase não configurado! Edite src/lib/fcmService.ts com suas credenciais');
      return null;
    }
    
    console.log('[FCM] ✓ Firebase configurado');

    // Solicitar permissão
    let permission = Notification.permission;
    console.log('[FCM] Permissão atual:', permission);
    
    if (permission === 'default') {
      console.log('[FCM] Solicitando permissão ao usuário...');
      permission = await Notification.requestPermission();
      console.log('[FCM] Resposta do usuário:', permission);
    }
    
    if (permission !== 'granted') {
      console.log('[FCM] ✗ Permissão negada ou não concedida');
      return null;
    }
    
    console.log('[FCM] ✓ Permissão concedida');

    // Importar Firebase
    console.log('[FCM] Importando Firebase modules...');
    const { initializeApp } = await import('firebase/app');
    const { getMessaging, getToken } = await import('firebase/messaging');
    console.log('[FCM] ✓ Modules importados');

    // Inicializar Firebase App
    console.log('[FCM] Inicializando Firebase App...');
    const app = initializeApp(FIREBASE_CONFIG);
    console.log('[FCM] ✓ Firebase App inicializado');

    // Obter Messaging
    console.log('[FCM] Obtendo Firebase Messaging...');
    const messaging = getMessaging(app);
    console.log('[FCM] ✓ Firebase Messaging obtido');

    // Registrar Service Worker
    console.log('[FCM] Registrando Service Worker...');
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    console.log('[FCM] ✓ Service Worker registrado');
    
    console.log('[FCM] Aguardando Service Worker ficar pronto...');
    await navigator.serviceWorker.ready;
    console.log('[FCM] ✓ Service Worker pronto');

    // Obter token FCM
    console.log('[FCM] Obtendo token FCM do Firebase...');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    console.log('[FCM] Token obtido?', !!token);

    if (token) {
      console.log('[FCM] ✓ Token FCM obtido com sucesso!');
      console.log('[FCM] Token (preview):', token.substring(0, 30) + '...');
      
      // Salvar token no banco de dados
      console.log('[FCM] Salvando token no banco...');
      const { data, error } = await supabase
        .from('fcm_tokens')
        .upsert({
          user_id: userId,
          token,
          device_info: navigator.userAgent,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,token'
        })
        .select();

      if (error) {
        console.error('[FCM] ✗ Erro ao salvar token:', error);
        throw error;
      } else {
        console.log('[FCM] ✓ Token salvo com sucesso!', data);
      }

      console.log('[FCM] ===== FCM INICIALIZADO COM SUCESSO =====');
      return token;
    } else {
      console.log('[FCM] ✗ Nenhum token foi retornado pelo Firebase');
      return null;
    }
  } catch (error: any) {
    console.error('[FCM] ===== ERRO FATAL =====');
    console.error('[FCM] Tipo:', error?.name);
    console.error('[FCM] Mensagem:', error?.message);
    console.error('[FCM] Stack:', error?.stack);
    console.error('[FCM] =========================');
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
