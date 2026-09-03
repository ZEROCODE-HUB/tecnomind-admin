import { useState, useMemo, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatBalance } from "@/lib/formatters";
import { useAuth } from "@/presentation/contexts/AuthContext";

const BalanceCard = () => {
  const [showBalance, setShowBalance] = useState(false);
  const { account } = useAuth();

  const balance = formatBalance(account?.balance || 0);

  // Ajusta el tamaño del texto según la cantidad de caracteres
  const balanceFontSize = useMemo(() => {
    const length = balance.length;
    if (length <= 12) return "text-4xl";
    if (length <= 16) return "text-3xl";
    if (length <= 20) return "text-2xl";
    return "text-xl";
  }, [balance]);

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-[2rem] relative overflow-hidden bg-card border border-border shadow-2xl transition-all duration-500 hover:scale-[1.01] group min-h-[180px]">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-accent/20 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-primary/20 transition-all duration-700" />

      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <p className="text-muted-foreground text-sm font-semibold uppercase tracking-widest mb-3 opacity-80">
          Tu Saldo Disponible
        </p>

        <div className="flex items-center gap-4">
          <h2 className={`${balanceFontSize} font-bold tracking-tight text-foreground transition-all duration-300 drop-shadow-sm`}>
            {showBalance ? balance : "$ ••••••••"}
          </h2>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="flex items-center justify-center size-12 rounded-full bg-muted/50 hover:bg-accent hover:text-accent-foreground transition-all duration-300 shadow-sm active:scale-90"
            aria-label={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
          >
            {showBalance ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
