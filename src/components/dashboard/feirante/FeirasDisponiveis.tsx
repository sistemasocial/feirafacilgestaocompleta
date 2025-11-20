import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Feira = Tables<"feiras">;

const diasSemanaMap: Record<string, string> = {
  "0": "Domingo",
  "1": "Segunda",
  "2": "Terça",
  "3": "Quarta",
  "4": "Quinta",
  "5": "Sexta",
  "6": "Sábado",
};

export const FeirasDisponiveis = () => {
  const [feiras, setFeiras] = useState<Feira[]>([]);
  const [loading, setLoading] = useState(true);
  const [inscricoes, setInscricoes] = useState<Record<string, string>>({});
  const [feiranteId, setFeiranteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: feiranteData } = await supabase
          .from("feirantes")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (feiranteData) {
          setFeiranteId(feiranteData.id);
          
          const { data: inscricoesData } = await supabase
            .from("inscricoes_feiras")
            .select("feira_id, status")
            .eq("feirante_id", feiranteData.id);
          
          if (inscricoesData) {
            const inscricoesMap: Record<string, string> = {};
            inscricoesData.forEach(i => {
              inscricoesMap[i.feira_id] = i.status;
            });
            setInscricoes(inscricoesMap);
          }
        }
      }

      const { data, error } = await supabase
        .from("feiras")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar feiras:", error);
      } else {
        setFeiras(data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleInscrever = async (feiraId: string) => {
    if (!feiranteId) {
      toast.error("Você precisa completar seu cadastro de feirante primeiro");
      return;
    }

    try {
      const { error } = await supabase
        .from("inscricoes_feiras")
        .insert({
          feira_id: feiraId,
          feirante_id: feiranteId,
          status: "pendente",
        });

      if (error) throw error;

      toast.success("Inscrição realizada com sucesso! Aguarde aprovação do administrador.");
      
      setInscricoes(prev => ({
        ...prev,
        [feiraId]: "pendente"
      }));
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Você já está inscrito nesta feira");
      } else {
        toast.error("Erro ao realizar inscrição: " + error.message);
      }
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const calcularTotal = (feira: Feira) => {
    const valor = Number(feira.valor_participacao || 0);
    const energia = Number(feira.taxa_energia || 0);
    const limpeza = Number(feira.taxa_limpeza || 0);
    const seguranca = Number(feira.taxa_seguranca || 0);
    return valor + energia + limpeza + seguranca;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (feiras.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma feira cadastrada</h3>
        <p className="text-muted-foreground">
          Ainda não há feiras disponíveis. Aguarde o administrador cadastrar novas feiras.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Feiras Disponíveis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feiras.map((feira) => {
          const status = inscricoes[feira.id];
          const total = calcularTotal(feira);
          
          return (
            <Card key={feira.id} className="p-6 hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col">

              <div className="space-y-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold line-clamp-2">{feira.nome}</h3>
                  {status && (
                    <Badge 
                      variant={
                        status === "aprovada" ? "default" : 
                        status === "rejeitada" ? "destructive" : 
                        "secondary"
                      }
                      className="shrink-0"
                    >
                      {status === "aprovada" ? "✓" :
                       status === "rejeitada" ? "✗" :
                       "⏱"}
                    </Badge>
                  )}
                </div>

                <Badge variant={feira.tipo_feira === "publica" ? "default" : "secondary"} className="w-fit">
                  {feira.tipo_feira === "publica" ? "Feira Pública" : "Condomínio"}
                </Badge>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {feira.bairro}, {feira.cidade}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span className="line-clamp-1">
                      {feira.dias_semana.map((dia) => diasSemanaMap[dia]).join(", ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span>
                      {feira.horario_inicio} - {feira.horario_fim}
                    </span>
                  </div>
                </div>

                {total > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-success" />
                        <span className="text-sm font-medium">Valor Total</span>
                      </div>
                      <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>
                )}

                {feira.avisos && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-2">
                    <p className="text-xs"><strong>⚠️ Aviso:</strong> {feira.avisos}</p>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4">
                {!status ? (
                  <Button 
                    onClick={() => handleInscrever(feira.id)} 
                    className="w-full"
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Participar
                  </Button>
                ) : status === "aprovada" ? (
                  <Button className="w-full" variant="outline" size="sm" disabled>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Inscrito
                  </Button>
                ) : status === "pendente" ? (
                  <Button className="w-full" variant="secondary" size="sm" disabled>
                    ⏱ Aguardando Aprovação
                  </Button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
