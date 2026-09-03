import { useNavigate } from 'react-router-dom';
import { MailCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';

interface StepConfirmationProps {
  email: string;
}

const StepConfirmation = ({ email }: StepConfirmationProps) => {
  const navigate = useNavigate();

  return (
    <div className="animate-scale-in flex flex-col items-center justify-center px-6 py-12 min-h-[60vh]">
      {/* Icono de éxito con animación */}
      <div className="relative mb-8">
        {/* Círculo de fondo con animación */}
        <div className="w-32 h-32 rounded-full bg-accent/10 flex items-center justify-center animate-pulse">
          <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center">
            <MailCheck className="h-12 w-12 text-accent" />
          </div>
        </div>
        
        {/* Badge de check */}
        <div className="absolute -right-1 -bottom-1 w-10 h-10 rounded-full bg-success flex items-center justify-center shadow-lg">
          <CheckCircle2 className="h-6 w-6 text-success-foreground" />
        </div>
      </div>

      {/* Título */}
      <h2 className="text-foreground text-2xl font-bold text-center mb-3">
        ¡Casi listo!
      </h2>

      {/* Subtítulo */}
      <p className="text-muted-foreground text-center max-w-sm mb-2">
        Enviamos un enlace de verificación a tu correo:
      </p>

      {/* Email destacado */}
      <div className="bg-accent/10 text-accent px-4 py-2 rounded-lg font-medium text-sm mb-6">
        {email || 'tu@email.com'}
      </div>

      {/* Instrucciones */}
      <div className="bg-muted/50 rounded-xl p-6 mb-8 max-w-sm w-full">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground text-sm flex items-center justify-center">
            !
          </span>
          Próximo paso
        </h4>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Por favor, confirma tu email para activar todas las funciones de tu billetera Magnate. 
          Revisa tu bandeja de entrada y haz clic en el enlace de verificación.
        </p>
      </div>

      {/* Botón de acción */}
      <button
        onClick={() => navigate('/login')}
        className="w-full max-w-sm bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-14 rounded-xl shadow-lg shadow-accent/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-lg"
      >
        Ir al Login
        <ArrowRight className="h-5 w-5" />
      </button>

      {/* Nota de spam */}
      <p className="text-muted-foreground text-xs text-center mt-6 max-w-sm">
        ¿No recibiste el correo? Revisa tu carpeta de spam o{' '}
        <button className="text-accent hover:underline">
          reenviar verificación
        </button>
      </p>
    </div>
  );
};

export default StepConfirmation;
