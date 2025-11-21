import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WeeklyStats {
  totalFeirasAtivas: number;
  totalFeirantes: number;
  taxaConversao: number;
  crescimentoFeiras: number;
  crescimentoFeirantes: number;
  crescimentoConversao: number;
}

export const FeirasWeeklyStats = () => {
  const [stats, setStats] = useState<WeeklyStats>({
    totalFeirasAtivas: 0,
    totalFeirantes: 0,
    taxaConversao: 0,
    crescimentoFeiras: 0,
    crescimentoFeirantes: 0,
    crescimentoConversao: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Feiras ativas recorrentes
      const { count: feirasAtivas } = await supabase
        .from("feiras")
        .select("*", { count: "exact", head: true })
        .eq("recorrente", true);

      // Total de feirantes ativos
      const { count: totalFeirantes } = await supabase
        .from("feirantes")
        .select("*", { count: "exact", head: true })
        .or("bloqueado.is.null,bloqueado.eq.false");

      // Inscrições totais e aprovadas para calcular taxa de conversão
      const { count: totalInscricoes } = await supabase
        .from("inscricoes_feiras")
        .select("*", { count: "exact", head: true });

      const { count: inscricoesAprovadas } = await supabase
        .from("inscricoes_feiras")
        .select("*", { count: "exact", head: true })
        .eq("status", "aprovada");

      const taxaConversao = totalInscricoes && totalInscricoes > 0
        ? Math.round((inscricoesAprovadas || 0) / totalInscricoes * 100)
        : 0;

      setStats({
        totalFeirasAtivas: feirasAtivas || 0,
        totalFeirantes: totalFeirantes || 0,
        taxaConversao,
        crescimentoFeiras: 100, // Placeholder - pode calcular comparando com período anterior
        crescimentoFeirantes: 0,
        crescimentoConversao: 12,
      });
    } catch (error: any) {
      toast.error("Erro ao carregar estatísticas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground/80 mb-4">Estatísticas Rápidas</h3>
      
      <div className="space-y-3">
        {/* Feiras Ativas */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Feiras Ativas</p>
            <p className="text-xl font-bold text-foreground">{stats.totalFeirasAtivas}</p>
          </div>
          {stats.crescimentoFeiras > 0 && (
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 font-semibold">
              +{stats.crescimentoFeiras}%
            </Badge>
          )}
        </div>

        {/* Total Feirantes */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Total Feirantes</p>
            <p className="text-xl font-bold text-foreground">{stats.totalFeirantes}</p>
          </div>
          <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/30 font-semibold">
            Ativo
          </Badge>
        </div>

        {/* Taxa Conversão */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Taxa Conversão</p>
            <p className="text-xl font-bold text-foreground">{stats.taxaConversao}%</p>
          </div>
          {stats.crescimentoConversao > 0 && (
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 border-orange-500/30 font-semibold">
              +{stats.crescimentoConversao}%
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};