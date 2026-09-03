/**
 * Formatea un número como moneda argentina
 * @param value - Valor numérico a formatear
 * @param options - Opciones de formateo
 */
export const formatCurrency = (
  value: number,
  options: { compact?: boolean; showSign?: boolean; decimals?: boolean } = {}
): string => {
  const { compact = false, showSign = false, decimals = true } = options;
  
  const sign = showSign && value > 0 ? "+" : "";
  
  if (compact) {
    if (Math.abs(value) >= 1000000) {
      return `${sign}$ ${(value / 1000000).toFixed(2).replace(".", ",")}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${sign}$ ${(value / 1000).toFixed(1).replace(".", ",")}K`;
    }
  }
  
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(value);
  
  return `${sign}$ ${formatted}`;
};

/**
 * Formatea un número como moneda argentina (estándar es-AR)
 * Separador de miles: punto (.)
 * Separador de decimales: coma (,)
 * Siempre muestra 2 decimales
 * Ejemplo: $ 1.250.400,00
 */
export const formatCurrencyAR = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formatea un saldo con 2 decimales siempre (estándar es-AR)
 */
export const formatBalance = (value: number): string => {
  return `$ ${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
};

/**
 * Parsea un string de monto a número
 */
export const parseAmount = (value: string): number => {
  const cleanValue = value.replace(/[^\d,.-]/g, "");
  const numericValue = cleanValue.replace(",", ".");
  return parseFloat(numericValue) || 0;
};

/**
 * Formatea un porcentaje
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
};

/**
 * Oculta un valor sensible reemplazándolo con bullets
 */
export const maskValue = (value: string, visibleChars: number = 0): string => {
  if (visibleChars === 0) {
    return "••••••";
  }
  const visible = value.slice(-visibleChars);
  const masked = "•".repeat(Math.max(0, value.length - visibleChars));
  return masked + visible;
};

/**
 * Obtiene las iniciales de un nombre
 * @param name - Nombre completo o alias
 */
export const getInitials = (name: string): string => {
  const parts = name.split(/[\s.-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Formatea segundos a formato mm:ss
 * @param seconds - Cantidad de segundos
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Formatea un monto como moneda ARS con 2 decimales (estándar es-AR)
 * @param amount - Monto a formatear
 */
export const formatCurrencyARS = (amount: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};