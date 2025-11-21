import { useEffect } from "react";
import { setupNotificationListener, requestNotificationPermission } from "@/lib/notificationService";
import { supabase } from "@/integrations/supabase/client";

export const useNotifications = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    // Solicitar permissão de notificações
    requestNotificationPermission();

    // Configurar listener de notificações
    const channel = setupNotificationListener(userId);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};
