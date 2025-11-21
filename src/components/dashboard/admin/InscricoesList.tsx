import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, User, MapPin, Calendar, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Inscricao {
  id: string;
  status: string;
  data_inscricao: string;
  observacoes: string | null;
  segmento_inscrito: string;
  feira: {
    nome: string;
    cidade: string;
    bairro: string;
  };
  feirante: {
    id: string;
    user_id: string;
    segmento: string;
    cpf_cnpj: string;
    descricao: string | null;
    tamanho_barraca: string | null;
    ticket_medio: number | null;
  };
  profile: {
    full_name: string;
    phone: string | null;
    foto_url: string | null;
    whatsapp: string | null;
  };
}

export const InscricoesList = () => {
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInscricoes();
  }, []);

  const loadInscricoes = async () => {
    try {
      const { data, error } = await supabase
        .from("inscricoes_feiras")
        .select(`
          *,
          feira:feiras(nome, cidade, bairro),
          feirante:feirantes(id, user_id, segmento, cpf_cnpj, descricao, tamanho_barraca, ticket_medio)
        `)
        .order("data_inscricao", { ascending: false });

      if (error) throw error;

      // Buscar profiles para cada feirante
      const inscricoesComPerfis = await Promise.all(
        (data || []).map(async (inscricao: any) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, phone, foto_url, whatsapp")
            .eq("id", inscricao.feirante.user_id)
            .maybeSingle();

          return {
            ...inscricao,
            profile: profileData || { full_name: "N/A", phone: null, foto_url: null, whatsapp: null },
          };
        })
      );

      setInscricoes(inscricoesComPerfis);
    } catch (error: any) {
      toast.error("Erro ao carregar inscrições: " + error.message);
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

  const handleUpdateStatus = async (inscricaoId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("inscricoes_feiras")
        .update({ status: newStatus })
        .eq("id", inscricaoId);

      if (error) throw error;

      toast.success(`Inscrição ${newStatus === "aprovada" ? "aprovada" : "rejeitada"} com sucesso!`);
      loadInscricoes();
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (inscricoes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma inscrição</h3>
        <p className="text-muted-foreground">
          Ainda não há feirantes inscritos nas feiras.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-border">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Feirantes Aceitaram Participar</h2>
              <p className="text-sm text-muted-foreground">Inscrições recebidas</p>
            </div>
          </div>
          <Badge className="bg-primary text-white text-sm h-6 px-3">{inscricoes.length}</Badge>
        </div>

        {/* Lista Vertical de Inscrições */}
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
          {inscricoes.map((inscricao) => (
            <div 
              key={inscricao.id} 
              className="p-3 rounded-lg bg-background border border-border hover:shadow-sm hover:border-primary/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                {inscricao.profile.foto_url ? (
                  <img 
                    src={inscricao.profile.foto_url} 
                    alt={inscricao.profile.full_name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                    <span className="text-sm font-bold text-primary">
                      {inscricao.profile.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm truncate">
                      {inscricao.profile.full_name}
                    </h3>
                    <Badge 
                      variant={
                        inscricao.status === "aprovada" ? "default" : 
                        inscricao.status === "rejeitada" ? "destructive" : 
                        "secondary"
                      }
                      className="text-xs shrink-0 px-2 py-0.5"
                    >
                      {inscricao.status === "aprovada" ? "Aprovado" : 
                       inscricao.status === "rejeitada" ? "Rejeitado" : 
                       "Pendente"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{inscricao.feira.nome}</span>
                  </div>
                </div>
              </div>

              {inscricao.status === "pendente" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus(inscricao.id, "aprovada")}
                    className="flex-1 h-7 text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleUpdateStatus(inscricao.id, "rejeitada")}
                    className="flex-1 h-7 text-xs"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
