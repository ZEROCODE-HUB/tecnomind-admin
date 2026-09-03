import { useState } from 'react';
import { ScanFace, Focus, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ScanStatus = 'idle' | 'scanning' | 'success';

const BiometricCard = () => {
  const [status, setStatus] = useState<ScanStatus>('idle');

  const handleScan = () => {
    if (status !== 'idle') return;
    
    setStatus('scanning');
    
    // Simular proceso de escaneo biométrico
    setTimeout(() => {
      setStatus('success');
    }, 2500);
  };

  const getButtonContent = () => {
    switch (status) {
      case 'scanning':
        return (
          <>
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
            Escaneando...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="h-[18px] w-[18px]" />
            Verificado
          </>
        );
      default:
        return (
          <>
            <Focus className="h-[18px] w-[18px]" />
            Escanear Rostro
          </>
        );
    }
  };

  return (
    <div className={cn(
      "bg-muted/50 border border-border rounded-xl p-5 shadow-sm",
      "flex flex-col items-center text-center gap-3 relative overflow-hidden",
      "group cursor-pointer transition-colors",
      status === 'success' ? "border-success/50" : "hover:border-accent/50"
    )}>
      {/* Accent bar */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full transition-colors",
        status === 'success' ? "bg-success" : "bg-accent"
      )} />
      
      {/* Icon */}
      <div className={cn(
        "p-3 rounded-full mb-1 transition-colors",
        status === 'success' ? "bg-success/10" : "bg-accent/10"
      )}>
        <ScanFace className={cn(
          "h-8 w-8 transition-colors",
          status === 'success' ? "text-success" : "text-accent",
          status === 'scanning' && "animate-pulse"
        )} />
      </div>
      
      {/* Text */}
      <div className="flex flex-col gap-1">
        <h4 className="text-foreground font-semibold text-base">
          {status === 'success' ? 'Identidad Verificada' : 'Identidad Biométrica'}
        </h4>
        <p className="text-muted-foreground text-xs max-w-[240px] mx-auto">
          {status === 'success' 
            ? 'Tu identidad ha sido validada correctamente.'
            : 'Para cumplir con regulaciones fintech, necesitamos validar que eres tú.'
          }
        </p>
      </div>
      
      {/* Button */}
      <button
        type="button"
        onClick={handleScan}
        disabled={status !== 'idle'}
        className={cn(
          "mt-2 w-full py-2.5 px-4 rounded-xl font-medium text-sm",
          "flex items-center justify-center gap-2 transition-all",
          "min-h-[44px]", // Área táctil mínima
          status === 'success'
            ? "bg-success/10 border border-success text-success cursor-default"
            : status === 'scanning'
            ? "bg-accent/5 border border-accent text-accent cursor-wait"
            : "bg-card border border-accent text-accent hover:bg-accent/5 active:scale-[0.98]"
        )}
      >
        {getButtonContent()}
      </button>
    </div>
  );
};

export default BiometricCard;
