import { useState, useEffect, useCallback } from 'react';
import { Delete, ArrowLeft, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PIN_LENGTH } from '@/constants/app';

interface StepPinCreationProps {
  onComplete: (pin: string) => void;
  onBack: () => void;
}

// Función para mezclar array (Fisher-Yates shuffle)
const shuffleArray = (array: number[]): number[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const StepPinCreation = ({ onComplete, onBack }: StepPinCreationProps) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirmPhase, setIsConfirmPhase] = useState(false);
  const [error, setError] = useState('');
  const [keypadNumbers, setKeypadNumbers] = useState<number[]>([]);

  // Generar teclado aleatorio al montar y cuando cambia la fase
  useEffect(() => {
    setKeypadNumbers(shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]));
  }, [isConfirmPhase]);

  const currentPin = isConfirmPhase ? confirmPin : pin;
  const setCurrentPin = isConfirmPhase ? setConfirmPin : setPin;

  const handleDigitPress = useCallback((digit: number) => {
    setError('');
    if (currentPin.length < PIN_LENGTH) {
      const newPin = currentPin + digit.toString();
      setCurrentPin(newPin);

      // Validar cuando se completa
      if (newPin.length === PIN_LENGTH) {
        if (!isConfirmPhase) {
          // Pasar a fase de confirmación
          setTimeout(() => {
            setIsConfirmPhase(true);
          }, 300);
        } else {
          // Validar que coincidan
          if (newPin === pin) {
            setTimeout(() => {
              onComplete(pin);
            }, 300);
          } else {
            setTimeout(() => {
              setError('Los PINs no coinciden. Intenta nuevamente.');
              setConfirmPin('');
              setIsConfirmPhase(false);
              setPin('');
            }, 300);
          }
        }
      }
    }
  }, [currentPin, isConfirmPhase, pin, onComplete, setCurrentPin]);

  const handleDelete = useCallback(() => {
    setError('');
    if (currentPin.length > 0) {
      setCurrentPin(currentPin.slice(0, -1));
    }
  }, [currentPin, setCurrentPin]);

  // Organizar números en grid 3x4 (3 filas de 3 + fila con 0)
  const row1 = keypadNumbers.slice(0, 3);
  const row2 = keypadNumbers.slice(3, 6);
  const row3 = keypadNumbers.slice(6, 9);
  const lastNumber = keypadNumbers[9];

  return (
    <div className="animate-fade-in flex flex-col items-center px-6 py-8">
      {/* Header con botón atrás */}
      <div className="w-full flex items-center mb-8">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
      </div>

      {/* Icono de seguridad */}
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
        <ShieldCheck className="h-10 w-10 text-accent" />
      </div>

      {/* Título */}
      <h2 className="text-foreground text-2xl font-bold text-center mb-2">
        {isConfirmPhase ? 'Confirma tu PIN' : 'Crea tu PIN de acceso'}
      </h2>
      <p className="text-muted-foreground text-sm text-center mb-8">
        {isConfirmPhase 
          ? `Ingresa nuevamente tu PIN de ${PIN_LENGTH} dígitos` 
          : `Ingresa un PIN de ${PIN_LENGTH} dígitos que usarás para acceder`
        }
      </p>

      {/* Indicadores de PIN */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-4 h-4 rounded-full transition-all duration-200 transform",
              i < currentPin.length 
                ? "bg-accent scale-110" 
                : "bg-border"
            )}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="text-destructive text-sm text-center mb-4 animate-fade-in">
          {error}
        </div>
      )}

      {/* Teclado numérico aleatorio */}
      <div className="w-full max-w-xs space-y-3">
        {/* Fila 1 */}
        <div className="grid grid-cols-3 gap-3">
          {row1.map((num) => (
            <KeypadButton key={num} number={num} onPress={handleDigitPress} />
          ))}
        </div>
        
        {/* Fila 2 */}
        <div className="grid grid-cols-3 gap-3">
          {row2.map((num) => (
            <KeypadButton key={num} number={num} onPress={handleDigitPress} />
          ))}
        </div>
        
        {/* Fila 3 */}
        <div className="grid grid-cols-3 gap-3">
          {row3.map((num) => (
            <KeypadButton key={num} number={num} onPress={handleDigitPress} />
          ))}
        </div>
        
        {/* Fila 4: vacío - número - borrar */}
        <div className="grid grid-cols-3 gap-3">
          <div /> {/* Espacio vacío */}
          <KeypadButton number={lastNumber} onPress={handleDigitPress} />
          <button
            onClick={handleDelete}
            className="aspect-square rounded-xl bg-muted hover:bg-muted/80 transition-all flex items-center justify-center active:scale-95"
          >
            <Delete className="h-6 w-6 text-foreground" />
          </button>
        </div>
      </div>

      {/* Indicador de seguridad */}
      <div className="mt-8 flex items-center gap-2 text-muted-foreground text-xs">
        <ShieldCheck className="h-4 w-4" />
        <span>El teclado aleatorio protege contra rastreo de patrones</span>
      </div>
    </div>
  );
};

// Componente de botón del teclado
const KeypadButton = ({ 
  number, 
  onPress 
}: { 
  number: number; 
  onPress: (digit: number) => void;
}) => (
  <button
    onClick={() => onPress(number)}
    className="aspect-square rounded-xl bg-card border border-border hover:bg-muted transition-all flex items-center justify-center text-2xl font-semibold text-foreground active:scale-95 active:bg-accent/20"
  >
    {number}
  </button>
);

export default StepPinCreation;
