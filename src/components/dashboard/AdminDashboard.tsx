import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Settings, 
  LogOut,
  ShoppingBag,
  UserCog
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FeiraForm } from "./admin/FeiraForm";
import { FeirasListEnhanced } from "./admin/FeirasListEnhanced";
import { InscricoesList } from "./admin/InscricoesList";
import { FeirasCalendar } from "./admin/FeirasCalendar";
import CompleteProfileAdmin from "@/components/profile/CompleteProfileAdmin";
import NotificationBell from "@/components/notifications/NotificationBell";

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showFeiraForm, setShowFeiraForm] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Gestão de Feiras</h1>
                <p className="text-sm text-muted-foreground">Painel Administrativo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-3xl">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="feirantes" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Feirantes</span>
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Pagamentos</span>
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configurar Feiras</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
                  <Users className="w-8 h-8 text-accent" />
                </div>
              </Card>
            </div>

            {/* Calendário de Feiras com REDLINE */}
            <FeirasCalendar />

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Bem-vindo ao Sistema!</h2>
              <p className="text-muted-foreground">
                Este é o painel administrativo completo para gestão de feiras livres.
                Use as abas acima para navegar entre as diferentes funcionalidades.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="feirantes">
            <InscricoesList />
          </TabsContent>

          <TabsContent value="pagamentos">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Controle de Pagamentos</h2>
              <p className="text-muted-foreground">
                Funcionalidade em desenvolvimento. Em breve você poderá gerenciar pagamentos.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="configuracoes">
            {showFeiraForm ? (
              <FeiraForm
                onSuccess={() => {
                  setShowFeiraForm(false);
                  setActiveTab("configuracoes");
                }}
                onCancel={() => setShowFeiraForm(false)}
              />
            ) : (
              <FeirasListEnhanced onAddNew={() => setShowFeiraForm(true)} />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
