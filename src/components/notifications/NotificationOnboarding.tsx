import { useEffect, useState } from "react";
import { X, Bell, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initializeFCM } from "@/lib/fcmService";
import { toast } from "sonner";

interface NotificationOnboardingProps {
  userId: string;
  userRole: "admin" | "feirante";
}

export const NotificationOnboarding = ({ userId, userRole }: NotificationOnboardingProps) => {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isEnabling, setIsEnabling] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = () => {
    if ("Notification" in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      
      // Mostrar onboarding apenas se não concedeu permissão
      const hasSeenOnboarding = localStorage.getItem("notification_onboarding_seen");
      
      if (currentPermission === "default" && !hasSeenOnboarding) {
        // Aguardar 2 segundos após login para mostrar
        setTimeout(() => setShow(true), 2000);
      } else if (currentPermission === "denied" && !hasSeenOnboarding) {
        // Mostrar aviso se negou
        setTimeout(() => setShow(true), 2000);
      }
    }
  };

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    
    try {
      console.log("[Onboarding] Solicitando permissão de notificações...");
      
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === "granted") {
        console.log("[Onboarding] ✓ Permissão concedida! Inicializando FCM...");
        
        // Inicializar FCM e registrar token
        const token = await initializeFCM(userId);
        
        if (token) {
          console.log("[Onboarding] ✓ Token FCM registrado com sucesso!");
          setCompleted(true);
          toast.success("Notificações ativadas com sucesso! 🎉");
          
          // Aguardar 2 segundos e fechar
          setTimeout(() => {
            setShow(false);
            localStorage.setItem("notification_onboarding_seen", "true");
          }, 2000);
        } else {
          toast.error("Erro ao registrar para notificações. Tente novamente.");
        }
      } else {
        console.log("[Onboarding] ✗ Permissão negada pelo usuário");
        toast.error("Você precisa permitir notificações para receber atualizações importantes.");
      }
    } catch (error) {
      console.error("[Onboarding] Erro ao ativar notificações:", error);
      toast.error("Erro ao ativar notificações. Tente novamente.");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("notification_onboarding_seen", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative animate-in fade-in zoom-in duration-300">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <CardHeader className="text-center pb-3">
          {completed ? (
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          ) : (
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-8 w-8 text-primary" />
            </div>
          )}
          <CardTitle className="text-xl">
            {completed ? "Tudo pronto!" : "Ative as Notificações"}
          </CardTitle>
          <CardDescription>
            {completed 
              ? "Você receberá notificações sobre atualizações importantes"
              : userRole === "admin" 
                ? "Receba alertas sobre novas inscrições, pagamentos e atividades dos feirantes"
                : "Receba avisos sobre novas feiras, aprovações e lembretes de pagamento"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {permission === "denied" && !completed && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
              <p className="font-semibold text-destructive mb-2">Notificações bloqueadas</p>
              <p className="text-muted-foreground">
                Para receber notificações, você precisa permitir nas configurações do navegador:
              </p>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Clique no ícone de cadeado ao lado da URL</li>
                <li>Encontre "Notificações" e altere para "Permitir"</li>
                <li>Recarregue a página</li>
              </ol>
            </div>
          )}

          {!completed && permission !== "denied" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Bell className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Notificações instantâneas</p>
                  <p className="text-muted-foreground">
                    Receba alertas mesmo com o app fechado
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleEnableNotifications}
                disabled={isEnabling}
                className="w-full"
                size="lg"
              >
                {isEnabling ? "Ativando..." : "Ativar Notificações"}
              </Button>

              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="w-full"
              >
                Agora não
              </Button>
            </div>
          )}

          {completed && (
            <Button
              onClick={handleDismiss}
              className="w-full"
              size="lg"
            >
              Entendi
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
