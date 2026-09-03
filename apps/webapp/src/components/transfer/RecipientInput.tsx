import { Search, Check, AlertCircle, Loader2, User } from "lucide-react";

interface RecipientInputProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  validating?: boolean;
  recipientName?: string | null;
  error?: string | null;
}

const RecipientInput = ({
  value,
  onChange,
  isValid,
  validating,
  recipientName,
  error
}: RecipientInputProps) => {
  return (
    <div className="mb-8 animate-fade-up">
      <p className="text-xs font-bold tracking-[0.15em] text-muted-foreground mb-3 ml-4 uppercase opacity-90">
        DESTINATARIO
      </p>

      <div className="relative group">
        <div className={`flex w-full items-center rounded-full bg-secondary/50 border transition-all duration-300 shadow-sm ${isValid
          ? "border-success ring-1 ring-success/20"
          : error
            ? "border-destructive ring-1 ring-destructive/20"
            : "border-border focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20"
          }`}>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 w-full bg-transparent border-none outline-none py-4 pl-6 pr-2 text-base font-medium placeholder:text-muted-foreground/40 text-foreground focus:ring-0 rounded-l-full min-h-[56px]"
            placeholder="Ingresá CBU, CVU o Alias"
            autoComplete="off"
          />
          <div className={`pr-5 transition-colors ${isValid
            ? "text-success"
            : error
              ? "text-destructive"
              : "text-muted-foreground/50 group-focus-within:text-accent"
            }`}>
            {validating ? (
              <Loader2 className="size-5 animate-spin" />
            ) : isValid ? (
              <Check className="size-5" />
            ) : error ? (
              <AlertCircle className="size-5" />
            ) : (
              <Search className="size-5" />
            )}
          </div>
        </div>

        {isValid && recipientName && (
          <div className="mt-2 ml-4 flex items-center gap-2 animate-fade-in">
            <div className="size-4 rounded-full bg-success/10 flex items-center justify-center">
              <User className="size-2.5 text-success" />
            </div>
            <p className="text-sm text-success font-medium">
              {recipientName}
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive font-medium mt-2 ml-4 flex items-center gap-1 animate-fade-in">
            <AlertCircle className="size-3" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default RecipientInput;

