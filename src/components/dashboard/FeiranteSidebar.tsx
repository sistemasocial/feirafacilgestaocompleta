import { 
  Home, 
  Calendar,
  DollarSign, 
  TrendingUp, 
  Tag,
  UserCog,
  HelpCircle,
  Store
} from "lucide-react";

const menuItems = [
  { title: "Início", url: "#home", icon: Home },
  { title: "Feiras Disponíveis", url: "#feiras", icon: Calendar },
  { title: "Minhas Inscrições", url: "#inscricoes", icon: Calendar },
  { title: "Pagamentos", url: "#pagamentos", icon: DollarSign },
  { title: "Vendas", url: "#vendas", icon: TrendingUp },
  { title: "Segmentos", url: "#segmentos", icon: Tag },
  { title: "Perfil do Feirante", url: "#perfil", icon: UserCog },
  { title: "Suporte", url: "#suporte", icon: HelpCircle },
];

interface FeiranteSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function FeiranteSidebar({ activeSection, onSectionChange }: FeiranteSidebarProps) {
  return (
    <aside className="w-[280px] border-r bg-background h-screen fixed left-0 top-0 flex flex-col">
      <div className="border-b pb-6 pt-6 px-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Store className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">FeiraFácil!</h2>
            <p className="text-sm text-muted-foreground">Painel Feirante</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto py-6">
        <nav className="space-y-2 px-4">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => {
                onSectionChange(item.url.replace('#', ''));
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                activeSection === item.url.replace('#', '')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.title}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
