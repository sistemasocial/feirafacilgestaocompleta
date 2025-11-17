import { 
  LayoutDashboard, 
  PlusCircle,
  Calendar,
  Users, 
  DollarSign, 
  Settings, 
  UserCog,
  HelpCircle
} from "lucide-react";
import { NavLink } from "@/components/NavLink";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Visão Geral", url: "#overview", icon: LayoutDashboard },
  { title: "Criar Feiras", url: "#criar", icon: PlusCircle },
  { title: "Feiras Cadastradas", url: "#feiras", icon: Calendar },
  { title: "Feirantes", url: "#feirantes", icon: Users },
  { title: "Pagamentos", url: "#pagamentos", icon: DollarSign },
  { title: "Configurações", url: "#config", icon: Settings },
  { title: "Perfil do Administrador", url: "#perfil", icon: UserCog },
  { title: "Suporte", url: "#suporte", icon: HelpCircle },
];

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Administrativo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={activeSection === item.url.replace('#', '')}
                  >
                    <a 
                      href={item.url}
                      onClick={(e) => {
                        e.preventDefault();
                        onSectionChange(item.url.replace('#', ''));
                      }}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
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
