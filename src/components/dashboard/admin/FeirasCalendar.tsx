import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Feira {
  id: string;
  nome: string;
  cidade: string;
  bairro: string;
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
}

const DIAS_SEMANA: { [key: string]: string } = {
  "0": "Domingo",
  "1": "Segunda",
  "2": "Terça",
  "3": "Quarta",
  "4": "Quinta",
  "5": "Sexta",
  "6": "Sábado",
};

export const FeirasCalendar = () => {
  const [feiras, setFeiras] = useState<Feira[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeiras();
  }, []);

  const loadFeiras = async () => {
    try {
      const { data, error } = await supabase
        .from("feiras")
        .select("id, nome, cidade, bairro, dias_semana, horario_inicio, horario_fim")
        .order("created_at", { ascending: false });

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (feiras.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhuma feira cadastrada ainda</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Calendário de Feiras</h2>
      </div>

      <div className="space-y-3">
        {feiras.map((feira) => (
          <Card 
            key={feira.id} 
            className="border-l-4 border-l-destructive bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{feira.nome}</h3>
                    <Badge variant="destructive" className="text-xs">
                      ATIVA
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{feira.cidade} - {feira.bairro}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-destructive" />
                    <span className="font-medium text-destructive">
                      {feira.horario_inicio.slice(0, 5)} às {feira.horario_fim.slice(0, 5)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {feira.dias_semana.map((dia) => (
                      <Badge 
                        key={dia} 
                        variant="outline" 
                        className="border-destructive text-destructive"
                      >
                        {DIAS_SEMANA[dia]}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="h-full w-1 bg-destructive rounded-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
