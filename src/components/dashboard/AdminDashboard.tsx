import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Users, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FeiraForm } from "./admin/FeiraForm";
import { FeirasListEnhanced } from "./admin/FeirasListEnhanced";
import { InscricoesList } from "./admin/InscricoesList";
import { FeirantesAtivos } from "./admin/FeirantesAtivos";
import { PagamentosVerificacao } from "./admin/PagamentosVerificacao";
import { EnhancedStatsCards } from "./admin/EnhancedStatsCards";
import { FeirasCalendar } from "./admin/FeirasCalendar";
import { FeirasConsolidatedCard } from "./admin/FeirasConsolidatedCard";
import { FinancialGoalsCard } from "./admin/FinancialGoalsCard";
import { ExpensesSettings } from "./admin/ExpensesSettings";
import CompleteProfileAdmin from "@/components/profile/CompleteProfileAdmin";
import ChangePassword from "@/components/profile/ChangePassword";
import NotificationBell from "@/components/notifications/NotificationBell";
import { ProfileHeader } from "./ProfileHeader";
import { AdminSidebar } from "./AdminSidebar";
import { MessageCircle, Mail } from "lucide-react";

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [activeSection, setActiveSection] = useState("overview");
  const [profileKey, setProfileKey] = useState(0);
  const [stats, setStats] = useState({
    totalFeiras: 0,
    feirasAtivas: 0,
    totalFeirantes: 0,
    participacoesConfirmadas: 0,
    pagamentosPendentes: 0,
    pagamentosRecebidos: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Total de feiras
      const { count: totalFeiras } = await supabase
        .from("feiras")
        .select("*", { count: "exact", head: true });

      // Feiras ativas (recorrentes)
      const { count: feirasAtivas } = await supabase
        .from("feiras")
        .select("*", { count: "exact", head: true })
        .eq("recorrente", true);

      // Total feirantes cadastrados
      const { count: totalFeirantes } = await supabase
        .from("feirantes")
        .select("*", { count: "exact", head: true });

      // Participações confirmadas (status "aprovada")
      const { count: participacoesConfirmadas } = await supabase
        .from("inscricoes_feiras")
        .select("*", { count: "exact", head: true })
        .eq("status", "aprovada");

      // Pagamentos - buscar todos os pagamentos
      const { data: pagamentos } = await supabase
        .from("pagamentos")
        .select("status, valor_total");

      let valorPendente = 0;
      let valorRecebido = 0;

      if (pagamentos && pagamentos.length > 0) {
        valorPendente = pagamentos
          .filter((p) => p.status === "pendente" || p.status === "atrasado" || p.status === "aguardando_verificacao")
          .reduce((acc, p) => acc + Number(p.valor_total), 0);
        valorRecebido = pagamentos
          .filter((p) => p.status === "pago")
          .reduce((acc, p) => acc + Number(p.valor_total), 0);
      }

      setStats({
        totalFeiras: totalFeiras || 0,
        feirasAtivas: feirasAtivas || 0,
        totalFeirantes: totalFeirantes || 0,
        participacoesConfirmadas: participacoesConfirmadas || 0,
        pagamentosPendentes: valorPendente,
        pagamentosRecebidos: valorRecebido,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/auth");
  };

  const handleProfileUpdated = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setProfileKey(prev => prev + 1);
    setActiveSection("overview");
  };

  return (
    <div className="min-h-screen w-full flex bg-gradient-hero">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className="flex-1 flex flex-col ml-[280px]">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <ProfileHeader key={profileKey} userId={user.id} role="admin" compact />
              <div className="flex items-center gap-4">
                <NotificationBell userId={user.id} onNavigate={setActiveSection} />
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 overflow-auto">
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Visão Geral</h1>
                <p className="text-muted-foreground">Painel de controle das feiras</p>
              </div>

              <EnhancedStatsCards stats={stats} userId={user.id} />
            </div>
          )}

          {activeSection === "feirantes" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InscricoesList />
              <FeirantesAtivos />
            </div>
          )}

          {activeSection === "pagamentos" && (
            <PagamentosVerificacao />
          )}

          {activeSection === "config" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <FinancialGoalsCard userId={user.id} onGoalUpdated={loadStats} />
                <FeirasCalendar />
              </div>
              <ExpensesSettings userId={user.id} />
            </div>
          )}

          {(activeSection === "criar" || activeSection === "feiras") && (
            <div className="space-y-6">
              {activeSection === "criar" && (
                <FeiraForm 
                  onSuccess={() => {
                    setActiveSection("feiras");
                  }}
                  onCancel={() => {
                    setActiveSection("feiras");
                  }}
                />
              )}
              {activeSection === "feiras" && (
                <FeirasListEnhanced onAddNew={() => setActiveSection("criar")} />
              )}
            </div>
          )}

          {activeSection === "perfil" && (
            <CompleteProfileAdmin userId={user.id} onProfileUpdated={handleProfileUpdated} />
          )}

          {activeSection === "senha" && (
            <div className="max-w-4xl mx-auto">
              <ChangePassword />
            </div>
          )}

          {activeSection === "suporte" && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Suporte</h2>
              <div className="space-y-4 max-w-md">
                <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">WhatsApp</p>
                    <a 
                      href="https://wa.me/5562991429264" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      +55 62 9 9142-9264
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">E-mail</p>
                    <a 
                      href="mailto:feirafacilbrasil@gmail.com"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      feirafacilbrasil@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
