import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutModal = ({ isOpen, onClose, onConfirm }: LogoutModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-xl p-6 w-full max-w-sm border border-border animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <LogOut className="size-8 text-destructive" />
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-foreground">¿Cerrar sesión?</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Tendrás que volver a ingresar tu PIN para acceder a tu cuenta.
            </p>
          </div>

          <div className="flex gap-3 w-full mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={onConfirm}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
