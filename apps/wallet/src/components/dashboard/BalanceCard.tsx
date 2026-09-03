import { useState, useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { mockBalance } from "@/data/mockBalance";
import { formatBalance } from "@/lib/formatters";

const BalanceCard = () => {
  const [showBalance, setShowBalance] = useState(true);

  const balance = formatBalance(mockBalance.available);

  // Ajusta el tamaño del texto según la cantidad de caracteres
  const balanceFontSize = useMemo(() => {
    const length = balance.length;
    if (length <= 12) return "text-4xl";
    if (length <= 16) return "text-3xl";
    if (length <= 20) return "text-2xl";
    return "text-xl";
  }, [balance]);

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl relative overflow-hidden bg-card border border-border shadow-card">
      {/* Decorative blurs */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

      <p className="text-muted-foreground text-sm font-medium mb-2">Saldo Disponible</p>
      
      <div className="flex items-center gap-3 mb-1">
        <h2 className={`${balanceFontSize} font-bold tracking-tight text-foreground whitespace-nowrap`}>
          {showBalance ? balance : "$ ••••••••"}
        </h2>
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="text-muted-foreground hover:text-accent transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
          aria-label={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
        >
          {showBalance ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
        </button>
      </div>

    </div>
  );
};

export default BalanceCard;