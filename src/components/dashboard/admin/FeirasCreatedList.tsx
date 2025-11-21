import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, MapPin, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Feira {
  id: string;
  nome: string;
  cidade: string;
  bairro: string;
  created_at: string;
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  recorrente: boolean;
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

export const FeirasCreatedList = () => {
  const [feiras, setFeiras] = useState<Feira[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeiras();
  }, []);

  const loadFeiras = async () => {
    try {
      const { data, error } = await supabase
        .from("feiras")
        .select("id, nome, cidade, bairro, created_at, dias_semana, horario_inicio, horario_fim, recorrente")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setFeiras(data || []);
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Feiras Criadas Recentemente</h3>
          <p className="text-sm text-muted-foreground">Últimas 10 feiras cadastradas</p>
        </div>
      </div>

      <div className="space-y-3">
        {feiras.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma feira cadastrada ainda
          </div>
        ) : (
          feiras.map((feira) => (
            <Card
              key={feira.id}
              className="p-4 hover:shadow-md transition-all border-l-4 border-l-primary animate-fade-in"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold">{feira.nome}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Criada em {format(parseISO(feira.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  {feira.recorrente && (
                    <Badge variant="outline" className="text-xs">
                      Recorrente
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{feira.cidade} - {feira.bairro}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{feira.horario_inicio} - {feira.horario_fim}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {feira.dias_semana.map((dia) => (
                    <Badge key={dia} variant="secondary" className="text-xs">
                      {DIAS_SEMANA_MAP[dia]}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};
