import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, DollarSign, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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
import { AdminInfo } from "./AdminInfo";

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

export const FeirasDisponiveisEnhanced = () => {
  const [feiras, setFeiras] = useState<Feira[]>([]);
  const [loading, setLoading] = useState(true);
  const [inscricoes, setInscricoes] = useState<Record<string, string>>({});
  const [feiranteId, setFeiranteId] = useState<string | null>(null);
  const [feiranteSegmento, setFeiranteSegmento] = useState<string | null>(null);
  const [selectedFeira, setSelectedFeira] = useState<Feira | null>(null);
  const [showExclusivityDialog, setShowExclusivityDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: feiranteData } = await supabase
          .from("feirantes")
          .select("id, segmento")
          .eq("user_id", user.id)
          .single();
        
        if (feiranteData) {
          setFeiranteId(feiranteData.id);
          setFeiranteSegmento(feiranteData.segmento);
          
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

  const handleInscreverClick = async (feira: Feira) => {
    if (!feiranteId) {
      toast.error("Erro ao processar inscrição. Entre em contato com o administrador.");
      return;
    }

    if (feira.segmento_exclusivo) {
      setSelectedFeira(feira);
      setShowExclusivityDialog(true);
    } else {
      await realizarInscricao(feira.id);
    }
  };

  const realizarInscricao = async (feiraId: string) => {
    if (!feiranteId || !feiranteSegmento) return;

    try {
      // Criar inscrição com status pendente
      const { data: inscricaoData, error: inscricaoError } = await supabase
        .from("inscricoes_feiras")
        .insert({
          feira_id: feiraId,
          feirante_id: feiranteId,
          status: "pendente",
          segmento_inscrito: feiranteSegmento as any,
        })
        .select()
        .single();

      if (inscricaoError) throw inscricaoError;

      toast.success("Solicitação enviada! Aguarde a aprovação do administrador.");
      
      setInscricoes(prev => ({
        ...prev,
        [feiraId]: "pendente"
      }));
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Você já está inscrito nesta feira");
      } else {
        console.error("Erro ao realizar inscrição:", error);
        toast.error("Erro ao realizar inscrição: " + error.message);
      }
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value || value === 0) return "Não informado";
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
    <>
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Feiras Disponíveis</h2>
          <p className="text-muted-foreground">
            Veja as feiras disponíveis e confirme sua participação
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feiras.map((feira) => {
            const status = inscricoes[feira.id];
            const total = calcularTotal(feira);
            
            return (
              <Card key={feira.id} className="p-6 hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col animate-fade-in">
                <div className="space-y-4 flex-1">
                  {/* Título e Status */}
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

                  {/* Badge de Tipo e Exclusividade */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={feira.tipo_feira === "publica" ? "default" : "secondary"} className="w-fit">
                      {feira.tipo_feira === "publica" ? "Feira Pública" : "Condomínio"}
                    </Badge>
                    {feira.segmento_exclusivo && (
                      <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-500">
                        ⭐ Exclusivo
                      </Badge>
                    )}
                  </div>

                  {/* Informações Principais */}
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

                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                      <span>
                        <strong>Pagamento:</strong> {feira.prazo_pagamento_dias || 3} dias antes da feira
                      </span>
                    </div>
                  </div>

                  {/* Valor Total */}
                  {total > 0 && (
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Valor Total</span>
                        </div>
                        <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  )}

                  {/* Avisos */}
                  {feira.avisos && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-2">
                      <p className="text-xs"><strong>⚠️ Aviso:</strong> {feira.avisos}</p>
                    </div>
                  )}

                  {/* Segmento Exclusivo Aviso */}
                  {feira.segmento_exclusivo && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                      <p className="text-xs text-amber-900 dark:text-amber-200">
                        <strong>Exclusividade:</strong> Único no seu segmento
                      </p>
                    </div>
                  )}
                </div>

                {/* Admin Info Compacta */}
                <AdminInfo adminId={feira.created_by} />

                {/* Botão de Ação */}
                <div className="mt-auto pt-4">
                  {!status ? (
                    <Button 
                      onClick={() => handleInscreverClick(feira)}
                      className="w-full"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aceitar Participação
                    </Button>
                  ) : status === "aprovada" ? (
                    <Button className="w-full" variant="outline" size="sm" disabled>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Participação Confirmada
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

      {/* Exclusivity Warning Dialog */}
      <AlertDialog open={showExclusivityDialog} onOpenChange={setShowExclusivityDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Segmento Exclusivo
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Esta feira possui <strong>exclusividade de segmento</strong>.
              </p>
              <p>
                Ao confirmar sua participação, você será o único feirante autorizado para o seu segmento ({feiranteSegmento}) nesta feira.
              </p>
              <p className="text-sm text-muted-foreground">
                Deseja continuar com a inscrição?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedFeira(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedFeira) {
                  realizarInscricao(selectedFeira.id);
                  setShowExclusivityDialog(false);
                  setSelectedFeira(null);
                }
              }}
            >
              Confirmar Inscrição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
