import { ArrowLeft, PanelLeft, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import UserAvatar from "./UserAvatar";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface GlobalHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backPath?: string;
  showLogo?: boolean;
  showAvatar?: boolean;
  userName?: string;
  greeting?: string;
  children?: React.ReactNode;
}

const GlobalHeader = ({
  title,
  showBackButton = false,
  backPath,
  showLogo = true,
  showAvatar = true,
  userName = "Juan Pérez",
  greeting,
  children
}: GlobalHeaderProps) => {
  const navigate = useNavigate();
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between px-4 py-3 min-h-[60px]">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {/* Back Button (visible on all screens when enabled) */}
          {showBackButton && (
            <button
              onClick={() => backPath ? navigate(backPath) : navigate(-1)}
              className="flex items-center justify-center size-10 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="size-5 text-foreground" />
            </button>
          )}
          
          {/* Mobile Logo (only when no back button) */}
          {!showBackButton && showLogo && (
            <div className="md:hidden">
              <Logo className="h-7" />
            </div>
          )}

          {/* Desktop: Toggle sidebar button */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "hidden md:flex items-center justify-center size-10 rounded-full hover:bg-muted transition-colors",
              !collapsed && "opacity-0 pointer-events-none"
            )}
          >
            <PanelLeft className="size-5 text-muted-foreground" />
          </button>

          {/* Title or Greeting */}
          {title && (
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
          )}
          {greeting && (
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-foreground">{greeting}</h1>
            </div>
          )}
        </div>

        {/* Center: Optional children */}
        {children && (
          <div className="flex-1 flex justify-center px-4">
            {children}
          </div>
        )}

        {/* Right Side: Avatar and Menu Button */}
        <div className="flex items-center gap-2">
          {showAvatar && (
            <UserAvatar name={userName} size="md" />
          )}
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => navigate("/menu")}
            className="md:hidden flex items-center justify-center size-10 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          >
            <Menu className="size-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
