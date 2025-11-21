import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Calendar, Users, DollarSign } from "lucide-react";
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

const DIAS_SEMANA_MAP: { [key: string]: string } = {
  "0": "Dom",
  "1": "Seg",
  "2": "Ter",
  "3": "Qua",
  "4": "Qui",
  "5": "Sex",
  "6": "Sáb",
};

export const FeirasListOverview = () => {
  const [feiras, setFeiras] = useState<Feira[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeiras();
  }, []);

  const loadFeiras = async () => {
    try {
      // Buscar feiras com contagem de inscrições
      const { data: feirasData, error: feirasError } = await supabase
        .from("feiras")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (feirasError) throw feirasError;

      // Para cada feira, buscar as contagens de inscrições
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Feiras Criadas</h3>
            <p className="text-sm text-muted-foreground">Últimas feiras cadastradas</p>
          </div>
        </div>
        <Button variant="link" className="text-primary">
          Ver todas
        </Button>
      </div>

      <div className="space-y-3">
        {feiras.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma feira cadastrada ainda
          </div>
        ) : (
          feiras.map((feira) => {
            const valorTotal = (feira.inscricoes_confirmadas || 0) * (feira.valor_participacao || 0);
            const isActive = feira.recorrente;
            
            return (
              <Card
                key={feira.id}
                className="p-4 hover:shadow-md transition-all border-l-4 border-l-primary animate-fade-in"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">{feira.nome}</h4>
                    </div>
                    {isActive && (
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                        Ativa
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{feira.cidade} - {feira.bairro}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground mt-0.5" />
                    {feira.dias_semana.map((dia) => (
                      <Badge key={dia} variant="secondary" className="text-xs">
                        {DIAS_SEMANA_MAP[dia]}
                      </Badge>
                    ))}
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
          })
        )}
      </div>
    </Card>
  );
};
