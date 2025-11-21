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
          <p className="text-sm text-muted-foreground">Distribuição por dias</p>
        </div>
      </div>

      <div className="space-y-2">
        {DIAS_SEMANA.map((dia) => {
          const feirasNoDia = getFeirasForDay(dia.key);

          return (
            <div
              key={dia.key}
              className={`flex items-center justify-between p-3 rounded-lg bg-gradient-to-r ${dia.color} text-white hover:shadow-md transition-all`}
            >
              <div className="flex items-center gap-3">
                <div className="font-bold text-sm">{dia.shortName}</div>
                <div className="font-medium text-sm">{dia.name}</div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                  {feirasNoDia.length} feira{feirasNoDia.length !== 1 ? "s" : ""}
                </Badge>
                
                {feirasNoDia.length > 0 && (
                  <div className="flex -space-x-1">
                    {feirasNoDia.slice(0, 3).map((feira) => (
                      <div
                        key={feira.id}
                        className="w-6 h-6 rounded-full bg-white/30 border-2 border-white flex items-center justify-center"
                        title={feira.nome}
                      >
                        <span className="text-xs font-bold">{feira.nome.charAt(0)}</span>
                      </div>
                    ))}
                    {feirasNoDia.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-white/30 border-2 border-white flex items-center justify-center">
                        <span className="text-xs font-bold">+{feirasNoDia.length - 3}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
