import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, ExternalLink, Loader2, Clock, DollarSign, MapPin, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Pagamento {
  id: string;
  valor_total: number;
  status: string;
  data_upload: string | null;
  comprovante_feirante_url: string | null;
  feira_id: string;
  feirante_id: string;
  data_referencia: string;
  feira: {
    nome: string;
  };
  feirante: {
    user_id: string;
  };
  profile: {
    full_name: string;
    foto_url: string | null;
  };
}

export function PagamentosVerificacao() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComprovante, setSelectedComprovante] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPagamentos();
  }, []);

  const loadPagamentos = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("pagamentos")
        .select(`
          *,
          feira:feiras(nome),
          feirante:feirantes(user_id)
        `)
        .in("status", ["aguardando_verificacao", "pendente"])
        .order("data_upload", { ascending: false });

      if (error) throw error;

      // Buscar informações do perfil de cada feirante
      const pagamentosComPerfil = await Promise.all(
        (data || []).map(async (pag) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, foto_url")
            .eq("id", pag.feirante.user_id)
            .single();

          return {
            ...pag,
            profile: profile || { full_name: "Sem nome", foto_url: null },
          };
        })
      );

      setPagamentos(pagamentosComPerfil);
    } catch (error: any) {
      console.error("Erro ao carregar pagamentos:", error);
      toast.error("Erro ao carregar pagamentos pendentes");
    } finally {
      setLoading(false);
    }
  };

  const visualizarComprovante = async (comprovanteUrl: string) => {
    try {
      const { data } = await supabase.storage
        .from("comprovantes")
        .createSignedUrl(comprovanteUrl, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error: any) {
      toast.error("Erro ao visualizar comprovante");
    }
  };

  const handleVerificarPagamento = async (pagamentoId: string, aprovar: boolean) => {
    setProcessingId(pagamentoId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const updateData = aprovar
        ? {
            status: "pago" as const,
            verificado_por: user.id,
            data_pagamento: new Date().toISOString(),
          }
        : {
            status: "pendente" as const,
            comprovante_feirante_url: null,
            data_upload: null,
          };

      const { error } = await supabase
        .from("pagamentos")
        .update(updateData)
        .eq("id", pagamentoId);

      if (error) throw error;

      toast.success(
        aprovar
          ? "Pagamento aprovado com sucesso!"
          : "Comprovante rejeitado. Feirante deverá enviar novamente."
      );

      loadPagamentos();
    } catch (error: any) {
      toast.error("Erro ao processar pagamento: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground mt-4">Carregando pagamentos...</p>
      </Card>
    );
  }

  if (pagamentos.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Nenhum pagamento pendente</h3>
            <p className="text-muted-foreground">
              Não há comprovantes aguardando verificação no momento.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Verificar Pagamentos</h2>
        <p className="text-muted-foreground">
          {pagamentos.length} pagamento{pagamentos.length !== 1 ? "s" : ""} pendente{pagamentos.length !== 1 ? "s" : ""} ou aguardando verificação
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pagamentos.map((pagamento) => (
          <Card 
            key={pagamento.id} 
            className="p-6 hover:shadow-lg transition-all hover:scale-[1.02] animate-fade-in"
          >
            <div className="space-y-4">
              {/* Header com Avatar e Nome */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={pagamento.profile.foto_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {pagamento.profile.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{pagamento.profile.full_name}</h3>
                  <Badge 
                    variant="outline" 
                    className={
                      pagamento.status === "aguardando_verificacao"
                        ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 text-xs"
                        : "bg-orange-500/10 text-orange-700 border-orange-500/20 text-xs"
                    }
                  >
                    {pagamento.status === "aguardando_verificacao" 
                      ? "Aguardando" 
                      : "Pendente"}
                  </Badge>
                </div>
              </div>

              {/* Informações da Feira */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium">{pagamento.feira.nome}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Ref: {new Date(pagamento.data_referencia).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {pagamento.data_upload && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Enviado: {new Date(pagamento.data_upload).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>

              {/* Valor Total */}
              <div className={`p-4 rounded-lg ${
                pagamento.status === "aguardando_verificacao" 
                  ? "bg-yellow-500/10" 
                  : "bg-orange-500/10"
              }`}>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  R$ {pagamento.valor_total.toFixed(2)}
                </p>
              </div>

              {/* Ações */}
              <div className="flex flex-col gap-2">
                {pagamento.comprovante_feirante_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => visualizarComprovante(pagamento.comprovante_feirante_url!)}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Comprovante
                  </Button>
                )}
                
                {pagamento.status === "aguardando_verificacao" && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleVerificarPagamento(pagamento.id, true)}
                      disabled={processingId === pagamento.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processingId === pagamento.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Aprovar
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleVerificarPagamento(pagamento.id, false)}
                      disabled={processingId === pagamento.id}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
