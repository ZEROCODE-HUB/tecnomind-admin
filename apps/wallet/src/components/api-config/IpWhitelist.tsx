import { useState } from 'react';
import { Plus, X, Globe } from 'lucide-react';

interface IpWhitelistProps {
  ips: string[];
  onIpsChange: (ips: string[]) => void;
}

const isValidIPv4 = (ip: string): boolean => {
  const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip.trim());
};

const IpWhitelist = ({ ips, onIpsChange }: IpWhitelistProps) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleAddIp = () => {
    const trimmedIp = inputValue.trim();
    
    if (!trimmedIp) {
      setError('Ingresa una dirección IP');
      return;
    }
    
    if (!isValidIPv4(trimmedIp)) {
      setError('Formato IPv4 inválido (ej: 192.168.1.1)');
      return;
    }
    
    if (ips.includes(trimmedIp)) {
      setError('Esta IP ya está en la lista');
      return;
    }
    
    onIpsChange([...ips, trimmedIp]);
    setInputValue('');
    setError('');
  };

  const handleRemoveIp = (ipToRemove: string) => {
    onIpsChange(ips.filter((ip) => ip !== ipToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIp();
    }
  };

  return (
    <div className="flex flex-col gap-1 mb-5">
      <div className="flex items-center gap-2 ml-4 mb-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <label className="text-muted-foreground text-sm font-medium">
          Lista de IPs permitidas (Whitelist)
        </label>
      </div>
      
      {/* Input with Add Button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-background text-foreground placeholder-muted-foreground border border-border rounded-full h-14 px-6 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono shadow-sm hover:border-muted-foreground/50"
            placeholder="192.168.1.1"
          />
        </div>
        <button
          onClick={handleAddIp}
          className="flex items-center justify-center h-14 w-14 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="text-destructive text-xs ml-4 mt-1">{error}</p>
      )}
      
      {/* IP Tags */}
      {ips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 px-2">
          {ips.map((ip) => (
            <span
              key={ip}
              className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-mono"
            >
              {ip}
              <button
                onClick={() => handleRemoveIp(ip)}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Empty State Info */}
      {ips.length === 0 && (
        <div className="mt-3 px-4 py-4 bg-muted/30 border border-dashed border-border rounded-xl flex flex-col items-center gap-2 text-center">
          <Globe className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-foreground">Sin IPs configuradas</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Se permitirá el acceso desde cualquier IP
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IpWhitelist;
