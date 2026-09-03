import LogoIcon from "./LogoIcon";

interface LogoProps {
  /** Controla la altura del contenedor (ej: "h-10"). */
  className?: string;
  showText?: boolean;
}

const Logo = ({ className = "h-12", showText = true }: LogoProps) => {
  return (
    <a
      href="/"
      className={`flex items-center gap-3 group ml-4 ${className}`.trim()}
      aria-label="Ir al inicio"
    >
      <LogoIcon className="h-full w-auto transition-transform duration-200 group-hover:scale-105" />

      {showText && (
        <span className="text-2xl font-semibold tracking-tight text-foreground">
          Magnate
        </span>
      )}
    </a>
  );
};

export default Logo;
