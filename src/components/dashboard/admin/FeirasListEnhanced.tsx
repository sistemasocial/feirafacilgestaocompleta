import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Clock, Calendar, DollarSign, Plus, Users, Trash2, AlertCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { FeiraEditForm } from "./FeiraEditForm";
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

interface Feira {
  id: string;
  nome: string;
  cidade: string;
  bairro: string;
  endereco: string;
  tipo_feira: string;
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  tempo_antecedencia_minutos: number;
  formas_pagamento: string[];
  horas_cancelamento_sem_multa: number;
  taxa_cancelamento: number;
  regras_evento: string | null;
  politica_cancelamento: string | null;
  avisos: string | null;
  observacoes: string | null;
  recorrente: boolean;
  segmento_exclusivo: boolean;
  valor_participacao: number | null;
  prazo_pagamento_dias: number | null;
}

interface FeirasListEnhancedProps {
  onAddNew: () => void;
}

const DIAS_SEMANA_LABELS: { [key: string]: string } = {
  "0": "Dom",
  "1": "Seg",
  "2": "Ter",
  "3": "Qua",
  "4": "Qui",
  "5": "Sex",
  "6": "Sáb",
};

export const FeirasListEnhanced = ({ onAddNew }: FeirasListEnhancedProps) => {
  const [feiras, setFeiras] = useState<Feira[]>([]);
  const [loading, setLoading] = useState(true);
  const [inscricoesCount, setInscricoesCount] = useState<Record<string, number>>({});
  const [feiraToDelete, setFeiraToDelete] = useState<string | null>(null);
  const [feiraToEdit, setFeiraToEdit] = useState<string | null>(null);

  useEffect(() => {
    loadFeiras();
  }, []);

  const loadFeiras = async () => {
    try {
      const { data, error } = await supabase
        .from("feiras")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setFeiras(data || []);

      // Load confirmations count for each feira
      if (data) {
        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (feira) => {
            const { count } = await supabase
              .from("inscricoes_feiras")
              .select("*", { count: "exact", head: true })
              .eq("feira_id", feira.id)
              .eq("status", "aprovada");
            counts[feira.id] = count || 0;
          })
        );
        setInscricoesCount(counts);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar feiras: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getDiaSemana = (diasIds: string[]) => {
    const diasOrdenados = diasIds.sort();
    return diasOrdenados.map(id => DIAS_SEMANA_LABELS[id]).join(", ");
  };

  const formatDate = (feira: Feira) => {
    // If recurring, just show the days of week
    if (feira.recorrente) {
      return getDiaSemana(feira.dias_semana);
    }
    // Otherwise show specific date if available
    return getDiaSemana(feira.dias_semana);
  };

  const handleDelete = async () => {
    if (!feiraToDelete) return;

    try {
      const { error } = await supabase
        .from("feiras")
        .delete()
        .eq("id", feiraToDelete);

      if (error) throw error;

      toast.success("Feira excluída com sucesso");
      loadFeiras();
    } catch (error: any) {
      toast.error("Erro ao excluir feira: " + error.message);
    } finally {
      setFeiraToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (feiras.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma feira cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando a primeira feira para gerenciar feirantes e pagamentos.
            </p>
            <Button onClick={onAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeira Feira
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Feiras</h2>
          <p className="text-muted-foreground mt-1">
            Total de Feiras: <span className="font-semibold text-foreground">{feiras.length}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feiras.map((feira) => {
          const feirantesConfirmados = inscricoesCount[feira.id] || 0;
          
          return (
            <Card key={feira.id} className="flex flex-col h-full relative">
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold line-clamp-2 pr-20">{feira.nome}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {feira.recorrente && (
                        <Badge variant="outline" className="border-primary">
                          Recorrente
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => setFeiraToEdit(feira.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setFeiraToDelete(feira.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={feira.tipo_feira === "publica" ? "default" : "secondary"}>
                      {feira.tipo_feira === "publica" ? "Pública" : "Condomínio"}
                    </Badge>
                    {feira.segmento_exclusivo && (
                      <Badge variant="outline" className="border-warning">
                        Segmento Exclusivo
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="line-clamp-1">{feira.bairro} - {feira.cidade}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0 text-primary" />
                    <span className="line-clamp-1">{formatDate(feira)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0 text-primary" />
                    <span>{feira.horario_inicio} - {feira.horario_fim}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 shrink-0 text-primary" />
                    <span className="font-semibold">{feirantesConfirmados} confirmados</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-warning" />
                    <span className="text-sm">
                      Pagamento: <strong>{feira.prazo_pagamento_dias || 3} dias antes</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 mt-0.5 text-success shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Valor da Feira</p>
                      <p className="text-lg font-bold text-primary">
                        R$ {feira.valor_participacao?.toFixed(2) || "0,00"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Admin: R$ {(feirantesConfirmados * 3).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium mb-1">Pagamento</p>
                    <div className="flex flex-wrap gap-1">
                      {feira.formas_pagamento.map((forma) => (
                        <Badge key={forma} variant="secondary" className="text-xs">
                          {forma.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {feira.avisos && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                    <p className="text-xs font-medium text-warning mb-1">⚠️ Avisos</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{feira.avisos}</p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <FeiraEditForm
        feiraId={feiraToEdit || ""}
        open={!!feiraToEdit}
        onOpenChange={(open) => !open && setFeiraToEdit(null)}
        onSuccess={loadFeiras}
      />

      <AlertDialog open={!!feiraToDelete} onOpenChange={() => setFeiraToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta feira? Esta ação não pode ser desfeita e todos os dados relacionados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

