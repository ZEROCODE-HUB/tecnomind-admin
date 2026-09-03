import { useRef } from "react";
import { ArrowLeft, Copy, Download, Share2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import { CodigoQR, descargarQR } from "@/components/CodigoQR";
import { useAuth } from "@/contexts/AuthContext";
import { useCuenta, useQrCuenta } from "@/hooks/useAccount";

/**
 * Datos de cuenta para recibir dinero.
 *
 * Antes esta pantalla mostraba un CVU, un alias y un titular fijos en el
 * código, y un QR que era un dibujo. Un cliente que compartiera esos
 * datos habría estado pidiendo que le pagaran a una cuenta inexistente.
 */
const ShareCVU = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: cuenta, isLoading, isError } = useCuenta();
  const { data: qrData } = useQrCuenta();
  const contenedorQR = useRef<HTMLDivElement>(null);

  const titular = user?.name ?? "—";

  const textoParaCompartir = cuenta
    ? `Titular: ${titular}\nCVU: ${cuenta.cvu}\nAlias: ${cuenta.alias}\nCBU: ${cuenta.cbu}`
    : "";

  const handleCopyData = async () => {
    if (!cuenta) return;
    try {
      await navigator.clipboard.writeText(textoParaCompartir);
      toast({
        title: "¡Datos copiados con éxito!",
        description: "Los datos de tu cuenta fueron copiados al portapapeles.",
      });
    } catch {
      toast({
        title: "Error al copiar",
        description: "No se pudieron copiar los datos. Intentá de nuevo.",
        variant: "destructive",
      });
    }
  };

  /** Comparte por la hoja nativa si existe; si no, copia. */
  const handleShare = async () => {
    if (!cuenta) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Mis datos de cuenta", text: textoParaCompartir });
        return;
      } catch {
        // El usuario canceló la hoja de compartir: no es un error.
        return;
      }
    }
    void handleCopyData();
  };

  const handleDownloadQR = () => {
    const canvas = contenedorQR.current?.querySelector("canvas") ?? null;
    if (descargarQR(canvas, `cvu-${cuenta?.alias ?? "cuenta"}`)) {
      toast({
        title: "Imagen guardada",
        description: "El código QR se descargó en tu dispositivo.",
      });
    } else {
      toast({
        title: "El QR todavía no está listo",
        description: "Esperá a que termine de generarse.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center size-10 rounded-full hover:bg-muted transition-colors"
            aria-label="Volver al dashboard"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </button>

          <h1 className="text-lg font-semibold text-foreground">Mis datos de cuenta</h1>

          <Logo className="h-8" showText={false} />
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-md mx-auto w-full">
        {isLoading ? (
          <Card className="p-10 rounded-3xl flex justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </Card>
        ) : isError || !cuenta ? (
          <Card className="p-8 rounded-3xl text-center space-y-2">
            <p className="font-semibold text-foreground">No pudimos cargar tu cuenta</p>
            <p className="text-sm text-muted-foreground">
              Revisá tu conexión y volvé a intentar.
            </p>
          </Card>
        ) : (
          <>
            <Card className="p-6 rounded-3xl shadow-lg bg-card border-border">
              <div className="flex flex-col items-center space-y-6">
                <div
                  ref={contenedorQR}
                  className="w-56 h-56 bg-white rounded-2xl p-4 shadow-inner flex items-center justify-center"
                >
                  {/* El contenido lo define la base, no el cliente: así el
                      lector de la app entiende lo que otro comparte. */}
                  <CodigoQR valor={qrData ?? null} tamano={192} />
                </div>

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

            <Card className="p-6 rounded-3xl shadow-lg bg-card border-border space-y-5">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Titular
                  </span>
                  <p className="text-foreground font-semibold text-lg">{titular}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    CVU
                  </span>
                  <p className="text-foreground font-mono text-base break-all">{cuenta.cvu}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    CBU
                  </span>
                  <p className="text-foreground font-mono text-base break-all">{cuenta.cbu}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Alias
                  </span>
                  <p className="text-accent font-semibold text-base">{cuenta.alias}</p>
                </div>
              </div>

              <Button
                onClick={handleCopyData}
                className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base gap-2"
              >
                <Copy className="size-5" />
                Copiar datos
              </Button>
            </Card>

            <Button
              variant="outline"
              onClick={handleShare}
              className="w-full h-14 rounded-xl border-border text-foreground font-semibold text-base gap-2 hover:border-accent hover:text-accent"
            >
              <Share2 className="size-5" />
              Compartir
            </Button>
          </>
        )}
      </main>
    </div>
  );
};

export default ShareCVU;
