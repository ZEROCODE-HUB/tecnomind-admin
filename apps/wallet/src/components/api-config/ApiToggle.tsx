import { Switch } from '@/components/ui/switch';

interface ApiToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const ApiToggle = ({ enabled, onToggle }: ApiToggleProps) => {
  return (
    <div className="flex items-center gap-4 bg-background rounded-[2rem] px-5 py-4 justify-between border border-border mb-6 shadow-lg shadow-muted/60">
      <div className="flex flex-col justify-center mr-2">
        <p className="text-foreground text-base font-bold leading-normal line-clamp-1">
          Habilitar acceso API
        </p>
        <p className="text-muted-foreground text-sm font-normal leading-normal mt-1">
          Permite interacciones externas con tu cuenta.
        </p>
      </div>
      <div className="shrink-0">
        <Switch 
          checked={enabled} 
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-primary"
        />
      </div>
    </div>
  );
};

export default ApiToggle;
