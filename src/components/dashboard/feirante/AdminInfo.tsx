import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone } from "lucide-react";

interface AdminData {
  full_name: string;
  foto_url: string | null;
  whatsapp: string | null;
}

export const AdminInfo = ({ adminId }: { adminId?: string | null }) => {
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminId) {
      setLoading(false);
      return;
    }
    
    loadAdminProfile();
  }, [adminId]);

  const loadAdminProfile = async () => {
    if (!adminId) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, foto_url, whatsapp")
        .eq("id", adminId)
        .maybeSingle();

      if (data && !error) {
        setAdmin(data);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil do admin:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary/20 via-primary/15 to-accent/20 border-2 border-primary/30 rounded-xl p-5 shadow-md animate-pulse">
        <div className="h-5 bg-primary/20 rounded w-1/3 mb-4"></div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/30 shadow-inner"></div>
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-primary/20 rounded w-2/3"></div>
            <div className="h-4 bg-primary/15 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="bg-gradient-to-br from-primary/20 via-primary/15 to-accent/20 border-2 border-primary/40 rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow">
      <h4 className="text-base font-bold mb-4 text-foreground flex items-center gap-2">
        👤 Administrador Responsável
      </h4>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg ring-2 ring-primary/30 ring-offset-2">
          {admin.foto_url ? (
            <img 
              src={admin.foto_url} 
              alt={admin.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-primary-foreground">
              {admin.full_name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg text-foreground">{admin.full_name}</p>
          {admin.whatsapp && (
            <div className="flex items-center gap-2 text-sm text-foreground/80 mt-2 bg-background/50 rounded-md px-3 py-1.5 w-fit">
              <Phone className="w-4 h-4 text-primary" />
              <span className="font-medium">{admin.whatsapp}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
