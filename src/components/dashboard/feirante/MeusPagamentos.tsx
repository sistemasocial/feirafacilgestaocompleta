import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, CheckCircle, Clock, AlertCircle, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Pagamento {
  id: string;
  valor_total: number;
  status: string;
  data_referencia: string;
  data_pagamento: string | null;
  taxa_participacao: number;
  taxa_energia: number | null;
  taxa_limpeza: number | null;
  taxa_seguranca: number | null;
  comprovante_feirante_url: string | null;
  feira: {
    nome: string;
    bairro: string;
    cidade: string;
  };
}

export const MeusPagamentos = () => {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPagamentos();
  }, []);

  const loadPagamentos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: feiranteData } = await supabase
        .from("feirantes")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!feiranteData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("pagamentos")
        .select(`
          *,
          feira:feiras(nome, bairro, cidade)
        `)
        .eq("feirante_id", feiranteData.id)
        .order("data_referencia", { ascending: false });

      if (error) {
        console.error("Erro ao buscar pagamentos:", error);
        toast.error("Erro ao carregar pagamentos");
      } else {
        setPagamentos(data as any || []);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Pago
          </Badge>
        );
      case "aguardando_verificacao":
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando Verificação
          </Badge>
        );
      case "pendente":
        return (
          <Badge variant="outline" className="border-warning text-warning">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "atrasado":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Atrasado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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
    } catch (error) {
      toast.error("Erro ao visualizar comprovante");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Meus Pagamentos</h2>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (pagamentos.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Meus Pagamentos</h2>
        <Card className="p-8 text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Você ainda não possui pagamentos registrados.</p>
        </Card>
      </div>
    );
  }

  const pagamentosPendentes = pagamentos.filter(p => p.status === "pendente" || p.status === "atrasado");
  const pagamentosAguardando = pagamentos.filter(p => p.status === "aguardando_verificacao");
  const pagamentosConfirmados = pagamentos.filter(p => p.status === "pago");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Meus Pagamentos</h2>
        <p className="text-muted-foreground">Acompanhe o histórico de todos os seus pagamentos</p>
      </div>

      {/* Pagamentos Pendentes */}
      {pagamentosPendentes.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Pagamentos Pendentes
          </h3>
          <div className="grid gap-4">
            {pagamentosPendentes.map((pagamento) => (
              <Card key={pagamento.id} className="p-6 border-warning/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold mb-1">{pagamento.feira.nome}</h4>
                    <p className="text-sm text-muted-foreground">
                      {pagamento.feira.bairro}, {pagamento.feira.cidade}
                    </p>
                  </div>
                  {getStatusBadge(pagamento.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Referência</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(pagamento.data_referencia), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-bold text-lg text-warning">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(pagamento.valor_total)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Detalhamento:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Participação:</span>
                      <span>R$ {pagamento.taxa_participacao.toFixed(2)}</span>
                    </div>
                    {pagamento.taxa_energia && pagamento.taxa_energia > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Energia:</span>
                        <span>R$ {pagamento.taxa_energia.toFixed(2)}</span>
                      </div>
                    )}
                    {pagamento.taxa_limpeza && pagamento.taxa_limpeza > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Limpeza:</span>
                        <span>R$ {pagamento.taxa_limpeza.toFixed(2)}</span>
                      </div>
                    )}
                    {pagamento.taxa_seguranca && pagamento.taxa_seguranca > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Segurança:</span>
                        <span>R$ {pagamento.taxa_seguranca.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pagamentos Aguardando Verificação */}
      {pagamentosAguardando.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Aguardando Verificação
          </h3>
          <div className="grid gap-4">
            {pagamentosAguardando.map((pagamento) => (
              <Card key={pagamento.id} className="p-6 border-yellow-500/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold mb-1">{pagamento.feira.nome}</h4>
                    <p className="text-sm text-muted-foreground">
                      {pagamento.feira.bairro}, {pagamento.feira.cidade}
                    </p>
                  </div>
                  {getStatusBadge(pagamento.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Referência</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(pagamento.data_referencia), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-bold text-lg">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(pagamento.valor_total)}
                    </p>
                  </div>
                </div>

                {pagamento.comprovante_feirante_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => visualizarComprovante(pagamento.comprovante_feirante_url!)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Comprovante Enviado
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pagamentos Confirmados */}
      {pagamentosConfirmados.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Pagamentos Confirmados
          </h3>
          <div className="grid gap-4">
            {pagamentosConfirmados.map((pagamento) => (
              <Card key={pagamento.id} className="p-6 border-success/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold mb-1">{pagamento.feira.nome}</h4>
                    <p className="text-sm text-muted-foreground">
                      {pagamento.feira.bairro}, {pagamento.feira.cidade}
                    </p>
                  </div>
                  {getStatusBadge(pagamento.status)}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Referência</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(pagamento.data_referencia), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  {pagamento.data_pagamento && (
                    <div>
                      <p className="text-sm text-muted-foreground">Data do Pagamento</p>
                      <p className="font-medium">
                        {format(new Date(pagamento.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-bold text-lg text-success">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(pagamento.valor_total)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};