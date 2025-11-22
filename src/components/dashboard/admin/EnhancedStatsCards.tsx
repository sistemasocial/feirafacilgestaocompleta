import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign, TrendingUp, CheckCircle2, Sparkles, Activity } from "lucide-react";
import { toast } from "sonner";
import { FeirasCalendar } from "./FeirasCalendar";
import { DraggableStatsCards } from "./DraggableStatsCards";

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
  storageKey?: string;
}

export const EnhancedStatsCards = ({ stats, userId, storageKey = "statsCardsOrder" }: EnhancedStatsCardsProps) => {
  const [revenueGoal, setRevenueGoal] = useState<number>(10000);
  const [editGoal, setEditGoal] = useState<number>(10000);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [feiras, setFeiras] = useState<any[]>([]);

  useEffect(() => {
    loadRevenueGoal();
    loadFeiras();
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

  const loadFeiras = async () => {
    try {
      const { data, error } = await supabase
        .from("feiras")
        .select("id, nome, bairro, dias_semana")
        .order("nome", { ascending: true })
        .limit(3);

      if (error) throw error;
      setFeiras(data || []);
    } catch (error) {
      console.error("Erro ao carregar feiras:", error);
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

  const DIAS_MAP: { [key: string]: string } = {
    "0": "DOM",
    "1": "SEG",
    "2": "TER",
    "3": "QUA",
    "4": "QUI",
    "5": "SEX",
    "6": "SÁB",
  };

  const cards = [
    // Card 1: Meta de Receita - VERDE ESMERALDA
    <Card key="meta-receita" className="h-full p-6 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white border-0 relative overflow-hidden flex flex-col shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-fade-in group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-200 animate-pulse" />
            <h3 className="text-sm font-bold text-emerald-100">Meta de Receita</h3>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="text-xs text-emerald-200 hover:text-white hover:underline transition-colors font-semibold">
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
        
        <div className="flex items-center justify-center mb-6 flex-1">
          <div className="relative w-48 h-48 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-emerald-800/30"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="url(#gradient-receita)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(percentualRecebido / 100) * 502.4} 502.4`}
                strokeLinecap="round"
                className="transition-all duration-1000 drop-shadow-lg"
              />
              <defs>
                <linearGradient id="gradient-receita" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
              <div className="text-3xl font-extrabold leading-tight drop-shadow-md">
                R$ {stats.pagamentosRecebidos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-emerald-100 mt-1 font-medium">
                de R$ {revenueGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm border-t border-emerald-500/30 pt-4">
          <span className="text-emerald-100 font-medium">Progresso</span>
          <Badge className="bg-emerald-400 text-emerald-900 text-lg font-bold px-3 py-1 hover:bg-emerald-300 transition-colors">
            {percentualRecebido}%
          </Badge>
        </div>
      </div>
    </Card>,

    // Card 2: Calendário
    <FeirasCalendar key="calendario" />,

    // Card 3: Status das Feiras - AZUL INDIGO
    <Card key="status-feiras" className="h-full p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 flex flex-col shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in hover-scale group">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-base font-bold text-indigo-900">Status das Feiras</h3>
      </div>
      
      <div className="mb-6 flex-1">
        <div className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
          {stats.totalFeiras}
        </div>
        <div className="h-3 bg-indigo-100 rounded-full overflow-hidden mb-4 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 transition-all duration-1000 shadow-lg animate-pulse"
            style={{ width: `${(stats.feirasAtivas / Math.max(stats.totalFeiras, 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-100/50 hover:bg-indigo-100 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm text-indigo-700 font-medium">Total</span>
          </div>
          <span className="font-bold text-indigo-900">{stats.totalFeiras}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-100/50 hover:bg-blue-100 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm text-blue-700 font-medium">Ativas</span>
          </div>
          <Badge className="bg-blue-500 text-white font-bold">{stats.feirasAtivas}</Badge>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-100/50 hover:bg-cyan-100 transition-colors">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-600" />
            <span className="text-sm text-cyan-700 font-medium">Taxa de ativação</span>
          </div>
          <span className="font-bold text-cyan-900">
            {Math.round((stats.feirasAtivas / Math.max(stats.totalFeiras, 1)) * 100)}%
          </span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <span className="text-sm text-indigo-700 font-medium">Total de feirantes</span>
          </div>
          <div className="text-3xl font-extrabold text-indigo-900">{stats.totalFeirantes}</div>
        </div>
      </div>
    </Card>,

    // Card 4: Pagamentos - VERDE LIMA/ESMERALDA
    <Card key="pagamentos" className="h-full p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 flex flex-col shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-base font-bold text-emerald-900">Pagamentos</h3>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors">
            Recebido
          </Badge>
          <Badge variant="outline" className="border-orange-300 text-orange-700 text-xs font-bold hover:bg-orange-50 transition-colors">
            Pendente
          </Badge>
        </div>
      </div>

      <div className="mb-6 flex-1 space-y-4">
        <div className="p-4 rounded-xl bg-emerald-100/50 border border-emerald-200 hover:bg-emerald-100 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-emerald-700 font-medium">Valor recebido</span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-900">
            R$ {stats.pagamentosRecebidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-orange-100/50 border border-orange-200 hover:bg-orange-100 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-sm text-orange-700 font-medium">Valor pendente</span>
          </div>
          <div className="text-3xl font-extrabold text-orange-900">
            R$ {stats.pagamentosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </Card>,

    // Card 5: Feiras da Semana - ROXO/AZUL VIBRANTE
    <Card key="feiras-semana" className="h-full p-6 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white border-0 relative overflow-hidden flex flex-col shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-fade-in group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-fuchsia-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white drop-shadow-md">Feiras da Semana</h3>
            <p className="text-sm text-purple-100 font-medium">Últimas feiras criadas</p>
          </div>
        </div>
      
        <div className="space-y-3 flex-1">
          {feiras.length === 0 ? (
            <div className="text-center py-8 text-purple-100 text-sm font-medium">
              Nenhuma feira cadastrada
            </div>
          ) : (
            feiras.map((feira, index) => {
              const diasFormatados = feira.dias_semana
                .map((d: string) => DIAS_MAP[d])
                .join(", ");
              
              return (
                <div
                  key={feira.id}
                  className="p-4 rounded-xl bg-background text-foreground border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300 hover-scale animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-base truncate text-foreground">
                        {feira.nome}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate font-semibold mt-1">
                        📍 {feira.bairro}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-sm font-bold px-4 py-1.5 shadow-md hover:shadow-lg transition-all">
                    {diasFormatados}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>,

    // Card 6: Atividade dos Feirantes - LARANJA/VERMELHO VIBRANTE
    <Card key="atividade-feirantes" className="h-full p-6 bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 text-white border-0 relative overflow-hidden flex flex-col shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-fade-in group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-6 h-6 text-orange-100 animate-pulse" />
          <h3 className="text-base font-bold text-orange-50">Atividade dos Feirantes</h3>
        </div>
        
        <div className="text-6xl font-extrabold mb-2 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
          {percentualConfirmado}%
        </div>
        <div className="text-sm text-orange-100 font-semibold mb-6">Taxa de conversão</div>

        <div className="flex gap-2 mb-6 h-32 items-end flex-1">
          {[65, 45, 75, 55, 85, 50, 95, 60].map((height, i) => (
            <div 
              key={i} 
              className="flex-1 flex flex-col justify-end animate-fade-in" 
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div 
                className="bg-gradient-to-t from-white to-orange-100 rounded-t-sm transition-all duration-500 hover:opacity-80"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-orange-400/30">
          <div className="text-center">
            <div className="text-3xl font-extrabold mb-1">{stats.participacoesConfirmadas}</div>
            <div className="text-xs text-orange-100 font-medium">Confirmadas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold mb-1">{stats.totalFeirantes}</div>
            <div className="text-xs text-orange-100 font-medium">Total de Feirantes</div>
          </div>
        </div>
      </div>
    </Card>,

    // Card 7: Participações Confirmadas - CINZA ESCURO ELEGANTE
    <Card key="participacoes" className="h-full p-6 bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 text-white border-0 relative overflow-hidden flex flex-col shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-fade-in group">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-slate-400 font-medium">Tipo de evento</div>
            <div className="text-xl font-bold text-white">Participações</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-slate-300 font-medium">Confirmadas</span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">
              {stats.participacoesConfirmadas}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-slate-300 font-medium">Feirantes</span>
            </div>
            <div className="text-3xl font-extrabold text-blue-400">
              {stats.totalFeirantes}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 mb-3 font-medium">Receita total</div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-3 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full shadow-lg transition-all duration-1000"
              style={{ width: `${percentualRecebido}%` }}
            />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            R$ {totalPagamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </Card>,

    // Card 8: Estatísticas Rápidas - NEUTRO MODERNO
    <Card key="estatisticas-rapidas" className="h-full p-6 bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 flex flex-col shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in group">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Estatísticas Rápidas</h3>
      </div>
      
      <div className="space-y-3 flex-1">
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-100 to-blue-100 border border-indigo-200 hover:shadow-md transition-all hover-scale">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-indigo-700 font-medium">Feiras Ativas</div>
              <div className="text-2xl font-extrabold text-indigo-900">{stats.feirasAtivas}</div>
            </div>
          </div>
          <Badge className="bg-emerald-500 text-white font-bold text-sm">
            +{Math.round((stats.feirasAtivas / Math.max(stats.totalFeiras, 1)) * 100)}%
          </Badge>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200 hover:shadow-md transition-all hover-scale">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-emerald-700 font-medium">Total Feirantes</div>
              <div className="text-2xl font-extrabold text-emerald-900">{stats.totalFeirantes}</div>
            </div>
          </div>
          <Badge className="bg-emerald-500 text-white font-bold">Ativo</Badge>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 hover:shadow-md transition-all hover-scale">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-orange-700 font-medium">Taxa Conversão</div>
              <div className="text-2xl font-extrabold text-orange-900">{percentualConfirmado}%</div>
            </div>
          </div>
          <Badge className="bg-emerald-500 text-white font-bold">+12%</Badge>
        </div>
      </div>
    </Card>,
  ];

  return <DraggableStatsCards storageKey={storageKey}>{cards}</DraggableStatsCards>;
};
