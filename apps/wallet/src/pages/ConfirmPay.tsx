import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2, Send, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Logo from "@/components/Logo";
import { formatCurrencyAR, getInitials, formatTime } from "@/lib/formatters";
import { useOtpVerification } from "@/hooks/useOtpVerification";
import { TransferState } from "@/types";
import { useTransferir } from "@/hooks/useTransfer";

const ConfirmPay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const transferData = location.state as TransferState | null;
  const transferir = useTransferir();

  const handleTransfer = async () => {
    if (!transferData) return;

    setIsProcessing(true);
    setShowSecurityModal(false);

    try {
      // process_transfer valida propiedad de la cuenta, saldo, estado y los
      // tres límites de forma atómica. No se duplica nada de eso acá.
      const resultado = await transferir.mutateAsync({
        destinatario: transferData.recipient,
        monto: transferData.amount,
        concepto: transferData.concept,
      });

      navigate("/success-pay", {
        state: {
          amount: transferData.amount,
          // SuccessPay espera un objeto, no el identificador suelto.
          recipient: {
            name: transferData.recipientName?.trim() || transferData.recipient,
            cuit: transferData.recipient,
            type: /^d{22}$/.test(transferData.recipient.trim())
              ? transferData.recipient.trim().startsWith("000") ? "CVU" : "CBU"
              : "Alias",
          },
          concept: transferData.concept,
          transactionId: resultado?.reference_number ?? resultado?.transaction_id ?? "",
          date: new Date(),
        },
      });
    } catch (error) {
      navigate("/error-pay", {
        state: {
          amount: String(transferData.amount),
          recipient: transferData.recipient,
          errorCode: error instanceof Error ? error.message : "No pudimos completar la transferencia.",
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ⚠️ PENDIENTE DE SEGURIDAD: el OTP todavía no es real. El código está
  // fijo y no se envía por ningún canal, porque el envío de emails está
  // bloqueado hasta configurar Resend (ver supabase/README.md). La tabla
  // email_otps ya existe en el esquema. NO puede salir a producción así:
  // hoy este paso no agrega ninguna verificación.
  const otp = useOtpVerification({
    maxAttempts: 3,
    countdownSeconds: 120,
    correctCode: "123456",
    onSuccess: () => {
      void handleTransfer();
    },
  });

  const handleOpenSecurityModal = () => {
    otp.reset();
    setShowSecurityModal(true);
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

  const { recipient, recipientName, amount, concept } = transferData;
  // Si por algún motivo no se resolvió el titular, se cae al identificador
  // en vez de mostrar un hueco vacío.
  const titular = recipientName?.trim() || recipient;

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-6">
        <div className="flex justify-center items-center mb-8">
          <Logo className="h-24 w-24" showText={false} />
        </div>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-accent animate-spin" />
          <p className="text-primary-foreground text-lg font-medium">Procesando transferencia...</p>
          <p className="text-primary-foreground/60 text-sm">No cierres esta pantalla</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-primary">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-primary-foreground/10 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold flex-1 text-center pr-10">
          Confirmar Transferencia
        </h1>
      </header>

      <div className="px-6 py-8 max-w-md mx-auto">
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
                {getInitials(titular)}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Destinatario</p>
              <h2 className="font-semibold text-lg text-foreground">
                {titular}
              </h2>
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
      <Dialog open={showSecurityModal} onOpenChange={setShowSecurityModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-accent" />
            </div>
            <DialogTitle className="text-xl font-semibold text-foreground text-center">
              Verificación de Seguridad
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-center">
              Por seguridad, ingresa el código de 6 dígitos
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-6">
            {/* Timer and attempts display */}
            <div className="flex items-center justify-between w-full px-2">
              <span className={`text-sm font-medium ${otp.countdown <= 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
                Expira en: {formatTime(otp.countdown)}
              </span>
              <span className="text-sm text-muted-foreground">
                Intentos: {otp.attempts}/{otp.maxAttempts}
              </span>
            </div>

            <InputOTP
              maxLength={6}
              value={otp.otpValue}
              onChange={(value) => {
                otp.setOtpValue(value);
                otp.clearError();
              }}
              disabled={otp.isBlocked || otp.attempts >= otp.maxAttempts}
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot 
                  index={0} 
                  className={`w-12 h-14 text-xl font-semibold border-border bg-muted/50 text-foreground rounded-xl ${otp.isBlocked ? 'opacity-50' : ''}`}
                />
                <InputOTPSlot 
                  index={1} 
                  className={`w-12 h-14 text-xl font-semibold border-border bg-muted/50 text-foreground rounded-xl ${otp.isBlocked ? 'opacity-50' : ''}`}
                />
                <InputOTPSlot 
                  index={2} 
                  className={`w-12 h-14 text-xl font-semibold border-border bg-muted/50 text-foreground rounded-xl ${otp.isBlocked ? 'opacity-50' : ''}`}
                />
                <InputOTPSlot 
                  index={3} 
                  className={`w-12 h-14 text-xl font-semibold border-border bg-muted/50 text-foreground rounded-xl ${otp.isBlocked ? 'opacity-50' : ''}`}
                />
                <InputOTPSlot 
                  index={4} 
                  className={`w-12 h-14 text-xl font-semibold border-border bg-muted/50 text-foreground rounded-xl ${otp.isBlocked ? 'opacity-50' : ''}`}
                />
                <InputOTPSlot 
                  index={5} 
                  className={`w-12 h-14 text-xl font-semibold border-border bg-muted/50 text-foreground rounded-xl ${otp.isBlocked ? 'opacity-50' : ''}`}
                />
              </InputOTPGroup>
            </InputOTP>

            {otp.otpError && (
              <p className="text-sm text-destructive font-medium text-center">{otp.otpError}</p>
            )}

            {/* Resend code button */}
            <button
              onClick={otp.resendCode}
              disabled={otp.isSendingCode}
              className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
            >
              {otp.isSendingCode ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando código...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Generar nuevo código
                </>
              )}
            </button>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSecurityModal(false)}
              className="flex-1 h-12 rounded-xl"
              disabled={otp.isVerifying}
            >
              Cancelar
            </Button>
            <Button
              onClick={otp.verify}
              disabled={otp.isVerifyDisabled}
              className="flex-1 h-12 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2"
            >
              {otp.isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfirmPay;
