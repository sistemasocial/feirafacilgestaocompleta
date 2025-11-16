import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Home, 
  DollarSign, 
  TrendingUp, 
  LogOut,
  ShoppingBag,
  Star,
  Calendar,
  UserCog
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FeirasDisponiveisEnhanced } from "./feirante/FeirasDisponiveisEnhanced";
import CompleteProfileFeirante from "@/components/profile/CompleteProfileFeirante";
import NotificationBell from "@/components/notifications/NotificationBell";

interface FeiranteDashboardProps {
  user: User;
}

const FeiranteDashboard = ({ user }: FeiranteDashboardProps) => {
  const [activeTab, setActiveTab] = useState("home");
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
                <h1 className="text-xl font-bold">Área do Feirante</h1>
                <p className="text-sm text-muted-foreground">Minha Barraca</p>
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
          <TabsList className="grid grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Início</span>
            </TabsTrigger>
            <TabsTrigger value="feiras" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Feiras</span>
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Pagamentos</span>
            </TabsTrigger>
            <TabsTrigger value="vendas" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="avaliacoes" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Avaliações</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">Terminar Cadastro</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
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

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Bem-vindo!</h2>
              <p className="text-muted-foreground">
                Este é o seu espaço para gerenciar suas atividades na feira.
                Aqui você pode conferir pagamentos, registrar vendas e avaliar sua experiência.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="feiras" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Feiras Disponíveis</h2>
              <p className="text-muted-foreground mb-6">
                Confira todas as feiras cadastradas e seus detalhes
              </p>
              <FeirasDisponiveisEnhanced />
            </div>
          </TabsContent>

          <TabsContent value="pagamentos">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Meus Pagamentos</h2>
              <p className="text-muted-foreground">
                Funcionalidade em desenvolvimento. Em breve você poderá visualizar o histórico de pagamentos.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="vendas">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Registro de Vendas</h2>
              <p className="text-muted-foreground">
                Funcionalidade em desenvolvimento. Em breve você poderá registrar suas vendas diárias.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="avaliacoes">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Minhas Avaliações</h2>
              <p className="text-muted-foreground">
                Funcionalidade em desenvolvimento. Em breve você poderá avaliar sua experiência nas feiras.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <CompleteProfileFeirante userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FeiranteDashboard;
