import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Tag } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { AdminInfo } from "./AdminInfo";
import { Skeleton } from "@/components/ui/skeleton";

type Feira = Tables<"feiras">;

const segmentosMap: Record<string, string> = {
  alimentacao: "Alimentação",
  roupas: "Roupas",
  artesanato: "Artesanato",
  servicos: "Serviços",
  outros: "Outros",
  doces: "Doces",
  joias: "Joias",
  tapetes: "Tapetes",
};

export const SegmentosSection = () => {
  const [feiras, setFeiras] = useState<Feira[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeiras = async () => {
      const { data, error } = await supabase
        .from("feiras")
        .select("*")
        .order("cidade", { ascending: true });

      if (error) {
        console.error("Erro ao buscar feiras:", error);
      } else {
        setFeiras(data || []);
      }
      setLoading(false);
    };

    fetchFeiras();
  }, []);

  const groupByCity = (feiras: Feira[]) => {
    return feiras.reduce((acc, feira) => {
      if (!acc[feira.cidade]) {
        acc[feira.cidade] = [];
      }
      acc[feira.cidade].push(feira);
      return acc;
    }, {} as Record<string, Feira[]>);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Segmentos por Região</h2>
        {[1, 2].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-48 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const groupedFeiras = groupByCity(feiras);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Segmentos por Região</h2>
        <p className="text-muted-foreground">
          Explore as feiras disponíveis por cidade e os segmentos que cada uma aceita
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {Object.entries(groupedFeiras).map(([cidade, cityFeiras]) => (
          <div key={cidade} className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold">{cidade}</h3>
              <Badge variant="outline" className="ml-2">
                <Users className="w-3 h-3 mr-1" />
                {cityFeiras.length} {cityFeiras.length === 1 ? "feira" : "feiras"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cityFeiras.map((feira) => (
                <Card key={feira.id} className="bg-background border-border hover:border-primary/50 transition-colors">
                  <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-1">Feira disponível</div>
                        <h4 className="font-bold text-lg truncate">{feira.nome}</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                          <MapPin className="w-3 h-3" />
                          <span>Localização</span>
                        </div>
                        <div className="font-semibold text-sm truncate">{feira.bairro}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                          <Tag className="w-3 h-3" />
                          <span>Segmentos</span>
                        </div>
                        <div className="font-semibold text-sm">Todos</div>
                      </div>
                    </div>

                    {feira.segmento_exclusivo && (
                      <div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-gradient-to-r from-accent to-primary rounded-full w-full" />
                        </div>
                        <Badge className="bg-accent text-accent-foreground text-xs">
                          Segmento Exclusivo
                        </Badge>
                      </div>
                    )}

                    {feira.created_by && (
                      <div className="pt-4 border-t border-border">
                        <AdminInfo adminId={feira.created_by} />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
