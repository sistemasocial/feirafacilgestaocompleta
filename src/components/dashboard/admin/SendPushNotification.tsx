import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Bell, Send } from "lucide-react";

export function SendPushNotification() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendToAll = async () => {
    if (!title || !message) {
      toast.error("Preencha título e mensagem");
      return;
    }

    setLoading(true);
    try {
      // Buscar todos os feirantes
      const { data: feirantes, error: feirantesError } = await supabase
        .from('feirantes')
        .select('user_id');

      if (feirantesError) throw feirantesError;

      const userIds = feirantes?.map(f => f.user_id) || [];

      // Enviar notificação push
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title,
          message,
          userIds,
          type: 'admin_broadcast',
        },
      });

      if (error) throw error;

      toast.success("Notificação enviada para todos os feirantes!");
      setTitle("");
      setMessage("");
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error("Erro ao enviar notificação");
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
        <div>
          <label className="text-sm font-medium">Título</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da notificação"
            maxLength={50}
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
