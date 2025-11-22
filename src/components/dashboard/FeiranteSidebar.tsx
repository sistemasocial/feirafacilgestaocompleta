import { 
  Home, 
  Calendar,
  DollarSign, 
  TrendingUp, 
  Tag,
  UserCog,
  HelpCircle,
  Store,
  KeyRound
} from "lucide-react";

const menuItems = [
  { title: "Início", url: "#home", icon: Home },
  { title: "Feiras Disponíveis", url: "#feiras", icon: Calendar },
  { title: "Minhas Inscrições", url: "#inscricoes", icon: Calendar },
  { title: "Pagamentos", url: "#pagamentos", icon: DollarSign },
  { title: "Vendas", url: "#vendas", icon: TrendingUp },
  { title: "Segmentos", url: "#segmentos", icon: Tag },
  { title: "Perfil do Feirante", url: "#perfil", icon: UserCog },
  { title: "Alterar Senha", url: "#senha", icon: KeyRound },
  { title: "Suporte", url: "#suporte", icon: HelpCircle },
];

interface FeiranteSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function FeiranteSidebar({ activeSection, onSectionChange }: FeiranteSidebarProps) {
  return (
    <aside className="w-full md:w-[280px] border-r bg-background h-full md:h-screen md:fixed md:left-0 md:top-0 flex flex-col">
      <div className="border-b pb-4 pt-4 md:pb-6 md:pt-6 px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Store className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold">FeiraFácil!</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Painel Feirante</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto py-4 md:py-6">
        <nav className="space-y-1 md:space-y-2 px-2 md:px-4">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => {
                onSectionChange(item.url.replace('#', ''));
              }}
              className={`w-full flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-sm md:text-base font-medium transition-colors ${
                activeSection === item.url.replace('#', '')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
