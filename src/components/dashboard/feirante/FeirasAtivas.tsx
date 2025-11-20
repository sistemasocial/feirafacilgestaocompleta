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

      const { data: feiranteData, error: feiranteError } = await supabase
        .from("feirantes")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (feiranteError) {
        console.error("Erro ao buscar feirante:", feiranteError);
        setLoading(false);
        return;
      }

      if (!feiranteData) {
        console.log("Perfil de feirante não encontrado");
        setLoading(false);
        return;
      }

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
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Minhas Inscrições</h2>
        <p className="text-muted-foreground">Acompanhe suas inscrições e status de pagamento</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inscricoes.map((inscricao) => (
          <Card key={inscricao.id} className="p-6 hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col animate-fade-in">
            <div className="space-y-4 flex-1">
              {/* Título e Status */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold line-clamp-2">{inscricao.feiras.nome}</h3>
                <div className="shrink-0">
                  {inscricao.status === "aprovada" && inscricao.pagamento?.status === "pago" ? (
                    <Badge className="bg-success text-success-foreground">
                      <CheckCircle className="w-3 h-3 mr-1" />✓
                    </Badge>
                  ) : inscricao.status === "aprovada" ? (
                    <Badge className="bg-primary text-primary-foreground">
                      <CheckCircle className="w-3 h-3 mr-1" />✓
                    </Badge>
                  ) : inscricao.status === "pendente" ? (
                    <Badge variant="outline" className="border-warning text-warning">
                      <AlertCircle className="w-3 h-3 mr-1" />⏱
                    </Badge>
                  ) : (
                    <Badge variant="destructive">✗</Badge>
                  )}
                </div>
              </div>

              {/* Localização */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  {inscricao.feiras.bairro}, {inscricao.feiras.cidade}
                </span>
              </div>

              {/* Horário */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span>{inscricao.feiras.horario_inicio} - {inscricao.feiras.horario_fim}</span>
              </div>

              {/* Dias da Semana */}
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
                <span className="line-clamp-1">
                  {inscricao.feiras.dias_semana.map((d) => diasSemanaMap[d]).join(", ")}
                </span>
              </div>

              {/* Data de Inscrição */}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Inscrito em {format(new Date(inscricao.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </div>

              {/* Admin Info */}
              <AdminInfo adminId={inscricao.feiras.created_by} />
              
              {/* Status de Pagamento */}
              {inscricao.status === "aprovada" && inscricao.pagamento && inscricao.pagamento.valor_total > 0 && (
                <div className="space-y-3">
                  {inscricao.pagamento.status !== "pago" ? (
                    <>
                      <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-warning" />
                          <p className="text-sm font-semibold text-warning">Pagamento Pendente</p>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(inscricao.pagamento.valor_total)}
                        </p>
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
                    <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle className="w-4 h-4" />
                        <p className="text-sm font-semibold">Pago ✓</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
