import { Home, ArrowLeftRight, Receipt, BarChart3, Code, User, Settings, LogOut, PanelLeftClose } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import Logo from "@/components/Logo";
import LogoIcon from "@/components/LogoIcon";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon: Icon, label, isActive, collapsed, onClick }: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 min-h-[44px]",
        collapsed ? "justify-center px-2" : "",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  );
};

const menuItems = [
  { icon: Home, label: "Inicio", path: "/dashboard" },
  { icon: ArrowLeftRight, label: "Transferir", path: "/transfer" },
  { icon: Receipt, label: "Movimientos", path: "/movements" },
  { icon: BarChart3, label: "Estadísticas", path: "/statistics" },
  { icon: User, label: "Perfil", path: "/profile" },
];

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggleSidebar } = useSidebar();
  const { logout } = useAuth();

  const handleSidebarClick = (e: React.MouseEvent<HTMLElement>) => {
    // Solo colapsar/expandir si el clic es directamente en el aside (área de fondo)
    if (e.target === e.currentTarget) {
      toggleSidebar();
    }
  };

  return (
    <aside
      onClick={handleSidebarClick}
      className={cn(
        "hidden md:flex fixed left-0 top-0 h-screen bg-card border-r border-border flex-col z-50 transition-all duration-300 cursor-pointer",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo + Toggle */}
      <div
        onClick={handleSidebarClick}
        className={cn(
          "p-4 border-b border-border flex items-center transition-all duration-300",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {collapsed ? (
          <LogoIcon className="h-8 w-8 pointer-events-none" />
        ) : (
          <Logo className="h-8 pointer-events-none" />
        )}
        {!collapsed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSidebar();
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Colapsar menú"
          >
            <PanelLeftClose className="size-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav onClick={handleSidebarClick} className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={location.pathname === item.path}
            collapsed={collapsed}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div onClick={handleSidebarClick} className="p-2 border-t border-border space-y-1">
        <SidebarItem
          icon={Settings}
          label="Configuración"
          path="/settings"
          isActive={location.pathname === "/settings"}
          collapsed={collapsed}
          onClick={() => navigate("/settings")}
        />
        <button
          onClick={async () => {

            await logout();
            navigate("/login", { replace: true });
          }}
          title={collapsed ? "Cerrar Sesión" : undefined}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors min-h-[44px] dark:hover:bg-destructive/15",
            collapsed ? "justify-center px-2" : ""
          )}
        >
          <LogOut className="size-5 shrink-0" />
          {!collapsed && <span className="font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
