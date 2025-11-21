import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Verificar se o banner foi fechado anteriormente (nas últimas 24h)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (now - dismissedTime < dayInMs) {
        return; // Não mostrar se foi fechado há menos de 24h
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
      console.log('[PWA] Prompt de instalação capturado e banner mostrado');
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    console.log('[PWA] Disparando prompt de instalação');
    await deferredPrompt.prompt();
    
    const choiceResult = await deferredPrompt.userChoice;
    console.log('[PWA] Escolha do usuário:', choiceResult.outcome);

    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border shadow-lg rounded-lg p-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="font-semibold text-sm mb-1">Instalar FeiraFácil</p>
          <p className="text-xs text-muted-foreground">
            Acesso rápido, funciona offline e receba notificações
          </p>
        </div>
        <Button onClick={handleInstall} size="sm" className="shrink-0">
          <Download className="w-4 h-4 mr-1" />
          Instalar
        </Button>
        <Button 
          onClick={handleDismiss} 
          variant="ghost" 
          size="icon" 
          className="shrink-0 h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
