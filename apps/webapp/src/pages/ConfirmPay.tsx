import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { formatCurrencyAR, getInitials } from "@/lib/formatters";
import { useOtpVerification } from "@/hooks/useOtpVerification";
import { TransferState } from "@/types";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { TransactionDataSource } from "@/data/datasources/supabase/TransactionDataSource";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import SecurityVerificationModal from "@/components/transfer/SecurityVerificationModal";

const transactionDataSource = new TransactionDataSource();

const ConfirmPay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, account, session, refreshUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');

  const transferData = location.state as TransferState | null;

  const handleTransfer = async () => {
    if (!account?.id || !transferData) return;

    setIsProcessing(true);
    setShowSecurityModal(false);

    try {
      const result = await transactionDataSource.processTransfer(
        account.id,
        transferData.recipient,
        transferData.amount,
        transferData.concept
      );

      if (result.success) {
        // Actualizar saldo
        await refreshUser();

        navigate("/success-pay", {
          state: {
            amount: result.amount,
            recipient: {
              name: transferData.recipientName || transferData.recipient,
              cuit: transferData.recipient,
              type: "CBU/Alias"
            },
            concept: transferData.concept,
            transactionId: result.reference_number || result.transaction_id,
            date: new Date(),
          },
        });
      } else {
        throw new Error("La transferencia no se pudo completar");
      }
    } catch (error: any) {
      console.error("Error processing transfer:", error);
      navigate("/error-pay", {
        state: {
          amount: transferData.amount.toString(),
          recipient: transferData.recipient,
          errorCode: "ERR-TRX-FAIL",
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const invokeWorker = async () => {
    try {
      const workerResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notification-worker`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const workerResult = await workerResponse.json();
    } catch (workerError) {
      console.error('Error invocando worker:', workerError);
    }
  };

  const otp = useOtpVerification({
    maxAttempts: 3,
    countdownSeconds: 120,
    correctCode: generatedOtp || "123456", // ✅ Usar el OTP generado o 123456 para testing
    onSuccess: handleTransfer,
    onResend: async () => {
      if (user && transferData) {
        const result = await transactionDataSource.sendTransferOtp(
          user.id,
          transferData.amount,
          transferData.recipientName || transferData.recipient
        );
        if (result.success && result.otp) {
          setGeneratedOtp(result.otp); // ✅ Guardar el OTP generado

          // ✅ Invocar worker después de encolar
          await invokeWorker();
        }
      }
    }
  });

  const handleOpenSecurityModal = async () => {
    setShowSecurityModal(true);
    // ✅ Enviar código inicial cuando se abre el modal
    if (user && transferData) {
      const result = await transactionDataSource.sendTransferOtp(
        user.id,
        transferData.amount,
        transferData.recipientName || transferData.recipient
      );
      if (result.success && result.otp) {
        setGeneratedOtp(result.otp); // ✅ Guardar el OTP generado

        // ✅ Invocar worker después de encolar
        await invokeWorker();
      }
    }
  };

  // Si no hay datos de transferencia, redirigir
  if (!transferData) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-6">
        <div className="flex justify-center items-center mb-8">
          <Logo className="h-24 w-24" showText={false} />
        </div>
        <p className="text-primary-foreground text-lg mb-4">No hay datos de transferencia</p>
        <Button
          onClick={() => navigate("/transfer")}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Volver a Transferir
        </Button>
      </div>
    );
  }

  const { recipient, amount, concept } = transferData;

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="flex justify-center items-center mb-8">
          <Logo className="h-24 w-24" showText={false} />
        </div>
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Loader2 className="h-14 w-14 text-accent animate-spin" />
            <div className="absolute inset-0 blur-xl bg-accent/20 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-foreground text-xl font-bold tracking-tight">Procesando transferencia...</p>
            <p className="text-muted-foreground text-sm font-medium">No cierres esta pantalla</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col flex-1 bg-background">
        <GlobalHeader
          title="Confirmar Transferencia"
          showBackButton
          backPath="/transfer"
        />

        <div className="px-6 py-8 max-w-md mx-auto w-full">
          {/* Amount Display */}
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground mb-2">
              Monto a transferir
            </p>
            <p className="text-5xl font-bold text-foreground">
              $ {formatCurrencyAR(amount)}
            </p>
          </div>

          {/* Recipient Card */}
          <div className="bg-card rounded-2xl p-6 shadow-sm mb-6 border border-border">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg">
                  {getInitials(transferData?.recipientName || recipient)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Destinatario</p>
                <h2 className="font-semibold text-lg text-foreground">
                  {transferData?.recipientName || "Titular no disponible"}
                </h2>
                <p className="text-sm text-muted-foreground font-mono">
                  {recipient}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  CBU/Alias
                </span>
                <span className="font-mono text-sm text-foreground truncate max-w-[180px]">
                  {recipient}
                </span>
              </div>
              {concept && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Concepto
                  </span>
                  <span className="text-sm text-foreground truncate max-w-[180px]">
                    {concept}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-accent/10 rounded-xl p-4 mb-8">
            <p className="text-sm text-accent text-center">
              Revisa los datos antes de confirmar. Esta operación no puede deshacerse.
            </p>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleOpenSecurityModal}
            className="w-full h-14 bg-accent hover:bg-accent/90 text-accent-foreground text-lg font-semibold rounded-2xl gap-2"
          >
            <Send className="h-5 w-5" />
            Confirmar Transferencia
          </Button>

          {/* Cancel Link */}
          <button
            onClick={() => navigate("/transfer")}
            className="w-full mt-4 text-center text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Security Verification Modal */}
        <SecurityVerificationModal
          isOpen={showSecurityModal}
          onClose={() => setShowSecurityModal(false)}
          otp={otp}
        />
      </div>
    </AppLayout>
  );
};

export default ConfirmPay;
