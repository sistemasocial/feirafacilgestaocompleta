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
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    loadRevenueGoal();
    loadFeiras();
  }, [userId]);

  useEffect(() => {
    if (typeof window !== "undefined" && "matchMedia" in window) {
      try {
        const mq = window.matchMedia("(display-mode: standalone)");
        setIsStandalone(mq.matches);
      } catch (error) {
        console.error("Erro ao detectar modo standalone:", error);
      }
    }
  }, []);

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
        .upsert(
          {
            user_id: userId,
            revenue_goal: editGoal,
          },
          {
            onConflict: "user_id",
          },
        );

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
  const percentualRecebido =
    revenueGoal > 0 ? Math.min(100, Math.round((stats.pagamentosRecebidos / revenueGoal) * 100)) : 0;

  const percentualConfirmado =
    stats.totalFeirantes > 0 ? Math.round((stats.participacoesConfirmadas / stats.totalFeirantes) * 100) : 0;

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
    <Card
      key="meta-receita"
      className="h-full p-4 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white border-0 relative overflow-hidden flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-200" />
            <h3 className="text-xs font-bold text-emerald-100">Meta de Receita</h3>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="text-xs text-emerald-200 hover:text-white hover:underline transition-colors font-semibold">
                Editar
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
                    Valor: R$ {editGoal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Button onClick={handleSaveGoal} disabled={loading} className="w-full">
                  {loading ? "Salvando..." : "Salvar Meta"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center justify-center mb-3 flex-1">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-emerald-800/30"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#gradient-receita)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(percentualRecebido / 100) * 351.68} 351.68`}
                strokeLinecap="round"
                className="transition-all duration-1000"
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
              <div className="text-xl font-bold leading-tight">
                R${" "}
                {stats.pagamentosRecebidos.toLocaleString("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="text-[10px] text-emerald-100 mt-1">
                de R${" "}
                {revenueGoal.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs border-t border-emerald-500/30 pt-2">
          <span className="text-emerald-100 font-medium">Progresso</span>
          <Badge className="bg-emerald-400 text-emerald-900 text-sm font-bold px-2 py-0.5">
            {percentualRecebido}%
          </Badge>
        </div>
      </div>
    </Card>,

    // Card 2: Calendário
    <FeirasCalendar key="calendario" />,

    // Card 3: Status das Feiras - AZUL INDIGO
    <Card
      key="status-feiras"
      className="h-full p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-sm font-bold text-indigo-900">Status das Feiras</h3>
      </div>

      <div className="mb-3 flex-1">
        <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
          {stats.totalFeiras}
        </div>
        <div className="h-2 bg-indigo-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 transition-all duration-1000"
            style={{ width: `${(stats.feirasAtivas / Math.max(stats.totalFeiras, 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-100/50">
          <span className="text-xs text-indigo-700 font-medium">Ativas</span>
          <Badge className="bg-blue-500 text-white text-xs font-bold">{stats.feirasAtivas}</Badge>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-100/50">
          <span className="text-xs text-cyan-700 font-medium">Feirantes</span>
          <span className="text-lg font-bold text-indigo-900">{stats.totalFeirantes}</span>
        </div>
      </div>
    </Card>,

    // Card 4: Pagamentos - VERDE LIMA/ESMERALDA
    <Card
      key="pagamentos"
      className="h-full p-4 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-bold text-emerald-900">Pagamentos</h3>
        </div>
      </div>

      <div className="space-y-2 flex-1">
        <div className="p-3 rounded-xl bg-emerald-100/50 border border-emerald-200">
          <span className="text-xs text-emerald-700 font-medium block mb-1">Recebido</span>
          <div className="text-xl font-bold text-emerald-900">
            R${" "}
            {stats.pagamentosRecebidos.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-orange-100/50 border border-orange-200">
          <span className="text-xs text-orange-700 font-medium block mb-1">Pendente</span>
          <div className="text-xl font-bold text-orange-900">
            R${" "}
            {stats.pagamentosPendentes.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
          </div>
        </div>
      </div>
    </Card>,

    // Card 5: Feiras da Semana - ROXO/AZUL VIBRANTE
    <Card
      key="feiras-semana"
      className="h-full p-4 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white border-0 relative overflow-hidden flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Feiras da Semana</h3>
          </div>
        </div>

        <div className="space-y-2 flex-1 overflow-auto max-h-[180px]">
          {feiras.length === 0 ? (
            <div className="text-center py-4 text-purple-100 text-xs">Nenhuma feira cadastrada</div>
          ) : (
            feiras.map((feira) => {
              const diasFormatados = feira.dias_semana
                .map((d: string) => DIAS_MAP[d])
                .join(", ");

              return (
                <div
                  key={feira.id}
                  className="p-3 rounded-lg bg-background text-foreground border border-purple-200 hover:border-purple-400 transition-all duration-300"
                >
                  <h4 className="font-bold text-xs truncate text-foreground mb-1">{feira.nome}</h4>
                  <p className="text-[10px] text-muted-foreground truncate">
                    📍 {feira.bairro}
                  </p>
                  <Badge className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-[10px] font-bold px-2 py-0.5 mt-1">
                    {diasFormatados}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>,

    // Card 7: Participações Confirmadas - CINZA ESCURO ELEGANTE
    <Card
      key="participacoes"
      className="h-full p-4 bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 text-white border-0 relative overflow-hidden flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400 font-medium">Participações</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 flex-1">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] text-slate-300 font-medium block mb-1">Confirmadas</span>
            <div className="text-2xl font-bold text-emerald-400">{stats.participacoesConfirmadas}</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-[10px] text-slate-300 font-medium block mb-1">Feirantes</span>
            <div className="text-2xl font-bold text-blue-400">{stats.totalFeirantes}</div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700">
          <div className="text-xs text-slate-400 mb-2 font-medium">Receita total</div>
          <div className="text-xl font-bold text-emerald-400">
            R${" "}
            {totalPagamentos.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
          </div>
        </div>
      </div>
    </Card>,

    // Card 8: Estatísticas Rápidas - NEUTRO MODERNO
    <Card
      key="estatisticas-rapidas"
      className="h-full p-4 bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Estatísticas</h3>
      </div>

      <div className="space-y-2 flex-1">
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-100 to-blue-100 border border-indigo-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-indigo-700 font-medium">Feiras Ativas</span>
          </div>
          <div className="text-lg font-bold text-indigo-900">{stats.feirasAtivas}</div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-emerald-700 font-medium">Feirantes</span>
          </div>
          <div className="text-lg font-bold text-emerald-900">{stats.totalFeirantes}</div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-orange-700 font-medium">Conversão</span>
          </div>
          <div className="text-lg font-bold text-orange-900">{percentualConfirmado}%</div>
        </div>
      </div>
    </Card>,

  ];

  // Em modo PWA instalado (standalone), evitamos drag-and-drop para garantir máxima estabilidade
  // e renderizamos os cards em um grid fixo.
  if (isStandalone) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
        {cards.map((card, index) => (
          <div key={index} className="h-full">
            {card}
          </div>
        ))}
      </div>
    );
  }

  return <DraggableStatsCards storageKey={storageKey}>{cards}</DraggableStatsCards>;
};
