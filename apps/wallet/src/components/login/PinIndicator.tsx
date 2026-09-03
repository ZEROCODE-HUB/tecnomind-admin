import { cn } from "@/lib/utils";

interface PinIndicatorProps {
  filled: boolean;
}

const PinIndicator = ({ filled }: PinIndicatorProps) => {
  return (
    <div
      className={cn(
        "h-4 w-4 rounded-full transition-colors duration-200",
        filled ? "bg-accent" : "bg-muted"
      )}
    />
  );
};

export default PinIndicator;
