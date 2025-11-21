import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, MapPin, Users, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Feira {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  valor_participacao: number | null;
  recorrente: boolean;
  dias_semana: string[];
  inscricoes_count: number;
  inscricoes_confirmadas: number;
}

const DIAS_MAP: { [key: string]: string } = {
  "0": "DOM",
  "1": "SEG",
  "2": "TER",
  "3": "QUA",
  "4": "QUI",
  "5": "SEX",
  "6": "SÁB",
};

export const FeirasConsolidatedCard = () => {
  const [feiras, setFeiras] = useState<Feira[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFeiras: 0,
    totalInscricoes: 0,
    totalConfirmadas: 0,
    receitaTotal: 0,
  });

  useEffect(() => {
    loadFeiras();
  }, []);

  const loadFeiras = async () => {
    try {
      const { data: feirasData, error: feirasError } = await supabase
        .from("feiras")
        .select("*")
        .order("nome", { ascending: true });

      if (feirasError) throw feirasError;

      const feirasWithCounts = await Promise.all(
        (feirasData || []).map(async (feira) => {
          const { count: totalCount } = await supabase
            .from("inscricoes_feiras")
            .select("*", { count: "exact", head: true })
            .eq("feira_id", feira.id);

          const { count: confirmadasCount } = await supabase
            .from("inscricoes_feiras")
            .select("*", { count: "exact", head: true })
            .eq("feira_id", feira.id)
            .eq("status", "aprovada");

          return {
            ...feira,
            inscricoes_count: totalCount || 0,
            inscricoes_confirmadas: confirmadasCount || 0,
          };
        })
      );

      setFeiras(feirasWithCounts);

      // Calculate stats
      const totalInscricoes = feirasWithCounts.reduce((sum, f) => sum + f.inscricoes_count, 0);
      const totalConfirmadas = feirasWithCounts.reduce((sum, f) => sum + f.inscricoes_confirmadas, 0);
      const receitaTotal = feirasWithCounts.reduce(
        (sum, f) => sum + (f.inscricoes_confirmadas * (f.valor_participacao || 0)),
        0
      );

      setStats({
        totalFeiras: feirasWithCounts.length,
        totalInscricoes,
        totalConfirmadas,
        receitaTotal,
      });
    } catch (error: any) {
      toast.error("Erro ao carregar feiras: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        {/* Header com estatísticas gerais */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Feiras da Semana</h3>
              <p className="text-sm text-muted-foreground">Todas as feiras organizadas</p>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Feiras</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalFeiras}</p>
            </div>

            <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Inscrições</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalInscricoes}</p>
            </div>

            <div className="p-3 bg-success/5 rounded-lg border border-success/10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-xs text-muted-foreground">Confirmadas</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalConfirmadas}</p>
            </div>

            <div className="p-3 bg-accent/5 rounded-lg border border-accent/10">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground">Receita</span>
              </div>
              <p className="text-base font-bold">
                R$ {(stats.receitaTotal / 1000).toFixed(1)}K
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Feiras */}
        <div className="space-y-3">
          {feiras.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma feira cadastrada</p>
            </div>
          ) : (
            feiras.map((feira) => {
              const valorTotal = (feira.inscricoes_confirmadas || 0) * (feira.valor_participacao || 0);
              const diasFormatados = feira.dias_semana
                .map((d) => DIAS_MAP[d])
                .join(", ");

              return (
                <div
                  key={feira.id}
                  className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all border border-border"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-base">{feira.nome}</h4>
                          {feira.recorrente && (
                            <Badge className="bg-success/10 text-success border-success/20 text-xs">
                              Ativa
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{feira.cidade} - {feira.bairro}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {diasFormatados}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-background rounded-lg">
                        <p className="text-xs text-muted-foreground mb-0.5">Inscrições</p>
                        <p className="text-lg font-bold">{feira.inscricoes_count}</p>
                      </div>

                      <div className="text-center p-2 bg-background rounded-lg">
                        <p className="text-xs text-muted-foreground mb-0.5">Confirmadas</p>
                        <p className="text-lg font-bold text-success">{feira.inscricoes_confirmadas}</p>
                      </div>

                      <div className="text-center p-2 bg-background rounded-lg">
                        <p className="text-xs text-muted-foreground mb-0.5">Receita</p>
                        <p className="text-sm font-bold">
                          R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
};
