import { 
  LayoutDashboard, 
  PlusCircle,
  Calendar,
  Users, 
  DollarSign, 
  Settings, 
  UserCog,
  HelpCircle,
  Store,
  KeyRound,
  Bell
} from "lucide-react";

const menuItems = [
  { title: "Visão Geral", url: "overview", icon: LayoutDashboard },
  { title: "Criar Feiras", url: "criar", icon: PlusCircle },
  { title: "Feiras Cadastradas", url: "feiras", icon: Calendar },
  { title: "Feirantes", url: "feirantes", icon: Users },
  { title: "Pagamentos", url: "pagamentos", icon: DollarSign },
  { title: "Enviar Notificações", url: "notificacoes", icon: Bell },
  { title: "Configurações", url: "config", icon: Settings },
  { title: "Perfil do Administrador", url: "perfil", icon: UserCog },
  { title: "Alterar Senha", url: "senha", icon: KeyRound },
  { title: "Suporte", url: "suporte", icon: HelpCircle },
];

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  return (
    <aside className="w-[260px] border-r bg-background h-screen fixed left-0 top-0 flex flex-col">
      <div className="border-b pb-6 pt-6 px-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Store className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">FeiraFácil!</h2>
            <p className="text-sm text-muted-foreground">Painel Administrativo</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto py-6">
        <nav className="space-y-2 px-4">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => onSectionChange(item.url)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                activeSection === item.url
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
