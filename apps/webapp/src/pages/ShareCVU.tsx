import { ArrowLeft, Copy, Download, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const ShareCVU = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, account } = useAuth();
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  useEffect(() => {
    const fetchQr = async () => {
      if (!account?.id) return;

      setIsLoadingQr(true);
      try {
        const { data, error } = await supabase
          .from('qr_codes')
          .select('qr_data')
          .eq('account_id', account.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error supabase fetching QR:', error);
        }

        if (data && data.qr_data) {
          setQrValue(data.qr_data);
        }
      } catch (e) {
        console.error('Error fetching QR:', e);
      } finally {
        setIsLoadingQr(false);
      }
    };

    fetchQr();
  }, [account?.id]);

  const fullName = user ? `${user.first_name} ${user.last_name}` : "Usuario";
  const accountData = {
    titular: fullName,
    cvu: account?.cvu || "No disponible",
    alias: account?.alias || "No disponible",
    cbu: account?.cbu || "No disponible",
  };

  const handleCopyData = async () => {
    const textToCopy = `Titular: ${accountData.titular}\nCVU: ${accountData.cvu}\nAlias: ${accountData.alias}\nCBU: ${accountData.cbu}`;

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
    const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_${accountData.alias.replace(/\./g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      toast({
        title: "QR Descargado",
        description: "La imagen se ha guardado en tu dispositivo.",
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo generar la imagen para descargar.",
        variant: "destructive",
      });
    }
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
            {/* QR Code Display */}
            <div className="relative">
              <div className="w-56 h-56 bg-white rounded-2xl p-4 shadow-inner flex items-center justify-center">
                {isLoadingQr ? (
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="w-40 h-40 bg-gray-200 rounded-md"></div>
                  </div>
                ) : qrValue ? (
                  <QRCodeCanvas
                    id="qr-code-canvas"
                    value={qrValue}
                    size={180}
                    level={"H"}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p className="text-sm font-medium">QR no disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Download Button */}
            <Button
              variant="ghost"
              onClick={handleDownloadQR}
              disabled={!qrValue}
              className="text-muted-foreground gap-2 hover:bg-transparent hover:text-muted-foreground"
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

            {/* CBU */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                CBU
              </span>
              <p className="text-foreground font-mono text-base break-all">
                {accountData.cbu}
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


      </main>
    </div>
  );
};

export default ShareCVU;
