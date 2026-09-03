import { Home, ArrowLeftRight, Receipt, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  isActive: boolean;
  isCenter?: boolean;
  onClick: () => void;
}

const NavItem = ({ icon: Icon, label, isActive, isCenter, onClick }: NavItemProps) => {
  if (isCenter) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center justify-center -mt-6 shrink-0 w-16 relative z-10"
      >
        <div className={cn(
          "size-14 rounded-full flex items-center justify-center shadow-glow border-4 border-background transform transition-transform active:scale-95",
          isActive ? "bg-primary" : "bg-accent"
        )}>
          <Icon className="size-7 text-accent-foreground" />
        </div>
        <span className={cn(
          "text-[10px] font-bold mt-1",
          isActive ? "text-primary" : "text-accent"
        )}>{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 flex-1 group min-h-[44px]"
    >
      <Icon
        className={cn(
          "size-5 transition-colors",
          isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span
        className={cn(
          "text-[10px] font-medium transition-colors",
          isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {label}
      </span>
    </button>
  );
};

const navItems = [
  { icon: Home, label: "Inicio", path: "/dashboard" },
  { icon: ArrowLeftRight, label: "Transferir", path: "/transfer" },
  { icon: Receipt, label: "Movimientos", path: "/movements" },
  { icon: User, label: "Perfil", path: "/profile" },
];

const AppBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Ocultar la barra de navegación en la página /menu
  if (location.pathname === "/menu") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-card/90 backdrop-blur-md border-t border-border pb-6 pt-2 px-2 z-40 md:hidden">
      <div className="flex justify-between items-end px-2">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={location.pathname === item.path}
            isCenter={item.isCenter}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </nav>
  );
};

export default AppBottomNav;
