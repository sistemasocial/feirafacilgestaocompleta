import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Feirante {
  id: string;
  user_id: string;
  cpf_cnpj: string;
  segmento: string;
  descricao: string | null;
  ticket_medio: number | null;
  tamanho_barraca: string | null;
  ponto_fixo: boolean | null;
  bloqueado: boolean | null;
  profile: {
    full_name: string;
    phone: string | null;
    whatsapp: string | null;
    foto_url: string | null;
  };
}

export const FeirantesAtivos = () => {
  const [feirantes, setFeirantes] = useState<Feirante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeirantes();
  }, []);

  const loadFeirantes = async () => {
    try {
      const { data: feirantesData, error } = await supabase
        .from("feirantes")
        .select("*")
        .eq("bloqueado", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const feirantesComPerfis = await Promise.all(
        (feirantesData || []).map(async (feirante) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, phone, whatsapp, foto_url")
            .eq("id", feirante.user_id)
            .single();

          return {
            ...feirante,
            profile: profileData || {
              full_name: "N/A",
              phone: null,
              whatsapp: null,
              foto_url: null,
            },
          };
        })
      );

      setFeirantes(feirantesComPerfis);
    } catch (error: any) {
      toast.error("Erro ao carregar feirantes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentoLabel = (segmento: string) => {
    const labels: Record<string, string> = {
      alimentacao: "Alimentação",
      roupas: "Roupas",
      artesanato: "Artesanato",
      servicos: "Serviços",
      doces: "Doces",
      joias: "Joias",
      tapetes: "Tapetes",
      outros: "Outros",
    };
    return labels[segmento] || segmento;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (feirantes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Nenhum feirante ativo</h3>
        <p className="text-muted-foreground">
          Ainda não há feirantes cadastrados no sistema.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-success/5 to-primary/5 border-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <User className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Feirantes Ativos</h2>
              <p className="text-sm text-muted-foreground">Todos os feirantes cadastrados</p>
            </div>
          </div>
          <Badge className="bg-success text-white">{feirantes.length} feirantes</Badge>
        </div>

        {/* Lista Vertical de Feirantes */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
          {feirantes.map((feirante) => (
            <div 
              key={feirante.id} 
              className="p-4 rounded-xl bg-background border border-border hover:shadow-md hover:border-primary/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14 shrink-0 ring-2 ring-success/20">
                  <AvatarImage src={feirante.profile.foto_url || undefined} />
                  <AvatarFallback className="text-base bg-success/10 text-success font-semibold">
                    {feirante.profile.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-base">
                      {feirante.profile.full_name}
                    </h3>
                    <Badge variant="outline" className="shrink-0 border-success/30 bg-success/10 text-success">
                      {getSegmentoLabel(feirante.segmento)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {feirante.profile.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="truncate font-medium">{feirante.profile.phone}</span>
                      </div>
                    )}
                    {feirante.ponto_fixo && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-success" />
                        <span className="font-semibold text-success">Ponto Fixo</span>
                      </div>
                    )}
                    {feirante.ticket_medio && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs">Ticket Médio:</span>
                        <span className="font-bold text-foreground">
                          R$ {feirante.ticket_medio.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {feirante.descricao && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">
                      {feirante.descricao}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
