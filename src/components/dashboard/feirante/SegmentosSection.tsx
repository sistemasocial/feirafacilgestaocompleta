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

      <div className="space-y-6">
        {Object.entries(groupedFeiras).map(([cidade, cityFeiras]) => (
          <Card key={cidade} className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 border-b">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">{cidade}</h3>
                <Badge variant="outline" className="ml-auto">
                  <Users className="w-3 h-3 mr-1" />
                  {cityFeiras.length} {cityFeiras.length === 1 ? "feira" : "feiras"}
                </Badge>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {cityFeiras.map((feira) => (
                <div key={feira.id} className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{feira.nome}</h4>
                      <p className="text-sm text-muted-foreground">{feira.bairro}</p>
                    </div>
                    {feira.segmento_exclusivo && (
                      <Badge className="bg-accent text-accent-foreground">
                        Segmento Exclusivo
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Aceita todos os segmentos</span>
                  </div>

                  <div className="pt-3 border-t">
                    {feira.created_by && <AdminInfo adminId={feira.created_by} />}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
