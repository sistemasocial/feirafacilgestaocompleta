import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Calendar as CalendarIcon, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminInfo } from "./AdminInfo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PaymentUpload from "@/components/payment/PaymentUpload";

type Inscricao = Tables<"inscricoes_feiras"> & {
  feiras: Tables<"feiras">;
  pagamento?: {
    id: string;
    status: string;
    valor_total: number;
  } | null;
};

const diasSemanaMap: Record<string, string> = {
  "0": "Domingo",
  "1": "Segunda",
  "2": "Terça",
  "3": "Quarta",
  "4": "Quinta",
  "5": "Sexta",
  "6": "Sábado",
};

export const FeirasAtivas = () => {
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInscricoes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: feiranteData } = await supabase
        .from("feirantes")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!feiranteData) return;

      const { data, error } = await supabase
        .from("inscricoes_feiras")
        .select("*, feiras(*)")
        .eq("feirante_id", feiranteData.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar inscrições:", error);
      } else {
        // Buscar pagamentos para cada inscrição
        const inscricoesComPagamento = await Promise.all(
          (data || []).map(async (inscricao) => {
            const { data: pagamentoData } = await supabase
              .from("pagamentos")
              .select("id, status, valor_total")
              .eq("feira_id", inscricao.feira_id)
              .eq("feirante_id", feiranteData.id)
              .maybeSingle();
            
            return {
              ...inscricao,
              pagamento: pagamentoData
            };
          })
        );
        
        setInscricoes(inscricoesComPagamento as any || []);
      }
      setLoading(false);
    };

    fetchInscricoes();
  }, []);

  const getStatusBadge = (status: string, pagamentoStatus?: string) => {
    if (status === "aprovada" && pagamentoStatus === "pago") {
      return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Aprovado - Participação Confirmada</Badge>;
    }
    
    switch (status) {
      case "aprovada":
        return <Badge className="bg-primary text-primary-foreground"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "pendente":
        return <Badge variant="outline" className="border-warning text-warning"><AlertCircle className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "rejeitada":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Minhas Inscrições</h2>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (inscricoes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Você ainda não se inscreveu em nenhuma feira.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Minhas Inscrições</h2>
      
      <div className="grid gap-6">
        {inscricoes.map((inscricao) => (
          <Card key={inscricao.id} className="overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">{inscricao.feiras.nome}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{inscricao.feiras.cidade} - {inscricao.feiras.bairro}</span>
                  </div>
                </div>
                {getStatusBadge(inscricao.status, inscricao.pagamento?.status)}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Horário</p>
                    <p className="font-medium">
                      {inscricao.feiras.horario_inicio} - {inscricao.feiras.horario_fim}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dias da Semana</p>
                    <p className="font-medium">
                      {inscricao.feiras.dias_semana.map((d) => diasSemanaMap[d]).join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Inscrito em {format(new Date(inscricao.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <AdminInfo adminId={inscricao.feiras.created_by} />
                
                {/* Sistema de Pagamento PIX */}
                {inscricao.status === "aprovada" && inscricao.pagamento && inscricao.pagamento.valor_total > 0 && (
                  <div className="mt-4 space-y-4">
                    {inscricao.pagamento.status !== "pago" ? (
                      <>
                        <div className="bg-gradient-to-br from-warning/20 via-warning/15 to-warning/10 border-2 border-warning/40 rounded-xl p-5 shadow-lg">
                          <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-warning-foreground">
                            <DollarSign className="w-6 h-6 text-warning" />
                            Pagamento Pendente
                          </h4>
                          <p className="text-base text-foreground/80 mb-4 font-medium">
                            Complete o pagamento via PIX para confirmar sua participação.
                          </p>
                          <div className="bg-background/80 backdrop-blur rounded-lg p-4 mb-3 border-2 border-primary/20 shadow-inner">
                            <p className="text-sm font-semibold mb-2 text-foreground/70">Valor Total:</p>
                            <p className="text-3xl font-bold text-primary">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(inscricao.pagamento.valor_total)}
                            </p>
                          </div>
                        </div>
                        
                        <PaymentUpload
                          pagamentoId={inscricao.pagamento.id}
                          status={inscricao.pagamento.status}
                          valorTotal={inscricao.pagamento.valor_total}
                          onUploadComplete={() => {
                            window.location.reload();
                          }}
                        />
                      </>
                    ) : (
                      <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="w-5 h-5" />
                          <p className="font-semibold">Pagamento Confirmado</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Sua participação está confirmada!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
