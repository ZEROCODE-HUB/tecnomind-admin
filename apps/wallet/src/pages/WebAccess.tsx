import { useState } from "react";
import { Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import PasswordInput from "@/components/api-config/PasswordInput";
import PasswordRequirements, { validatePassword } from "@/components/api-config/PasswordRequirements";
import SaveButton from "@/components/api-config/SaveButton";
import { Switch } from "@/components/ui/switch";
import { ShieldAlert } from "lucide-react";

const WebAccess = () => {
  const { toast } = useToast();
  const [webAccessEnabled, setWebAccessEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Simulates if user already has a saved password
  const [hasSavedPassword, setHasSavedPassword] = useState(true);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const passwordIsValid = validatePassword(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isDirty = passwordTouched || confirmPasswordTouched;
  const canSave = webAccessEnabled && passwordIsValid && passwordsMatch && isDirty;
  
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordTouched(true);
  };
  
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setConfirmPasswordTouched(true);
  };

  const handleSave = async () => {
    if (!canSave) return;

    console.log("Saving Web Access config:", {
      passwordLength: password.length,
    });

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setHasSavedPassword(true);
    setPasswordTouched(false);
    setConfirmPasswordTouched(false);
    setPassword("");
    setConfirmPassword("");
    toast({
      title: "Contraseña actualizada",
      description: "Tu contraseña de acceso web ha sido cambiada correctamente.",
    });
  };

  return (
    <AppLayout>
      <GlobalHeader
        title="Acceso Web"
        showBackButton
        showAvatar
        userName="Santiago García"
      />

      <main className="flex-1 flex flex-col px-4 pb-32">
        {/* Security Warning */}
        <div className="mt-4 mb-6 relative overflow-hidden rounded-2xl bg-background border border-amber-400/40 p-4 shadow-sm">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-500 rounded-full blur-2xl opacity-20" />
          <div className="flex gap-3">
            <ShieldAlert className="h-6 w-6 text-amber-500 shrink-0" />
            <div className="flex flex-col">
              <h4 className="text-amber-500 text-sm font-bold mb-1">Zona de Seguridad</h4>
              <p className="text-muted-foreground text-xs leading-relaxed font-medium">
                Esta contraseña permite el acceso directo a tu cuenta Magnate vía navegadores web. Mantenla segura.
              </p>
            </div>
          </div>
        </div>

        {/* Web Access Toggle */}
        <div className="flex items-center gap-4 bg-background rounded-[2rem] px-5 py-4 justify-between border border-border mb-6 shadow-lg shadow-muted/60">
          <div className="flex flex-col justify-center mr-2">
            <p className="text-foreground text-base font-bold leading-normal line-clamp-1">
              Habilitar acceso web
            </p>
            <p className="text-muted-foreground text-sm font-normal leading-normal mt-1">
              Permite iniciar sesión mediante usuario y contraseña en la versión de escritorio.
            </p>
          </div>
          <div className="shrink-0">
            <Switch 
              checked={webAccessEnabled} 
              onCheckedChange={setWebAccessEnabled}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        {/* Conditional Credentials Section */}
        {webAccessEnabled && (
          <>
            <div className="flex items-center gap-2 mb-4 px-1">
              <Key className="h-5 w-5 text-primary" />
              <h3 className="text-foreground text-lg font-bold leading-tight tracking-tight">
                Contraseña Web
              </h3>
            </div>

            <PasswordInput 
              label="Contraseña" 
              value={password} 
              onChange={handlePasswordChange}
              placeholder={hasSavedPassword && !passwordTouched ? "••••••••" : "Ingresa tu contraseña"}
            />
            
            {isDirty && <PasswordRequirements password={password} />}

            <PasswordInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder={hasSavedPassword && !confirmPasswordTouched ? "••••••••" : "Confirma tu contraseña"}
              showValidation={isDirty}
              isValid={passwordsMatch}
              errorMessage="Las contraseñas no coinciden"
            />

            {isDirty && (
              <button
                onClick={handleSave}
                disabled={!canSave || loading}
                className="w-full mt-4 py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-primary/90"
              >
                {loading ? "Guardando..." : "Cambiar contraseña"}
              </button>
            )}
          </>
        )}
      </main>
    </AppLayout>
  );
};

export default WebAccess;
