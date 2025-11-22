import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import FeiranteDashboard from "@/components/dashboard/FeiranteDashboard";
import { Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Configurar listener de notificações push
  useNotifications(user?.id);

  useEffect(() => {
    
    // Timeout de segurança: se após 10s ainda estiver carregando, redireciona com erro
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.error("Timeout ao carregar sessão");
        setLoading(false);
        toast({
          title: "Erro ao carregar",
          description: "Sua sessão expirou. Faça login novamente.",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    }, 10000);

    // Helper to fetch or create the user's role
    const fetchOrCreateRole = async (session: Session) => {
      try {
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching role:", error);
          throw error;
        }

        if (!roleData) {
          const rawRole = (session.user.user_metadata as any)?.role;
          const metaRole = rawRole === "admin" || rawRole === "feirante" ? rawRole : null;
          const roleToAssign: "admin" | "feirante" = (metaRole ?? "feirante") as "admin" | "feirante";

          const { data: inserted, error: insertError } = await supabase
            .from("user_roles")
            .insert({ user_id: session.user.id, role: roleToAssign })
            .select("role")
            .single();

          if (insertError) {
            console.error("Error creating role:", insertError);
            throw insertError;
          }
          setUserRole(inserted.role);
        } else {
          setUserRole(roleData.role);
        }
      } catch (e) {
        console.error("Error resolving role:", e);
        toast({
          title: "Erro de autenticação",
          description: "Não foi possível carregar seu perfil. Faça login novamente.",
          variant: "destructive",
        });
        setUserRole(null);
        setLoading(false);
        navigate("/auth", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session);
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
          setLoading(false);
          navigate("/auth", { replace: true });
          return;
        }
        
        if (session?.user) {
          setUser(session.user);
          setTimeout(() => {
            fetchOrCreateRole(session);
          }, 0);
        } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Sessão atualizada mas sem usuário = erro
          if (!session) {
            console.error("Session refresh failed");
            toast({
              title: "Sessão expirada",
              description: "Faça login novamente.",
              variant: "destructive",
            });
            setLoading(false);
            navigate("/auth", { replace: true });
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        toast({
          title: "Erro de sessão",
          description: "Não foi possível recuperar sua sessão. Faça login novamente.",
          variant: "destructive",
        });
        setLoading(false);
        navigate("/auth", { replace: true });
        return;
      }
      
      if (!session) {
        setLoading(false);
        navigate("/auth", { replace: true });
        return;
      }
      
      setUser(session.user);
      fetchOrCreateRole(session);
    }).catch((err) => {
      console.error("Unexpected error getting session:", err);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao verificar sua sessão. Tente novamente.",
        variant: "destructive",
      });
      setLoading(false);
      navigate("/auth", { replace: true });
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Perfil não configurado</h1>
          <p className="text-muted-foreground mb-4">
            Seu perfil ainda não foi configurado por um administrador.
          </p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com o responsável pela feira.
          </p>
        </div>
      </div>
    );
  }

  if (userRole === "admin") {
    return <AdminDashboard user={user!} />;
  }

  return <FeiranteDashboard user={user!} />;
};

export default Dashboard;
