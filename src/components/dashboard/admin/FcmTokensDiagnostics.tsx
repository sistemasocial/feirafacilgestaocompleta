import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Bell, AlertCircle, CheckCircle, RefreshCw, Trash2, Users, Volume2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { playNotificationSound } from "@/lib/notificationService";

interface FcmTokenData {
  id: string;
  user_id: string;
  token: string;
  device_info: string | null;
  created_at: string;
  updated_at: string | null;
}

interface FeiranteWithToken {
  user_id: string;
  full_name: string;
  whatsapp: string | null;
  has_token: boolean;
  last_token_update: string | null;
}

export function FcmTokensDiagnostics() {
  const [tokens, setTokens] = useState<FcmTokenData[]>([]);
  const [feirantes, setFeirantes] = useState<FeiranteWithToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [clearingOld, setClearingOld] = useState(false);

  const handleTestSound = () => {
    console.log("[Teste] Tocando som de notificação...");
    playNotificationSound();
    toast.success("Som de notificação tocado!");
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar tokens FCM
      const { data: tokensData, error: tokensError } = await supabase
        .from('fcm_tokens')
        .select('*')
        .order('updated_at', { ascending: false });

      if (tokensError) throw tokensError;

      // Carregar todos os feirantes
      const { data: allFeirantes, error: feirantesError } = await supabase
        .from('feirantes')
        .select('user_id');

      if (feirantesError) throw feirantesError;

      // Carregar perfis dos usuários
      const userIds = allFeirantes?.map(f => f.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, whatsapp')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      setTokens(tokensData || []);

      // Criar mapa de perfis
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Criar mapa de tokens
      const tokenMap = new Map(tokensData?.map(t => [t.user_id, t.updated_at]) || []);
      
      const feirantesWithStatus = allFeirantes?.map(f => {
        const profile = profileMap.get(f.user_id);
        return {
          user_id: f.user_id,
          full_name: profile?.full_name || 'Sem nome',
          whatsapp: profile?.whatsapp || null,
          has_token: tokenMap.has(f.user_id),
          last_token_update: tokenMap.get(f.user_id) || null
        };
      }) || [];

      setFeirantes(feirantesWithStatus);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearInvalidTokens = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os tokens FCM? Os feirantes precisarão reabrir o app.')) {
      return;
    }

    setClearing(true);
    try {
      const { error } = await supabase
        .from('fcm_tokens')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      toast.success('Todos os tokens FCM foram removidos');
      loadData();
    } catch (error: any) {
      console.error('Erro ao limpar tokens:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleClearOldTokens = async () => {
    if (!confirm('Limpar tokens antigos do projeto feira-facil-1d3bf? Isso não afetará tokens novos válidos.')) {
      return;
    }

    setClearingOld(true);
    try {
      // Buscar tokens que começam com prefixos antigos
      const { data: oldTokens, error: fetchError } = await supabase
        .from('fcm_tokens')
        .select('id, token')
        .or('token.like.f_EgywJE%,token.like.fdiluLHMXrEA%');

      if (fetchError) throw fetchError;

      if (!oldTokens || oldTokens.length === 0) {
        toast.info('Nenhum token antigo encontrado');
        return;
      }

      const tokenIds = oldTokens.map(t => t.id);
      const { error: deleteError } = await supabase
        .from('fcm_tokens')
        .delete()
        .in('id', tokenIds);

      if (deleteError) throw deleteError;

      toast.success(`${oldTokens.length} token(s) antigo(s) removido(s)`);
      loadData();
    } catch (error: any) {
      console.error('Erro ao limpar tokens antigos:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setClearingOld(false);
    }
  };

  const feirantesWithTokens = feirantes.filter(f => f.has_token);
  const feirantesWithoutTokens = feirantes.filter(f => !f.has_token);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Diagnóstico de Tokens FCM
            </CardTitle>
            <CardDescription>
              Verifique quais feirantes podem receber notificações push
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleTestSound}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Testar Som
            </Button>
            <Button 
              onClick={loadData} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              onClick={handleClearOldTokens}
              disabled={clearingOld || tokens.length === 0}
              variant="outline"
              size="sm"
              className="text-orange-600 hover:text-orange-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Antigos
            </Button>
            <Button 
              onClick={handleClearInvalidTokens}
              disabled={clearing || tokens.length === 0}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Todos
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{feirantes.length}</div>
                <div className="text-sm text-muted-foreground">Total Feirantes</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{feirantesWithTokens.length}</div>
                <div className="text-sm text-muted-foreground">Com Token FCM</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold text-orange-600">{feirantesWithoutTokens.length}</div>
                <div className="text-sm text-muted-foreground">Sem Token FCM</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status geral */}
        {feirantesWithoutTokens.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{feirantesWithoutTokens.length} feirante(s)</strong> não podem receber notificações push.
              Eles precisam abrir o app e permitir notificações.
            </AlertDescription>
          </Alert>
        )}

        {feirantesWithTokens.length > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{feirantesWithTokens.length} feirante(s)</strong> podem receber notificações push.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de feirantes com tokens */}
        {feirantesWithTokens.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Feirantes com Token FCM ({feirantesWithTokens.length})
            </h3>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-2">
                {feirantesWithTokens.map((f) => (
                  <div key={f.user_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                      <div className="font-medium">{f.full_name}</div>
                      {f.whatsapp && (
                        <div className="text-sm text-muted-foreground">{f.whatsapp}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                      {f.last_token_update && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(f.last_token_update), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Lista de feirantes sem tokens */}
        {feirantesWithoutTokens.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              Feirantes sem Token FCM ({feirantesWithoutTokens.length})
            </h3>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-2">
                {feirantesWithoutTokens.map((f) => (
                  <div key={f.user_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                      <div className="font-medium">{f.full_name}</div>
                      {f.whatsapp && (
                        <div className="text-sm text-muted-foreground">{f.whatsapp}</div>
                      )}
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      Sem Token
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Instruções */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Como os feirantes podem receber notificações:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Abrir o app FeiraFácil</li>
              <li>Permitir notificações quando solicitado</li>
              <li>Manter o app aberto por alguns segundos para registrar o token</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
