import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Calendar, Clock, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, addDays, startOfDay } from "date-fns";

interface Feira {
  id: string;
  nome: string;
  cidade: string;
  bairro: string;
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  created_by: string | null;
}

interface AdminProfile {
  full_name: string;
  foto_url: string | null;
}

const DIAS_SEMANA: { [key: string]: string } = {
  "0": "Dom",
  "1": "Seg",
  "2": "Ter",
  "3": "Qua",
  "4": "Qui",
  "5": "Sex",
  "6": "Sáb",
};

const DIAS_SEMANA_FULL: { [key: string]: string } = {
  "0": "Domingo",
  "1": "Segunda-feira",
  "2": "Terça-feira",
  "3": "Quarta-feira",
  "4": "Quinta-feira",
  "5": "Sexta-feira",
  "6": "Sábado",
};

export const FeirasCalendarFeirante = () => {
  const [feiras, setFeiras] = useState<Feira[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<{ [key: string]: AdminProfile }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeiras();
  }, []);

  const loadFeiras = async () => {
    try {
      const { data, error } = await supabase
        .from("feiras")
        .select("id, nome, cidade, bairro, dias_semana, horario_inicio, horario_fim, created_by")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const feirasData = data || [];
      setFeiras(feirasData);

      // Load admin profiles
      const adminIds = [...new Set(feirasData.map(f => f.created_by).filter(Boolean))];
      if (adminIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, foto_url")
          .in("id", adminIds);

        if (profiles) {
          const profilesMap: { [key: string]: AdminProfile } = {};
          profiles.forEach(p => {
            profilesMap[p.id] = { full_name: p.full_name, foto_url: p.foto_url };
          });
          setAdminProfiles(profilesMap);
        }
      }
    } catch (error: any) {
      toast.error("Erro ao carregar feiras: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getNextOccurrence = (diasSemana: string[]) => {
    const today = startOfDay(new Date());
    const currentDay = today.getDay();
    
    const dias = diasSemana.map(d => parseInt(d)).sort((a, b) => a - b);
    
    let daysUntil = 0;
    let found = false;
    
    for (let i = 0; i <= 7; i++) {
      const checkDay = (currentDay + i) % 7;
      if (dias.includes(checkDay)) {
        daysUntil = i;
        found = true;
        break;
      }
    }
    
    if (!found) daysUntil = 0;
    
    const nextDate = addDays(today, daysUntil);
    const daysRemaining = differenceInDays(nextDate, today);
    
    return {
      date: nextDate,
      daysRemaining,
      dayName: DIAS_SEMANA_FULL[nextDate.getDay().toString()]
    };
  };

  const getDaysUntilText = (daysRemaining: number) => {
    if (daysRemaining === 0) return "Hoje";
    if (daysRemaining === 1) return "Amanhã";
    return `${daysRemaining} dias`;
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
      <Card className="p-8 text-center border-2 border-dashed">
        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhuma feira disponível no momento</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg">
          <Calendar className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Calendário de Feiras
        </h2>
      </div>

      <div className="grid gap-4">
        {feiras.map((feira) => {
          const nextOccurrence = getNextOccurrence(feira.dias_semana);
          const admin = feira.created_by ? adminProfiles[feira.created_by] : null;
          
          return (
            <Card 
              key={feira.id} 
              className="overflow-hidden border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-xl text-foreground">{feira.nome}</h3>
                      <Badge 
                        variant="default" 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md"
                      >
                        ATIVA
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">{feira.cidade} - {feira.bairro}</span>
                    </div>
                  </div>

                  {/* Countdown Badge */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white px-5 py-3 rounded-lg shadow-lg">
                      <div className="text-center">
                        <div className="text-3xl font-bold drop-shadow-lg">
                          {nextOccurrence.daysRemaining}
                        </div>
                        <div className="text-sm font-semibold">
                          {nextOccurrence.daysRemaining === 1 ? 'dia' : 'dias'}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-foreground font-bold">
                      {getDaysUntilText(nextOccurrence.daysRemaining)}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Time Info */}
                  <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm p-3 rounded-lg border border-border/50">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">Horário</div>
                      <div className="font-bold text-lg text-foreground">
                        {feira.horario_inicio.slice(0, 5)} - {feira.horario_fim.slice(0, 5)}
                      </div>
                    </div>
                  </div>

                  {/* Next Date */}
                  <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm p-3 rounded-lg border border-border/50">
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">Próxima</div>
                      <div className="font-bold text-sm text-foreground">{nextOccurrence.dayName}</div>
                    </div>
                  </div>
                </div>

                {/* Days of week */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {feira.dias_semana.map((dia) => (
                    <Badge 
                      key={dia} 
                      variant="secondary"
                      className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 text-primary font-semibold px-3 py-1"
                    >
                      {DIAS_SEMANA[dia]}
                    </Badge>
                  ))}
                </div>

                {/* Admin Info */}
                {admin && (
                  <div className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-accent/10 p-3 rounded-lg border border-primary/20">
                    <div className="p-1.5 bg-primary/10 rounded-full">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarImage src={admin.foto_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {admin.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-xs text-muted-foreground">Administrador</div>
                        <div className="text-sm font-semibold text-foreground">{admin.full_name}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
