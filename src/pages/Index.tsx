import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, TrendingUp, Settings, Clock, MapPin, Check, Store } from "lucide-react";
import feiraBackground from "@/assets/feira-background.jpg";
import vendedoraHero from "@/assets/vendedora-hero.jpg";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Gestão de Feirantes",
      description: "Cadastre e gerencie todos os feirantes da sua feira em um só lugar",
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      icon: DollarSign,
      title: "Controle de Pagamentos",
      description: "Acompanhe pagamentos, taxas e status financeiro de cada feirante",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: TrendingUp,
      title: "Relatórios e Análises",
      description: "Visualize gráficos de desempenho e vendas em tempo real",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Settings,
      title: "Sistema de Regras",
      description: "Defina políticas de cancelamento e regras da feira automaticamente",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: Clock,
      title: "Gestão de Horários",
      description: "Configure dias, horários e limite para montagem das barracas",
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      icon: MapPin,
      title: "Localização",
      description: "Gerencie endereços e visualize a localização da sua feira",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
  ];

  const benefits = [
    "Interface intuitiva e fácil de usar",
    "Controle completo de pagamentos e status",
    "Relatórios detalhados de vendas e desempenho",
    "Sistema de regras e políticas automatizado",
    "Acesso diferenciado para administradores e feirantes",
    "Suporte a múltiplas formas de pagamento",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6" color="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">FeiraFácil!</h1>
              <p className="text-xs text-muted-foreground">Gestão Completa</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#recursos" className="text-gray-600 hover:text-emerald-600 transition-colors">
              Recursos
            </a>
            <a href="#vantagens" className="text-gray-600 hover:text-emerald-600 transition-colors">
              Vantagens
            </a>
            <a href="#contato" className="text-gray-600 hover:text-emerald-600 transition-colors">
              Contato
            </a>
          </nav>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/auth")}
              className="text-gray-600 hover:text-emerald-600 transition-colors whitespace-nowrap"
            >
              Já tenho conta
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl transition-all duration-300 hover:shadow-lg whitespace-nowrap"
            >
              Criar Cadastro
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${feiraBackground})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/85"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-light text-gray-800 leading-tight">
                  Gestão Completa de <span className="font-semibold text-emerald-600">Feiras Livres</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  A plataforma profissional para administrar sua feira livre com controle de feirantes, pagamentos,
                  vendas e muito mais.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate("/auth")}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-medium transition-all duration-300 hover:shadow-xl hover:scale-105 whitespace-nowrap"
                >
                  Criar Cadastro
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="border-2 border-gray-200 hover:border-emerald-300 text-gray-700 px-8 py-4 rounded-2xl text-lg font-medium transition-all duration-300 hover:shadow-lg whitespace-nowrap"
                >
                  Já tenho conta
                </button>
              </div>
              <div className="flex items-center space-x-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">500+</div>
                  <div className="text-sm text-gray-500">Feiras Ativas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">2.500+</div>
                  <div className="text-sm text-gray-500">Feirantes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">98%</div>
                  <div className="text-sm text-gray-500">Satisfação</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                <img src={vendedoraHero} alt="Feirante feliz" className="w-full h-auto rounded-2xl object-cover" />
              </div>
              <div className="absolute -top-4 -left-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Store className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">1,2 mil</div>
                    <div className="text-xs text-gray-500">Feirantes</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Store className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">R$ 45 mil</div>
                    <div className="text-xs text-gray-500">Arrecadado</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-800 mb-4">Tudo que você precisa em um só lugar</h2>
            <p className="text-xl text-gray-600">
              Sistema completo com todas as ferramentas essenciais para gerenciar sua feira livre
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className={`${feature.iconColor} text-2xl`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="vantagens" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-800 mb-4">Por que escolher nossa plataforma?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100"
              >
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="text-emerald-600 text-lg" />
                </div>
                <p className="text-gray-700 font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Entre em Contato</h2>
          <p className="text-xl text-gray-600 mb-8">Estamos aqui para ajudar você</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <a
              href="https://wa.me/5562991429264"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-gray-200 p-6 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-3"
            >
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="text-gray-900 font-semibold">WhatsApp</span>
            </a>
            <a
              href="mailto:feirafacilbrasil@gmail.com"
              className="bg-white border border-gray-200 p-6 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-3"
            >
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="text-gray-900 font-semibold">E-mail</span>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-light text-white mb-4">Pronto para começar?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Transforme a gestão da sua feira livre com nossa plataforma completa
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/auth")}
              className="bg-white text-emerald-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap"
            >
              Começar Gratuitamente
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="border-2 border-white/30 text-white px-8 py-4 rounded-2xl text-lg font-medium hover:bg-white/10 transition-all duration-300 whitespace-nowrap"
            >
              Agendar Demonstração
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6" color="white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">FeiraFácil!</h3>
                  <p className="text-xs text-gray-400">Gestão Completa</p>
                </div>
              </div>
              <p className="text-gray-400">A plataforma mais completa para gestão de feiras livres do Brasil.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#recursos" className="hover:text-white transition-colors">
                    Recursos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Preços
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Demonstração
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Central de Ajuda
                  </a>
                </li>
                <li>
                  <a href="#contato" className="hover:text-white transition-colors">
                    Contato
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/5562991429264"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href="mailto:feirafacilbrasil@gmail.com" className="hover:text-white transition-colors">
                    E-mail
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 FeiraFácil!. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
