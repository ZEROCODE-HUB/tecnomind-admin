import { Delete } from "lucide-react";

interface PinKeypadProps {
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
}

// Disposición aleatoria del teclado numérico (seguridad)
const keypadLayout = [
  ["5", "2", "8"],
  ["0", "9", "4"],
  ["7", "3", "6"],
  ["", "1", "backspace"],
];

const PinKeypad = ({ onDigitPress, onBackspace }: PinKeypadProps) => {
  const handleKeyPress = (key: string) => {
    if (key === "backspace") {
      onBackspace();
    } else if (key !== "") {
      onDigitPress(key);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
      {keypadLayout.flat().map((key, index) => {
        if (key === "") {
          return <div key={index} className="h-14 w-full" />;
        }

        if (key === "backspace") {
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleKeyPress(key)}
              className="flex items-center justify-center h-14 w-full rounded-full text-muted-foreground hover:text-accent active:text-accent transition-colors min-w-[44px] min-h-[44px]"
              aria-label="Borrar"
            >
              <Delete className="h-6 w-6" />
            </button>
          );
        }

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleKeyPress(key)}
            className="flex items-center justify-center h-14 w-full rounded-full bg-card shadow-sm border border-border active:bg-accent active:text-accent-foreground active:border-accent transition-all text-xl font-medium text-foreground min-w-[44px] min-h-[44px]"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
};

export default PinKeypad;
