import logoSrc from "@/assets/burxia-isotipo.png";

/**
 * Isotipo de la marca (Burxia, "BX"). Mantiene el nombre del componente para no
 * tocar sus usos.
 */
export function TecnoMindLogo({
  className = "",
  size = 48,
}: {
  className?: string;
  size?: number;
  variant?: "dark" | "white";
}) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src={logoSrc}
        alt="Burxia"
        style={{ height: size, width: "auto", display: "block" }}
      />
    </div>
  );
}
