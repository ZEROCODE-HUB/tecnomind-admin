import { useState, useEffect, useCallback, useRef } from "react";

import { OTP_MAX_ATTEMPTS, OTP_COUNTDOWN_SECONDS } from "@/constants/app";
import { supabase } from "@/lib/supabase";

interface UseOtpVerificationOptions {
  maxAttempts?: number;
  countdownSeconds?: number;
  /** Para qué se pide el código; separa los circuitos en la base. */
  purpose?: string;
  onSuccess?: () => void;
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
  /** true si no hay canal de entrega configurado (ver migración 00035). */
  sinCanal: boolean;
  verify: () => void;
  resendCode: () => void;
  reset: () => void;
  clearError: () => void;
}

/** Motivos que devuelve la base, traducidos a algo que el usuario entienda. */
const MENSAJES: Record<string, string> = {
  expirado: "El código venció. Pedí uno nuevo.",
  no_solicitado: "Todavía no pediste un código.",
  bloqueado: "Superaste el límite de intentos. Generá un código nuevo.",
  demasiados_intentos: "Pediste demasiados códigos. Esperá unos minutos.",
};

/**
 * Verificación por código de un solo uso.
 *
 * Antes esto comparaba contra la constante "123456" dentro del navegador:
 * cualquiera que llegara a la pantalla confirmaba la operación. Ahora el
 * código lo genera y lo valida la base (`otp_solicitar` / `otp_verificar`),
 * que guarda solo el hash, lo expira y cuenta los intentos.
 */
export const useOtpVerification = ({
  maxAttempts = OTP_MAX_ATTEMPTS,
  countdownSeconds = OTP_COUNTDOWN_SECONDS,
  purpose = "transfer",
  onSuccess,
}: UseOtpVerificationOptions = {}): UseOtpVerificationReturn => {
  const [otpValue, setOtpValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sinCanal, setSinCanal] = useState(false);

  // onSuccess suele ser una función nueva en cada render; guardarla en una
  // ref evita rehacer verify() y reiniciar el temporizador.
  const alAcertar = useRef(onSuccess);
  useEffect(() => {
    alAcertar.current = onSuccess;
  }, [onSuccess]);

  const solicitar = useCallback(async () => {
    setIsSendingCode(true);
    setOtpError("");
    try {
      const { data, error } = await supabase.rpc("otp_solicitar", { p_proposito: purpose });
      if (error) throw error;
      const fila = (data ?? [])[0];
      setSinCanal(fila?.motivo === "sin_canal");
      if (fila?.motivo === "demasiados_intentos") {
        setIsBlocked(true);
        setOtpError(MENSAJES.demasiados_intentos);
      }
    } catch {
      setOtpError("No se pudo enviar el código. Intentá de nuevo.");
    } finally {
      setIsSendingCode(false);
    }
  }, [purpose]);

  const reset = useCallback(() => {
    setOtpValue("");
    setOtpError("");
    setAttempts(0);
    setCountdown(countdownSeconds);
    setIsBlocked(false);
    setIsVerifying(false);
    setIsActive(true);
    void solicitar();
  }, [countdownSeconds, solicitar]);

  const clearError = useCallback(() => setOtpError(""), []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (isActive && countdown > 0 && !isBlocked) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsBlocked(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, countdown, isBlocked]);

  const verify = useCallback(async () => {
    if (isBlocked || attempts >= maxAttempts || otpValue.length !== 6) return;

    setIsVerifying(true);
    setOtpError("");

    try {
      const { data, error } = await supabase.rpc("otp_verificar", {
        p_codigo: otpValue,
        p_proposito: purpose,
      });
      if (error) throw error;
      const fila = (data ?? [])[0];

      if (fila?.valido) {
        setIsActive(false);
        alAcertar.current?.();
        return;
      }

      const nuevos = attempts + 1;
      setAttempts(nuevos);
      const motivo = fila?.motivo ?? "incorrecto";

      if (motivo !== "incorrecto") {
        setIsBlocked(true);
        setOtpError(MENSAJES[motivo] ?? "No se pudo verificar el código.");
      } else if (nuevos >= maxAttempts) {
        setIsBlocked(true);
        setOtpError(`Superaste el límite de ${maxAttempts} intentos. Generá un código nuevo.`);
      } else {
        setOtpError(`Código incorrecto. Te ${maxAttempts - nuevos === 1 ? "queda" : "quedan"} ${maxAttempts - nuevos} intento${maxAttempts - nuevos === 1 ? "" : "s"}.`);
      }
      setOtpValue("");
    } catch {
      setOtpError("No se pudo verificar el código. Revisá tu conexión.");
    } finally {
      setIsVerifying(false);
    }
  }, [otpValue, attempts, maxAttempts, isBlocked, purpose]);

  const resendCode = useCallback(() => reset(), [reset]);

  const isVerifyDisabled =
    otpValue.length !== 6 || isVerifying || isBlocked || attempts >= maxAttempts;

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
    sinCanal,
    verify: () => void verify(),
    resendCode,
    reset,
    clearError,
  };
};
