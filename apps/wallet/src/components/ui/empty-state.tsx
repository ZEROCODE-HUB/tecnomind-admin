import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  iconClassName?: string;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  className,
  iconClassName,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted/50 p-4 mb-4">
        <Icon
          className={cn(
            "size-10 text-muted-foreground/50",
            iconClassName
          )}
          strokeWidth={1.5}
        />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-[240px]">
          {description}
        </p>
      )}
    </div>
  );
};

export default EmptyState;
