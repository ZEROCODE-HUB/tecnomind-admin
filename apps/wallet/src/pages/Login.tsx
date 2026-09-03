import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Handshake, Zap, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LogoIcon from "@/components/LogoIcon";
import FeatureCard from "@/components/login/FeatureCard";
import PinIndicator from "@/components/login/PinIndicator";
import PinKeypad from "@/components/login/PinKeypad";
import { useToast } from "@/hooks/use-toast";
import { PIN_LENGTH } from "@/constants/app";
import { useAuth } from "@/contexts/AuthContext";

// Datos para las tarjetas de características
const features = [
  {
    icon: Shield,
    label: "Seguro",
    gradientClass: "bg-gradient-to-b from-accent/80 to-accent",
  },
  {
    icon: Handshake,
    label: "Confiable",
    gradientClass: "bg-gradient-to-b from-accent/70 to-accent/90",
  },
  {
    icon: Zap,
    label: "Eficaz",
    gradientClass: "bg-gradient-to-b from-accent/60 to-accent/80",
  },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { loginConDetalle } = useAuth();

  const handleDigitPress = (digit: string) => {
    if (pin.length < PIN_LENGTH) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese su correo electrónico.",
        variant: "destructive",
      });
      return;
    }

    // El PIN es la credencial en cualquier dispositivo: antes se pedía
    // contraseña en escritorio y PIN en móvil, pero esa contraseña no
    // existía en ningún lado.
    if (pin.length !== PIN_LENGTH) {
      toast({
        title: "Error",
        description: `Por favor ingrese su PIN de ${PIN_LENGTH} dígitos.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const resultado = await loginConDetalle(email, pin);
    setIsLoading(false);

    if (!resultado.ok) {
      setPin("");
      toast({
        title: "No pudimos iniciar sesión",
        description: resultado.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Bienvenido",
      description: "Has iniciado sesión correctamente.",
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-background p-4">
      <div className="relative flex h-full min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col bg-card rounded-2xl shadow-elevated overflow-hidden md:min-h-[700px]">
        {/* Header */}
        <header className="flex items-center bg-card p-4 pb-2 justify-between border-b border-border">
          <LogoIcon className="h-10 w-10" />
          <h1 className="text-foreground text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
            TecnoMind
          </h1>
        </header>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pb-6">
          {/* Feature Cards */}
          <div className="grid grid-cols-3 gap-3 p-4">
            {features.map((feature) => (
              <FeatureCard
                key={feature.label}
                icon={feature.icon}
                label={feature.label}
                gradientClass={feature.gradientClass}
              />
            ))}
          </div>

          {/* Email Input */}
          <div className="flex flex-col gap-4 px-6 pt-2 pb-4">
            <Label htmlFor="email" className="flex flex-col w-full">
              <span className="text-muted-foreground text-sm font-medium leading-normal pb-2 ml-1">
                Usuario
              </span>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@tecnomind.com"
                  className="h-12 pl-10 rounded-xl bg-muted border-border focus:border-accent"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </Label>
          </div>

          {/* PIN: es la credencial en todos los dispositivos */}
          <div className="bg-card rounded-t-3xl border-t border-border mt-2 flex-1 p-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-4 w-4 text-accent" />
              <p className="text-foreground text-sm font-semibold leading-normal text-center">
                Ingrese su PIN de {PIN_LENGTH} dígitos
              </p>
            </div>

            <div className="flex justify-center w-full mb-8">
              <div className="bg-muted border border-border rounded-xl px-6 py-4 shadow-inner flex gap-4">
                {Array.from({ length: PIN_LENGTH }).map((_, index) => (
                  <PinIndicator key={index} filled={index < pin.length} />
                ))}
              </div>
            </div>

            <div className="mb-8">
              <PinKeypad
                onDigitPress={handleDigitPress}
                onBackspace={handleBackspace}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-4 w-full">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl font-bold shadow-lg shadow-accent/30 bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-5 animate-spin mr-2" />
                    Ingresando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
              {/* Mobile: Link to /register */}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-accent hover:text-accent/80 text-sm font-medium transition-colors md:hidden"
              >
                ¿Nuevo usuario? Registrate aquí
              </button>
              {/* Desktop: Link to Google Play Store */}
              <a
                href="https://play.google.com/store"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent/80 text-sm font-medium transition-colors hidden md:block"
              >
                ¿Nuevo usuario? Registrate desde la app
              </a>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-muted-foreground hover:text-accent text-sm font-medium transition-colors"
              >
                ¿Olvidó su clave?
              </button>
            </div>

            {/* Version */}
            <p className="text-muted-foreground text-[10px] mt-8 font-medium">
              v2.4.0 Secure Build
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
