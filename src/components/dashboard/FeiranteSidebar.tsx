import { 
  Home, 
  Calendar,
  DollarSign, 
  TrendingUp, 
  Tag,
  UserCog,
  HelpCircle,
  Store,
  KeyRound,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <>
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

      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-2 px-4">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => {
                onSectionChange(item.url.replace('#', ''));
                setOpen(false);
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
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon" className="bg-background">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[280px] border-r bg-background h-screen fixed left-0 top-0 flex-col">
        <SidebarContent />
      </aside>
    </>
  );
}
