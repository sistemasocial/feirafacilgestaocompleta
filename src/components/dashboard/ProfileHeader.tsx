import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { User, Mail, Phone, Tag, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileHeaderProps {
  userId: string;
  role: "admin" | "feirante";
  compact?: boolean;
}

interface ProfileData {
  full_name: string;
  cpf: string | null;
  phone: string | null;
  whatsapp: string | null;
  foto_url: string | null;
  feiras_por_semana?: number | null;
  media_feirantes_por_feira?: number | null;
}

interface FeiranteData {
  segmento: string;
  cpf_cnpj: string;
}

export const ProfileHeader = ({ userId, role, compact = false }: ProfileHeaderProps) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [feirante, setFeirante] = useState<FeiranteData | null>(null);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      // Get user email and metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        
        // If no profile exists, use user metadata as fallback
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, cpf, phone, whatsapp, foto_url, feiras_por_semana, media_feirantes_por_feira")
          .eq("id", userId)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
        } else if (user.user_metadata) {
          // Use metadata as fallback
          setProfile({
            full_name: user.user_metadata.full_name || "Usuário",
            cpf: user.user_metadata.cpf || null,
            phone: user.user_metadata.phone || null,
            whatsapp: user.user_metadata.whatsapp || null,
            foto_url: null,
            feiras_por_semana: null,
            media_feirantes_por_feira: null
          });
        }
      }

      // If feirante, get additional data
      if (role === "feirante") {
        const { data: feiranteData } = await supabase
          .from("feirantes")
          .select("segmento, cpf_cnpj")
          .eq("user_id", userId)
          .maybeSingle();

        if (feiranteData) {
          setFeirante(feiranteData);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatSegmento = (segmento: string) => {
    const segmentoMap: Record<string, string> = {
      alimentacao: "Alimentação",
      roupas: "Roupas e Acessórios",
      artesanato: "Artesanato",
      servicos: "Serviços",
      outros: "Outros",
      doces: "Doces",
      joias: "Joias",
      tapetes: "Tapetes",
    };
    return segmentoMap[segmento] || segmento;
  };

  if (loading) {
    if (compact) {
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      );
    }
    return (
      <Card className="p-6 mb-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </Card>
    );
  }

  if (!profile) {
    // Show minimal info even without complete profile
    if (compact) {
      return (
        <Card className="p-4 bg-background/50 border-border/40">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold shadow-md">
              ?
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-base font-semibold">Usuário</h3>
                <p className="text-xs text-muted-foreground">
                  {role === "admin" ? "Administrador" : "Feirante"}
                </p>
              </div>
              {email && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{email}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      );
    }
    return null;
  }

  // Compact version for header
  if (compact) {
    return (
      <Card className="p-4 bg-background/50 border-border/40">
        <div className="flex items-start gap-4">
          {profile.foto_url ? (
            <img 
              src={profile.foto_url} 
              alt={profile.full_name}
              className="w-12 h-12 rounded-full object-cover shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold shadow-md">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="text-base font-semibold">{profile.full_name}</h3>
              <p className="text-xs text-muted-foreground">
                {role === "admin" ? "Administrador" : "Feirante"}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{email}</span>
              </div>
              {feirante?.cpf_cnpj && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">CPF/CNPJ:</span>
                  <span className="font-medium">{feirante.cpf_cnpj}</span>
                </div>
              )}
              {feirante?.segmento && (
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">Segmento:</span>
                  <span className="font-medium">{formatSegmento(feirante.segmento)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
      <div className="flex items-center gap-3 mb-4">
        {profile.foto_url ? (
          <img 
            src={profile.foto_url} 
            alt={profile.full_name}
            className="w-12 h-12 rounded-full object-cover shadow-glow"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg shadow-glow">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold">{profile.full_name}</h2>
          <p className="text-sm text-muted-foreground">
            {role === "admin" ? "Administrador" : "Feirante"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 text-sm">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Email:</span>
          <span className="font-medium">{email}</span>
        </div>

        {profile.cpf && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">CPF:</span>
            <span className="font-medium">{profile.cpf}</span>
          </div>
        )}

        {feirante?.cpf_cnpj && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">CPF/CNPJ:</span>
            <span className="font-medium">{feirante.cpf_cnpj}</span>
          </div>
        )}

        {profile.whatsapp && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">WhatsApp:</span>
            <span className="font-medium">{profile.whatsapp}</span>
          </div>
        )}

        {feirante?.segmento && (
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Segmento:</span>
            <span className="font-medium">{formatSegmento(feirante.segmento)}</span>
          </div>
        )}

        {role === "admin" && profile.feiras_por_semana && (
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Feiras/Semana:</span>
            <span className="font-medium">{profile.feiras_por_semana}</span>
          </div>
        )}

        {role === "admin" && profile.media_feirantes_por_feira && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Média Feirantes:</span>
            <span className="font-medium">{profile.media_feirantes_por_feira}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
