import { useState } from "react";
import { Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import SecurityWarning from "@/components/api-config/SecurityWarning";
import ApiToggle from "@/components/api-config/ApiToggle";
import ApiUsernameInput from "@/components/api-config/ApiUsernameInput";
import PasswordInput from "@/components/api-config/PasswordInput";
import PasswordRequirements, { validatePassword } from "@/components/api-config/PasswordRequirements";
import IpWhitelist from "@/components/api-config/IpWhitelist";
import SaveButton from "@/components/api-config/SaveButton";

const ApiConfig = () => {
  const { toast } = useToast();
  const [apiEnabled, setApiEnabled] = useState(false);
  const [usernameSuffix, setUsernameSuffix] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [whitelistedIps, setWhitelistedIps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Simulates if user already has a saved password
  const [hasSavedPassword, setHasSavedPassword] = useState(true);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Simulated user ID
  const userId = "8291";
  
  const passwordIsValid = validatePassword(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const hasValidUsername = usernameSuffix.length >= 3;
  const isDirty = passwordTouched || confirmPasswordTouched;
  const canSavePassword = apiEnabled && passwordIsValid && passwordsMatch && isDirty;
  const canSaveConfig = apiEnabled && hasValidUsername;
  
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordTouched(true);
  };
  
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setConfirmPasswordTouched(true);
  };
  
  const handleChangePassword = async () => {
    if (!canSavePassword) return;

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
      description: "Tu contraseña de API ha sido cambiada correctamente.",
    });
  };

  const handleSave = async () => {
    if (!canSaveConfig) return;

    const fullUsername = `mag_${userId}_${usernameSuffix}`;
    
    console.log("Saving API config:", {
      username: fullUsername,
      whitelistedIps,
    });

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    toast({
      title: "Configuración guardada",
      description: "Tu configuración de API ha sido actualizada correctamente.",
    });
  };

  return (
    <AppLayout>
      <GlobalHeader
        title="Configuración API"
        showBackButton
        showAvatar
        userName="Santiago García"
      />

      <main className="flex-1 flex flex-col px-4 pb-32">
        <SecurityWarning />

        <ApiToggle enabled={apiEnabled} onToggle={setApiEnabled} />

        {apiEnabled && (
          <>
            {/* Credentials Section */}
            <div className="flex items-center gap-2 mb-4 px-1">
              <Key className="h-5 w-5 text-primary" />
              <h3 className="text-foreground text-lg font-bold leading-tight tracking-tight">
                Credenciales de Acceso
              </h3>
            </div>

            <ApiUsernameInput 
              userId={userId} 
              suffix={usernameSuffix} 
              onSuffixChange={setUsernameSuffix} 
            />

            <PasswordInput 
              label="Contraseña API" 
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
                onClick={handleChangePassword}
                disabled={!canSavePassword || loading}
                className="w-full mt-4 mb-4 py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-primary/90"
              >
                {loading ? "Guardando..." : "Cambiar contraseña"}
              </button>
            )}

            <IpWhitelist 
              ips={whitelistedIps} 
              onIpsChange={setWhitelistedIps} 
            />

            {/* Security Help Text */}
            <div className="mt-2 px-4 py-3 bg-muted/50 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Importante:</span> Tu
                clave API es como la llave de tu cuenta. Nunca la compartas en chats,
                correos o sitios web. Si sospechas que fue comprometida, cámbiala
                inmediatamente.
              </p>
            </div>
          </>
        )}
      </main>

      <SaveButton loading={loading} disabled={!canSaveConfig} onClick={handleSave} />
    </AppLayout>
  );
};

export default ApiConfig;
