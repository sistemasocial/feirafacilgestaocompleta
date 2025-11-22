import { supabase } from "@/integrations/supabase/client";
import { initializeFCM } from "./fcmService";

export const setupNotificationListener = (userId: string) => {
  // Inicializar FCM para push notifications
  initializeFCM(userId).catch(console.error);

  // Criar listener de notificações em tempo real (para tocar som e atualizar UI)
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
        console.log("Nova notificação recebida:", payload);
        
        // Verificar permissão de notificações apenas para tocar som;
        // a notificação visual fica a cargo do push do FCM, evitando duplicidade.
        if ("Notification" in window && Notification.permission === "granted") {
          playNotificationSound();
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
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error("Erro ao tocar som:", error);
  }
};

export const requestNotificationPermission = async () => {
  if ("Notification" in window && Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    console.log("Permissão de notificação:", permission);
    return permission;
  }
  return Notification.permission;
};
