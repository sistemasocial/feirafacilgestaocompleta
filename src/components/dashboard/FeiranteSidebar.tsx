import { 
  Home, 
  Calendar,
  DollarSign, 
  TrendingUp, 
  Tag,
  UserCog,
  HelpCircle
} from "lucide-react";

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
  { title: "Início", url: "#home", icon: Home },
  { title: "Feiras", url: "#feiras", icon: Calendar },
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
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu do Feirante</SidebarGroupLabel>
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
