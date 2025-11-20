import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Phone, MapPin, Calendar } from "lucide-react";
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
  feiras: Array<{
    id: string;
    nome: string;
    cidade: string;
    bairro: string;
    status: string;
  }>;
}

export const FeirantesAtivosEnhanced = () => {
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

      const feirantesComDados = await Promise.all(
        (feirantesData || []).map(async (feirante) => {
          // Buscar profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, phone, whatsapp, foto_url")
            .eq("id", feirante.user_id)
            .single();

          // Buscar feiras confirmadas
          const { data: inscricoesData } = await supabase
            .from("inscricoes_feiras")
            .select(`
              status,
              feira:feiras(id, nome, cidade, bairro)
            `)
            .eq("feirante_id", feirante.id)
            .eq("status", "confirmada");

          const feiras = (inscricoesData || []).map((insc: any) => ({
            id: insc.feira.id,
            nome: insc.feira.nome,
            cidade: insc.feira.cidade,
            bairro: insc.feira.bairro,
            status: insc.status,
          }));

          return {
            ...feirante,
            profile: profileData || {
              full_name: "N/A",
              phone: null,
              whatsapp: null,
              foto_url: null,
            },
            feiras,
          };
        })
      );

      setFeirantes(feirantesComDados);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Feirantes Ativos</h2>
        <Badge variant="secondary">{feirantes.length} feirantes</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feirantes.map((feirante) => (
          <Card key={feirante.id} className="p-6 flex flex-col gap-4">
            <div className="flex flex-col items-center text-center gap-3">
              <Avatar className="w-20 h-20">
                <AvatarImage src={feirante.profile.foto_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {feirante.profile.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {feirante.profile.full_name}
                </h3>
                <Badge variant="outline">
                  {getSegmentoLabel(feirante.segmento)}
                </Badge>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">CPF/CNPJ:</span>
                <p className="font-medium">{feirante.cpf_cnpj}</p>
              </div>

              {(feirante.profile.whatsapp || feirante.profile.phone) && (
                <div>
                  <span className="text-muted-foreground text-xs">WhatsApp:</span>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <p className="font-medium">
                      {feirante.profile.whatsapp || feirante.profile.phone}
                    </p>
                  </div>
                </div>
              )}

              {feirante.ponto_fixo && (
                <div className="flex items-center gap-2 text-primary">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium text-sm">Ponto Fixo</span>
                </div>
              )}
            </div>

            {feirante.feiras.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">
                    Feiras Confirmadas ({feirante.feiras.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {feirante.feiras.slice(0, 2).map((feira) => (
                    <div
                      key={feira.id}
                      className="p-2 bg-muted/30 rounded-lg border text-xs"
                    >
                      <p className="font-medium line-clamp-1">{feira.nome}</p>
                      <p className="text-muted-foreground line-clamp-1">
                        {feira.cidade} - {feira.bairro}
                      </p>
                    </div>
                  ))}
                  {feirante.feiras.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{feirante.feiras.length - 2} feira{feirante.feiras.length - 2 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
