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

  useEffect(() => {
    if (!adminId) return;
    
    loadAdminProfile();
  }, [adminId]);

  const loadAdminProfile = async () => {
    if (!adminId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, foto_url, whatsapp")
      .eq("id", adminId)
      .maybeSingle();

    if (data && !error) {
      setAdmin(data);
    }
  };

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
