import { useState, useEffect, useCallback } from "react";
import { OTP_MAX_ATTEMPTS, OTP_COUNTDOWN_SECONDS } from "@/constants/app";

interface UseOtpVerificationOptions {
  maxAttempts?: number;
  countdownSeconds?: number;
  correctCode?: string;
  onSuccess?: () => void;
  onResend?: () => Promise<void>;
}

interface UseOtpVerificationReturn {
  otpValue: string;
  setOtpValue: (value: string) => void;
  attempts: number;
  countdown: number;
  isBlocked: boolean;
  isVerifying: boolean;
  isSendingCode: boolean;
  otpError: string;
  isVerifyDisabled: boolean;
  maxAttempts: number;
  verify: () => void;
  resendCode: () => void;
  reset: () => void;
  clearError: () => void;
}

/**
 * Hook para manejar la verificación OTP con countdown, intentos limitados y bloqueo
 */
export const useOtpVerification = ({
  maxAttempts = OTP_MAX_ATTEMPTS,
  countdownSeconds = OTP_COUNTDOWN_SECONDS,
  correctCode = "123456",
  onSuccess,
  onResend,
}: UseOtpVerificationOptions = {}): UseOtpVerificationReturn => {
  const [otpValue, setOtpValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Reset all state
  const reset = useCallback(() => {
    setOtpValue("");
    setOtpError("");
    setAttempts(0);
    setCountdown(countdownSeconds);
    setIsBlocked(false);
    setIsVerifying(false);
    setIsActive(true);
  }, [countdownSeconds]);

  // Clear error message
  const clearError = useCallback(() => {
    setOtpError("");
  }, []);

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive && countdown > 0 && !isBlocked) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // No bloqueamos automáticamente al llegar a 0, permitimos reenviar
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, countdown, isBlocked]);

  // Verify OTP
  const verify = useCallback(() => {
    if (isBlocked || attempts >= maxAttempts || otpValue.length !== 6) return;

    setIsVerifying(true);
    setOtpError("");

    // Simulación de verificación (en producción esto debería llamar a una API)
    setTimeout(() => {
      // ✅ Permitir 123456 como código maestro de pruebas en cualquier circunstancia
      if (otpValue === correctCode || otpValue === "123456") {
        setIsActive(false);
        onSuccess?.();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= maxAttempts) {
          setIsBlocked(true);
          setOtpError(`Has superado el límite de ${maxAttempts} intentos. Genera un nuevo código.`);
        } else {
          setOtpError(`Código incorrecto. Te quedan ${maxAttempts - newAttempts} intento(s)`);
        }
        setOtpValue("");
        setIsVerifying(false);
      }
    }, 1500);
  }, [otpValue, attempts, maxAttempts, isBlocked, correctCode, onSuccess]);

  // Resend code
  const resendCode = useCallback(async () => {
    setIsSendingCode(true);
    setOtpError("");

    try {
      if (onResend) {
        await onResend();
      }
      reset();
    } catch (error: any) {
      setOtpError("Error al enviar el código. Reintente en unos momentos.");
    } finally {
      setIsSendingCode(false);
    }
  }, [onResend, reset]);

  const isVerifyDisabled =
    otpValue.length !== 6 ||
    isVerifying ||
    isBlocked ||
    attempts >= maxAttempts;

  return {
    otpValue,
    setOtpValue,
    attempts,
    countdown,
    isBlocked,
    isVerifying,
    isSendingCode,
    otpError,
    isVerifyDisabled,
    maxAttempts,
    verify,
    resendCode,
    reset,
    clearError,
  };
};

