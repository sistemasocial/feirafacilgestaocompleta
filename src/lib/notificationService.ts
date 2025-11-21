import { supabase } from "@/integrations/supabase/client";
import { initializeFCM } from "./fcmService";
import { setupForegroundMessaging } from "./firebaseMessaging";

export const setupNotificationListener = (userId: string) => {
  // Inicializar FCM para push notifications
  initializeFCM(userId).catch(console.error);
  
  // Configurar listener de mensagens em foreground
  setupForegroundMessaging();
  // Criar listener de notificações em tempo real
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('Nova notificação recebida:', payload);
        const notification = payload.new as any;
        
        // Verificar permissão de notificações
        if ('Notification' in window && Notification.permission === 'granted') {
          // Tocar som
          playNotificationSound();
          
          // Mostrar notificação via Service Worker
          if ('serviceWorker' in navigator) {
            try {
              const registration = await navigator.serviceWorker.ready;
              if (registration.active) {
                registration.active.postMessage({
                  type: 'SHOW_NOTIFICATION',
                  title: notification.title,
                  message: notification.message,
                  id: notification.id
                });
              }
            } catch (error) {
              console.error('Erro ao enviar notificação via SW:', error);
            }
          }
        }
      }
    )
    .subscribe();

  return channel;
};

export const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Tom de notificação agradável
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error('Erro ao tocar som:', error);
  }
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    console.log('Permissão de notificação:', permission);
    return permission;
  }
  return Notification.permission;
};
