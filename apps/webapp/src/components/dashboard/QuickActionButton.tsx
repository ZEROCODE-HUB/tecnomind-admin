import { LucideIcon } from "lucide-react";

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  isPrimary?: boolean;
  onClick?: () => void;
}

const QuickActionButton = ({ icon: Icon, label, isPrimary = false, onClick }: QuickActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col items-center gap-2 group min-w-[44px] min-h-[44px]"
    >
      <div
        className={`size-16 rounded-2xl flex items-center justify-center transition-transform active:scale-95 ${isPrimary
          ? "bg-accent shadow-glow"
          : "bg-card border border-border shadow-sm hover:border-accent/30"
          }`}
      >
        <Icon
          className={`size-7 ${isPrimary ? "text-accent-foreground" : "text-accent"}`}
        />
      </div>
      <span
        className={`text-xs font-medium transition-colors text-center leading-tight ${isPrimary
          ? "font-semibold text-accent"
          : "text-muted-foreground group-hover:text-accent"
          }`}
      >
        {label}
      </span>
    </button>
  );
};

export default QuickActionButton;
