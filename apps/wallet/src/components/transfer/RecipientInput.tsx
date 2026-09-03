import { Search, Check } from "lucide-react";

interface RecipientInputProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
}

const RecipientInput = ({ value, onChange, isValid }: RecipientInputProps) => {
  return (
    <div className="mb-8 animate-fade-up">
      <p className="text-xs font-bold tracking-[0.15em] text-muted-foreground mb-3 ml-4 uppercase opacity-90">
        Destinatario
      </p>
      
      <div className="relative group">
        <div className={`flex w-full items-center rounded-full bg-secondary border transition-all duration-300 shadow-sm ${
          isValid 
            ? "border-success ring-1 ring-success" 
            : "border-border focus-within:border-accent focus-within:ring-1 focus-within:ring-accent"
        }`}>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 w-full bg-transparent border-none py-4 pl-6 pr-2 text-base font-medium placeholder:text-muted-foreground/40 text-foreground focus:ring-0 rounded-l-full min-h-[44px]"
            placeholder="Ingresá CBU, CVU o Alias"
            autoComplete="off"
          />
          <div className={`pr-5 transition-colors ${
            isValid 
              ? "text-success" 
              : "text-muted-foreground/50 group-focus-within:text-accent"
          }`}>
            {isValid ? (
              <Check className="size-5" />
            ) : (
              <Search className="size-5" />
            )}
          </div>
        </div>
        
        {isValid && (
          <p className="text-xs text-success font-medium mt-2 ml-4 flex items-center gap-1">
            <Check className="size-3" />
            Destinatario validado
          </p>
        )}
      </div>
    </div>
  );
};

export default RecipientInput;
