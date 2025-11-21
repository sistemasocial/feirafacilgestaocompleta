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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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

        {/* Grid de Feirantes */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {feirantes.map((feirante) => (
            <div 
              key={feirante.id} 
              className="p-4 rounded-xl bg-background border border-border hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarImage src={feirante.profile.foto_url || undefined} />
                  <AvatarFallback className="text-sm bg-primary/10">
                    {feirante.profile.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate text-sm mb-1">
                    {feirante.profile.full_name}
                  </h3>
                  <Badge variant="outline" className="text-xs mb-2">
                    {getSegmentoLabel(feirante.segmento)}
                  </Badge>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {feirante.profile.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        <span className="truncate">{feirante.profile.phone}</span>
                      </div>
                    )}
                    {feirante.ponto_fixo && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-success" />
                        <span className="font-medium text-success">Ponto Fixo</span>
                      </div>
                    )}
                  </div>

                  {feirante.descricao && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
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
