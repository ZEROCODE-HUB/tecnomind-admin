import { ArrowLeft, Copy, Download, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";

const ShareCVU = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const accountData = {
    titular: "Santiago Magnate",
    cvu: "0000003100012345678901",
    alias: "magnate.startup.app",
  };

  const handleCopyData = async () => {
    const textToCopy = `Titular: ${accountData.titular}\nCVU: ${accountData.cvu}\nAlias: ${accountData.alias}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: "¡Datos copiados con éxito!",
        description: "Los datos de tu cuenta fueron copiados al portapapeles.",
      });
    } catch (error) {
      toast({
        title: "Error al copiar",
        description: "No se pudieron copiar los datos. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQR = () => {
    toast({
      title: "Imagen guardada",
      description: "El código QR se ha guardado en tu dispositivo.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center size-10 rounded-full hover:bg-muted transition-colors"
            aria-label="Volver al dashboard"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </button>

          <h1 className="text-lg font-semibold text-foreground">
            Mis datos de cuenta
          </h1>

          <Logo className="h-8" showText={false} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 space-y-6 max-w-md mx-auto w-full">
        {/* QR Card */}
        <Card className="p-6 rounded-3xl shadow-lg bg-card border-border">
          <div className="flex flex-col items-center space-y-6">
            {/* QR Code Placeholder */}
            <div className="relative">
              <div className="w-56 h-56 bg-white rounded-2xl p-4 shadow-inner flex items-center justify-center">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full"
                  fill="currentColor"
                >
                  {/* Simulated QR Code Pattern */}
                  <rect x="0" y="0" width="200" height="200" fill="white" />
                  
                  {/* Corner squares */}
                  <rect x="10" y="10" width="50" height="50" fill="#0A2540" />
                  <rect x="17" y="17" width="36" height="36" fill="white" />
                  <rect x="24" y="24" width="22" height="22" fill="#0A2540" />
                  
                  <rect x="140" y="10" width="50" height="50" fill="#0A2540" />
                  <rect x="147" y="17" width="36" height="36" fill="white" />
                  <rect x="154" y="24" width="22" height="22" fill="#0A2540" />
                  
                  <rect x="10" y="140" width="50" height="50" fill="#0A2540" />
                  <rect x="17" y="147" width="36" height="36" fill="white" />
                  <rect x="24" y="154" width="22" height="22" fill="#0A2540" />
                  
                  {/* Pattern blocks */}
                  <rect x="70" y="10" width="10" height="10" fill="#0A2540" />
                  <rect x="90" y="10" width="10" height="10" fill="#0A2540" />
                  <rect x="110" y="10" width="10" height="10" fill="#0A2540" />
                  <rect x="70" y="30" width="10" height="10" fill="#0A2540" />
                  <rect x="100" y="30" width="10" height="10" fill="#0A2540" />
                  <rect x="120" y="30" width="10" height="10" fill="#0A2540" />
                  <rect x="80" y="50" width="10" height="10" fill="#0A2540" />
                  <rect x="110" y="50" width="10" height="10" fill="#0A2540" />
                  
                  <rect x="10" y="70" width="10" height="10" fill="#0A2540" />
                  <rect x="30" y="70" width="10" height="10" fill="#0A2540" />
                  <rect x="50" y="70" width="10" height="10" fill="#0A2540" />
                  <rect x="70" y="70" width="10" height="10" fill="#0A2540" />
                  <rect x="90" y="70" width="10" height="10" fill="#0A2540" />
                  <rect x="110" y="70" width="10" height="10" fill="#0A2540" />
                  <rect x="130" y="70" width="10" height="10" fill="#0A2540" />
                  <rect x="150" y="70" width="10" height="10" fill="#0A2540" />
                  <rect x="170" y="70" width="10" height="10" fill="#0A2540" />
                  
                  <rect x="10" y="90" width="10" height="10" fill="#0A2540" />
                  <rect x="40" y="90" width="10" height="10" fill="#0A2540" />
                  <rect x="80" y="90" width="20" height="20" fill="#2F80ED" />
                  <rect x="120" y="90" width="10" height="10" fill="#0A2540" />
                  <rect x="160" y="90" width="10" height="10" fill="#0A2540" />
                  <rect x="180" y="90" width="10" height="10" fill="#0A2540" />
                  
                  <rect x="10" y="110" width="10" height="10" fill="#0A2540" />
                  <rect x="30" y="110" width="10" height="10" fill="#0A2540" />
                  <rect x="50" y="110" width="10" height="10" fill="#0A2540" />
                  <rect x="120" y="110" width="10" height="10" fill="#0A2540" />
                  <rect x="140" y="110" width="10" height="10" fill="#0A2540" />
                  <rect x="160" y="110" width="10" height="10" fill="#0A2540" />
                  <rect x="180" y="110" width="10" height="10" fill="#0A2540" />
                  
                  <rect x="70" y="130" width="10" height="10" fill="#0A2540" />
                  <rect x="90" y="130" width="10" height="10" fill="#0A2540" />
                  <rect x="110" y="130" width="10" height="10" fill="#0A2540" />
                  <rect x="140" y="140" width="50" height="50" fill="none" stroke="#0A2540" strokeWidth="4" />
                  <rect x="155" y="155" width="20" height="20" fill="#0A2540" />
                  
                  <rect x="70" y="150" width="10" height="10" fill="#0A2540" />
                  <rect x="100" y="150" width="10" height="10" fill="#0A2540" />
                  <rect x="120" y="150" width="10" height="10" fill="#0A2540" />
                  <rect x="70" y="170" width="10" height="10" fill="#0A2540" />
                  <rect x="90" y="170" width="10" height="10" fill="#0A2540" />
                  <rect x="110" y="170" width="10" height="10" fill="#0A2540" />
                  <rect x="70" y="180" width="10" height="10" fill="#0A2540" />
                  <rect x="100" y="180" width="10" height="10" fill="#0A2540" />
                </svg>
              </div>
            </div>

            {/* Download Button */}
            <Button
              variant="ghost"
              onClick={handleDownloadQR}
              className="text-muted-foreground hover:text-accent gap-2"
            >
              <Download className="size-5" />
              Descargar QR
            </Button>
          </div>
        </Card>

        {/* Account Data Card */}
        <Card className="p-6 rounded-3xl shadow-lg bg-card border-border space-y-5">
          <div className="space-y-4">
            {/* Titular */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Titular
              </span>
              <p className="text-foreground font-semibold text-lg">
                {accountData.titular}
              </p>
            </div>

            {/* CVU */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                CVU
              </span>
              <p className="text-foreground font-mono text-base break-all">
                {accountData.cvu}
              </p>
            </div>

            {/* Alias */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Alias
              </span>
              <p className="text-accent font-semibold text-base">
                {accountData.alias}
              </p>
            </div>
          </div>

          {/* Copy Button */}
          <Button
            onClick={handleCopyData}
            className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base gap-2"
          >
            <Copy className="size-5" />
            Copiar datos
          </Button>
        </Card>

        {/* Share Button */}
        <Button
          variant="outline"
          onClick={handleCopyData}
          className="w-full h-14 rounded-xl border-border text-foreground font-semibold text-base gap-2 hover:border-accent hover:text-accent"
        >
          <Share2 className="size-5" />
          Compartir
        </Button>
      </main>
    </div>
  );
};

export default ShareCVU;
