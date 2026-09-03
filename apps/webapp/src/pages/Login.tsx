import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Handshake, Zap, Lock, User, Loader2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LogoIcon from "@/components/LogoIcon";
import FeatureCard from "@/components/login/FeatureCard";
import { useToast } from "@/hooks/use-toast";
import { PIN_LENGTH } from "@/constants/app";
import { useAuth } from "@/presentation/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, loading: authLoading } = useAuth(); // Hook de autenticación real
  const [showSuspendedAlert, setShowSuspendedAlert] = useState(false);

  useEffect(() => {
    if (searchParams.get("reason") === "suspended") {
      setShowSuspendedAlert(true);
    }
  }, [searchParams]);

  // [V3.1] Redirect logic with extra strict verification
  useEffect(() => {
    if (!authLoading && isAuthenticated) {

      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Authentication logic simplified for all platforms

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

    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese su contraseña.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        toast({
          title: "Bienvenido",
          description: "Has iniciado sesión correctamente.",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Error de autenticación",
          description: result.error || "No se pudo iniciar sesión",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-background p-4 gap-4">
        <Loader2 className="size-12 animate-spin text-accent" />
        <p className="text-muted-foreground animate-pulse font-medium">Verificando sesión (V3.1)...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-background p-4">
      <div className="relative flex h-full min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col bg-card rounded-2xl shadow-elevated overflow-hidden md:min-h-[700px]">
        {/* Header */}
        <header className="flex items-center bg-card p-4 pb-0 justify-between">
          <LogoIcon className="h-10 w-10" />
          <h1 className="text-foreground text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
            Magnate
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
                  placeholder="ejemplo@magnate.com"
                  className="h-12 pl-10 rounded-xl bg-background border-border focus:border-accent"
                  disabled={isLoading}
                  autoComplete="email"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </Label>
          </div>

          {/* Password Section - Desktop Only */}
          <div className="px-6 pb-6">
            <Label htmlFor="password" title="password-label" className="flex flex-col w-full">
              <span className="text-muted-foreground text-sm font-medium leading-normal pb-2 ml-1">
                Contraseña
              </span>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  className="h-12 pl-10 rounded-xl bg-background border-border focus:border-accent"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </Label>
          </div>

          {/* PIN Section - Mobile Only */}
          {/* Submit Section */}
          <div className="px-6 flex flex-col items-center">

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
            </div>

            <p className="text-muted-foreground text-[10px] mt-8 font-medium">
              v2.4.0 Secure Build (V3.1)
            </p>
          </div>
        </form>
      </div>

      <AlertDialog open={showSuspendedAlert} onOpenChange={setShowSuspendedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <Ban className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center text-xl">Cuenta Suspendida</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Tu cuenta ha sido suspendida temporalmente debido a actividad inusual o violación de nuestros términos.
              <br /><br />
              Por favor, contacta a soporte para más información.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={() => setShowSuspendedAlert(false)} className="w-full sm:w-auto">
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Login;
