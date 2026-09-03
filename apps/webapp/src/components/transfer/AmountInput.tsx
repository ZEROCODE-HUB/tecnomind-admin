import { Wallet, AlertCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { formatCurrencyAR, parseAmount } from "@/lib/formatters";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  availableBalance: number;
}

/**
 * Formatea un número al estilo argentino mientras el usuario escribe
 * Separador de miles: punto (.)
 * Separador de decimales: coma (,)
 */
const formatWhileTyping = (input: string): string => {
  if (!input || input === "") return "";
  
  // Separar parte entera y decimal
  const parts = input.split(",");
  let integerPart = parts[0] || "";
  const decimalPart = parts[1];
  
  // Remover puntos existentes de la parte entera
  integerPart = integerPart.replace(/\./g, "");
  
  // Agregar puntos como separadores de miles
  if (integerPart.length > 3) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  
  // Reconstruir con decimales si existen
  if (decimalPart !== undefined) {
    return `${integerPart},${decimalPart}`;
  }
  
  return integerPart;
};

/**
 * Obtiene solo los dígitos del valor para calcular el tamaño
 */
const getDigitCount = (value: string): number => {
  return (value.match(/\d/g) || []).length;
};

/**
 * Determina la clase de tamaño de fuente basada en la cantidad de dígitos
 */
const getFontSizeClass = (digitCount: number): string => {
  if (digitCount <= 5) return "text-6xl";
  if (digitCount <= 8) return "text-5xl";
  if (digitCount <= 10) return "text-4xl";
  return "text-3xl";
};

/**
 * Determina el ancho del input basado en la cantidad de dígitos
 */
const getInputWidth = (digitCount: number): string => {
  if (digitCount <= 5) return "w-48";
  if (digitCount <= 8) return "w-56";
  if (digitCount <= 10) return "w-64";
  return "w-72";
};

const AmountInput = ({ value, onChange, availableBalance }: AmountInputProps) => {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const numericAmount = parseAmount(value);
  const isInsufficientBalance = numericAmount > availableBalance;

  // Sincronizar displayValue con value externo solo cuando no está enfocado
  useEffect(() => {
    if (!isFocused && (value === "" || value === "0")) {
      setDisplayValue("");
    }
  }, [value, isFocused]);

  const digitCount = useMemo(() => getDigitCount(displayValue), [displayValue]);
  const fontSizeClass = useMemo(() => getFontSizeClass(digitCount), [digitCount]);
  const inputWidthClass = useMemo(() => getInputWidth(digitCount), [digitCount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Remover cualquier caracter que no sea dígito, coma o punto
    inputValue = inputValue.replace(/[^\d,.]/g, "");
    
    // Remover puntos (son solo visuales para miles)
    inputValue = inputValue.replace(/\./g, "");
    
    // Permitir campo vacío
    if (inputValue === "") {
      setDisplayValue("");
      onChange("");
      return;
    }
    
    // Asegurar solo una coma
    const commaCount = (inputValue.match(/,/g) || []).length;
    if (commaCount > 1) {
      const firstCommaIndex = inputValue.indexOf(",");
      inputValue = inputValue.slice(0, firstCommaIndex + 1) + 
                   inputValue.slice(firstCommaIndex + 1).replace(/,/g, "");
    }
    
    // Limitar decimales a 2
    const parts = inputValue.split(",");
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
      inputValue = parts.join(",");
    }
    
    // Limitar a un máximo razonable de dígitos (prevenir overflow)
    const digitCount = (inputValue.match(/\d/g) || []).length;
    if (digitCount > 12) {
      return; // No permitir más de 12 dígitos
    }

    // Formatear con separadores de miles mientras escribe
    const formattedValue = formatWhileTyping(inputValue);
    
    setDisplayValue(formattedValue);
    onChange(inputValue); // Enviar valor sin formato de miles para parsing
  };

  const handleFocus = () => {
    setIsFocused(true);
    // No modificar el valor al hacer focus, permitir edición libre
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Solo formatear a "0,00" si está completamente vacío
    if (displayValue === "" || displayValue === "0" || displayValue === "0,") {
      setDisplayValue("");
      onChange("0");
    } else {
      // Asegurar que tenga formato correcto al salir
      const numValue = parseAmount(displayValue);
      if (numValue === 0) {
        setDisplayValue("");
        onChange("0");
      }
    }
  };

  // Valor a mostrar: formateado o placeholder
  const showPlaceholder = displayValue === "" && !isFocused;

  return (
    <div className="mb-8 flex flex-col items-center">
      <p className="text-xs font-bold tracking-[0.15em] text-muted-foreground mb-2 uppercase opacity-90">
        Monto a transferir
      </p>
      
      <div className="relative w-full flex justify-center py-4">
        <div className="flex items-baseline text-foreground">
          <span className="text-3xl font-medium text-muted-foreground/50 mr-2 self-center">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={showPlaceholder ? "" : displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`bg-transparent border-none p-0 ${inputWidthClass} ${fontSizeClass} font-bold tracking-tight text-center focus:ring-0 focus:outline-none caret-accent selection:bg-accent/20 placeholder:text-muted-foreground/30 transition-all duration-200 ${
              isInsufficientBalance ? "text-destructive" : "text-foreground"
            }`}
            placeholder="0,00"
          />
        </div>
      </div>

      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-colors ${
        isInsufficientBalance 
          ? "bg-destructive/10 border-destructive/30" 
          : "bg-secondary border-border"
      }`}>
        {isInsufficientBalance ? (
          <>
            <AlertCircle className="size-4 text-destructive" />
            <span className="text-sm text-destructive font-medium">
              Saldo insuficiente
            </span>
          </>
        ) : (
          <>
            <Wallet className="size-4 text-accent" />
            <span className="text-sm text-muted-foreground font-medium">
              Disponible:{" "}
              <span className="font-bold text-foreground ml-1">
                $ {formatCurrencyAR(availableBalance)}
              </span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default AmountInput;
