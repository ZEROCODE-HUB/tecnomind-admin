import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, MailCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LogoIcon from "@/components/LogoIcon";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "sent">("email");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Por favor ingrese un correo electrónico válido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simular envío de email
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsLoading(false);
    setStep("sent");
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-background p-4">
      <div className="relative flex h-full min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col bg-card rounded-2xl shadow-elevated overflow-hidden md:min-h-[600px]">
        {/* Header */}
        <header className="flex items-center bg-card p-4 pb-2 justify-between border-b border-border">
          <button
            onClick={() => navigate("/login")}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2 flex-1 justify-center pr-7">
            <LogoIcon className="h-8 w-8" />
            <h1 className="text-foreground text-xl font-bold leading-tight tracking-[-0.015em]">
              Magnate
            </h1>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {step === "email" ? (
            <form onSubmit={handleSubmit} className="w-full max-w-sm animate-fade-in">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                  <KeyRound className="h-10 w-10 text-accent" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-foreground text-2xl font-bold text-center mb-2">
                Recuperar Contraseña
              </h2>
              <p className="text-muted-foreground text-sm text-center mb-8">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu PIN.
              </p>

              {/* Email Input */}
              <div className="flex flex-col gap-4 mb-6">
                <Label htmlFor="email" className="flex flex-col w-full">
                  <span className="text-muted-foreground text-sm font-medium leading-normal pb-2 ml-1">
                    Correo Electrónico
                  </span>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@magnate.com"
                      className="h-12 pl-10 rounded-xl bg-muted border-border focus:border-accent"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl font-bold shadow-lg shadow-accent/30 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isLoading ? "Enviando..." : "Enviar Enlace"}
              </Button>

              {/* Back to Login */}
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-muted-foreground hover:text-accent text-sm font-medium transition-colors"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          ) : (
            <div className="w-full max-w-sm text-center animate-fade-in">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center animate-scale-in">
                  <MailCheck className="h-12 w-12 text-green-500" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-foreground text-2xl font-bold mb-2">
                ¡Correo Enviado!
              </h2>
              <p className="text-muted-foreground text-sm mb-2">
                Hemos enviado un enlace de recuperación a:
              </p>
              <p className="text-accent font-semibold mb-6">
                {email}
              </p>
              <p className="text-muted-foreground text-xs mb-8 px-4">
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu PIN. Si no lo encuentras, revisa la carpeta de spam.
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full h-12 rounded-xl font-bold shadow-lg shadow-accent/30 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Ir al Login
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-muted-foreground hover:text-accent text-sm font-medium transition-colors"
                >
                  Usar otro correo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Version */}
        <p className="text-muted-foreground text-[10px] text-center pb-4 font-medium">
          v2.4.0 Secure Build
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
