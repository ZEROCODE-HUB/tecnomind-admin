interface LogoIconProps {
  className?: string;
}

/**
 * Isotipo SVG de Magnate - Letra M con flecha de crecimiento
 */
const LogoIcon = ({ className = "h-14 w-14" }: LogoIconProps) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Fondo redondeado azul oscuro */}
      <rect width="100" height="100" rx="20" className="fill-[#0A2540]" />
      
      {/* Pata izquierda de la M */}
      <path
        d="M18 75V30L32 44V75H18Z"
        fill="white"
      />
      
      {/* Diagonal izquierda de la M (hacia el centro) */}
      <path
        d="M18 30L50 58"
        stroke="white"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Pata derecha de la M */}
      <path
        d="M68 44V75H82V30L68 44Z"
        fill="white"
      />
      
      {/* Diagonal derecha de la M - en azul claro formando la flecha */}
      <path
        d="M50 58L75 22"
        stroke="#5BA3E8"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Punta de flecha */}
      <path
        d="M64 18H82V36"
        stroke="#5BA3E8"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default LogoIcon;
