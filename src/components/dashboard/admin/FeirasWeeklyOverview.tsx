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
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
          <CalendarIcon className="w-5 h-5 text-success" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Feiras da Semana</h3>
          <p className="text-sm text-muted-foreground">Feiras organizadas por dia</p>
        </div>
      </div>

      <div className="space-y-2">
        {DIAS_SEMANA.map((dia) => {
          const feirasNoDia = getFeirasForDay(dia.key);

          return (
            <Collapsible key={dia.key} defaultOpen={feirasNoDia.length > 0}>
              <CollapsibleTrigger className="w-full group">
                <div
                  className={`flex items-center justify-between p-3 rounded-xl bg-gradient-to-r ${dia.color} text-white hover:shadow-lg transition-all cursor-pointer`}
                >
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-xs bg-white/20 rounded-lg px-2 py-1">{dia.shortName}</div>
                    <div className="font-medium text-sm">{dia.name}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs px-2 py-0.5">
                      {feirasNoDia.length} feira{feirasNoDia.length !== 1 ? "s" : ""}
                    </Badge>
                    {feirasNoDia.length > 0 && (
                      <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              {feirasNoDia.length > 0 && (
                <CollapsibleContent className="mt-2 ml-2 space-y-2 animate-fade-in">
                  {feirasNoDia.map((feira) => {
                    const valorTotal = (feira.inscricoes_confirmadas || 0) * (feira.valor_participacao || 0);
                    
                    return (
                      <div
                        key={feira.id}
                        className="p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base">{feira.nome}</h4>
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
                            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-primary" />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mb-0.5">Inscrições</p>
                              <p className="text-xl font-bold">{feira.inscricoes_count}</p>
                            </div>

                            <div className="p-3 bg-success/5 rounded-lg border border-success/10">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-success" />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mb-0.5">Confirmadas</p>
                              <p className="text-xl font-bold">{feira.inscricoes_confirmadas}</p>
                            </div>

                            <div className="p-3 bg-accent/5 rounded-lg border border-accent/10">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                  <DollarSign className="w-4 h-4 text-accent" />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mb-0.5">Receita</p>
                              <p className="text-base font-bold">
                                R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
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
