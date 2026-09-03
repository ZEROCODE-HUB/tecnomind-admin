import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

const ApiConfigHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center px-4 pt-6 pb-2 justify-between sticky top-0 z-10 bg-background/95 backdrop-blur-md">
      <button 
        onClick={() => navigate(-1)}
        className="text-foreground flex size-12 shrink-0 items-center justify-center rounded-full active:bg-muted hover:bg-muted/50 transition-colors"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
      <h2 className="text-foreground text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12">
        Configuración API
      </h2>
      <div className="hidden md:block absolute right-4">
        <Logo className="h-8" showText={false} />
      </div>
    </div>
  );
};

export default ApiConfigHeader;
