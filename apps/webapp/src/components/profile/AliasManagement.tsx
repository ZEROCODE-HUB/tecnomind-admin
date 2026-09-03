import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AliasManagementProps {
  userCuit?: string;
}

const AliasManagement = ({ userCuit = "20123456789" }: AliasManagementProps) => {
  const [alias, setAlias] = useState(`magnate.${userCuit}`);
  const [originalAlias] = useState(`magnate.${userCuit}`);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "available" | "unavailable">("idle");

  const hasChanged = alias !== originalAlias;

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationStatus("idle");
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Simulate: available if alias contains user's CUIT
    const isAvailable = alias.includes(userCuit) || Math.random() > 0.3;
    setVerificationStatus(isAvailable ? "available" : "unavailable");
    setIsVerifying(false);
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    
    // Simulate API call to save the alias
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Alias actualizado correctamente");
    setVerificationStatus("idle");
    setIsConfirming(false);
  };

  const handleAliasChange = (value: string) => {
    setAlias(value.toLowerCase().replace(/[^a-z0-9.]/g, ""));
    setVerificationStatus("idle");
  };

  return (
    <section className="md:hidden bg-card border border-border rounded-2xl p-4 mx-4 mt-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Administración de Alias
      </h3>
      
      <div className="flex gap-2">
        <Input
          value={alias}
          onChange={(e) => handleAliasChange(e.target.value)}
          placeholder="magnate.tucuit"
          className="flex-1 bg-muted/50 border-border rounded-xl"
        />
        <Button
          onClick={handleVerify}
          disabled={isVerifying || !alias || !hasChanged || verificationStatus === "available"}
          variant={verificationStatus === "available" ? "outline" : "default"}
          className="rounded-xl px-4 min-w-[100px]"
        >
          {isVerifying ? (
            <Loader2 className="size-4 animate-spin" />
          ) : verificationStatus === "available" ? (
            <Check className="size-4 text-green-600" />
          ) : (
            "Verificar"
          )}
        </Button>
      </div>

      {verificationStatus === "available" && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400 px-3 py-2 rounded-xl">
            <Check className="size-4" />
            <span>Alias Disponible</span>
          </div>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="w-full rounded-xl"
          >
            {isConfirming ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : null}
            Confirmar Cambio
          </Button>
        </div>
      )}

      {verificationStatus === "unavailable" && (
        <div className="flex items-center gap-2 mt-3 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">
          <X className="size-4" />
          <span>Alias no disponible. Intenta con otro.</span>
        </div>
      )}

      {!hasChanged && verificationStatus === "idle" && (
        <p className="text-xs text-muted-foreground mt-3">
          Modifica el alias para verificar disponibilidad.
        </p>
      )}
    </section>
  );
};

export default AliasManagement;
