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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

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
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <div className="border-b pb-4 pt-4 px-3">
          <div className="flex items-center gap-2">
            <div className={`${open ? 'w-10 h-10' : 'w-8 h-8'} bg-primary/10 rounded-lg flex items-center justify-center shrink-0`}>
              <Store className={`${open ? 'w-6 h-6' : 'w-5 h-5'} text-primary`} />
            </div>
            {open && (
              <div className="min-w-0">
                <h2 className="text-sm font-semibold truncate">FeiraFácil!</h2>
                <p className="text-xs text-muted-foreground truncate">Painel Admin</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="py-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.url)}
                    isActive={activeSection === item.url}
                    tooltip={item.title}
                    className="h-10"
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {open && <span className="truncate">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
