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
      // Buscar todas as feiras recorrentes
      const { data, error } = await supabase
        .from("feiras")
        .select("id, nome, cidade, dias_semana")
        .eq("recorrente", true);

      if (error) throw error;

      // Mapear dias da semana para números (0 = Domingo, 1 = Segunda, etc)
      const diaSemanaMapa: { [key: string]: number } = {
        'domingo': 0,
        '0': 0,
        'segunda': 1,
        '1': 1,
        'terca': 2,
        'terça': 2,
        '2': 2,
        'quarta': 3,
        '3': 3,
        'quinta': 4,
        '4': 4,
        'sexta': 5,
        '5': 5,
        'sabado': 6,
        'sábado': 6,
        '6': 6,
      };

      // Criar mapa de eventos por data
      const eventMap: { [key: string]: Array<{ id: string; nome: string; cidade: string }> } = {};
      
      // Para cada dia do mês atual
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const allDays = eachDayOfInterval({ start, end });

      allDays.forEach((day) => {
        const dayOfWeek = getDay(day); // 0-6 (Domingo-Sábado)
        const dateStr = format(day, "yyyy-MM-dd");

        // Verificar quais feiras acontecem neste dia da semana
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

  // Remove feiras duplicadas baseado no ID
  const getUniqueFeiras = (feiras: Array<{ id: string; nome: string; cidade: string }>) => {
    const seen = new Set();
    return feiras.filter(feira => {
      if (seen.has(feira.id)) return false;
      seen.add(feira.id);
      return true;
    });
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
    <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-border shadow-sm">
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h3>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 hover:bg-muted rounded-md" 
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 hover:bg-muted rounded-md" 
              onClick={handleNextMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, index) => (
            <div 
              key={index} 
              className="text-center text-xs font-semibold text-muted-foreground uppercase"
            >
              {day.substring(0, 3)}
            </div>
          ))}
        </div>

        {/* Grid do calendário */}
        <div className="grid grid-cols-7 gap-2 flex-1">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="w-9 h-9" />
          ))}
          
          {daysInMonth.map((day, index) => {
            const event = getEventForDay(day);
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

            // Regra simples de prioridade de cores:
            // 1) Se for hoje -> laranja
            // 2) Senão, se tiver feira -> verde
            // 3) Caso contrário -> neutro
            let colorClass = "text-foreground/80";

            if (isToday) {
              colorClass = "bg-orange-500 text-white shadow-sm";
            } else if (event) {
              colorClass = "bg-primary text-primary-foreground shadow-sm";
            }

            return (
              <div
                key={index}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium ${colorClass}`}
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>

      </div>
    </Card>
  );
};
