import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, parseISO, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeiraEvent {
  date: string;
  feiras: Array<{
    id: string;
    nome: string;
    cidade: string;
  }>;
}

export const FeirasCalendar = () => {
  const [events, setEvents] = useState<FeiraEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadFeiraEvents();
  }, [currentMonth]);

  const loadFeiraEvents = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      // Buscar todas as feiras criadas no mês atual
      const { data, error } = await supabase
        .from("feiras")
        .select("id, nome, cidade, created_at")
        .gte("created_at", format(start, "yyyy-MM-dd"))
        .lte("created_at", format(end, "yyyy-MM-dd"))
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Agrupar por data
      const eventMap: { [key: string]: Array<{ id: string; nome: string; cidade: string }> } = {};
      data?.forEach((feira) => {
        const date = format(parseISO(feira.created_at), "yyyy-MM-dd");
        if (!eventMap[date]) {
          eventMap[date] = [];
        }
        eventMap[date].push({
          id: feira.id,
          nome: feira.nome,
          cidade: feira.cidade,
        });
      });

      const eventList = Object.entries(eventMap).map(([date, feiras]) => ({
        date,
        feiras,
      }));

      setEvents(eventList);
    } catch (error: any) {
      toast.error("Erro ao carregar feiras: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  
  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  const emptyDays = Array(firstDayOfMonth).fill(null);

  const getEventForDay = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return events.find((e) => e.date === dateStr);
  };

  const getDayClass = (day: Date) => {
    const event = getEventForDay(day);
    const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
    
    if (event) {
      return "bg-primary text-primary-foreground font-semibold hover:bg-primary/90";
    }
    if (isToday) {
      return "border-2 border-primary font-semibold";
    }
    return "hover:bg-muted/50";
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
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
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Calendário</h3>
              <p className="text-xs text-muted-foreground capitalize">
                {format(currentMonth, "MMM yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePreviousMonth}>
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => (
            <div key={index} className="text-center text-[10px] font-bold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Grid do calendário */}
        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}
          
          {daysInMonth.map((day, index) => {
            const event = getEventForDay(day);
            const dayClass = getDayClass(day);
            
            return (
              <div
                key={index}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] transition-all cursor-pointer ${dayClass}`}
                title={event ? event.feiras.map(f => `${f.nome} - ${f.cidade}`).join('\n') : undefined}
              >
                <span className="font-semibold">{format(day, "d")}</span>
                {event && event.feiras.length > 0 && (
                  <div className="w-1 h-1 rounded-full bg-current mt-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-center gap-3 pt-2 border-t text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-primary" />
            <span className="text-muted-foreground">Hoje</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-muted-foreground">Feira</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
