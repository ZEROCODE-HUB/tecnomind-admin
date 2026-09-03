export function TecnoMindWordmark({
  className = "",
  size = 30,
  variant = "dark",
}: {
  className?: string;
  size?: number;
  variant?: "dark" | "white";
}) {
  const isWhite = variant === "white";
  return (
    <span
      className={`relative inline-flex items-baseline select-none ${className}`}
      style={{ fontSize: size, lineHeight: 1 }}
      aria-label="TecnoMind"
    >
      <span
        className="font-display-serif italic tracking-[0.02em]"
        style={{
          fontWeight: 500,
          backgroundImage: isWhite
            ? "linear-gradient(180deg, #ffffff 0%, #c9d4ea 100%)"
            : "linear-gradient(180deg, #1a244d 0%, #324595 120%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }}
      >
        Tecno
      </span>
      <span
        className="font-display-serif tracking-[0.02em]"
        style={{
          fontWeight: 700,
          backgroundImage: isWhite
            ? "linear-gradient(180deg, #ffbe8a 0%, #f97316 100%)"
            : "linear-gradient(180deg, #fb923c 0%, #ea580c 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }}
      >
        Mind
      </span>
      <span
        className="absolute -bottom-[0.08em] left-0 h-[1.5px] w-full rounded-full"
        style={{
          backgroundImage: isWhite
            ? "linear-gradient(90deg, rgba(249,115,22,0) 0%, #f97316 50%, rgba(249,115,22,0) 100%)"
            : "linear-gradient(90deg, rgba(234,88,12,0) 0%, #ea580c 50%, rgba(234,88,12,0) 100%)",
        }}
      />
    </span>
  );
}
