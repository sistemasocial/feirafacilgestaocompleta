import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeiraEvent {
  date: string;
  count: number;
}

export const FeirasCalendarActivity = () => {
  const [events, setEvents] = useState<FeiraEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(new Date());

  useEffect(() => {
    loadFeiraEvents();
  }, []);

  const loadFeiraEvents = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      // Buscar todas as inscrições do mês atual
      const { data, error } = await supabase
        .from("inscricoes_feiras")
        .select("data_inscricao, status")
        .gte("data_inscricao", format(start, "yyyy-MM-dd"))
        .lte("data_inscricao", format(end, "yyyy-MM-dd"));

      if (error) throw error;

      // Agrupar por data e contar
      const eventMap: { [key: string]: number } = {};
      data?.forEach((inscricao) => {
        const date = format(parseISO(inscricao.data_inscricao), "yyyy-MM-dd");
        eventMap[date] = (eventMap[date] || 0) + 1;
      });

      const eventList = Object.entries(eventMap).map(([date, count]) => ({
        date,
        count,
      }));

      setEvents(eventList);
    } catch (error: any) {
      toast.error("Erro ao carregar eventos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
  
  // Preencher os dias vazios no início do mês
  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  const emptyDays = Array(firstDayOfMonth).fill(null);

  const getEventCount = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const event = events.find((e) => e.date === dateStr);
    return event?.count || 0;
  };

  const getCircleColor = (count: number) => {
    if (count === 0) return "bg-muted/30 text-muted-foreground";
    if (count <= 3) return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
    if (count <= 7) return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
    return "bg-primary text-primary-foreground";
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
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Atividade de Inscrições</h3>
          <p className="text-sm text-muted-foreground">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, index) => (
            <div key={index} className="text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Grid do calendário */}
        <div className="grid grid-cols-7 gap-2">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} />
          ))}
          
          {daysInMonth.map((day, index) => {
            const count = getEventCount(day);
            const colorClass = getCircleColor(count);
            
            return (
              <div key={index} className="flex items-center justify-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${colorClass}`}
                  title={`${count} inscrição(ões) em ${format(day, "dd/MM/yyyy")}`}
                >
                  {count > 0 ? count : format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-muted/30" />
            <span>Sem atividade</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30" />
            <span>1-3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/30" />
            <span>4-7</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary" />
            <span>8+</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
