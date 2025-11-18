import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, DollarSign, TrendingUp, Star, MessageCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FeirasDisponiveisEnhanced } from "./feirante/FeirasDisponiveisEnhanced";
import { FeirasCalendarFeirante } from "./feirante/FeirasCalendarFeirante";
import { FeirasAtivas } from "./feirante/FeirasAtivas";
import { SegmentosSection } from "./feirante/SegmentosSection";
import CompleteProfileFeirante from "@/components/profile/CompleteProfileFeirante";
import NotificationBell from "@/components/notifications/NotificationBell";
import { ProfileHeader } from "./ProfileHeader";
import { FeiranteSidebar } from "./FeiranteSidebar";

interface FeiranteDashboardProps {
  user: User;
}

const FeiranteDashboard = ({ user }: FeiranteDashboardProps) => {
  const [activeSection, setActiveSection] = useState("home");
  const [profileKey, setProfileKey] = useState(0);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/auth");
  };

  const handleProfileUpdated = async () => {
    // Aguarda um momento para garantir que o banco foi atualizado
    await new Promise(resolve => setTimeout(resolve, 500));
    // Força o ProfileHeader a recarregar atualizando a key
    setProfileKey(prev => prev + 1);
    // Volta para a home
    setActiveSection("home");
  };

  return (
    <div className="min-h-screen w-full flex bg-gradient-hero">
      <FeiranteSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className="flex-1 flex flex-col ml-[280px]">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center justify-end gap-4">
              <ProfileHeader key={profileKey} userId={user.id} role="feirante" />
              <NotificationBell userId={user.id} />
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 overflow-auto">
          {activeSection === "home" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Status Pagamento</p>
                      <p className="text-2xl font-bold text-success">Em Dia</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-success" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Vendas do Mês</p>
                      <p className="text-2xl font-bold">R$ 0,00</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avaliação Média</p>
                      <p className="text-2xl font-bold">-</p>
                    </div>
                    <Star className="w-8 h-8 text-accent" />
                  </div>
                </Card>
              </div>

              <FeirasCalendarFeirante />

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Bem-vindo!</h2>
                <p className="text-muted-foreground">
                  Este é o seu espaço para gerenciar suas atividades na feira. Aqui você pode conferir
                  pagamentos, registrar vendas e avaliar sua experiência.
                </p>
              </Card>
            </div>
          )}

          {activeSection === "feiras" && (
            <FeirasDisponiveisEnhanced />
          )}

          {activeSection === "inscricoes" && (
            <FeirasAtivas />
          )}

          {activeSection === "pagamentos" && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Meus Pagamentos</h2>
              <p className="text-muted-foreground">Sistema de pagamentos em desenvolvimento...</p>
            </Card>
          )}

          {activeSection === "vendas" && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Registrar Vendas</h2>
              <p className="text-muted-foreground">Sistema de vendas em desenvolvimento...</p>
            </Card>
          )}

          {activeSection === "segmentos" && (
            <SegmentosSection />
          )}

          {activeSection === "perfil" && (
            <CompleteProfileFeirante userId={user.id} onSuccess={handleProfileUpdated} />
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

export default FeiranteDashboard;
