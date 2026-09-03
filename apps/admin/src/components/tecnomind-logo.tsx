import logoSrcDark from "@/assets/tecnomindlogo-dark.png";
import logoSrcWhite from "@/assets/tecnomindlogo-white.png";

export function TecnoMindLogo({
  className = "",
  size = 48,
  variant = "dark",
}: {
  className?: string;
  size?: number;
  variant?: "dark" | "white";
}) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src={variant === "white" ? logoSrcWhite : logoSrcDark}
        alt="TecnoMind"
        style={{ height: size, width: "auto", display: "block" }}
      />
    </div>
  );
}
