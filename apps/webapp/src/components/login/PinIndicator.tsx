interface PinIndicatorProps {
    filled: boolean;
  }
  
  const PinIndicator = ({ filled }: PinIndicatorProps) => {
    return (
      <div
        className={`
          w-4 h-4 rounded-full border-2 transition-all duration-300
          ${
            filled
              ? "bg-accent border-accent scale-110 shadow-[0_0_10px_rgba(255,255,255,0.4)]"
              : "bg-transparent border-muted-foreground/30 scale-100"
          }
        `}
      />
    );
  };
  
  export default PinIndicator;
