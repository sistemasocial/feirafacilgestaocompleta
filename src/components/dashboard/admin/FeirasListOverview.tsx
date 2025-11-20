import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Calendar, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
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
        .limit(5);

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
            .eq("status", "confirmada");

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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Feiras Criadas</CardTitle>
          <Button variant="link" className="text-primary">
            Ver todas
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feiras.map((feira) => {
            const valorTotal = (feira.inscricoes_confirmadas || 0) * (feira.valor_participacao || 0);
            
            return (
              <div
                key={feira.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-base">{feira.nome}</h4>
                  {feira.recorrente && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                      Ativa
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{feira.bairro}, {feira.cidade}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{feira.dias_semana.join(", ")}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-1">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xs text-muted-foreground">Inscrições</p>
                    <p className="text-sm font-semibold">{feira.inscricoes_count}</p>
                  </div>

                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-1">
                      <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-xs text-muted-foreground">Confirmadas</p>
                    <p className="text-sm font-semibold">{feira.inscricoes_confirmadas}</p>
                  </div>

                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-1">
                      <DollarSign className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="text-sm font-semibold">
                      R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
