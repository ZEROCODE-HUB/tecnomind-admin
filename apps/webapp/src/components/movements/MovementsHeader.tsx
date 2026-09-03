import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../Logo";

interface MovementsHeaderProps {
  balance: string;
  showBalance: boolean;
  onToggleBalance: () => void;
}

const MovementsHeader = ({ balance, showBalance, onToggleBalance }: MovementsHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-background">
      {/* Navigation bar */}
      <div className="flex items-center px-4 py-2 justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-foreground flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-muted active:bg-border transition-colors md:hidden"
        >
          <ArrowLeft className="size-6" />
        </button>
        
        <div className="hidden md:flex items-center">
          <Logo className="h-8" />
        </div>
        
        <h2 className="text-foreground text-lg font-bold leading-tight tracking-tight text-center md:hidden">
          Movimientos
        </h2>
        
        <button
          onClick={onToggleBalance}
          className="text-foreground flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-muted active:bg-border transition-colors"
        >
          {showBalance ? <Eye className="size-6" /> : <EyeOff className="size-6" />}
        </button>
      </div>

      {/* Balance display */}
      <div className="flex flex-col items-center pt-4 pb-6">
        <p className="text-muted-foreground text-sm font-medium leading-normal mb-1">
          Balance Total
        </p>
        <h1 className="text-foreground tracking-tight text-4xl font-bold leading-none">
          {showBalance ? balance : "$ ••••••"}
        </h1>
      </div>
    </div>
  );
};

export default MovementsHeader;
