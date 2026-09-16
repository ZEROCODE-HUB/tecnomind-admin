import wordmarkDark from "@/assets/burxia-wordmark.png";
import wordmarkWhite from "@/assets/burxia-wordmark-white.png";

/**
 * Wordmark de la marca (Burxia). Mantiene el nombre del componente para no
 * tocar sus usos; renderiza el logo del manual de marca (imagen).
 */
export function TecnoMindWordmark({
  className = "",
  size = 30,
  variant = "dark",
}: {
  className?: string;
  size?: number;
  variant?: "dark" | "white";
}) {
  return (
    <img
      src={variant === "white" ? wordmarkWhite : wordmarkDark}
      alt="Burxia"
      className={`select-none ${className}`}
      style={{ height: size, width: "auto", display: "block" }}
    />
  );
}
