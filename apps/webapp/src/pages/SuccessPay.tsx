import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Share2, Home, Building2, Download, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { formatBalance } from "@/lib/formatters";
import { useState, useRef } from "react";
import html2canvas from 'html2canvas';
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
  const receiptRef = useRef<HTMLDivElement>(null);

  // Get payment data from navigation state or use defaults
  const state = location.state as PaymentState | null;
  const recipient = state?.recipient 
    ? (typeof state.recipient === 'string' 
      ? { name: state.recipient, cuit: state.recipient, type: "Destino" } 
      : state.recipient)
    : { name: "Café Buenos Aires", cuit: "30-71234567-9", type: "CUIT" };

  const paymentData = {
    amount: state?.amount || "4500.00",
    recipient,
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
    if (!receiptRef.current) {
      setShowShareMenu(true);
      return;
    }

    try {
      // Small delay to ensure all CSS paints are completed before capture
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Better resolution
        logging: false,
        useCORS: true,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setShowShareMenu(true);
          return;
        }
        const file = new File([blob], `comprobante-${paymentData.transactionId}.png`, { type: 'image/png' });

        const shareData = {
          files: [file],
          title: "Comprobante de Pago - Magnate",
          text: `Pago realizado a ${paymentData.recipient.name} por ${formatCurrencyLocal(paymentData.amount)}. ID: ${paymentData.transactionId}`,
        };

        if (navigator.share && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          setShowShareMenu(true);
        }
      }, 'image/png');
    } catch (err) {
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Success Header */}
      <div className="bg-[#0A2540] pt-8 pb-8 px-6 text-center shadow-lg relative overflow-hidden">
        {/* Subtle decorative elements for the header */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-success/10 rounded-full blur-3xl -ml-16 -mb-16" />

        <div className="relative z-10">
          <Logo className="h-6 mb-6 mx-auto" />

          <div className="flex flex-col items-center gap-3 mb-1">
            <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center shadow-lg shadow-success/40 animate-scale-in">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              ¡Pago Realizado con Éxito!
            </h1>
          </div>
          <p className="text-white/70 text-sm font-medium">Tu transacción fue procesada correctamente</p>
        </div>
      </div>

      {/* Receipt Card */}
      <div className="flex-1 px-6 pt-4">
        <div ref={receiptRef} className="bg-card rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto border border-border">
          {/* Amount Section */}
          <div className="p-6 text-center border-b border-border">
            <p className="text-sm text-muted-foreground mb-1 font-medium uppercase tracking-wider">Monto pagado</p>
            <p className="text-4xl font-bold text-foreground">
              {formatCurrencyLocal(paymentData.amount)}
            </p>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-4">
            {/* Recipient */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Destinatario</p>
                <p className="font-semibold text-foreground truncate">
                  {paymentData.recipient.name}
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  {paymentData.recipient.type}: {paymentData.recipient.cuit}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-border" />

            {/* Date & Time */}
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-medium text-foreground">
                  {formatDate(paymentData.date)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Hora</p>
                <p className="font-medium text-foreground">
                  {formatTime(paymentData.date)}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-border" />

            {/* Transaction ID */}
            <div>
              <p className="text-sm text-muted-foreground">ID de Transacción</p>
              <p className="font-mono font-semibold text-accent">
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
            className="w-full h-14 border-2 border-accent text-accent hover:bg-accent/10 text-lg font-semibold rounded-2xl flex items-center justify-center gap-3"
          >
            <Share2 className="h-5 w-5" />
            Compartir Comprobante
          </Button>

          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold rounded-2xl flex items-center justify-center gap-3"
          >
            <Home className="h-5 w-5" />
            Ir al Inicio
          </Button>
        </div>
      </div>

      {/* Share Menu Modal */}
      {showShareMenu && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-end justify-center z-50 p-4"
          onClick={() => setShowShareMenu(false)}
        >
          <div
            className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
              Compartir comprobante
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={handleWhatsAppShare}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-muted transition-all active:scale-95 translate-y-0 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                  <MessageCircle className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-semibold text-foreground/80">WhatsApp</span>
              </button>

              <button
                onClick={handleEmailShare}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-muted transition-all active:scale-95 translate-y-0 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-destructive rounded-full flex items-center justify-center shadow-lg shadow-destructive/20">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-semibold text-foreground/80">Email</span>
              </button>

              <button
                onClick={() => setShowShareMenu(false)}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-muted transition-all active:scale-95 translate-y-0 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-lg shadow-accent/20">
                  <Download className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-semibold text-foreground/80">Descargar</span>
              </button>
            </div>

            <Button
              onClick={() => setShowShareMenu(false)}
              variant="ghost"
              className="w-full h-12 text-muted-foreground"
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
