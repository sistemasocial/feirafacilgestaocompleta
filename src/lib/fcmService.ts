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
const VAPID_KEY = "BHq6gocWa_b9xlZCl0gcWlnDpeB1jd0X_FjM0zMvG4j_j65nQz0hZsvlUKAVbRBgQN_7xPfMEuZvkNHpWjxWr04";

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
