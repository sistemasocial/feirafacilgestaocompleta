import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Calendar as CalendarIcon, CheckCircle, AlertCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminInfo } from "./AdminInfo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Inscricao = Tables<"inscricoes_feiras"> & {
  feiras: Tables<"feiras">;
};

const diasSemanaMap: Record<string, string> = {
  "0": "Domingo",
  "1": "Segunda",
  "2": "Terça",
  "3": "Quarta",
  "4": "Quinta",
  "5": "Sexta",
  "6": "Sábado",
};

export const FeirasAtivas = () => {
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInscricoes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: feiranteData } = await supabase
        .from("feirantes")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!feiranteData) return;

      const { data, error } = await supabase
        .from("inscricoes_feiras")
        .select("*, feiras(*)")
        .eq("feirante_id", feiranteData.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar inscrições:", error);
      } else {
        setInscricoes(data as any || []);
      }
      setLoading(false);
    };

    fetchInscricoes();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprovado":
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "pendente":
        return <Badge variant="outline" className="border-warning text-warning"><AlertCircle className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "recusado":
        return <Badge variant="destructive">Recusado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Minhas Inscrições</h2>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (inscricoes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Você ainda não se inscreveu em nenhuma feira.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Minhas Inscrições</h2>
      
      <div className="grid gap-6">
        {inscricoes.map((inscricao) => (
          <Card key={inscricao.id} className="overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">{inscricao.feiras.nome}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{inscricao.feiras.cidade} - {inscricao.feiras.bairro}</span>
                  </div>
                </div>
                {getStatusBadge(inscricao.status)}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Horário</p>
                    <p className="font-medium">
                      {inscricao.feiras.horario_inicio} - {inscricao.feiras.horario_fim}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dias da Semana</p>
                    <p className="font-medium">
                      {inscricao.feiras.dias_semana.map((d) => diasSemanaMap[d]).join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Inscrito em {format(new Date(inscricao.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                {inscricao.feiras.created_by && (
                  <AdminInfo adminId={inscricao.feiras.created_by} />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
