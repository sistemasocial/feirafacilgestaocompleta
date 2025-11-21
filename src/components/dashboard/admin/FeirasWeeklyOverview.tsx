import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Users, DollarSign } from "lucide-react";
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
  const [selectedDay, setSelectedDay] = useState<string>("1");

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
    <div className="space-y-3">
      {/* Seletor de dias - mais compacto */}
      <Card className="p-3">
        <h3 className="text-base font-semibold mb-3">Feiras da Semana</h3>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {DIAS_SEMANA.map((dia) => {
            const stats = getStatsForDay(dia.key);
            return (
              <button
                key={dia.key}
                onClick={() => setSelectedDay(dia.key)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg border transition-all ${
                  selectedDay === dia.key
                    ? `bg-gradient-to-r ${dia.color} text-white border-transparent shadow-md`
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                <div className="text-[10px] font-bold">{dia.shortName}</div>
                <div className="text-sm font-bold mt-0.5">{stats.totalFeiras}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Cards de estatísticas - mais compactos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className={`p-3 bg-gradient-to-br ${diaInfo.color} text-white`}>
          <Users className="w-4 h-4 mb-2 opacity-80" />
          <p className="text-[10px] opacity-90">Feiras</p>
          <p className="text-xl font-bold">{statsDoSelecionado.totalFeiras}</p>
        </Card>

        <Card className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <Users className="w-4 h-4 mb-2 opacity-80" />
          <p className="text-[10px] opacity-90">Inscrições</p>
          <p className="text-xl font-bold">{statsDoSelecionado.totalInscricoes}</p>
        </Card>

        <Card className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <Users className="w-4 h-4 mb-2 opacity-80" />
          <p className="text-[10px] opacity-90">Confirmadas</p>
          <p className="text-xl font-bold">{statsDoSelecionado.totalConfirmadas}</p>
        </Card>

        <Card className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <DollarSign className="w-4 h-4 mb-2 opacity-80" />
          <p className="text-[10px] opacity-90">Receita</p>
          <p className="text-base font-bold">
            R$ {(statsDoSelecionado.totalReceita / 1000).toFixed(1)}k
          </p>
        </Card>
      </div>

      {/* Lista de feiras - compacta */}
      {feirasDoSelecionado.length > 0 && (
        <Card className="p-3">
          <h4 className="text-sm font-semibold mb-2">
            {diaInfo.name} ({feirasDoSelecionado.length})
          </h4>
          <div className="space-y-2">
            {feirasDoSelecionado.map((feira) => {
              const valorTotal = (feira.inscricoes_confirmadas || 0) * (feira.valor_participacao || 0);
              
              return (
                <div
                  key={feira.id}
                  className="p-2 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-sm truncate">{feira.nome}</h5>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{feira.cidade} - {feira.bairro}</span>
                      </div>
                    </div>
                    {feira.recorrente && (
                      <Badge className="bg-success/10 text-success border-success/20 text-[10px] px-1.5 py-0">
                        Ativa
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-1.5 bg-background rounded">
                      <p className="text-[10px] text-muted-foreground">Inscrições</p>
                      <p className="text-sm font-bold">{feira.inscricoes_count}</p>
                    </div>

                    <div className="text-center p-1.5 bg-background rounded">
                      <p className="text-[10px] text-muted-foreground">Confirmadas</p>
                      <p className="text-sm font-bold">{feira.inscricoes_confirmadas}</p>
                    </div>

                    <div className="text-center p-1.5 bg-background rounded">
                      <p className="text-[10px] text-muted-foreground">Receita</p>
                      <p className="text-xs font-bold">
                        R$ {(valorTotal / 1000).toFixed(1)}k
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
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma feira em {diaInfo.name}</p>
        </Card>
      )}
    </div>
  );
};