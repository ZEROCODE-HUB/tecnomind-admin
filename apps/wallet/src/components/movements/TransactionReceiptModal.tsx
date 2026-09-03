import { X, Building2, Share2, Download, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { useState } from "react";

export interface TransactionDetails {
  id: number;
  icon: LucideIcon;
  name: string;
  category: string;
  time: string;
  amount: string;
  type: "income" | "expense";
  dateGroup: string;
}

interface TransactionReceiptModalProps {
  transaction: TransactionDetails | null;
  onClose: () => void;
}

const TransactionReceiptModal = ({ transaction, onClose }: TransactionReceiptModalProps) => {
  const [showShareMenu, setShowShareMenu] = useState(false);

  if (!transaction) return null;

  const isIncome = transaction.type === "income";
  const transactionId = `MAG-${String(transaction.id).padStart(5, '0')}-${isIncome ? 'I' : 'E'}`;
  const cleanAmount = transaction.amount.replace(/[+-]/g, '');
  const handleShare = async () => {
    const shareData = {
      title: "Comprobante de Transacción - Magnate",
      text: `${isIncome ? 'Ingreso' : 'Pago'}: ${transaction.name} por ${cleanAmount}. ID: ${transactionId}`,
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
      `${isIncome ? '✅ Ingreso recibido' : '💸 Pago realizado'} con Magnate\n\n${isIncome ? 'Origen' : 'Destinatario'}: ${transaction.name}\nMonto: ${cleanAmount}\nFecha: ${transaction.dateGroup} ${transaction.time}\nID: ${transactionId}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShowShareMenu(false);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent("Comprobante de Transacción - Magnate");
    const body = encodeURIComponent(
      `Comprobante de ${isIncome ? 'Ingreso' : 'Pago'}\n\n${isIncome ? 'Origen' : 'Destinatario'}: ${transaction.name}\nCategoría: ${transaction.category}\nMonto: ${cleanAmount}\nFecha: ${transaction.dateGroup} ${transaction.time}\nID de Transacción: ${transactionId}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setShowShareMenu(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1a3a5c] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-5 ${isIncome ? 'bg-[#27AE60]' : 'bg-[#0A2540]'} text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <p className="text-sm text-white/80 mb-1">
            {isIncome ? 'Ingreso recibido' : 'Pago realizado'}
          </p>
          <p className="text-3xl font-bold">{cleanAmount}</p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {/* Recipient/Origin */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#2F80ED]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-[#2F80ED]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 dark:text-white/60">
                {isIncome ? 'Origen' : 'Destinatario'}
              </p>
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {transaction.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-white/60">
                {transaction.category}
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
                {transaction.dateGroup}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-white/60">Hora</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {transaction.time}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-200 dark:border-white/10" />

          {/* Transaction ID */}
          <div>
            <p className="text-sm text-gray-500 dark:text-white/60">ID de Transacción</p>
            <p className="font-mono font-semibold text-[#2F80ED]">
              {transactionId}
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-3">
            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full h-12 border-2 border-[#2F80ED] text-[#2F80ED] hover:bg-[#2F80ED]/10 font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Compartir Comprobante
            </Button>

            <Button
              onClick={onClose}
              className="w-full h-12 bg-[#0A2540] hover:bg-[#0A2540]/90 text-white font-semibold rounded-xl"
            >
              Cerrar
            </Button>
          </div>
        </div>

        {/* Share Menu */}
        {showShareMenu && (
          <div 
            className="absolute inset-0 bg-black/50 flex items-end justify-center"
            onClick={() => setShowShareMenu(false)}
          >
            <div 
              className="bg-white dark:bg-[#1a3a5c] w-full rounded-t-3xl p-6 animate-slide-up"
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
    </div>
  );
};

export default TransactionReceiptModal;
