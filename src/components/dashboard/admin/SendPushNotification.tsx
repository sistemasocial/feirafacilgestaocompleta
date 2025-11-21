import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Bell, Send, AlertCircle, CheckCircle } from "lucide-react";

export function SendPushNotification() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);
  const [fcmTokensCount, setFcmTokensCount] = useState(0);

  useEffect(() => {
    // Verificar se Firebase está configurado
    const config = localStorage.getItem('firebase_config');
    if (config) {
      try {
        const parsed = JSON.parse(config);
        const isConfigured = parsed.apiKey && parsed.apiKey !== 'YOUR_FIREBASE_API_KEY';
        setFirebaseConfigured(isConfigured);
      } catch (e) {
        setFirebaseConfigured(false);
      }
    }

    // Buscar quantidade de tokens FCM
    const fetchTokensCount = async () => {
      const { count } = await supabase
        .from('fcm_tokens')
        .select('*', { count: 'exact', head: true });
      setFcmTokensCount(count || 0);
    };
    fetchTokensCount();
  }, []);

  const handleSendToAll = async () => {
    if (!title || !message) {
      toast.error("Preencha título e mensagem");
      return;
    }

    setLoading(true);
    try {
      console.log('Iniciando envio de notificação...', { title, message });

      // Buscar todos os feirantes
      const { data: feirantes, error: feirantesError } = await supabase
        .from('feirantes')
        .select('user_id');

      if (feirantesError) {
        console.error('Erro ao buscar feirantes:', feirantesError);
        throw feirantesError;
      }

      const userIds = feirantes?.map(f => f.user_id) || [];
      console.log('Feirantes encontrados:', userIds.length);

      if (userIds.length === 0) {
        toast.error("Nenhum feirante encontrado para enviar notificação");
        return;
      }

      // Enviar notificação push
      console.log('Chamando edge function...');
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title,
          message,
          userIds,
          type: 'admin_broadcast',
        },
      });

      console.log('Resposta do edge function:', { data, error });

      if (error) {
        console.error('Erro na edge function:', error);
        throw error;
      }

      toast.success(`Notificação enviada para ${userIds.length} feirantes!`);
      setTitle("");
      setMessage("");
    } catch (error: any) {
      console.error('Erro completo ao enviar notificação:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      toast.error(`Erro ao enviar notificação: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Enviar Push Notification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!firebaseConfigured && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Firebase não configurado! Configure acima para habilitar notificações push.
            </AlertDescription>
          </Alert>
        )}

        {firebaseConfigured && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Firebase configurado. {fcmTokensCount} dispositivo(s) registrado(s).
            </AlertDescription>
          </Alert>
        )}

        <div>
          <label className="text-sm font-medium">Título</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da notificação"
            maxLength={50}
            disabled={!firebaseConfigured}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Mensagem</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mensagem da notificação"
            maxLength={200}
            rows={4}
            disabled={!firebaseConfigured}
          />
        </div>

        <Button
          onClick={handleSendToAll}
          disabled={loading || !title || !message || !firebaseConfigured}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? "Enviando..." : "Enviar para Todos os Feirantes"}
        </Button>
      </CardContent>
    </Card>
  );
}
