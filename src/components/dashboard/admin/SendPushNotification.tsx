import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Bell, Send, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";

export function SendPushNotification() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fcmTokensCount, setFcmTokensCount] = useState(0);

  useEffect(() => {
    // Buscar quantidade de tokens FCM registrados
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
          Notificações Push
        </CardTitle>
        <CardDescription>
          Envie notificações push para todos os feirantes cadastrados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fcmTokensCount === 0 ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Firebase não configurado</p>
                <p className="text-sm">
                  Para habilitar notificações push, você precisa:
                </p>
                <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                  <li>Editar o arquivo <code className="bg-muted px-1 rounded">src/lib/fcmService.ts</code></li>
                  <li>Substituir as credenciais do Firebase pelas suas</li>
                  <li>Obter as credenciais no{" "}
                    <a 
                      href="https://console.firebase.google.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Firebase Console
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Firebase configurado. {fcmTokensCount} dispositivo(s) registrado(s) para receber notificações.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <label className="text-sm font-medium">Título</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Nova feira disponível"
            maxLength={50}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Mensagem</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex: A feira do Parque Central está aberta para inscrições!"
            maxLength={200}
            rows={4}
          />
        </div>

        <Button
          onClick={handleSendToAll}
          disabled={loading || !title || !message}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? "Enviando..." : "Enviar para Todos os Feirantes"}
        </Button>
      </CardContent>
    </Card>
  );
}
