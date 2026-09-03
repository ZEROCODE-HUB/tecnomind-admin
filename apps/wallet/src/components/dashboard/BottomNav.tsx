import { Home, ArrowLeftRight, QrCode, Receipt, Code } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  isCenter?: boolean;
}

const NavItem = ({ icon: Icon, label, isActive = false, isCenter = false }: NavItemProps) => {
  if (isCenter) {
    return (
      <button className="flex flex-col items-center justify-center -mt-6 shrink-0 w-16 relative z-10">
        <div className="size-14 rounded-full bg-accent flex items-center justify-center shadow-glow border-4 border-background transform transition-transform active:scale-95">
          <Icon className="size-7 text-accent-foreground" />
        </div>
        <span className="text-[10px] font-bold text-accent mt-1">{label}</span>
      </button>
    );
  }

  return (
    <button className="flex flex-col items-center gap-1 flex-1 group min-h-[44px]">
      <Icon
        className={`size-5 transition-colors ${
          isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
        }`}
      />
      <span
        className={`text-[10px] font-medium transition-colors ${
          isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
        }`}
      >
        {label}
      </span>
    </button>
  );
};

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-card/90 backdrop-blur-md border-t border-border pb-6 pt-2 px-2 z-40 md:hidden">
      <div className="flex justify-between items-end px-2">
        <NavItem icon={Home} label="Inicio" isActive />
        <NavItem icon={ArrowLeftRight} label="Transferir" />
        <NavItem icon={QrCode} label="QR" isCenter />
        <NavItem icon={Receipt} label="Movimientos" />
        <NavItem icon={Code} label="API" />
      </div>
    </nav>
  );
};

export default BottomNav;
