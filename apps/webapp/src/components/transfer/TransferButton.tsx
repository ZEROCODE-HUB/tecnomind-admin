import { useState } from "react";
import { ArrowRight, Lock, Loader2 } from "lucide-react";

interface TransferButtonProps {
  disabled?: boolean;
  onClick: () => void | Promise<void>;
  loading?: boolean;
  children?: React.ReactNode;
}

const TransferButton = ({
  disabled = false,
  onClick,
  loading: externalLoading,
  children
}: TransferButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const loading = externalLoading ?? isLoading;

  const handleClick = async () => {
    if (disabled || loading) return;

    const result = onClick();
    if (result instanceof Promise) {
      setIsLoading(true);
      try {
        await result;
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <footer className="mt-auto px-4 pb-8 pt-4 bg-background/95 backdrop-blur-sm sticky bottom-16 md:bottom-0 z-10 w-full max-w-md mx-auto border-t border-transparent">
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={`w-full font-bold text-lg h-14 rounded-full shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group ring-2 ring-transparent focus:ring-accent/50 outline-none ${disabled || loading
            ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
            : "bg-accent hover:bg-accent/90 text-accent-foreground shadow-accent/25"
          }`}
      >
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            <span>Procesando...</span>
          </>
        ) : (
          <>
            <span>{children || "Transferir"}</span>
            <ArrowRight className={`size-5 transition-transform ${!disabled && "group-hover:translate-x-1"}`} />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-4 opacity-80">
        <Lock className="size-3.5 text-muted-foreground/70" />
        <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
          Transferencia Segura
        </span>
      </div>
    </footer>
  );
};

export default TransferButton;

