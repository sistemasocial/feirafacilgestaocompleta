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
        console.log("[Notificação] Nova notificação recebida via real-time:", payload);
        
        // Tocar som sempre que notificação chegar via real-time
        // O push visual já foi enviado pelo FCM via service worker
        playNotificationSound();
      }
    )
    .subscribe();

  return channel;
};

export const playNotificationSound = () => {
  console.log("[Som] Tentando tocar som de notificação...");
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Verificar se o contexto está suspenso (autoplay policy)
    if (audioContext.state === 'suspended') {
      console.log("[Som] AudioContext suspenso, tentando retomar...");
      audioContext.resume().then(() => {
        console.log("[Som] AudioContext retomado!");
        playTone(audioContext);
      }).catch(err => {
        console.error("[Som] Erro ao retomar AudioContext:", err);
      });
    } else {
      playTone(audioContext);
    }
  } catch (error) {
    console.error("[Som] Erro ao tocar som:", error);
  }
};

// Função auxiliar para tocar o tom
const playTone = (audioContext: AudioContext) => {
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Tom de notificação agradável (dois bipes)
    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    // Primeiro bipe
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    // Segundo bipe
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    console.log("[Som] ✓ Som tocado com sucesso!");
  } catch (error) {
    console.error("[Som] Erro ao tocar tom:", error);
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
