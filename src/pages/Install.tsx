import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Store, Smartphone, Download, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const benefits = [
    "Acesso rápido direto da tela inicial",
    "Funciona offline",
    "Notificações em tempo real",
    "Experiência como app nativo",
    "Sem precisar baixar da loja",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-6">
      <Card className="w-full max-w-lg p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
            <Store className="w-12 h-12" color="white" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Instale o FeiraFácil!</h1>
            <p className="text-gray-600">
              Instale nosso aplicativo na tela inicial do seu celular para acesso rápido e offline
            </p>
          </div>

          {isInstalled ? (
            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center space-x-3">
              <Check className="w-6 h-6 text-emerald-600" />
              <span className="text-emerald-700 font-medium">App já instalado! ✨</span>
            </div>
          ) : (
            <>
              <div className="w-full space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3 text-left">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              {isInstallable ? (
                <Button
                  onClick={handleInstallClick}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-lg"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Instalar Agora
                </Button>
              ) : (
                <div className="w-full space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-left">
                        <p className="font-medium text-blue-900 mb-1">Como instalar:</p>
                        <p className="text-sm text-blue-700">
                          <strong>iPhone:</strong> Toque no botão de compartilhar
                          <span className="mx-1">📤</span>
                          e selecione "Adicionar à Tela de Início"
                        </p>
                        <p className="text-sm text-blue-700 mt-2">
                          <strong>Android:</strong> Toque no menu (⋮) e selecione "Instalar app" ou
                          "Adicionar à tela inicial"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <Button onClick={() => navigate("/")} variant="outline" className="w-full">
            Voltar para o Site
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Install;
