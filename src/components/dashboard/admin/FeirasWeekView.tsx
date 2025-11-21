import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Clock, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface Feira {
  id: string;
  nome: string;
  cidade: string;
  bairro: string;
  horario_inicio: string;
  horario_fim: string;
  dias_semana: string[];
  recorrente: boolean;
}

const DIAS_SEMANA = [
  { key: "1", name: "Segunda", shortName: "SEG", color: "from-blue-500 to-blue-600" },
  { key: "2", name: "Terça", shortName: "TER", color: "from-green-500 to-green-600" },
  { key: "3", name: "Quarta", shortName: "QUA", color: "from-yellow-500 to-yellow-600" },
  { key: "4", name: "Quinta", shortName: "QUI", color: "from-orange-500 to-orange-600" },
  { key: "5", name: "Sexta", shortName: "SEX", color: "from-purple-500 to-purple-600" },
  { key: "6", name: "Sábado", shortName: "SÁB", color: "from-pink-500 to-pink-600" },
  { key: "0", name: "Domingo", shortName: "DOM", color: "from-red-500 to-red-600" },
];

export const FeirasWeekView = () => {
  const [feiras, setFeiras] = useState<Feira[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeiras();
  }, []);

  const loadFeiras = async () => {
    try {
      const { data, error } = await supabase
        .from("feiras")
        .select("id, nome, cidade, bairro, horario_inicio, horario_fim, dias_semana, recorrente")
        .order("nome", { ascending: true });

      if (error) throw error;
      setFeiras(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar feiras: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFeirasForDay = (diaKey: string) => {
    return feiras.filter((feira) => feira.dias_semana.includes(diaKey));
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CalendarIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Feiras da Semana</h3>
          <p className="text-sm text-muted-foreground">Organização por dias da semana</p>
        </div>
      </div>

      <div className="space-y-4">
        {DIAS_SEMANA.map((dia) => {
          const feirasNoDia = getFeirasForDay(dia.key);

          return (
            <div key={dia.key} className="space-y-3">
              <div className={`flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r ${dia.color} text-white`}>
                <div className="font-bold text-lg">{dia.shortName}</div>
                <div className="flex-1 font-semibold">{dia.name}</div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {feirasNoDia.length} feira{feirasNoDia.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {feirasNoDia.length > 0 ? (
                <div className="grid gap-3 pl-4">
                  {feirasNoDia.map((feira) => (
                    <Card
                      key={feira.id}
                      className="p-4 hover:shadow-md transition-all animate-fade-in border-l-4"
                      style={{
                        borderLeftColor: `hsl(var(--primary))`,
                      }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm">{feira.nome}</h4>
                          {feira.recorrente && (
                            <Badge variant="outline" className="text-xs">
                              Recorrente
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>
                              {feira.cidade} - {feira.bairro}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {feira.horario_inicio} - {feira.horario_fim}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="pl-4 py-2 text-sm text-muted-foreground italic">
                  Nenhuma feira programada para este dia
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
