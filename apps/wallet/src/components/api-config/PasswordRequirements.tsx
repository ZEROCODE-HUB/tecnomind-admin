import { Check, X } from 'lucide-react';

interface PasswordRequirementsProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Al menos 1 Mayúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Al menos 1 Número', test: (p) => /[0-9]/.test(p) },
  { label: 'Al menos 1 Carácter especial (!@#$%)', test: (p) => /[!@#$%]/.test(p) },
];

export const validatePassword = (password: string): boolean => {
  return requirements.every((req) => req.test(password));
};

const PasswordRequirements = ({ password }: PasswordRequirementsProps) => {
  return (
    <div className="px-4 py-3 bg-muted/30 rounded-xl border border-border mb-5">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Requisitos de seguridad:
      </p>
      <ul className="space-y-1.5">
        {requirements.map((req, index) => {
          const isValid = req.test(password);
          return (
            <li key={index} className="flex items-center gap-2 text-xs">
              {isValid ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className={isValid ? 'text-green-600' : 'text-muted-foreground'}>
                {req.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordRequirements;
