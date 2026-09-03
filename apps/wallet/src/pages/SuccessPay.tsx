import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Share2, Home, Building2, Download, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { formatBalance } from "@/lib/formatters";
import { useState } from "react";

interface PaymentState {
  amount: string;
  recipient: {
    name: string;
    cuit: string;
    type: string;
  };
  transactionId: string;
  date: Date;
}

const SuccessPay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  // Get payment data from navigation state or use defaults
  const state = location.state as PaymentState | null;
  const paymentData = {
    amount: state?.amount || "4500.00",
    recipient: state?.recipient || { name: "Café Buenos Aires", cuit: "30-71234567-9", type: "CUIT" },
    transactionId: state?.transactionId || "MAG-88293-X",
    date: state?.date ? new Date(state.date) : new Date()
  };

  const formatCurrencyLocal = (value: string) => {
    const num = parseFloat(value);
    return formatBalance(num);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  };

  const handleShare = async () => {
    const shareData = {
      title: "Comprobante de Pago - Magnate",
      text: `Pago realizado a ${paymentData.recipient.name} por ${formatCurrencyLocal(paymentData.amount)}. ID: ${paymentData.transactionId}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      setShowShareMenu(true);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `✅ Pago realizado con Magnate\n\nDestinatario: ${paymentData.recipient.name}\nMonto: ${formatCurrencyLocal(paymentData.amount)}\nFecha: ${formatDate(paymentData.date)} ${formatTime(paymentData.date)}\nID: ${paymentData.transactionId}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShowShareMenu(false);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent("Comprobante de Pago - Magnate");
    const body = encodeURIComponent(
      `Comprobante de Pago\n\nDestinatario: ${paymentData.recipient.name}\nCUIT: ${paymentData.recipient.cuit}\nMonto: ${formatCurrencyLocal(paymentData.amount)}\nFecha: ${formatDate(paymentData.date)} ${formatTime(paymentData.date)}\nID de Transacción: ${paymentData.transactionId}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setShowShareMenu(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A2540] flex flex-col">
      {/* Success Header */}
      <div className="bg-[#0A2540] dark:bg-[#0A2540]/80 pt-6 pb-6 px-6 text-center">
        <Logo className="h-6 mb-4 mx-auto" />
        
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="w-8 h-8 bg-[#27AE60] rounded-full flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">
            ¡Pago Realizado con Éxito!
          </h1>
        </div>
        <p className="text-white/70 text-sm">Tu transacción fue procesada correctamente</p>
      </div>

      {/* Receipt Card */}
      <div className="flex-1 px-6 pt-4">
        <div className="bg-white dark:bg-white/10 rounded-2xl shadow-lg overflow-hidden max-w-md mx-auto">
          {/* Amount Section */}
          <div className="p-6 text-center border-b border-gray-100 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-white/60 mb-1">Monto pagado</p>
            <p className="text-4xl font-bold text-[#0A2540] dark:text-white">
              {formatCurrencyLocal(paymentData.amount)}
            </p>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-4">
            {/* Recipient */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2F80ED]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-[#2F80ED]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 dark:text-white/60">Destinatario</p>
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {paymentData.recipient.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-white/60 font-mono">
                  {paymentData.recipient.type}: {paymentData.recipient.cuit}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 dark:border-white/10" />

            {/* Date & Time */}
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-white/60">Fecha</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(paymentData.date)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-white/60">Hora</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatTime(paymentData.date)}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 dark:border-white/10" />

            {/* Transaction ID */}
            <div>
              <p className="text-sm text-gray-500 dark:text-white/60">ID de Transacción</p>
              <p className="font-mono font-semibold text-[#2F80ED]">
                {paymentData.transactionId}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-md mx-auto mt-6 space-y-3 pb-8">
          <Button
            onClick={handleShare}
            variant="outline"
            className="w-full h-14 border-2 border-[#2F80ED] text-[#2F80ED] hover:bg-[#2F80ED]/10 text-lg font-semibold rounded-2xl flex items-center justify-center gap-3"
          >
            <Share2 className="h-5 w-5" />
            Compartir Comprobante
          </Button>

          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full h-14 bg-[#0A2540] hover:bg-[#0A2540]/90 text-white text-lg font-semibold rounded-2xl flex items-center justify-center gap-3"
          >
            <Home className="h-5 w-5" />
            Ir al Inicio
          </Button>
        </div>
      </div>

      {/* Share Menu Modal */}
      {showShareMenu && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={() => setShowShareMenu(false)}
        >
          <div 
            className="bg-white dark:bg-[#1a3a5c] w-full max-w-md rounded-t-3xl p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 dark:bg-white/30 rounded-full mx-auto mb-6" />
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Compartir comprobante
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={handleWhatsAppShare}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <div className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center">
                  <MessageCircle className="h-7 w-7 text-white" />
                </div>
                <span className="text-sm text-gray-700 dark:text-white/80">WhatsApp</span>
              </button>

              <button
                onClick={handleEmailShare}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <div className="w-14 h-14 bg-[#EA4335] rounded-full flex items-center justify-center">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <span className="text-sm text-gray-700 dark:text-white/80">Email</span>
              </button>

              <button
                onClick={() => setShowShareMenu(false)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <div className="w-14 h-14 bg-[#2F80ED] rounded-full flex items-center justify-center">
                  <Download className="h-7 w-7 text-white" />
                </div>
                <span className="text-sm text-gray-700 dark:text-white/80">Descargar</span>
              </button>
            </div>

            <Button
              onClick={() => setShowShareMenu(false)}
              variant="ghost"
              className="w-full h-12 text-gray-500 dark:text-white/60"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessPay;
