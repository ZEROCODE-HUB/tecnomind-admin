import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showValidation?: boolean;
  isValid?: boolean;
  errorMessage?: string;
}

const PasswordInput = ({
  label,
  value,
  onChange,
  placeholder = "••••••••••••",
  showValidation = false,
  isValid = false,
  errorMessage,
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1 mb-5">
      <label className="text-muted-foreground text-sm font-medium ml-4 mb-2">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-background text-foreground placeholder-muted-foreground border border-border rounded-full h-14 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono tracking-widest shadow-sm hover:border-muted-foreground/50"
          placeholder={placeholder}
        />
        <div className="absolute right-4 flex items-center gap-2">
          {showValidation && value && (
            <CheckCircle 
              className={`h-5 w-5 transition-opacity ${
                isValid ? 'text-green-500 opacity-100' : 'opacity-0'
              }`} 
            />
          )}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground hover:text-primary focus:outline-none p-1 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-6 w-6" />
            ) : (
              <Eye className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
      {errorMessage && value && !isValid && (
        <p className="text-destructive text-xs ml-4 mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default PasswordInput;
