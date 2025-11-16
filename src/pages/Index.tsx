import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Shield,
  Clock,
  MapPin,
  CheckCircle
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Gestão de Feirantes",
      description: "Cadastre e gerencie todos os feirantes da sua feira em um só lugar"
    },
    {
      icon: DollarSign,
      title: "Controle de Pagamentos",
      description: "Acompanhe pagamentos, taxas e status financeiro de cada feirante"
    },
    {
      icon: TrendingUp,
      title: "Relatórios e Análises",
      description: "Visualize gráficos de desempenho e vendas em tempo real"
    },
    {
      icon: Shield,
      title: "Sistema de Regras",
      description: "Defina políticas de cancelamento e regras da feira automaticamente"
    },
    {
      icon: Clock,
      title: "Gestão de Horários",
      description: "Configure dias, horários e limite para montagem das barracas"
    },
    {
      icon: MapPin,
      title: "Localização",
      description: "Gerencie endereços e visualize a localização da sua feira"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-6 shadow-glow">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Gestão Completa de
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Feiras Livres</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              A plataforma profissional para administrar sua feira livre com controle de feirantes, 
              pagamentos, vendas e muito mais.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="shadow-glow"
                onClick={() => navigate("/auth")}
              >
                Começar Agora
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/auth")}
              >
                Já tenho conta
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sistema completo com todas as ferramentas essenciais para gerenciar sua feira livre
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Por que escolher nossa plataforma?
            </h2>

            <div className="space-y-6">
              {[
                "Interface intuitiva e fácil de usar",
                "Controle completo de pagamentos e status",
                "Relatórios detalhados de vendas e desempenho",
                "Sistema de regras e políticas automatizado",
                "Acesso diferenciado para administradores e feirantes",
                "Suporte a múltiplas formas de pagamento"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-4">
                  <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                  <p className="text-lg">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Transforme a gestão da sua feira livre com nossa plataforma completa
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="shadow-lg"
            onClick={() => navigate("/auth")}
          >
            Criar Conta Grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Sistema de Gestão de Feiras Livres. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
