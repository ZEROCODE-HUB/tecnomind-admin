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
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A2540] flex flex-col">
      {/* Error Header */}
      <div className="bg-[#0A2540] dark:bg-[#0A2540]/80 pt-6 pb-6 px-6 text-center">
        <Logo className="h-6 mb-4 mx-auto" />
        
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="w-8 h-8 bg-[#E74C3C] rounded-full flex items-center justify-center">
            <XCircle className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">
            Transferencia no realizada
          </h1>
        </div>
        <p className="text-white/70 text-sm">No pudimos procesar tu solicitud</p>
      </div>

      {/* Error Content */}
      <div className="flex-1 px-6 pt-8 flex flex-col items-center">
        <div className="bg-white dark:bg-white/10 rounded-2xl shadow-lg overflow-hidden max-w-md w-full">
          {/* Message Section */}
          <div className="p-6 text-center border-b border-gray-100 dark:border-white/10">
            <p className="text-gray-600 dark:text-white/80 leading-relaxed">
              Ocurrió un inconveniente, no se proceso su solicitud. Por favor, inténtalo nuevamente en unos minutos.
            </p>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-white/60">Destinatario</span>
              <span className="font-medium text-gray-900 dark:text-white">{errorData.recipient}</span>
            </div>
            
            <div className="border-t border-dashed border-gray-200 dark:border-white/10" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-white/60">Código de error</span>
              <span className="font-mono text-sm text-[#E74C3C]">{errorData.errorCode}</span>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-[#F39C12]/10 rounded-xl p-4 mt-6 max-w-md w-full">
          <p className="text-sm text-[#F39C12] text-center">
            Si el problema persiste, comunícate con nuestro equipo de soporte.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="max-w-md w-full mt-6 space-y-3 pb-8">
          <Button
            onClick={() => navigate("/movements")}
            variant="outline"
            className="w-full h-14 border-2 border-[#2F80ED] text-[#2F80ED] hover:bg-[#2F80ED]/10 text-lg font-semibold rounded-2xl flex items-center justify-center gap-3"
          >
            <FileText className="h-5 w-5" />
            Ir a Movimientos
          </Button>

          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full h-14 bg-[#0A2540] hover:bg-[#0A2540]/90 text-white text-lg font-semibold rounded-2xl flex items-center justify-center gap-3"
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