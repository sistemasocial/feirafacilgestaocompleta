import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import FeiranteDashboard from "@/components/dashboard/FeiranteDashboard";
import { Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationOnboarding } from "@/components/notifications/NotificationOnboarding";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Configurar listener de notificações push
  useNotifications(user?.id);

  useEffect(() => {
    // Helper to fetch or create the user's role to avoid "Perfil não configurado"
    const fetchOrCreateRole = async (session: Session) => {
      try {
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching role:", error);
        }

        if (!roleData) {
          // Prefer role from user metadata if present, else default to "feirante"
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
            setUserRole(null);
          } else {
            setUserRole(inserted.role);
          }
        } else {
          setUserRole(roleData.role);
        }
      } catch (e) {
        console.error("Unexpected error resolving role:", e);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    // 1) Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate("/auth");
          return;
        }
        setUser(session.user);
        // Defer DB calls to avoid deadlocks in the callback
        setTimeout(() => {
          fetchOrCreateRole(session);
        }, 0);
      }
    );

    // 2) THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchOrCreateRole(session);
    });

    return () => subscription.unsubscribe();
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
    return (
      <>
        <NotificationOnboarding userId={user!.id} userRole="admin" />
        <AdminDashboard user={user!} />
      </>
    );
  }

  return (
    <>
      <NotificationOnboarding userId={user!.id} userRole="feirante" />
      <FeiranteDashboard user={user!} />
    </>
  );
};

export default Dashboard;
