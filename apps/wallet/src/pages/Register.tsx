import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProgressIndicator from '@/components/register/ProgressIndicator';
import StepFormData from '@/components/register/StepFormData';
import StepPinCreation from '@/components/register/StepPinCreation';
import StepConfirmation from '@/components/register/StepConfirmation';
import Logo from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  dni: string;
  cuit: string;
}

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    dni: '',
    cuit: '',
  });
  const [pin, setPin] = useState('');

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Validación del formulario
  const isFormValid = 
    formData.nombres.trim() !== '' &&
    formData.apellidos.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.telefono.trim() !== '' &&
    formData.dni.trim() !== '';

  const handleContinueToPin = () => {
    if (!isFormValid) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor, completa todos los campos obligatorios.",
      });
      return;
    }
    setStep(2);
  };

  const handlePinComplete = (createdPin: string) => {
    setPin(createdPin);
    // Aquí se enviaría la información al backend
    console.log('Registro completo:', { ...formData, pin: createdPin });
    toast({
      title: "PIN creado correctamente",
      description: "Tu cuenta está casi lista.",
    });
    setStep(3);
  };

  const handleBackToForm = () => {
    setStep(1);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background md:max-w-none">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center p-4 justify-between h-14 md:hidden">
          {step === 1 ? (
            <button
              onClick={() => navigate(-1)}
              className="text-foreground hover:bg-muted rounded-full p-2 -ml-2 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          ) : (
            <div className="w-[44px]" /> // Spacer
          )}
          <h2 className="text-foreground text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-8">
            {step === 1 && 'Crear Cuenta'}
            {step === 2 && 'PIN de Seguridad'}
            {step === 3 && 'Verificación'}
          </h2>
        </div>
        
        {/* Desktop header - Logo centrado */}
        <div className="hidden md:flex items-center justify-center p-4 h-16">
          <Logo className="h-8" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 md:flex md:justify-center">
        <div className="w-full md:max-w-lg md:py-8">
          {/* Progress indicator - Solo visible en paso 1 y 2 */}
          {step < 3 && (
            <ProgressIndicator currentStep={step} totalSteps={3} />
          )}

          {/* Contenido según el paso */}
          {step === 1 && (
            <StepFormData
              formData={formData}
              onChange={handleChange}
              onContinue={handleContinueToPin}
              isValid={isFormValid}
            />
          )}

          {step === 2 && (
            <StepPinCreation
              onComplete={handlePinComplete}
              onBack={handleBackToForm}
            />
          )}

          {step === 3 && (
            <StepConfirmation email={formData.email} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Register;
