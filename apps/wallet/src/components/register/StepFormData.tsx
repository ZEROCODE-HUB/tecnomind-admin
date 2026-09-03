import { Link } from 'react-router-dom';
import { Mail, Smartphone, Lock, ArrowRight } from 'lucide-react';
import FormInput from './FormInput';
import BiometricCard from './BiometricCard';

interface FormData {
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  dni: string;
  cuit: string;
}

interface StepFormDataProps {
  formData: FormData;
  onChange: (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContinue: () => void;
  isValid: boolean;
}

const StepFormData = ({ formData, onChange, onContinue, isValid }: StepFormDataProps) => {
  return (
    <div className="animate-fade-in">
      {/* Section header */}
      <div className="px-6 mb-6">
        <h3 className="text-foreground tracking-tight text-2xl font-bold leading-tight mb-2">
          Datos Personales
        </h3>
        <p className="text-muted-foreground text-sm font-normal leading-relaxed">
          Completa tu información para configurar tu perfil de inversor en TecnoMind.
        </p>
      </div>

      {/* Form */}
      <form className="flex flex-col gap-5 px-6" onSubmit={(e) => e.preventDefault()}>
        {/* Nombres y Apellidos */}
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Nombres"
            placeholder="Juan"
            value={formData.nombres}
            onChange={onChange('nombres')}
            autoComplete="given-name"
          />
          <FormInput
            label="Apellidos"
            placeholder="Pérez"
            value={formData.apellidos}
            onChange={onChange('apellidos')}
            autoComplete="family-name"
          />
        </div>

        {/* Email */}
        <FormInput
          label="Email Corporativo"
          icon={Mail}
          type="email"
          placeholder="nombre@empresa.com"
          value={formData.email}
          onChange={onChange('email')}
          autoComplete="email"
        />

        {/* Teléfono */}
        <FormInput
          label="Teléfono Móvil"
          icon={Smartphone}
          type="tel"
          placeholder="+54 9 11 1234 5678"
          value={formData.telefono}
          onChange={onChange('telefono')}
          autoComplete="tel"
        />

        {/* DNI y CUIT */}
        <div className="grid grid-cols-1 gap-5 pt-2">
          <FormInput
            label="DNI"
            placeholder="00.000.000"
            inputMode="numeric"
            value={formData.dni}
            onChange={onChange('dni')}
            rightLabel={
              <span className="text-xs text-accent font-medium flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" /> Seguro
              </span>
            }
          />
          <FormInput
            label="CUIT / CUIL"
            placeholder="00-00000000-0"
            inputMode="numeric"
            value={formData.cuit}
            onChange={onChange('cuit')}
          />
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border/60 my-2" />

        {/* Biometric Card */}
        <BiometricCard />

        {/* Terms */}
        <div className="text-center pb-8 pt-2">
          <p className="text-xs text-muted-foreground">
            Al continuar, aceptas los{' '}
            <Link to="#" className="text-accent hover:underline">
              Términos de Servicio
            </Link>{' '}
            y la{' '}
            <Link to="#" className="text-accent hover:underline">
              Política de Privacidad
            </Link>{' '}
            de TecnoMind.
          </p>
        </div>
      </form>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-background/95 border-t border-border/50 backdrop-blur-sm md:static md:border-t-0 md:max-w-lg md:mx-auto md:w-full">
        <button
          type="button"
          onClick={onContinue}
          disabled={!isValid}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-14 rounded-xl shadow-lg shadow-accent/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-lg min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default StepFormData;
