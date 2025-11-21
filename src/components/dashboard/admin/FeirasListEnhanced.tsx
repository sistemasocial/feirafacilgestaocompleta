import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Clock, Calendar, DollarSign, Plus, Users, Trash2, AlertCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { FeiraEditForm } from "./FeiraEditForm";
import { DraggableStatsCards } from "./DraggableStatsCards";
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

  // Gradientes elegantes para os cards
  const cardGradients = [
    "bg-gradient-to-br from-primary/5 to-accent/5",
    "bg-gradient-to-br from-orange-500/5 to-red-500/10",
    "bg-gradient-to-br from-blue-500/5 to-purple-500/10",
    "bg-gradient-to-br from-emerald-500/5 to-teal-500/10",
    "bg-gradient-to-br from-pink-500/5 to-rose-500/10",
    "bg-gradient-to-br from-indigo-500/5 to-blue-500/10",
  ];

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

  const feiraCards = feiras.map((feira, index) => {
    const feirantesConfirmados = inscricoesCount[feira.id] || 0;
    const gradientClass = cardGradients[index % cardGradients.length];
    
    return (
      <Card key={feira.id} className={`flex flex-col h-full relative border-border ${gradientClass}`}>
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold line-clamp-2 pr-20 text-foreground">{feira.nome}</h3>
              <div className="flex items-center gap-1 shrink-0">
                {feira.recorrente && (
                  <Badge className="bg-success text-white border-0">
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
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {feira.tipo_feira === "publica" ? "Pública" : "Condomínio"}
              </Badge>
              {feira.segmento_exclusivo && (
                <Badge variant="outline" className="border-warning bg-warning/10 text-warning">
                  Segmento Exclusivo
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="line-clamp-1 font-semibold text-foreground">{feira.bairro} - {feira.cidade}</span>
            </div>

            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 shrink-0 text-primary" />
              <span className="line-clamp-1 font-medium">{formatDate(feira)}</span>
            </div>

            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-4 h-4 shrink-0 text-primary" />
              <span className="font-medium">{feira.horario_inicio} - {feira.horario_fim}</span>
            </div>

            <div className="flex items-center gap-2 text-foreground">
              <Users className="w-4 h-4 shrink-0 text-success" />
              <span className="font-semibold">{feirantesConfirmados} confirmados</span>
            </div>

            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-blue-600" />
              <span className="text-sm font-bold text-foreground">
                Pagamento: <strong className="text-blue-600">{feira.prazo_pagamento_dias || 3} dias antes</strong>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 mt-0.5 text-success shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Valor da Feira</p>
                <p className="text-2xl font-extrabold text-emerald-600">
                  R$ {feira.valor_participacao?.toFixed(2) || "0,00"}
                </p>
                <div className="mt-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-md">
                  <p className="text-sm font-bold text-white">
                    Total Admin: R$ {(feirantesConfirmados * 3).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold mb-1 text-foreground">Formas de Pagamento</p>
              <div className="flex flex-wrap gap-1">
                {feira.formas_pagamento.map((forma) => (
                  <Badge key={forma} variant="secondary" className="text-xs font-medium">
                    {forma.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {feira.avisos && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <p className="text-xs font-medium text-warning mb-1">⚠️ Avisos</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{feira.avisos}</p>
            </div>
          )}
        </div>
      </Card>
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Feiras</h2>
          <p className="text-muted-foreground mt-1">
            Total de Feiras: <span className="font-semibold text-foreground">{feiras.length}</span>
          </p>
        </div>
        <Button onClick={onAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Feira
        </Button>
      </div>

      <DraggableStatsCards layout="vertical" storageKey="feirasCardsOrder">
        {feiraCards}
      </DraggableStatsCards>

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

