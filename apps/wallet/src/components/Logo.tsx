interface LogoProps {
  /** Controla la altura del contenedor (ej: "h-10"). */
  className?: string;
  /** Se conserva por compatibilidad; sin texto queda solo el enlace. */
  showText?: boolean;
}

/**
 * Marca en las cabeceras.
 *
 * Se usa texto y no el archivo de logo a propósito: el único asset de
 * marca disponible es un lockup apaisado (1044x569) que a la altura de
 * una cabecera (32 px) queda ilegible. El logo se reserva para las
 * superficies grandes — splash, login, comprobantes — a través de
 * LogoIcon. Cuando haya un isotipo cuadrado se puede volver a
 * combinarlos.
 */
const Logo = ({ className = "h-12", showText = true }: LogoProps) => {
  return (
    <a
      href="/"
      className={`flex items-center ml-4 group ${className}`.trim()}
      aria-label="Ir al inicio"
    >
      {showText && (
        <span className="text-2xl font-semibold tracking-tight text-foreground leading-none">
          TecnoMind
        </span>
      )}
    </a>
  );
};

export default Logo;
