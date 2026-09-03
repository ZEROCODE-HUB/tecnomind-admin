import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatCurrencyARS } from "@/lib/formatters";

interface OperationalLimitsProps {
  monthlyLimit?: number;
  amountOperated?: number;
}

const OperationalLimits = ({ 
  monthlyLimit = 800000, 
  amountOperated = 245000 
}: OperationalLimitsProps) => {
  const remainingBalance = monthlyLimit - amountOperated;
  const progressPercentage = (amountOperated / monthlyLimit) * 100;

  const getProgressColor = () => {
    if (progressPercentage >= 90) return "bg-destructive";
    if (progressPercentage >= 70) return "bg-amber-500";
    return "bg-primary";
  };

  return (
    <section className="bg-card border border-border rounded-2xl p-4 mx-4 mt-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-primary/10">
          <TrendingUp className="size-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Perfil Operacional
        </h3>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Operado este mes</span>
          <span>{progressPercentage.toFixed(0)}%</span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-3 rounded-full"
          indicatorClassName={getProgressColor()}
        />
      </div>

      {/* Limits Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="h-full flex flex-col items-center justify-between bg-muted/50 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground min-h-[2rem] flex items-center">Límite Mensual</p>
          <p className="text-sm font-bold text-foreground">
            {formatCurrencyARS(monthlyLimit)}
          </p>
        </div>
        
        <div className="h-full flex flex-col items-center justify-between bg-muted/50 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground min-h-[2rem] flex items-center">Monto Operado</p>
          <p className="text-sm font-bold text-primary">
            {formatCurrencyARS(amountOperated)}
          </p>
        </div>
        
        <div className="h-full flex flex-col items-center justify-between bg-muted/50 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground min-h-[2rem] flex items-center">Disponible</p>
          <p className={`text-sm font-bold ${remainingBalance > 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
            {formatCurrencyARS(remainingBalance)}
          </p>
        </div>
      </div>
    </section>
  );
};

export default OperationalLimits;
