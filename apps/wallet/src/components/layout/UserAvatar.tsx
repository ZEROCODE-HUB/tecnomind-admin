import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

const UserAvatar = ({ 
  name = "Juan Pérez", 
  imageUrl,
  size = "md",
  showName = false,
  className
}: UserAvatarProps) => {
  const navigate = useNavigate();
  
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <button 
      onClick={() => navigate("/profile")}
      className={cn(
        "flex items-center gap-3 group",
        className
      )}
    >
      <div className={cn(
        "rounded-full bg-gradient-to-br from-primary/30 via-primary/50 to-primary/70 flex items-center justify-center overflow-hidden border-2 border-accent/30 hover:border-accent transition-colors cursor-pointer",
        sizeClasses[size]
      )}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="size-full object-cover"
          />
        ) : (
          <span className="font-bold text-primary">{initials}</span>
        )}
      </div>
      {showName && (
        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
          {name}
        </span>
      )}
    </button>
  );
};

export default UserAvatar;
