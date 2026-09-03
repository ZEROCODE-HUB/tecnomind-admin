import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PinKeypadProps {
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

const PinKeypad = ({ onDigitPress, onBackspace, disabled }: PinKeypadProps) => {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

  return (
    <div className="grid grid-cols-3 gap-x-8 gap-y-6 max-w-[280px] mx-auto">
      {digits.map((digit, index) => {
        if (digit === "") return <div key={`empty-${index}`} />;

        if (digit === "back") {
          return (
            <Button
              key="back-button"
              variant="ghost"
              disabled={disabled}
              onClick={onBackspace}
              className="h-16 w-16 rounded-full flex items-center justify-center hover:bg-muted/50 active:scale-95 transition-all"
            >
              <Delete className="h-6 w-6 text-muted-foreground" />
            </Button>
          );
        }

        return (
          <Button
            key={digit}
            variant="ghost"
            disabled={disabled}
            onClick={() => onDigitPress(digit)}
            className="h-16 w-16 rounded-full text-2xl font-medium text-foreground hover:bg-muted/50 active:scale-95 transition-all border border-transparent hover:border-border"
          >
            {digit}
          </Button>
        );
      })}
    </div>
  );
};

export default PinKeypad;
