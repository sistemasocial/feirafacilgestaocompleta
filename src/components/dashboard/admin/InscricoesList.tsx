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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Feirantes Aceitaram Participar ({inscricoes.length})</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inscricoes.map((inscricao) => (
          <Card key={inscricao.id} className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {inscricao.profile.foto_url ? (
                <img 
                  src={inscricao.profile.foto_url} 
                  alt={inscricao.profile.full_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {inscricao.profile.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold">{inscricao.profile.full_name}</h3>
                <Badge 
                  variant={
                    inscricao.status === "aprovada" ? "default" : 
                    inscricao.status === "rejeitada" ? "destructive" : 
                    "secondary"
                  }
                  className="text-xs"
                >
                  {inscricao.status === "aprovada" ? "Aprovado" : 
                   inscricao.status === "rejeitada" ? "Rejeitado" : 
                   "Pendente"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Segmento:</span>
                <p className="font-medium capitalize">
                  {getSegmentoLabel(
                    inscricao.segmento_inscrito || inscricao.feirante.segmento
                  )}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground text-xs">WhatsApp:</span>
                <p className="font-medium">{inscricao.profile.whatsapp || inscricao.profile.phone || "N/A"}</p>
              </div>

              <div>
                <span className="text-muted-foreground text-xs">CPF/CNPJ:</span>
                <p className="font-medium">{inscricao.feirante.cpf_cnpj}</p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="line-clamp-1">{inscricao.feira.nome}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>
                  {new Date(inscricao.data_inscricao).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>

            {inscricao.status === "pendente" && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(inscricao.id, "aprovada")}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleUpdateStatus(inscricao.id, "rejeitada")}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
