import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface SaveButtonProps {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

const SaveButton = ({ loading, disabled, onClick }: SaveButtonProps) => {
  const { collapsed } = useSidebar();

  return (
    <div className={cn(
      "fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-background via-background to-transparent pt-8 z-20 transition-all duration-300",
      collapsed ? "md:pl-16" : "md:pl-64"
    )}>
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all text-primary-foreground h-14 rounded-full font-bold text-lg shadow-[0_4px_14px_rgba(47,128,237,0.4)] flex items-center justify-center disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Guardando...
          </>
        ) : (
          'Guardar Configuración'
        )}
      </Button>
    </div>
  );
};

export default SaveButton;
