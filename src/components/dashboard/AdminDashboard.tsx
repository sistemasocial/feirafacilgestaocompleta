import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, ShoppingBag, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FeiraForm } from "./admin/FeiraForm";
import { FeirasListEnhanced } from "./admin/FeirasListEnhanced";
import { InscricoesList } from "./admin/InscricoesList";
import { FeirasCalendar } from "./admin/FeirasCalendar";
import CompleteProfileAdmin from "@/components/profile/CompleteProfileAdmin";
import NotificationBell from "@/components/notifications/NotificationBell";
import { ProfileHeader } from "./ProfileHeader";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [activeSection, setActiveSection] = useState("overview");
  const [showFeiraForm, setShowFeiraForm] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-gradient-hero">
        <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-card sticky top-0 z-10">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger />
                  <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold" style={{ fontFamily: 'Pacifico, serif' }}>FeiraFácil!</h1>
                    <p className="text-sm text-muted-foreground">Painel Administrativo</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ProfileHeader userId={user.id} role="admin" />
                  <NotificationBell userId={user.id} />
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 px-4 py-8 overflow-auto">
            {activeSection === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Feirantes</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-warning" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pagamentos em Dia</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-success" />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Feirantes Ativos</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                      <Users className="w-8 h-8 text-info" />
                    </div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Calendário de Feiras</h2>
                  <FeirasCalendar />
                </Card>
              </div>
            )}

            {activeSection === "feirantes" && (
              <InscricoesList />
            )}

            {activeSection === "pagamentos" && (
              <Card className="p-6">
                <p className="text-muted-foreground">
                  Funcionalidade de gestão de pagamentos em desenvolvimento
                </p>
              </Card>
            )}

            {(activeSection === "config" || activeSection === "criar" || activeSection === "feiras") && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    {activeSection === "criar" ? "Nova Feira" : "Feiras Cadastradas"}
                  </h2>
                  {activeSection !== "criar" && (
                    <Button onClick={() => setShowFeiraForm(!showFeiraForm)}>
                      {showFeiraForm ? "Ver Lista" : "Nova Feira"}
                    </Button>
                  )}
                </div>
                {(showFeiraForm || activeSection === "criar") ? (
                  <FeiraForm 
                    onSuccess={() => setShowFeiraForm(false)} 
                    onCancel={() => setShowFeiraForm(false)} 
                  />
                ) : (
                  <FeirasListEnhanced onAddNew={() => setShowFeiraForm(true)} />
                )}
              </div>
            )}

            {activeSection === "perfil" && (
              <CompleteProfileAdmin userId={user.id} />
            )}

            {activeSection === "suporte" && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Suporte</h2>
                <p className="text-muted-foreground">
                  Entre em contato conosco através do email: suporte@feirafacil.com
                </p>
              </Card>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
