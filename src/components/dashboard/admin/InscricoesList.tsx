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
  };
  profile: {
    full_name: string;
    phone: string | null;
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
          feirante:feirantes(id, user_id, segmento, cpf_cnpj)
        `)
        .order("data_inscricao", { ascending: false });

      if (error) throw error;

      // Buscar profiles para cada feirante
      const inscricoesComPerfis = await Promise.all(
        (data || []).map(async (inscricao: any) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", inscricao.feirante.user_id)
            .single();

          return {
            ...inscricao,
            profile: profileData || { full_name: "N/A", phone: null },
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
      <h2 className="text-xl font-semibold">Inscrições de Feirantes ({inscricoes.length})</h2>
      
      <div className="grid gap-4">
        {inscricoes.map((inscricao) => (
          <Card key={inscricao.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{inscricao.profile.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{inscricao.feira.nome} - {inscricao.feira.cidade}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(inscricao.data_inscricao).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                <Badge 
                  variant={
                    inscricao.status === "aprovada" ? "default" : 
                    inscricao.status === "rejeitada" ? "destructive" : 
                    "secondary"
                  }
                >
                  {inscricao.status}
                </Badge>
              </div>

              <div className="text-sm">
                <p><strong>Segmento:</strong> {inscricao.feirante.segmento}</p>
                <p><strong>CPF/CNPJ:</strong> {inscricao.feirante.cpf_cnpj}</p>
                {inscricao.profile.phone && (
                  <p><strong>Telefone:</strong> {inscricao.profile.phone}</p>
                )}
                {inscricao.observacoes && (
                  <p className="mt-2"><strong>Observações:</strong> {inscricao.observacoes}</p>
                )}
              </div>

              {inscricao.status === "pendente" && (
                <div className="flex gap-2">
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
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
