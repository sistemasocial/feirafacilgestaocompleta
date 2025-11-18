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
      // Criar inscrição
      const { data: inscricaoData, error: inscricaoError } = await supabase
        .from("inscricoes_feiras")
        .insert({
          feira_id: feiraId,
          feirante_id: feiranteId,
          status: "aprovada",
          segmento_inscrito: feiranteSegmento as any,
        })
        .select()
        .single();

      if (inscricaoError) throw inscricaoError;

      // Buscar feira para criar pagamento
      const feira = feiras.find(f => f.id === feiraId);
      if (feira) {
        const total = calcularTotal(feira);
        
        // Criar registro de pagamento
        const { error: pagamentoError } = await supabase
          .from("pagamentos")
          .insert({
            feira_id: feiraId,
            feirante_id: feiranteId,
            valor_total: total,
            taxa_participacao: Number(feira.valor_participacao || 0),
            taxa_energia: Number(feira.taxa_energia || 0),
            taxa_limpeza: Number(feira.taxa_limpeza || 0),
            taxa_seguranca: Number(feira.taxa_seguranca || 0),
            data_referencia: new Date().toISOString().split('T')[0],
            status: total > 0 ? "pendente" : "pago",
          });

        if (pagamentoError) throw pagamentoError;
      }

      toast.success("Participação confirmada! Complete o pagamento para finalizar.");
      
      setInscricoes(prev => ({
        ...prev,
        [feiraId]: "aprovada"
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
      <div className="space-y-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Feiras Disponíveis</h2>
          <p className="text-muted-foreground">
            Veja as feiras disponíveis e confirme sua participação
          </p>
        </div>

        {feiras.map((feira) => {
          const status = inscricoes[feira.id];
          const total = calcularTotal(feira);
          
          return (
            <Card key={feira.id} className="overflow-hidden">
              {/* Header - Informações Destacadas */}
              <div className="bg-primary/5 border-l-4 border-primary px-6 py-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">{feira.nome}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{feira.cidade} - {feira.bairro}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{feira.dias_semana.map((dia) => diasSemanaMap[dia]).join(", ")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{feira.horario_inicio} - {feira.horario_fim}</span>
                        </div>
                      </div>
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

                  {feira.segmento_exclusivo && (
                    <div className="flex items-start gap-2 bg-warning/10 border border-warning/20 rounded p-3 mt-3">
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-warning">
                        <strong>Segmento Exclusivo:</strong> Você será o único feirante autorizado para seu segmento nesta feira
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalhes da Feira */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{feira.endereco}, {feira.bairro} - {feira.cidade}</span>
                </div>

                {feira.observacoes && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium mb-1">📋 Observações do Administrador</p>
                    <p className="text-sm text-muted-foreground">{feira.observacoes}</p>
                  </div>
                )}

                {feira.avisos && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <p className="text-sm font-medium text-warning mb-1">⚠️ Avisos Importantes</p>
                    <p className="text-sm text-muted-foreground">{feira.avisos}</p>
                  </div>
                )}

                <div className="bg-gradient-to-br from-blue-500/10 via-indigo-400/10 to-purple-500/10 border-2 border-blue-500/30 rounded-xl p-5 shadow-lg">
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-foreground">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                    💰 Valores
                  </h4>
                  <div className="grid gap-3 text-base">
                    {/* Mostrar detalhes apenas se houver taxas adicionais */}
                    {(feira.taxa_energia && Number(feira.taxa_energia) > 0) || 
                     (feira.taxa_limpeza && Number(feira.taxa_limpeza) > 0) || 
                     (feira.taxa_seguranca && Number(feira.taxa_seguranca) > 0) ? (
                      <>
                        {feira.valor_participacao && Number(feira.valor_participacao) > 0 && (
                          <div className="flex justify-between items-center bg-background/60 rounded-lg px-3 py-2">
                            <span className="font-medium text-foreground/80">Valor de Participação da Feira:</span>
                            <span className="font-bold text-lg text-foreground">
                              {formatCurrency(Number(feira.valor_participacao))}
                            </span>
                          </div>
                        )}
                        {feira.taxa_energia && Number(feira.taxa_energia) > 0 && (
                          <div className="flex justify-between items-center bg-background/60 rounded-lg px-3 py-2">
                            <span className="font-medium text-foreground/80">Taxa de Energia:</span>
                            <span className="font-bold text-lg text-foreground">{formatCurrency(Number(feira.taxa_energia))}</span>
                          </div>
                        )}
                        {feira.taxa_limpeza && Number(feira.taxa_limpeza) > 0 && (
                          <div className="flex justify-between items-center bg-background/60 rounded-lg px-3 py-2">
                            <span className="font-medium text-foreground/80">Taxa de Limpeza:</span>
                            <span className="font-bold text-lg text-foreground">{formatCurrency(Number(feira.taxa_limpeza))}</span>
                          </div>
                        )}
                        {feira.taxa_seguranca && Number(feira.taxa_seguranca) > 0 && (
                          <div className="flex justify-between items-center bg-background/60 rounded-lg px-3 py-2">
                            <span className="font-medium text-foreground/80">Taxa de Segurança:</span>
                            <span className="font-bold text-lg text-foreground">{formatCurrency(Number(feira.taxa_seguranca))}</span>
                          </div>
                        )}
                        {total > 0 && (
                          <div className="flex justify-between items-center bg-blue-600/20 border-2 border-blue-600/40 rounded-lg px-4 py-3 mt-2">
                            <span className="font-bold text-lg text-foreground">Total:</span>
                            <span className="font-bold text-2xl text-blue-700 dark:text-blue-400">{formatCurrency(total)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Se não houver taxas adicionais, mostrar apenas o total */
                      total > 0 && (
                        <div className="flex justify-between items-center bg-blue-600/20 border-2 border-blue-600/40 rounded-lg px-4 py-3">
                          <span className="font-bold text-lg text-foreground">Total:</span>
                          <span className="font-bold text-2xl text-blue-700 dark:text-blue-400">{formatCurrency(total)}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <AdminInfo adminId={feira.created_by} />

                {!status && (
                  <Button 
                    onClick={() => handleInscreverClick(feira)}
                    className="w-full"
                    size="lg"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceitar Participação
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
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
