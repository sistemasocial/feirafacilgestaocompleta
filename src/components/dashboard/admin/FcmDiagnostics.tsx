import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCcw, Smartphone, Bell, Database, AlertCircle, XCircle, CheckCircle2 } from "lucide-react";
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
  const [lastTestResult, setLastTestResult] = useState<{
    sent: number;
    failed: number;
    total: number;
    results?: Array<{ error?: string; success?: boolean }>;
  } | null>(null);

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
    setLastTestResult(null);
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
        setLastTestResult(data);
        
        if (data.sent > 0) {
          toast.success(`${data.sent} notificação(ões) enviada(s). Verifique o celular.`);
        } else if (data.failed > 0) {
          toast.warning(`Todas as ${data.failed} tentativas falharam. Veja detalhes abaixo.`);
        } else {
          toast.info("Notificação criada no banco, mas push não foi enviado.");
        }
        
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

      {/* Alertas de problemas detectados */}
      {permission === "denied" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>⚠️ Permissão de notificação NEGADA no navegador</AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            <p className="font-medium">O navegador deste dispositivo bloqueou as notificações.</p>
            <p className="text-sm">Para corrigir:</p>
            <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
              <li>Toque no ícone de <strong>cadeado</strong> ou <strong>"i"</strong> na barra de endereço do navegador</li>
              <li>Procure por <strong>"Notificações"</strong> ou <strong>"Permissões"</strong></li>
              <li>Altere de <strong>"Bloquear"</strong> para <strong>"Permitir"</strong></li>
              <li>Atualize esta página e faça login novamente</li>
            </ol>
            <p className="text-sm mt-2 italic">
              ⚠️ Enquanto estiver bloqueado, NENHUMA notificação push chegará neste dispositivo.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {permission === "granted" && tokens.length === 0 && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Permissão concedida, mas sem token FCM</AlertTitle>
          <AlertDescription className="text-sm">
            A permissão está OK, mas nenhum token FCM foi registrado ainda. Recarregue a página ou faça logout/login novamente.
          </AlertDescription>
        </Alert>
      )}

      {lastTestResult && lastTestResult.failed > 0 && lastTestResult.results && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>❌ Erro ao enviar notificações push para o Firebase</AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            <p className="font-medium">
              {lastTestResult.failed} de {lastTestResult.total} tentativa(s) falharam com erro da API do Firebase.
            </p>
            
            {lastTestResult.results.some(r => r.error?.includes("404")) && (
              <div className="space-y-2 mt-3 p-3 bg-destructive/10 rounded-md">
                <p className="font-semibold text-sm">🔥 Erro HTTP 404 detectado (Firebase)</p>
                <p className="text-sm">
                  O backend tentou enviar para o Firebase, mas recebeu <strong>404 Not Found</strong>. 
                  Isso geralmente significa:
                </p>
                <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                  <li>O <code>project_id</code> no segredo <code>FIREBASE_SERVICE_ACCOUNT</code> está incorreto</li>
                  <li>O projeto Firebase não tem o Cloud Messaging (FCM) habilitado</li>
                  <li>A conta de serviço JSON não pertence ao mesmo projeto do app web</li>
                </ul>
                <p className="text-sm mt-2 font-medium">
                  ✅ Solução: Verifique no Firebase Console se o projeto está correto e gere um novo JSON de conta de serviço.
                </p>
              </div>
            )}

            <details className="text-xs mt-2">
              <summary className="cursor-pointer font-medium">Ver detalhes técnicos</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-32">
                {JSON.stringify(lastTestResult.results, null, 2)}
              </pre>
            </details>
          </AlertDescription>
        </Alert>
      )}

      {lastTestResult && lastTestResult.sent > 0 && lastTestResult.failed === 0 && (
        <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>✅ Push enviado com sucesso!</AlertTitle>
          <AlertDescription className="text-sm">
            {lastTestResult.sent} notificação(ões) foram enviadas para o Firebase sem erros. 
            Verifique o celular em até 1–2 minutos.
          </AlertDescription>
        </Alert>
      )}

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
