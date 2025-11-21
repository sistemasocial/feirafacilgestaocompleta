import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requestNotificationPermission } from "@/lib/notificationService";

export const NotificationPermission = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!('Notification' in window)) {
    return (
      <Alert variant="destructive">
        <BellOff className="h-4 w-4" />
        <AlertDescription>
          Seu navegador não suporta notificações push.
        </AlertDescription>
      </Alert>
    );
  }

  if (permission === 'granted') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg">Notificações Ativadas</CardTitle>
          </div>
          <CardDescription>
            Você receberá notificações push neste dispositivo.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Alert variant="destructive">
        <BellOff className="h-4 w-4" />
        <AlertDescription>
          As notificações foram bloqueadas. Para ativar:
          <ol className="mt-2 ml-4 list-decimal text-sm">
            <li>Abra as configurações do navegador</li>
            <li>Procure por "Notificações" ou "Permissões do site"</li>
            <li>Encontre este site e altere as permissões para "Permitir"</li>
            <li>Recarregue a página</li>
          </ol>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ativar Notificações</CardTitle>
        <CardDescription>
          Receba alertas em tempo real sobre novas inscrições, pagamentos e atualizações.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleRequestPermission} 
          disabled={loading}
          className="w-full"
        >
          <Bell className="mr-2 h-4 w-4" />
          {loading ? 'Solicitando...' : 'Ativar Notificações'}
        </Button>
      </CardContent>
    </Card>
  );
};
