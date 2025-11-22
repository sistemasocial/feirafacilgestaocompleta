import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Hook para gerenciar atualizações automáticas do PWA
 * Detecta quando há nova versão e recarrega automaticamente
 */
export function usePWAUpdate() {
  useEffect(() => {
    // Só executa no navegador
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Listener para mensagens do Service Worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('[PWA] Nova versão detectada:', event.data.version);
        
        // Mostra toast informando sobre atualização
        toast.info('Nova versão disponível! Atualizando...', {
          duration: 2000,
        });

        // Recarrega após 2 segundos para aplicar updates
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Verifica se há service worker esperando para ativar
    navigator.serviceWorker.ready.then((registration) => {
      // Verifica atualizações a cada 30 segundos
      setInterval(() => {
        registration.update().catch((err) => {
          console.log('[PWA] Erro ao verificar atualização:', err);
        });
      }, 30000);

      // Se há um service worker esperando, ativa imediatamente
      if (registration.waiting) {
        console.log('[PWA] Service Worker aguardando, ativando...');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Listener para quando um novo service worker está instalando
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Nova versão instalada, aplicando...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);
}
