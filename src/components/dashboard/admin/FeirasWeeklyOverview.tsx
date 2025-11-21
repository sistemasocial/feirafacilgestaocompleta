import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar as CalendarIcon, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface Feira {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  valor_participacao: number | null;
  recorrente: boolean;
  dias_semana: string[];
  created_at: string;
  inscricoes_count: number;
  inscricoes_confirmadas: number;
}

const DIAS_SEMANA = [
  { key: "1", name: "Segunda-feira", shortName: "SEG", color: "from-blue-500 to-blue-600" },
  { key: "2", name: "Terça-feira", shortName: "TER", color: "from-green-500 to-green-600" },
  { key: "3", name: "Quarta-feira", shortName: "QUA", color: "from-yellow-500 to-yellow-600" },
  { key: "4", name: "Quinta-feira", shortName: "QUI", color: "from-orange-500 to-orange-600" },
  { key: "5", name: "Sexta-feira", shortName: "SEX", color: "from-purple-500 to-purple-600" },
  { key: "6", name: "Sábado", shortName: "SÁB", color: "from-pink-500 to-pink-600" },
  { key: "0", name: "Domingo", shortName: "DOM", color: "from-red-500 to-red-600" },
];

export const FeirasWeeklyOverview = () => {
  const [feiras, setFeiras] = useState<Feira[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>("1"); // Segunda por padrão

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
    } catch (error: any) {
      toast.error("Erro ao carregar feiras: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFeirasForDay = (diaKey: string) => {
    return feiras.filter((feira) => feira.dias_semana.includes(diaKey));
  };

  const getStatsForDay = (diaKey: string) => {
    const feirasNoDia = getFeirasForDay(diaKey);
    const totalInscricoes = feirasNoDia.reduce((sum, f) => sum + f.inscricoes_count, 0);
    const totalConfirmadas = feirasNoDia.reduce((sum, f) => sum + f.inscricoes_confirmadas, 0);
    const totalReceita = feirasNoDia.reduce((sum, f) => sum + (f.inscricoes_confirmadas * (f.valor_participacao || 0)), 0);
    
    return { totalInscricoes, totalConfirmadas, totalReceita, totalFeiras: feirasNoDia.length };
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

  const feirasDoSelecionado = getFeirasForDay(selectedDay);
  const statsDoSelecionado = getStatsForDay(selectedDay);
  const diaInfo = DIAS_SEMANA.find(d => d.key === selectedDay) || DIAS_SEMANA[0];

  return (
    <div className="space-y-4">
      {/* Seletor de dias */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Feiras da Semana</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {DIAS_SEMANA.map((dia) => {
            const stats = getStatsForDay(dia.key);
            return (
              <button
                key={dia.key}
                onClick={() => setSelectedDay(dia.key)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl border-2 transition-all ${
                  selectedDay === dia.key
                    ? `bg-gradient-to-r ${dia.color} text-white border-transparent shadow-lg`
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                <div className="text-xs font-bold">{dia.shortName}</div>
                <div className="text-lg font-bold mt-1">{stats.totalFeiras}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Inscrições */}
        <Card className={`p-6 bg-gradient-to-br ${diaInfo.color} text-white`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm opacity-90">Total Inscrições</p>
            <p className="text-3xl font-bold">{statsDoSelecionado.totalInscricoes}</p>
          </div>
        </Card>

        {/* Confirmadas */}
        <Card className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm opacity-90">Confirmadas</p>
            <p className="text-3xl font-bold">{statsDoSelecionado.totalConfirmadas}</p>
          </div>
        </Card>

        {/* Receita */}
        <Card className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm opacity-90">Receita Total</p>
            <p className="text-2xl font-bold">
              R$ {statsDoSelecionado.totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </Card>
      </div>

      {/* Lista de feiras */}
      {feirasDoSelecionado.length > 0 && (
        <Card className="p-6">
          <h4 className="text-md font-semibold mb-4">
            {diaInfo.name} - {feirasDoSelecionado.length} feira{feirasDoSelecionado.length !== 1 ? 's' : ''}
          </h4>
          <div className="space-y-3">
            {feirasDoSelecionado.map((feira) => {
              const valorTotal = (feira.inscricoes_confirmadas || 0) * (feira.valor_participacao || 0);
              
              return (
                <div
                  key={feira.id}
                  className="p-4 rounded-xl bg-muted/50 border border-border hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      <h5 className="font-semibold text-base">{feira.nome}</h5>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{feira.cidade} - {feira.bairro}</span>
                      </div>
                    </div>
                    {feira.recorrente && (
                      <Badge className="bg-success/10 text-success border-success/20">
                        Ativa
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-background rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Inscrições</p>
                      <p className="text-lg font-bold">{feira.inscricoes_count}</p>
                    </div>

                    <div className="text-center p-2 bg-background rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Confirmadas</p>
                      <p className="text-lg font-bold">{feira.inscricoes_confirmadas}</p>
                    </div>

                    <div className="text-center p-2 bg-background rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Receita</p>
                      <p className="text-sm font-bold">
                        R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {feirasDoSelecionado.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhuma feira cadastrada para {diaInfo.name}</p>
        </Card>
      )}
    </div>
  );
};
