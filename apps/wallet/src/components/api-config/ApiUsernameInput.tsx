import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ApiUsernameInputProps {
  userId: string;
  suffix: string;
  onSuffixChange: (value: string) => void;
}

const ApiUsernameInput = ({ userId, suffix, onSuffixChange }: ApiUsernameInputProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const prefix = `mag_${userId}_`;
  const fullUsername = `${prefix}${suffix}`;

  const handleCopy = async () => {
    if (!suffix) return;
    await navigator.clipboard.writeText(fullUsername);
    setCopied(true);
    toast({
      title: "Copiado",
      description: "Usuario API copiado al portapapeles",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSuffixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow lowercase letters, numbers, and underscores
    const value = e.target.value.replace(/[^a-z0-9_]/g, '');
    onSuffixChange(value);
  };

  return (
    <div className="flex flex-col gap-1 mb-5">
      <label className="text-muted-foreground text-sm font-medium ml-4 mb-2">
        Usuario API (Client ID)
      </label>
      <div className="relative flex items-center">
        <div className="flex w-full bg-background border border-border rounded-full h-14 overflow-hidden shadow-sm hover:border-muted-foreground/50 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
          {/* Fixed Prefix */}
          <span className="flex items-center bg-muted text-muted-foreground font-mono text-sm px-4 border-r border-border select-none">
            {prefix}
          </span>
          {/* Editable Suffix */}
          <input
            type="text"
            value={suffix}
            onChange={handleSuffixChange}
            className="flex-1 bg-transparent text-foreground placeholder-muted-foreground px-4 pr-12 focus:outline-none font-mono"
            placeholder="nombre_app"
          />
        </div>
        <button
          onClick={handleCopy}
          disabled={!suffix}
          className="absolute right-4 text-muted-foreground hover:text-primary transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {copied ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground ml-4 mt-1">
        Solo letras minúsculas, números y guiones bajos (_)
      </p>
    </div>
  );
};

export default ApiUsernameInput;
