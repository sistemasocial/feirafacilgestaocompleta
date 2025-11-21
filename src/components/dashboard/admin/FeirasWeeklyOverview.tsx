import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Calendar as CalendarIcon, Users, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface FeiraEvent {
  date: string;
  feiras: Array<{
    id: string;
    nome: string;
    cidade: string;
  }>;
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
  const [calendarEvents, setCalendarEvents] = useState<FeiraEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadFeiras();
    loadCalendarEvents();
  }, [currentMonth]);

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

  const loadCalendarEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("feiras")
        .select("id, nome, cidade, dias_semana")
        .eq("recorrente", true);

      if (error) throw error;

      const diaSemanaMapa: { [key: string]: number } = {
        'domingo': 0, '0': 0,
        'segunda': 1, '1': 1,
        'terca': 2, 'terça': 2, '2': 2,
        'quarta': 3, '3': 3,
        'quinta': 4, '4': 4,
        'sexta': 5, '5': 5,
        'sabado': 6, 'sábado': 6, '6': 6,
      };

      const eventMap: { [key: string]: Array<{ id: string; nome: string; cidade: string }> } = {};
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const allDays = eachDayOfInterval({ start, end });

      allDays.forEach((day) => {
        const dayOfWeek = getDay(day);
        const dateStr = format(day, "yyyy-MM-dd");

        data?.forEach((feira) => {
          const feiraHappenToday = feira.dias_semana.some((dia: string) => {
            const diaKey = dia.toString().toLowerCase();
            return diaSemanaMapa[diaKey] === dayOfWeek;
          });

          if (feiraHappenToday) {
            if (!eventMap[dateStr]) {
              eventMap[dateStr] = [];
            }
            eventMap[dateStr].push({
              id: feira.id,
              nome: feira.nome,
              cidade: feira.cidade,
            });
          }
        });
      });

      const eventList = Object.entries(eventMap).map(([date, feiras]) => ({
        date,
        feiras,
      }));

      setCalendarEvents(eventList);
    } catch (error: any) {
      console.error("Erro ao carregar eventos do calendário:", error);
    }
  };

  const getEventForDay = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return calendarEvents.find((e) => e.date === dateStr);
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  const emptyDays = Array(firstDayOfMonth).fill(null);

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
      {/* Seletor de dias e Calendário */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
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

        {/* Calendário Compacto */}
        <Card className="p-4 bg-gradient-to-br from-accent/5 to-primary/5 border-border shadow-sm">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h3>
              <div className="flex items-center gap-0.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 hover:bg-muted rounded-md" 
                  onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 hover:bg-muted rounded-md" 
                  onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {weekDays.map((day, index) => (
                <div 
                  key={index} 
                  className="text-center text-[8px] font-semibold text-muted-foreground uppercase"
                >
                  {day.substring(0, 3)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="w-7 h-7" />
              ))}
              
              {daysInMonth.map((day, index) => {
                const event = getEventForDay(day);
                const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                const tooltipText = event ? event.feiras.map(f => `${f.nome} - ${f.cidade}`).join('\n') : '';
                
                return (
                  <div
                    key={index}
                    className={`
                      w-7 h-7 rounded-md flex items-center justify-center 
                      text-[10px] font-medium transition-all cursor-pointer relative group
                      ${event ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-muted/40'}
                      ${isToday && !event ? 'bg-accent text-accent-foreground' : ''}
                      ${!event && !isToday ? 'text-foreground/80' : ''}
                    `}
                  >
                    {format(day, "d")}
                    {event && tooltipText && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded shadow-lg whitespace-pre-line opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 min-w-[120px] text-center">
                        {tooltipText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

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
