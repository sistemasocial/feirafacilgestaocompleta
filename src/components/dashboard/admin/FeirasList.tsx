import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Clock, Calendar, DollarSign, Plus, Edit, Trash2 } from "lucide-react";
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
}

interface FeirasListProps {
  onAddNew: () => void;
  onEdit?: (feira: Feira) => void;
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

export const FeirasList = ({ onAddNew, onEdit }: FeirasListProps) => {
  const [feiras, setFeiras] = useState<Feira[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feiraToDelete, setFeiraToDelete] = useState<string | null>(null);

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
    } catch (error: any) {
      toast.error("Erro ao carregar feiras: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!feiraToDelete) return;

    try {
      const { error } = await supabase
        .from("feiras")
        .delete()
        .eq("id", feiraToDelete);

      if (error) throw error;

      toast.success("Feira excluída com sucesso!");
      loadFeiras();
    } catch (error: any) {
      toast.error("Erro ao excluir feira: " + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setFeiraToDelete(null);
    }
  };

  const confirmDelete = (feiraId: string) => {
    setFeiraToDelete(feiraId);
    setDeleteDialogOpen(true);
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Feiras Cadastradas ({feiras.length})</h2>
        <Button onClick={onAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Feira
        </Button>
      </div>

      <div className="grid gap-4">
        {feiras.map((feira) => (
          <Card key={feira.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{feira.nome}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{feira.cidade} - {feira.bairro}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{feira.endereco}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={feira.tipo_feira === "publica" ? "default" : "secondary"}>
                    {feira.tipo_feira === "publica" ? "Feira Pública" : "Condomínio"}
                  </Badge>
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(feira)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => confirmDelete(feira.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-0.5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Dias da Semana</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {feira.dias_semana.map((dia) => (
                        <Badge key={dia} variant="outline" className="text-xs">
                          {DIAS_SEMANA_LABELS[dia]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Horários</p>
                    <p className="text-sm text-muted-foreground">
                      {feira.horario_inicio} às {feira.horario_fim}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Chegar {feira.tempo_antecedencia_minutos} min antes
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 mt-0.5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Cancelamento</p>
                    <p className="text-sm text-muted-foreground">
                      Taxa: R$ {feira.taxa_cancelamento.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sem multa até {feira.horas_cancelamento_sem_multa}h antes
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Formas de Pagamento</p>
                <div className="flex flex-wrap gap-2">
                  {feira.formas_pagamento.map((forma) => (
                    <Badge key={forma} variant="secondary">
                      {forma.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>

              {feira.avisos && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-warning mb-1">⚠️ Avisos aos Feirantes</p>
                  <p className="text-sm text-muted-foreground">{feira.avisos}</p>
                </div>
              )}

              {feira.regras_evento && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">📋 Regras da Feira</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{feira.regras_evento}</p>
                </div>
              )}

              {feira.politica_cancelamento && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">🔄 Política de Cancelamento</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{feira.politica_cancelamento}</p>
                </div>
              )}

              {feira.observacoes && (
                <div>
                  <p className="text-sm font-medium mb-1">📝 Observações</p>
                  <p className="text-sm text-muted-foreground">{feira.observacoes}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta feira? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};