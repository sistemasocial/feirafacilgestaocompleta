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
import { FeirasCalendarActivity } from "./admin/FeirasCalendarActivity";
import { FeirantesAtivos } from "./admin/FeirantesAtivos";
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

      // Participações confirmadas
      const { count: participacoesConfirmadas } = await supabase
        .from("inscricoes_feiras")
        .select("*", { count: "exact", head: true })
        .eq("status", "confirmada");

      // Pagamentos
      const { data: pagamentos } = await supabase
        .from("pagamentos")
        .select("status, valor_total");

      const pendentes = pagamentos?.filter((p) => p.status === "pendente" || p.status === "atrasado").length || 0;
      const recebidos = pagamentos?.filter((p) => p.status === "pago").length || 0;
      const valorPendente = pagamentos
        ?.filter((p) => p.status === "pendente" || p.status === "atrasado")
        .reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;
      const valorRecebido = pagamentos
        ?.filter((p) => p.status === "pago")
        .reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;

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
                <NotificationBell userId={user.id} />
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

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Total de Feiras</p>
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">{stats.totalFeiras}</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Feiras Ativas</p>
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">{stats.feirasAtivas}</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Feirantes Cadastrados</p>
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">{stats.totalFeirantes}</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Participações Confirmadas</p>
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">{stats.participacoesConfirmadas}</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">R$ {stats.pagamentosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Pagamentos Recebidos</p>
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">R$ {stats.pagamentosRecebidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </Card>
              </div>

              <FeirasCalendarActivity />
            </div>
          )}

          {activeSection === "feirantes" && (
            <div className="space-y-6">
              <FeirantesAtivos />
              <InscricoesList />
            </div>
          )}

          {activeSection === "pagamentos" && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Gerenciar Pagamentos</h2>
              <p className="text-muted-foreground">Sistema de pagamentos em desenvolvimento...</p>
            </Card>
          )}

          {activeSection === "config" && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Configurações do Sistema</h2>
              <p className="text-muted-foreground">Área de configurações em desenvolvimento...</p>
            </Card>
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
