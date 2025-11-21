import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCcw, Smartphone, Bell, Database } from "lucide-react";
import { toast } from "sonner";

interface FcmDiagnosticsProps {
  userId: string;
}

interface FcmTokenRow {
  token: string;
  device_info: string | null;
  created_at: string | null;
}

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export const FcmDiagnostics = ({ userId }: FcmDiagnosticsProps) => {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [swReady, setSwReady] = useState<boolean | null>(null);
  const [tokens, setTokens] = useState<FcmTokenRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);

      // Status do navegador
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setPermission("unsupported");
      } else {
        setPermission(Notification.permission);
      }

      try {
        const reg = await navigator.serviceWorker.getRegistration();
        setSwReady(!!reg);
      } catch {
        setSwReady(false);
      }

      // Tokens FCM deste usuário
      const { data: tokenData, error: tokenError } = await supabase
        .from("fcm_tokens")
        .select("token, device_info, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (tokenError) {
        console.error("[FCM] Erro ao carregar tokens:", tokenError);
      } else {
        setTokens(tokenData || []);
      }

      // Últimas notificações deste usuário
      const { data: notifData, error: notifError } = await supabase
        .from("notifications")
        .select("id, title, message, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (notifError) {
        console.error("[FCM] Erro ao carregar notificações:", notifError);
      } else {
        setNotifications(notifData || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSendTest = async () => {
    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          title: "Teste FCM",
          message: "Notificação de teste enviada pelo painel de diagnóstico.",
          userId,
          type: "teste_fcm",
        },
      });

      if (error) {
        console.error("[FCM] Erro ao enviar teste:", error);
        toast.error("Erro ao enviar notificação de teste");
      } else {
        console.log("[FCM] Resultado envio teste:", data);
        toast.success("Notificação de teste enviada. Verifique o celular.");
        loadStatus();
      }
    } catch (e) {
      console.error("[FCM] Erro inesperado ao enviar teste:", e);
      toast.error("Erro inesperado ao enviar teste");
    } finally {
      setSendingTest(false);
    }
  };

  const renderPermissionBadge = () => {
    if (permission === "unsupported") {
      return <Badge variant="destructive">Navegador não suporta push</Badge>;
    }
    if (permission === "granted") {
      return <Badge variant="default">Permissão concedida</Badge>;
    }
    if (permission === "denied") {
      return <Badge variant="destructive">Permissão negada</Badge>;
    }
    return <Badge variant="outline">Permissão pendente</Badge>;
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Diagnóstico FCM (Push)
          </h2>
          <p className="text-sm text-muted-foreground">
            Verifique se o dispositivo está pronto para receber notificações push.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={loadStatus} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <Bell className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Permissão de notificação</p>
            {renderPermissionBadge()}
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <Database className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Tokens FCM registrados</p>
            <p className="text-sm font-medium">{tokens.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <Smartphone className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Service Worker</p>
            <p className="text-sm font-medium">
              {swReady === null ? "Verificando..." : swReady ? "Registrado" : "Não encontrado"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t pt-4">
        <div className="text-sm text-muted-foreground max-w-xl">
          Use o botão abaixo para enviar uma notificação de teste apenas para este usuário. 
          Se nada chegar no celular em 1–2 minutos, verifique as configurações de notificação do aparelho.
        </div>
        <Button onClick={handleSendTest} disabled={sendingTest || tokens.length === 0}>
          {sendingTest ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando teste...
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Enviar notificação de teste
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Tokens FCM recentes</h3>
          {tokens.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhum token encontrado para este usuário. Abra o dashboard no celular, aceite as permissões e recarregue.
            </p>
          ) : (
            <ScrollArea className="h-40 pr-2">
              <div className="space-y-2 text-xs">
                {tokens.map((t, idx) => (
                  <div key={idx} className="p-2 rounded-md border bg-muted/40">
                    <p className="font-mono break-all text-[10px]">{t.token}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {t.device_info || "Sem info do dispositivo"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {t.created_at ? new Date(t.created_at).toLocaleString() : "Sem data"}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Histórico de notificações</h3>
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhuma notificação encontrada para este usuário ainda.
            </p>
          ) : (
            <ScrollArea className="h-40 pr-2">
              <div className="space-y-2 text-xs">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-md border bg-muted/40">
                    <p className="font-semibold text-[11px]">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </Card>
  );
};
