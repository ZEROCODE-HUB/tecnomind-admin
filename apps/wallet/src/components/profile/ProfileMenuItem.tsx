import { ChevronRight, LucideIcon } from "lucide-react";

interface ProfileMenuItemProps {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  onClick?: () => void;
}

const ProfileMenuItem = ({ icon: Icon, label, subtitle, onClick }: ProfileMenuItemProps) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full p-4 bg-card rounded-2xl border border-border hover:bg-muted/50 hover:border-primary/50 transition-all group shadow-sm min-h-[56px] touch-manipulation"
    >
      <div className="bg-muted p-2.5 rounded-full border border-border group-hover:border-primary/50 mr-4 shrink-0 transition-colors">
        <Icon className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="flex flex-col flex-1 items-start">
        <span className="text-foreground font-medium">{label}</span>
        {subtitle && (
          <span className="text-xs text-primary mt-0.5 font-medium">{subtitle}</span>
        )}
      </div>
      <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </button>
  );
};

export default ProfileMenuItem;
