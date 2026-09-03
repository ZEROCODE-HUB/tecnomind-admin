import {
  Home,
  ArrowLeftRight,
  Receipt,
  BarChart3,
  Code,
  User,
  Settings,
  LogOut,
  Smartphone,
  Share2,
  ChevronRight,
  Monitor,
  LucideIcon
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import { cn } from "@/lib/utils";
import { useAuth } from "@/presentation/contexts/AuthContext";

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
  variant?: "default" | "destructive";
}

const MenuItem = ({ icon: Icon, label, description, isActive, onClick, variant = "default" }: MenuItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 w-full p-4 rounded-xl transition-all duration-200",
        isActive
          ? "bg-accent text-accent-foreground"
          : variant === "destructive"
            ? "text-destructive hover:bg-destructive/10"
            : "text-foreground hover:bg-muted"
      )}
    >
      <div className={cn(
        "size-12 rounded-xl flex items-center justify-center shrink-0",
        isActive ? "bg-primary/20" : variant === "destructive" ? "bg-destructive/10" : "bg-muted"
      )}>
        <Icon className={cn(
          "size-6",
          isActive ? "text-primary" : variant === "destructive" ? "text-destructive" : "text-muted-foreground"
        )} />
      </div>
      <div className="flex-1 text-left">
        <span className="font-medium block">{label}</span>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </div>
      <ChevronRight className="size-5 text-muted-foreground" />
    </button>
  );
};

const mainMenuItems = [
  { icon: Home, label: "Inicio", description: "Panel principal", path: "/dashboard" },
  { icon: ArrowLeftRight, label: "Transferir", description: "Enviar dinero", path: "/transfer" },
  { icon: Receipt, label: "Movimientos", description: "Historial de transacciones", path: "/movements" },
  { icon: BarChart3, label: "Estadísticas", description: "Análisis de gastos", path: "/statistics" },
  { icon: User, label: "Perfil", description: "Tu información", path: "/profile" },
  { icon: Code, label: "API", description: "Configuración de API", path: "/api-config" },
  { icon: Monitor, label: "Acceso Web", description: "Acceso desde navegador", path: "/web-access" },
];

const mobileOnlyItems = [
  { icon: Share2, label: "Compartir CVU", description: "Compartir tu información", path: "/share-cvu" },
  { icon: Smartphone, label: "Dispositivos", description: "Dispositivos vinculados", path: "/linked-devices" },
];

const settingsItems = [
  { icon: Settings, label: "Configuración", description: "Ajustes de la cuenta", path: "/settings" },
];

const Menu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AppLayout>
      <GlobalHeader
        title="Menú"
        showBackButton
        backPath="/dashboard"
        showAvatar
        userName={user ? `${user.first_name} ${user.last_name}` : "Usuario"}
      />

      <div className="p-4 space-y-6 pb-24 md:pb-8">
        {/* Sección Principal */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Principal
          </h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {mainMenuItems.map((item) => (
              <MenuItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                description={item.description}
                path={item.path}
                isActive={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
        </div>

        {/* Sección Acciones Rápidas */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Acciones Rápidas
          </h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {mobileOnlyItems.map((item) => (
              <MenuItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                description={item.description}
                path={item.path}
                isActive={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
        </div>

        {/* Sección Configuración */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Ajustes
          </h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            {settingsItems.map((item) => (
              <MenuItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                description={item.description}
                path={item.path}
                isActive={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              />
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full p-4 text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <div className="size-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <LogOut className="size-6 text-destructive" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-medium block">Cerrar Sesión</span>
                <span className="text-sm text-muted-foreground">Salir de tu cuenta</span>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Menu;
