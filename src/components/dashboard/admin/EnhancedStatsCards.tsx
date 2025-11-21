import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Users, DollarSign, TrendingUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { FeirasCalendar } from "./FeirasCalendar";

interface EnhancedStatsCardsProps {
  stats: {
    totalFeiras: number;
    feirasAtivas: number;
    totalFeirantes: number;
    participacoesConfirmadas: number;
    pagamentosPendentes: number;
    pagamentosRecebidos: number;
  };
  userId: string;
}

export const EnhancedStatsCards = ({ stats, userId }: EnhancedStatsCardsProps) => {
  const [revenueGoal, setRevenueGoal] = useState<number>(10000);
  const [editGoal, setEditGoal] = useState<number>(10000);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadRevenueGoal();
  }, [userId]);

  const loadRevenueGoal = async () => {
    try {
      const { data } = await supabase
        .from("admin_settings")
        .select("revenue_goal")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setRevenueGoal(data.revenue_goal || 10000);
        setEditGoal(data.revenue_goal || 10000);
      }
    } catch (error) {
      console.error("Erro ao carregar meta:", error);
    }
  };

  const handleSaveGoal = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          user_id: userId,
          revenue_goal: editGoal,
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;

      setRevenueGoal(editGoal);
      setOpen(false);
      toast.success("Meta atualizada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPagamentos = stats.pagamentosPendentes + stats.pagamentosRecebidos;
  const percentualRecebido = revenueGoal > 0 
    ? Math.min(100, Math.round((stats.pagamentosRecebidos / revenueGoal) * 100))
    : 0;

  const percentualConfirmado = stats.totalFeirantes > 0
    ? Math.round((stats.participacoesConfirmadas / stats.totalFeirantes) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Revenue Goal - Circular Chart */}
      <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-slate-300">Meta de Receita</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button className="text-xs text-primary hover:underline">
                  Editar Meta
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Meta de Receita</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Meta de Receita (R$)</label>
                    <Input
                      type="number"
                      value={editGoal}
                      onChange={(e) => setEditGoal(Number(e.target.value))}
                      min={0}
                      step={100}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor: R$ {editGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Button onClick={handleSaveGoal} disabled={loading} className="w-full">
                    {loading ? "Salvando..." : "Salvar Meta"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-slate-700"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(percentualRecebido / 100) * 502.4} 502.4`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                <div className="text-3xl font-bold leading-tight">
                  R$ {stats.pagamentosRecebidos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-400 mt-1">de R$ {revenueGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Progresso</span>
            <span className="text-2xl font-bold">{percentualRecebido}%</span>
          </div>
        </div>
      </Card>

      {/* Calendário de Feiras ao lado da Meta de Receita */}
      <FeirasCalendar />
 
       {/* Feiras Targets */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-border">
        <h3 className="text-sm font-medium mb-4 text-muted-foreground">Status das Feiras</h3>
        
        <div className="mb-6">
          <div className="text-4xl font-bold mb-2">{stats.totalFeiras}</div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-primary via-success to-accent transition-all duration-500"
              style={{ width: `${(stats.feirasAtivas / Math.max(stats.totalFeiras, 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Total</span>
            </div>
            <span className="font-semibold">{stats.totalFeiras}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-muted-foreground">Ativas</span>
            </div>
            <span className="font-semibold">{stats.feirasAtivas}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-muted-foreground">Taxa de ativação</span>
            </div>
            <span className="font-semibold">
              {Math.round((stats.feirasAtivas / Math.max(stats.totalFeiras, 1)) * 100)}%
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">Total de feirantes</div>
          <div className="text-2xl font-bold">{stats.totalFeirantes}</div>
        </div>
      </Card>

      {/* Pagamentos Card */}
      <Card className="p-6 bg-gradient-to-br from-success/5 to-primary/5 border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button className="px-4 py-1.5 rounded-full bg-foreground text-background text-xs font-medium">
              Recebido
            </button>
            <button className="px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              Pendente
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-sm text-muted-foreground mb-1">Valor recebido</div>
          <div className="text-2xl font-bold mb-4">
            R$ {stats.pagamentosRecebidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>

          <div className="flex gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-success" />
          </div>

          <div className="text-sm text-muted-foreground mb-1 mt-4">Valor pendente</div>
          <div className="text-2xl font-bold">
            R$ {stats.pagamentosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          
          <div className="flex gap-2 mt-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
          </div>
        </div>
      </Card>

      {/* Atividade dos Feirantes */}
      <Card className="p-6 bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="relative z-10">
          <h3 className="text-sm font-medium mb-2 text-white/80">Atividade dos Feirantes</h3>
          
          <div className="text-5xl font-bold mb-2">{percentualConfirmado}%</div>
          <div className="text-sm text-white/80 mb-6">Taxa de conversão</div>

          <div className="flex gap-2 mb-6 h-32 items-end">
            {[65, 45, 75, 55, 85, 50, 95, 60].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end">
                <div 
                  className="w-full bg-gradient-to-t from-yellow-300 to-yellow-400 rounded-t-lg transition-all duration-500"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80">Total de inscrições</span>
              <span className="font-bold">{stats.participacoesConfirmadas}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80">Feirantes ativos</span>
              <span className="font-bold">{stats.totalFeirantes}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Participações Confirmadas */}
      <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-success/20 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-400">Tipo de evento</div>
              <div className="text-lg font-semibold">Participações</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-xs text-slate-400">Confirmadas</span>
              </div>
              <div className="text-2xl font-bold">{stats.participacoesConfirmadas}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-slate-400">Feirantes</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalFeirantes}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <div className="text-xs text-slate-400 mb-2">Receita total</div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-success to-primary rounded-full"
                style={{ width: `${percentualRecebido}%` }}
              />
            </div>
            <div className="text-xl font-bold">
              R$ {totalPagamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-border">
        <h3 className="text-sm font-medium mb-6 text-muted-foreground">Estatísticas Rápidas</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Feiras Ativas</div>
                <div className="text-xl font-bold">{stats.feirasAtivas}</div>
              </div>
            </div>
            <div className="text-xs text-success font-medium">
              +{Math.round((stats.feirasAtivas / Math.max(stats.totalFeiras, 1)) * 100)}%
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Feirantes</div>
                <div className="text-xl font-bold">{stats.totalFeirantes}</div>
              </div>
            </div>
            <div className="text-xs text-success font-medium">Ativo</div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Taxa Conversão</div>
                <div className="text-xl font-bold">{percentualConfirmado}%</div>
              </div>
            </div>
            <div className="text-xs text-success font-medium">+12%</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
