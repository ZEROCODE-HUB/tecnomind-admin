import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

/**
 * Código QR real.
 *
 * Reemplaza al dibujo decorativo que había antes: era un SVG con forma de
 * QR que no codificaba nada, así que la pantalla ofrecía "compartir" y
 * "descargar" algo que ningún lector podía leer.
 *
 * Se dibuja sobre un canvas para poder exportarlo como PNG.
 */
export function CodigoQR({
  valor,
  tamano = 224,
  className = "",
}: {
  /** Texto que se codifica. Null mientras carga. */
  valor: string | null;
  tamano?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!valor || !canvasRef.current) return;
    let vigente = true;

    QRCode.toCanvas(canvasRef.current, valor, {
      width: tamano,
      margin: 1,
      // Nivel M: tolera algo de suciedad en pantalla o impresión sin
      // agrandar demasiado la matriz.
      errorCorrectionLevel: "M",
      color: { dark: "#0A2540", light: "#FFFFFF" },
    })
      .then(() => vigente && setError(null))
      .catch((e: Error) => vigente && setError(e.message));

    return () => {
      vigente = false;
    };
  }, [valor, tamano]);

  if (!valor) {
    return (
      <div
        className={`rounded-2xl bg-muted animate-pulse ${className}`}
        style={{ width: tamano, height: tamano }}
        aria-label="Generando código QR"
      />
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-2xl bg-muted flex items-center justify-center p-4 text-center text-sm text-muted-foreground ${className}`}
        style={{ width: tamano, height: tamano }}
      >
        No se pudo generar el código QR.
      </div>
    );
  }

  return <canvas ref={canvasRef} className={className} aria-label="Código QR de la cuenta" />;
}

/** Descarga el canvas del QR como PNG. Devuelve false si todavía no está. */
export function descargarQR(canvas: HTMLCanvasElement | null, nombre: string) {
  if (!canvas) return false;
  const enlace = document.createElement("a");
  enlace.download = `${nombre}.png`;
  enlace.href = canvas.toDataURL("image/png");
  enlace.click();
  return true;
}
