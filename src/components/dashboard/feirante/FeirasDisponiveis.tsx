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
    <div className="space-y-4">
      {feiras.map((feira) => {
        const status = inscricoes[feira.id];
        const total = calcularTotal(feira);
        
        return (
          <Card key={feira.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">{feira.nome}</h3>
                  <Badge variant={feira.tipo_feira === "publica" ? "default" : "secondary"}>
                    {feira.tipo_feira === "publica" ? "Feira Pública" : "Condomínio"}
                  </Badge>
                </div>
                {status && (
                  <Badge 
                    variant={
                      status === "aprovada" ? "default" : 
                      status === "rejeitada" ? "destructive" : 
                      "secondary"
                    }
                  >
                    {status === "aprovada" ? "Aprovado" :
                     status === "rejeitada" ? "Rejeitado" :
                     "Pendente"}
                  </Badge>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>
                    {feira.endereco}, {feira.bairro} - {feira.cidade}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>
                    {feira.dias_semana.map((dia) => diasSemanaMap[dia]).join(", ")}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>
                    {feira.horario_inicio} às {feira.horario_fim}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-warning" />
                  <span>
                    Chegue {feira.tempo_antecedencia_minutos} min antes
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  Valores
                </h4>
                <div className="grid gap-2 text-sm">
                  {feira.valor_participacao && Number(feira.valor_participacao) > 0 && (
                    <div className="flex justify-between">
                      <span>Valor de Participação:</span>
                      <span className="font-medium">{formatCurrency(Number(feira.valor_participacao))}</span>
                    </div>
                  )}
                  {feira.taxa_energia && Number(feira.taxa_energia) > 0 && (
                    <div className="flex justify-between">
                      <span>Taxa de Energia:</span>
                      <span className="font-medium">{formatCurrency(Number(feira.taxa_energia))}</span>
                    </div>
                  )}
                  {feira.taxa_limpeza && Number(feira.taxa_limpeza) > 0 && (
                    <div className="flex justify-between">
                      <span>Taxa de Limpeza:</span>
                      <span className="font-medium">{formatCurrency(Number(feira.taxa_limpeza))}</span>
                    </div>
                  )}
                  {feira.taxa_seguranca && Number(feira.taxa_seguranca) > 0 && (
                    <div className="flex justify-between">
                      <span>Taxa de Segurança:</span>
                      <span className="font-medium">{formatCurrency(Number(feira.taxa_seguranca))}</span>
                    </div>
                  )}
                  {total > 0 && (
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(total)}</span>
                    </div>
                  )}
                </div>
              </div>

              {feira.formas_pagamento && feira.formas_pagamento.length > 0 && (
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-success mt-0.5" />
                  <div>
                    <span className="text-sm font-medium">Formas de pagamento: </span>
                    <span className="text-sm">
                      {feira.formas_pagamento.map(f => f.toUpperCase()).join(", ")}
                    </span>
                  </div>
                </div>
              )}

              {feira.avisos && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                  <p className="text-sm"><strong>Avisos:</strong> {feira.avisos}</p>
                </div>
              )}

              {feira.regras_evento && (
                <div className="text-sm">
                  <strong>Regras:</strong>
                  <p className="text-muted-foreground mt-1">{feira.regras_evento}</p>
                </div>
              )}

              {!status ? (
                <Button 
                  onClick={() => handleInscrever(feira.id)} 
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Quero Participar desta Feira
                </Button>
              ) : status === "aprovada" ? (
                <Button className="w-full" variant="outline" disabled>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Você está inscrito nesta feira
                </Button>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
