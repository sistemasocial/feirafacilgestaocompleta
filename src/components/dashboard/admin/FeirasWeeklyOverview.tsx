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
          <p className="text-sm text-muted-foreground">Feiras organizadas por dia</p>
        </div>
      </div>

      <div className="space-y-3">
        {DIAS_SEMANA.map((dia) => {
          const feirasNoDia = getFeirasForDay(dia.key);

          return (
            <Collapsible key={dia.key}>
              <CollapsibleTrigger className="w-full">
                <div
                  className={`flex items-center justify-between p-4 rounded-lg bg-gradient-to-r ${dia.color} text-white hover:shadow-lg transition-all cursor-pointer`}
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
                      <ChevronDown className="w-4 h-4 transition-transform" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              {feirasNoDia.length > 0 && (
                <CollapsibleContent className="mt-2 space-y-2">
                  {feirasNoDia.map((feira) => {
                    const valorTotal = (feira.inscricoes_confirmadas || 0) * (feira.valor_participacao || 0);
                    
                    return (
                      <Card
                        key={feira.id}
                        className="p-4 ml-4 hover:shadow-md transition-all border-l-4 border-l-primary animate-fade-in"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold">{feira.nome}</h4>
                            </div>
                            {feira.recorrente && (
                              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                Ativa
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{feira.cidade} - {feira.bairro}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-1">
                                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <p className="text-xs text-muted-foreground">Inscrições</p>
                              <p className="text-base font-bold">{feira.inscricoes_count}</p>
                            </div>

                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-1">
                                <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                              </div>
                              <p className="text-xs text-muted-foreground">Confirmadas</p>
                              <p className="text-base font-bold">{feira.inscricoes_confirmadas}</p>
                            </div>

                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-1">
                                <DollarSign className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              </div>
                              <p className="text-xs text-muted-foreground">Valor Total</p>
                              <p className="text-sm font-bold">
                                R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </CollapsibleContent>
              )}
            </Collapsible>
          );
        })}
      </div>
    </Card>
  );
};
