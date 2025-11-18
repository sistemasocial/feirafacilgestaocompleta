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
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4">
      <h4 className="text-sm font-semibold mb-3">👤 Administrador Responsável</h4>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
          {admin.foto_url ? (
            <img 
              src={admin.foto_url} 
              alt={admin.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-primary">
              {admin.full_name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium">{admin.full_name}</p>
          {admin.whatsapp && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Phone className="w-3 h-3" />
              <span>{admin.whatsapp}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
