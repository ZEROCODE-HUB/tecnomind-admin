import { useLocation, useNavigate } from "react-router-dom";
import { XCircle, Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

interface ErrorState {
  amount: string;
  recipient: string;
  errorCode?: string;
}

const ErrorPay = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as ErrorState | null;
  const errorData = {
    amount: state?.amount || "0.00",
    recipient: state?.recipient || "Desconocido",
    errorCode: state?.errorCode || "ERR-001"
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Error Header */}
      <div className="bg-primary pt-6 pb-6 px-6 text-center shadow-lg">
        <Logo className="h-6 mb-4 mx-auto" />

        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center shadow-lg shadow-destructive/20">
            <XCircle className="h-5 w-5 text-destructive-foreground" />
          </div>
          <h1 className="text-lg font-bold text-primary-foreground">
            Transferencia no realizada
          </h1>
        </div>
        <p className="text-primary-foreground/70 text-sm">No pudimos procesar tu solicitud</p>
      </div>

      {/* Error Content */}
      <div className="flex-1 px-6 pt-8 flex flex-col items-center">
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden max-w-md w-full border border-border">
          {/* Message Section */}
          <div className="p-6 text-center border-b border-border">
            <p className="text-foreground/80 leading-relaxed font-medium">
              Ocurrió un inconveniente, no se proceso su solicitud. Por favor, inténtalo nuevamente en unos minutos.
            </p>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Destinatario</span>
              <span className="font-medium text-foreground">{errorData.recipient}</span>
            </div>

            <div className="border-t border-dashed border-border" />

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Código de error</span>
              <span className="font-mono text-sm text-destructive font-semibold">{errorData.errorCode}</span>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-muted rounded-xl p-4 mt-6 max-w-md w-full border border-border">
          <p className="text-sm text-muted-foreground text-center font-medium">
            Si el problema persiste, comunícate con nuestro equipo de soporte.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="max-w-md w-full mt-6 space-y-3 pb-8">
          <Button
            onClick={() => navigate("/movements")}
            variant="outline"
            className="w-full h-14 border-2 border-accent text-accent hover:bg-accent/10 text-lg font-semibold rounded-2xl flex items-center justify-center gap-3"
          >
            <FileText className="h-5 w-5" />
            Ir a Movimientos
          </Button>

          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold rounded-2xl flex items-center justify-center gap-3"
          >
            <Home className="h-5 w-5" />
            Volver al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPay;
