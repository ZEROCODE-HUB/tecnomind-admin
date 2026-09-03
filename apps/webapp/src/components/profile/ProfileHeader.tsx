import { ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LogoIcon from "@/components/LogoIcon";

const ProfileHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 flex items-center bg-card/90 backdrop-blur-md p-4 pb-2 justify-between border-b border-border">
      {/* Mobile: Back/Close button */}
      <button
        onClick={() => navigate(-1)}
        className="flex size-12 shrink-0 items-center justify-start text-foreground hover:text-primary transition-colors md:hidden"
      >
        <X className="size-7" />
      </button>

      {/* Desktop: Logo */}
      <div className="hidden md:flex items-center gap-2">
        <LogoIcon className="size-8" />
      </div>

      {/* Title */}
      <h2 className="text-foreground text-lg font-bold leading-tight tracking-tight flex-1 text-center md:text-left md:ml-4">
        Mi Perfil
      </h2>

      {/* Spacer for mobile symmetry */}
      <div className="flex w-12 items-center justify-end md:hidden" />
    </header>
  );
};

export default ProfileHeader;
