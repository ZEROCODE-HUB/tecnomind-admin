import logoOscuro from "@/assets/tecnomindlogo-dark.png";
import logoBlanco from "@/assets/tecnomindlogo-white.png";

interface LogoIconProps {
  className?: string;
  /** `white` para fondos oscuros (landing, splash). */
  variant?: "dark" | "white";
}

/**
 * Isotipo de TecnoMind.
 *
 * Antes era un SVG dibujado a mano con la "M" de Magnate. Se reemplaza
 * por el logo real, el mismo archivo que ya usa el backoffice, para que
 * las dos superficies del producto muestren la misma marca.
 */
const LogoIcon = ({ className = "h-14 w-14", variant = "dark" }: LogoIconProps) => {
  return (
    <img
      src={variant === "white" ? logoBlanco : logoOscuro}
      alt="TecnoMind"
      // object-contain: el logo no es cuadrado y los usos heredados le
      // pasan clases cuadradas (h-14 w-14); sin esto se deforma.
      className={`object-contain ${className}`}
    />
  );
};

export default LogoIcon;
