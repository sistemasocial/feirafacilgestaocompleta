import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ServiceWorkerRegistrationInfo {
  scope: string;
  active?: { state: string; scriptURL: string | null };
  waiting?: { state: string; scriptURL: string | null };
  installing?: { state: string; scriptURL: string | null };
}

interface DiagnosticsData {
  timestamp: string;
  userAgent: string;
  isStandalone: boolean;
  displayMode: string;
  location: {
    href: string;
    pathname: string;
    search: string;
    hash: string;
  };
  session: unknown;
  serviceWorker: {
    supported: boolean;
    registrations: ServiceWorkerRegistrationInfo[];
  };
  caches: {
    supported: boolean;
    keys: string[];
  };
  notifications: {
    permission: NotificationPermission | "unsupported";
  };
}

async function hardResetAndReload() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn("[DIAGNOSTICS] Falha ao limpar cache/service workers:", error);
  } finally {
    window.location.replace("/");
  }
}

function getDisplayMode(): string {
  if (window.matchMedia("(display-mode: standalone)").matches) return "standalone";
  if (window.matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  if ((navigator as any).standalone) return "standalone-ios";
  return "browser";
}

const Diagnostics = () => {
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collect = async () => {
      try {
        const [{ data: sessionData }, swInfo, cacheInfo] = await Promise.all([
          supabase.auth.getSession(),
          (async () => {
            if (!("serviceWorker" in navigator)) {
              return { supported: false, registrations: [] as ServiceWorkerRegistrationInfo[] };
            }

            const registrations = await navigator.serviceWorker.getRegistrations();

            const mapped: ServiceWorkerRegistrationInfo[] = registrations.map((reg) => ({
              scope: reg.scope,
              active: reg.active
                ? { state: reg.active.state, scriptURL: reg.active.scriptURL ?? null }
                : undefined,
              waiting: reg.waiting
                ? { state: reg.waiting.state, scriptURL: reg.waiting.scriptURL ?? null }
                : undefined,
              installing: reg.installing
                ? { state: reg.installing.state, scriptURL: reg.installing.scriptURL ?? null }
                : undefined,
            }));

            return { supported: true, registrations: mapped };
          })(),
          (async () => {
            if (!("caches" in window)) {
              return { supported: false, keys: [] as string[] };
            }
            const keys = await caches.keys();
            return { supported: true, keys };
          })(),
        ]);

        const diagnostics: DiagnosticsData = {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          isStandalone:
            window.matchMedia("(display-mode: standalone)").matches ||
            (navigator as any).standalone === true,
          displayMode: getDisplayMode(),
          location: {
            href: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
          },
          session: sessionData.session ?? null,
          serviceWorker: swInfo,
          caches: cacheInfo,
          notifications: {
            permission: typeof Notification === "undefined" ? "unsupported" : Notification.permission,
          },
        };

        console.log("[DIAGNOSTICS] Estado atual do app:", diagnostics);
        setData(diagnostics);
      } catch (error) {
        console.error("[DIAGNOSTICS] Falha ao coletar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    collect();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>Diagnóstico do Aplicativo</span>
            {data?.isStandalone && <Badge variant="outline">PWA Standalone</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">Modo: {data?.displayMode ?? "detectando..."}</Badge>
            <Badge variant="secondary">
              Notificações: {data?.notifications.permission ?? "desconhecido"}
            </Badge>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Coletando informações...</p>}

          {data && (
            <div className="space-y-3 text-xs font-mono break-words max-h-[420px] overflow-auto">
              <div>
                <p className="font-semibold mb-1">Sessão atual</p>
                <pre className="bg-muted p-2 rounded-md whitespace-pre-wrap">
                  {JSON.stringify(data.session, null, 2)}
                </pre>
              </div>

              <div>
                <p className="font-semibold mb-1">Rota atual</p>
                <pre className="bg-muted p-2 rounded-md whitespace-pre-wrap">
                  {JSON.stringify(data.location, null, 2)}
                </pre>
              </div>

              <div>
                <p className="font-semibold mb-1">Service Workers</p>
                <pre className="bg-muted p-2 rounded-md whitespace-pre-wrap">
                  {JSON.stringify(data.serviceWorker, null, 2)}
                </pre>
              </div>

              <div>
                <p className="font-semibold mb-1">Caches</p>
                <pre className="bg-muted p-2 rounded-md whitespace-pre-wrap">
                  {JSON.stringify(data.caches, null, 2)}
                </pre>
              </div>

              <div>
                <p className="font-semibold mb-1">User Agent</p>
                <pre className="bg-muted p-2 rounded-md whitespace-pre-wrap">
                  {data.userAgent}
                </pre>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              Recarregar página
            </Button>
            <Button size="sm" variant="destructive" onClick={hardResetAndReload}>
              Limpar cache e reiniciar app
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Diagnostics;
