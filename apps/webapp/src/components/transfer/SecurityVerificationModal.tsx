import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { formatTime } from "@/lib/formatters";

interface OtpState {
    countdown: number;
    attempts: number;
    maxAttempts: number;
    otpValue: string;
    setOtpValue: (value: string) => void;
    clearError: () => void;
    isBlocked: boolean;
    otpError: string | null;
    resendCode: () => void;
    isSendingCode: boolean;
    isVerifying: boolean;
    isVerifyDisabled: boolean;
    verify: () => void;
}

interface SecurityVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    otp: OtpState;
}

const SecurityVerificationModal = ({
    isOpen,
    onClose,
    otp,
}: SecurityVerificationModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                        <span
                            className={`text-sm font-medium ${otp.countdown <= 30 ? "text-destructive" : "text-muted-foreground"
                                }`}
                        >
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
                                className={`w-12 h-14 text-xl font-semibold border-border bg-muted/50 text-foreground rounded-xl ${otp.isBlocked ? "opacity-50" : ""
                                    }`}
                            />
                            <InputOTPSlot
                                index={1}
                                className={`w-12 h-14 text-xl font-semibold border-border bg-muted/50 text-foreground rounded-xl ${otp.isBlocked ? "opacity-50" : ""
                                    }`}
                            />
                            <InputOTPSlot
                                index={2}
                                className={`w-12 h-14 text-xl font-semibold border-border bg-muted/50 text-foreground rounded-xl ${otp.isBlocked ? "opacity-50" : ""
                                    }`}
                            />
                            <InputOTPSlot
                                index={3}
                                className={`w-12 h-14 text-xl font-semibold border-border bg-muted/50 text-foreground rounded-xl ${otp.isBlocked ? "opacity-50" : ""
                                    }`}
                            />
                            <InputOTPSlot
                                index={4}
                                className={`w-12 h-14 text-xl font-semibold border-border bg-muted/50 text-foreground rounded-xl ${otp.isBlocked ? "opacity-50" : ""
                                    }`}
                            />
                            <InputOTPSlot
                                index={5}
                                className={`w-12 h-14 text-xl font-semibold border-border bg-muted/50 text-foreground rounded-xl ${otp.isBlocked ? "opacity-50" : ""
                                    }`}
                            />
                        </InputOTPGroup>
                    </InputOTP>

                    {otp.otpError && (
                        <p className="text-sm text-destructive font-medium text-center">
                            {otp.otpError}
                        </p>
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
                        onClick={onClose}
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
    );
};

export default SecurityVerificationModal;
