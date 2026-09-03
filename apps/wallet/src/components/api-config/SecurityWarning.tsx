import { ShieldAlert } from 'lucide-react';

const SecurityWarning = () => {
  return (
    <div className="mt-4 mb-6 relative overflow-hidden rounded-2xl bg-background border border-amber-400/40 p-4 shadow-sm">
      <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-500 rounded-full blur-2xl opacity-20" />
      <div className="flex gap-3">
        <ShieldAlert className="h-6 w-6 text-amber-500 shrink-0" />
        <div className="flex flex-col">
          <h4 className="text-amber-500 text-sm font-bold mb-1">Zona de Seguridad</h4>
          <p className="text-muted-foreground text-xs leading-relaxed font-medium">
            Estas credenciales otorgan acceso completo a tu cuenta Magnate. No las compartas con nadie que no sea de tu absoluta confianza.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityWarning;
